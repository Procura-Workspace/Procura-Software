import type { FinalOutput } from "@procura/shared";
import { sha256 } from "../../core/hash.js";
import { newId, nowIso } from "../../core/ids.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class OutputsService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  list(): FinalOutput[] {
    return [...this.store.outputs.values()].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }

  generate(rfqId: string, actor: CurrentUser): FinalOutput | null {
    const rfq = this.store.rfqs.get(rfqId);
    const awarded = [...this.store.decisions.values()].find(
      (decision) => decision.rfqId === rfqId && decision.decision === "awarded"
    );
    if (!rfq || !awarded) return null;

    const now = nowIso();
    const output: FinalOutput = {
      id: newId(),
      exportId: `EXP-${new Date().getUTCFullYear()}-${String(this.store.sequences.output++).padStart(3, "0")}`,
      rfqId,
      supplierId: awarded.supplierId,
      status: "generated",
      payloadHash: sha256({ rfq, awarded }),
      pvReference: `PV-${rfq.reference.replace("RFQ-", "")}`,
      generatedAt: now,
      sentAt: null,
      acknowledgedAt: null
    };

    this.store.outputs.set(output.id, output);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "output.generate",
      resourceType: "rfq",
      resourceId: rfqId
    });
    return output;
  }

  sendToErp(outputId: string, actor: CurrentUser): FinalOutput | null {
    const output = this.store.outputs.get(outputId);
    if (!output || output.status !== "generated") return null;
    const now = nowIso();
    const updated: FinalOutput = {
      ...output,
      status: "acknowledged",
      sentAt: now,
      acknowledgedAt: now
    };
    this.store.outputs.set(outputId, updated);
    const rfq = this.store.rfqs.get(output.rfqId);
    if (rfq) {
      this.store.rfqs.set(rfq.id, { ...rfq, status: "exported", updatedAt: now });
    }
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "erp.export",
      resourceType: "output",
      resourceId: outputId
    });
    return updated;
  }
}