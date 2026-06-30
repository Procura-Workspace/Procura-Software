import { canTransitionRfq, type CreateRfqInput, type Rfq } from "@procura/shared";
import { nextReference, newId, nowIso } from "../../core/ids.js";
import { sha256 } from "../../core/hash.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class RfqService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  list(): Rfq[] {
    return [...this.store.rfqs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): Rfq | null {
    return this.store.rfqs.get(id) ?? null;
  }

  create(input: CreateRfqInput, actor: CurrentUser): Rfq {
    const now = nowIso();
    const id = newId();
    const rfqWithoutHash = {
      id,
      reference: nextReference("RFQ", this.store.sequences.rfq++),
      needId: input.needId,
      title: input.title,
      description: input.description,
      status: "draft" as const,
      buyerId: actor.id,
      deadlineAt: input.deadlineAt,
      supplierIds: input.supplierIds,
      technicalWeight: input.technicalWeight,
      financialWeight: input.financialWeight,
      allowedFormats: input.allowedFormats ?? ["pdf"],
      globalHash: null,
      createdAt: now,
      updatedAt: now
    };
    const rfq: Rfq = {
      ...rfqWithoutHash,
      globalHash: sha256(rfqWithoutHash)
    };

    this.store.rfqs.set(id, rfq);
    if (input.needId) {
      const need = this.store.needs.get(input.needId);
      if (need) {
        this.store.needs.set(need.id, {
          ...need,
          status: "convertedToRfq",
          updatedAt: now
        });
      }
    }

    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "rfq.create",
      resourceType: "rfq",
      resourceId: id
    });

    return rfq;
  }

  transition(id: string, target: Rfq["status"], actor: CurrentUser): Rfq | null {
    const existing = this.store.rfqs.get(id);
    if (!existing || !canTransitionRfq(existing.status, target)) {
      return null;
    }

    const updated: Rfq = {
      ...existing,
      status: target,
      updatedAt: nowIso()
    };

    this.store.rfqs.set(id, updated);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: `rfq.${target}`,
      resourceType: "rfq",
      resourceId: id
    });

    return updated;
  }

  publish(id: string, actor: CurrentUser): Rfq | null {
    return this.transition(id, "published", actor);
  }

  lockExpired(actor: CurrentUser): Rfq[] {
    const now = Date.now();
    const locked: Rfq[] = [];
    for (const rfq of this.store.rfqs.values()) {
      if (rfq.status === "published" && Date.parse(rfq.deadlineAt) <= now) {
        const updated = this.transition(rfq.id, "locked", actor);
        if (updated) locked.push(updated);
      }
    }
    return locked;
  }
}