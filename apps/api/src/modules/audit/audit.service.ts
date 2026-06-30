import { createHash, randomUUID } from "node:crypto";
import type { AuditEvent, RoleCode } from "@procura/shared";
import type { AppStore } from "../../core/store.js";

type AppendAuditInput = {
  actorId: string;
  actorRole: RoleCode;
  action: string;
  resourceType: string;
  resourceId: string;
};

export class AuditService {
  constructor(
    private readonly store: AppStore,
    private readonly pepper: string
  ) {}

  append(input: AppendAuditInput): AuditEvent {
    const previousHash = this.store.auditEvents.at(-1)?.entryHash ?? null;
    const occurredAt = new Date().toISOString();
    const id = randomUUID();
    const payload = JSON.stringify({ ...input, id, occurredAt, previousHash });
    const entryHash = createHash("sha256")
      .update(previousHash ?? "GENESIS")
      .update(payload)
      .update(this.pepper)
      .digest("hex");

    const event: AuditEvent = {
      id,
      occurredAt,
      previousHash,
      entryHash,
      ...input
    };

    this.store.auditEvents.push(event);
    return event;
  }

  list(): AuditEvent[] {
    return [...this.store.auditEvents].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }

  verify(): {
    total: number;
    verified: number;
    broken: number;
    firstBrokenAt: string | null;
  } {
    let previousHash: string | null = null;
    let verified = 0;
    let broken = 0;
    let firstBrokenAt: string | null = null;

    for (const event of this.store.auditEvents) {
      const payload = JSON.stringify({
        actorId: event.actorId,
        actorRole: event.actorRole,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        id: event.id,
        occurredAt: event.occurredAt,
        previousHash
      });
      const expected = createHash("sha256")
        .update(previousHash ?? "GENESIS")
        .update(payload)
        .update(this.pepper)
        .digest("hex");

      const chainOk = event.previousHash === previousHash;
      const hashOk = expected === event.entryHash;

      if (chainOk && hashOk) {
        verified += 1;
      } else {
        broken += 1;
        if (!firstBrokenAt) firstBrokenAt = event.occurredAt;
      }
      previousHash = event.entryHash;
    }

    return {
      total: this.store.auditEvents.length,
      verified,
      broken,
      firstBrokenAt
    };
  }
}