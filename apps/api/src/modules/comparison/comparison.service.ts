import type { ComparisonRow, ProcessVerbal, Submission } from "@procura/shared";
import { newId, nowIso } from "../../core/ids.js";
import { sha256 } from "../../core/hash.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class ComparisonService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  build(rfqId: string): ComparisonRow[] {
    const rfq = this.store.rfqs.get(rfqId);
    if (!rfq) return [];

    const submissions: Submission[] = [...this.store.submissions.values()].filter(
      (s) => s.rfqId === rfqId
    );
    const decisions = [...this.store.decisions.values()].filter((d) => d.rfqId === rfqId);

    return rfq.supplierIds.map((supplierId) => {
      const supplier = this.store.suppliers.get(supplierId);
      const submission = submissions.find((s) => s.supplierId === supplierId);
      const decision = decisions.find((d) => d.supplierId === supplierId);

      const technicalScore = decision?.technicalScore ?? 0;
      const financialScore = decision?.financialScore ?? 0;
      const finalScore =
        (technicalScore * rfq.technicalWeight + financialScore * rfq.financialWeight) / 100;

      return {
        rfqId,
        supplierId,
        supplierName: supplier?.legalName ?? "Fournisseur inconnu",
        technicalScore,
        financialScore,
        finalScore: Number(finalScore.toFixed(2)),
        decision: decision?.decision ?? "non-note",
        financialOffer: submission?.financialOffer ?? null
      };
    });
  }

  buildPv(rfqId: string, observations: string, actor: CurrentUser): ProcessVerbal | null {
    const rfq = this.store.rfqs.get(rfqId);
    if (!rfq) return null;

    const decisions = [...this.store.decisions.values()].filter((d) => d.rfqId === rfqId);
    if (decisions.length === 0) return null;

    const pv: ProcessVerbal = {
      rfqId,
      reference: `PV-${rfq.reference.replace("RFQ-", "")}`,
      signedBy: actor.id,
      signedAt: nowIso(),
      observations,
      decisions
    };

    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "pv.sign",
      resourceType: "rfq",
      resourceId: rfqId
    });
    return pv;
  }

  pvHash(pv: ProcessVerbal): string {
    return sha256(pv);
  }

  awardDecisionId(rfqId: string): string | null {
    const awarded = [...this.store.decisions.values()].find(
      (d) => d.rfqId === rfqId && d.decision === "awarded"
    );
    return awarded?.id ?? null;
  }
}