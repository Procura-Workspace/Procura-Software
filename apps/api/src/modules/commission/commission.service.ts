import type { CommissionDecision, CreateCommissionDecisionInput } from "@procura/shared";
import { newId, nowIso } from "../../core/ids.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class CommissionService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  list(): CommissionDecision[] {
    return [...this.store.decisions.values()].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  }

  decide(input: CreateCommissionDecisionInput, actor: CurrentUser): CommissionDecision | null {
    const rfq = this.store.rfqs.get(input.rfqId);
    if (!rfq || !["opening", "commissionReview", "locked"].includes(rfq.status)) {
      return null;
    }

    const finalScore =
      (input.technicalScore * rfq.technicalWeight + input.financialScore * rfq.financialWeight) / 100;
    const decision: CommissionDecision = {
      id: newId(),
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      technicalScore: input.technicalScore,
      financialScore: input.financialScore,
      finalScore,
      decision: input.decision,
      notes: input.notes,
      decidedBy: actor.id,
      decidedAt: nowIso()
    };

    this.store.decisions.set(decision.id, decision);
    this.store.rfqs.set(rfq.id, {
      ...rfq,
      status: input.decision === "awarded" ? "awarded" : "commissionReview",
      updatedAt: nowIso()
    });
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: `commission.${input.decision}`,
      resourceType: "rfq",
      resourceId: input.rfqId
    });

    return decision;
  }
}