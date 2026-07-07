import { createHash, randomUUID } from "node:crypto";
import type { AuditEvent, RoleCode } from "@procura/shared";
import { db } from "../../core/db.js";

type AppendAuditInput = {
  actorId: string;
  actorRole: RoleCode;
  action: string;
  resourceType: string;
  resourceId: string;
};

export class AuditService {
  constructor(private readonly pepper: string) {}

  async append(input: AppendAuditInput): Promise<AuditEvent> {
    // 1. Get the previous hash from PostgreSQL (hash-chain integrity)
    const lastRes = await db.query(
      `SELECT entry_hash FROM audit_events ORDER BY occurred_at DESC LIMIT 1`,
    );
    const previousHash: string | null = lastRes.rows[0]?.entry_hash ?? null;

    // 2. Compute deterministic hash
    const occurredAt = new Date().toISOString();
    const id = randomUUID();
    const payload = JSON.stringify({ ...input, id, occurredAt, previousHash });
    const entryHash = createHash("sha256")
      .update(previousHash ?? "GENESIS")
      .update(payload)
      .update(this.pepper)
      .digest("hex");

    // 3. Persist to PostgreSQL
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

    return {
      id,
      occurredAt,
      previousHash,
      entryHash,
      ...input,
    };
  }

  async list(): Promise<AuditEvent[]> {
    const res = await db.query(
      `SELECT audit_event_id as id, actor_id as "actorId", actor_role as "actorRole",
              action, resource_type as "resourceType", resource_id as "resourceId",
              occurred_at as "occurredAt", previous_hash as "previousHash", entry_hash as "entryHash"
       FROM audit_events
       ORDER BY occurred_at DESC`,
    );
    return res.rows as AuditEvent[];
  }

  async verify(): Promise<{
    total: number;
    verified: number;
    broken: number;
    firstBrokenAt: string | null;
  }> {
    const res = await db.query(
      `SELECT audit_event_id as id, actor_id as "actorId", actor_role as "actorRole",
              action, resource_type as "resourceType", resource_id as "resourceId",
              occurred_at as "occurredAt", previous_hash as "previousHash", entry_hash as "entryHash"
       FROM audit_events
       ORDER BY occurred_at ASC`,
    );

    let previousHash: string | null = null;
    let verified = 0;
    let broken = 0;
    let firstBrokenAt: string | null = null;

    for (const event of res.rows) {
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
      total: res.rows.length,
      verified,
      broken,
      firstBrokenAt,
    };
  }
}
