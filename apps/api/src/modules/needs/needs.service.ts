import type { CreateNeedInput, Need } from "@procura/shared";
import { nextReference, newId, nowIso } from "../../core/ids.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class NeedsService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  list(): Need[] {
    return [...this.store.needs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): Need | null {
    return this.store.needs.get(id) ?? null;
  }

  create(input: CreateNeedInput, actor: CurrentUser): Need {
    const now = nowIso();
    const need: Need = {
      id: newId(),
      reference: nextReference("NEED", this.store.sequences.need++),
      title: input.title,
      description: input.description,
      department: input.department,
      estimatedBudget: input.estimatedBudget,
      currency: input.currency,
      priority: input.priority,
      status: "draft",
      requesterId: actor.id,
      approverId: null,
      createdAt: now,
      updatedAt: now
    };

    this.store.needs.set(need.id, need);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "need.create",
      resourceType: "need",
      resourceId: need.id
    });
    return need;
  }

  submit(id: string, actor: CurrentUser): Need | null {
    const need = this.store.needs.get(id);
    if (!need || need.status !== "draft") return null;
    const updated = { ...need, status: "submitted" as const, updatedAt: nowIso() };
    this.store.needs.set(id, updated);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "need.submit",
      resourceType: "need",
      resourceId: id
    });
    return updated;
  }

  approve(id: string, actor: CurrentUser): Need | null {
    const need = this.store.needs.get(id);
    if (!need || !["submitted", "draft"].includes(need.status)) return null;
    if (need.requesterId === actor.id) return null; // separation of duties
    const updated = {
      ...need,
      status: "approved" as const,
      approverId: actor.id,
      updatedAt: nowIso()
    };
    this.store.needs.set(id, updated);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "need.approve",
      resourceType: "need",
      resourceId: id
    });
    return updated;
  }

  reject(id: string, reason: string, actor: CurrentUser): Need | null {
    const need = this.store.needs.get(id);
    if (!need || !["submitted", "draft"].includes(need.status)) return null;
    const updated: Need = {
      ...need,
      status: "rejected",
      approverId: actor.id,
      updatedAt: nowIso(),
      description: `${need.description}\n\nRefus: ${reason}`
    };
    this.store.needs.set(id, updated);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "need.reject",
      resourceType: "need",
      resourceId: id
    });
    return updated;
  }
}