import type { RoleCode, User } from "@procura/shared";
import { newId, nowIso } from "../../core/ids.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class AdminService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  users(): User[] {
    return [...this.store.users.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  createUser(input: {
    displayName: string;
    email: string;
    role: RoleCode;
    department: string;
  }, actor: CurrentUser): User {
    const user: User = {
      id: newId(),
      displayName: input.displayName,
      email: input.email,
      role: input.role,
      department: input.department,
      active: true,
      createdAt: nowIso()
    };
    this.store.users.set(user.id, user);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "user.create",
      resourceType: "user",
      resourceId: user.id
    });
    return user;
  }

  toggleActive(id: string, actor: CurrentUser): User | null {
    const user = this.store.users.get(id);
    if (!user) return null;
    const updated: User = { ...user, active: !user.active };
    this.store.users.set(id, updated);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: updated.active ? "user.activate" : "user.deactivate",
      resourceType: "user",
      resourceId: id
    });
    return updated;
  }
}