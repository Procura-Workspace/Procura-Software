import { createHash, randomUUID } from "node:crypto";
import type { AuditEvent, RoleCode } from "@procura/shared";
import type { AppStore } from "../../core/store.js";
import { db } from "../../core/db.js";

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
    private readonly pepper: string,
  ) {}

  async append(input: AppendAuditInput): Promise<AuditEvent> {
    // 1. Dual Write: Get the last event's entryHash from postgres or fallback to in-memory
    let previousHash: string | null = null;
    try {
      const lastRes = await db.query(
        `SELECT entry_hash FROM audit_events ORDER BY occurred_at DESC LIMIT 1`,
      );
      previousHash =
        lastRes.rows[0]?.entry_hash ??
        this.store.auditEvents.at(-1)?.entryHash ??
        null;
    } catch {
      previousHash = this.store.auditEvents.at(-1)?.entryHash ?? null;
    }

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
      ...input,
    };

    // 2. Persist to PostgreSQL database
    try {
      await db.query(
        `INSERT INTO audit_events (audit_event_id, actor_id, actor_role, action, resource_type, resource_id, occurred_at, previous_hash, entry_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          input.actorId,
          input.actorRole,
          input.action,
          input.resourceType,
          input.resourceId,
          occurredAt,
          previousHash,
          entryHash,
        ],
      );
    } catch (err) {
      console.error("Failed to write audit event to PostgreSQL:", err);
    }

    // 3. Fallback sync to in-memory store for maquette compatibility
    this.store.auditEvents.push(event);
    return event;
  }

  async list(): Promise<AuditEvent[]> {
    try {
      const res = await db.query(
        `SELECT audit_event_id as id, actor_id as "actorId", actor_role as "actorRole", 
                action, resource_type as "resourceType", resource_id as "resourceId", 
                occurred_at as "occurredAt", previous_hash as "previousHash", entry_hash as "entryHash"
         FROM audit_events 
         ORDER BY occurred_at DESC`,
      );
      if (res.rows.length > 0) {
        return res.rows as AuditEvent[];
      }
    } catch {
      // Fallback to in-memory if DB fails
    }
    return [...this.store.auditEvents].sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt),
    );
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
        previousHash,
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
      firstBrokenAt,
    };
  }
}
