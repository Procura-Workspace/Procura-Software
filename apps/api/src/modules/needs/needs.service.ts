import type { CreateNeedInput, Need } from "@procura/shared";
import { db } from "../../core/db.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class NeedsService {
  constructor(private readonly audit: AuditService) {}

  async list(): Promise<Need[]> {
    const res = await db.query(
      `SELECT need_id as id, reference, title, description, department,
              estimated_budget as "estimatedBudget", currency,
              priority, status,
              requester_id as "requesterId",
              approver_id as "approverId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM need_expressions
       ORDER BY created_at DESC`,
    );
    return res.rows.map(this.mapRow);
  }

  async get(id: string): Promise<Need | null> {
    const res = await db.query(
      `SELECT need_id as id, reference, title, description, department,
              estimated_budget as "estimatedBudget", currency,
              priority, status,
              requester_id as "requesterId",
              approver_id as "approverId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM need_expressions
       WHERE need_id = $1`,
      [id],
    );
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  async create(input: CreateNeedInput, actor: CurrentUser): Promise<Need> {
    // Generate reference from DB sequence
    const seqRes = await db.query(
      `SELECT COUNT(*)::int + 1 as next FROM need_expressions`,
    );
    const seq = seqRes.rows[0].next;
    const reference = `NEED-${new Date().getUTCFullYear()}-${String(seq).padStart(3, "0")}`;

    const res = await db.query(
      `INSERT INTO need_expressions
        (reference, title, description, department, estimated_budget, currency, priority, status, requester_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)
       RETURNING need_id as id, reference, title, description, department,
                 estimated_budget as "estimatedBudget", currency, priority, status,
                 requester_id as "requesterId", approver_id as "approverId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [
        reference,
        input.title,
        input.description,
        input.department,
        input.estimatedBudget,
        input.currency,
        input.priority,
        actor.id,
      ],
    );

    const need = this.mapRow(res.rows[0]);

    await this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "need.create",
      resourceType: "need",
      resourceId: need.id,
    });

    return need;
  }

  async submit(id: string, actor: CurrentUser): Promise<Need | null> {
    const res = await db.query(
      `UPDATE need_expressions
       SET status = 'submitted', updated_at = now()
       WHERE need_id = $1 AND status = 'draft'
       RETURNING need_id as id, reference, title, description, department,
                 estimated_budget as "estimatedBudget", currency, priority, status,
                 requester_id as "requesterId", approver_id as "approverId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id],
    );
    if (res.rows.length === 0) return null;

    await this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "need.submit",
      resourceType: "need",
      resourceId: id,
    });

    return this.mapRow(res.rows[0]);
  }

  async approve(id: string, actor: CurrentUser): Promise<Need | null> {
    // Enforce separation of duties: requester cannot approve their own need
    const check = await db.query(
      `SELECT requester_id FROM need_expressions WHERE need_id = $1`,
      [id],
    );
    if (check.rows.length === 0) return null;
    if (check.rows[0].requester_id === actor.id) return null;

    const res = await db.query(
      `UPDATE need_expressions
       SET status = 'approved', approver_id = $2, updated_at = now()
       WHERE need_id = $1 AND status IN ('submitted', 'draft')
       RETURNING need_id as id, reference, title, description, department,
                 estimated_budget as "estimatedBudget", currency, priority, status,
                 requester_id as "requesterId", approver_id as "approverId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id, actor.id],
    );
    if (res.rows.length === 0) return null;

    await this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "need.approve",
      resourceType: "need",
      resourceId: id,
    });

    return this.mapRow(res.rows[0]);
  }

  async reject(
    id: string,
    reason: string,
    actor: CurrentUser,
  ): Promise<Need | null> {
    const res = await db.query(
      `UPDATE need_expressions
       SET status = 'rejected', approver_id = $2,
           justification = $3, updated_at = now()
       WHERE need_id = $1 AND status IN ('submitted', 'draft')
       RETURNING need_id as id, reference, title, description, department,
                 estimated_budget as "estimatedBudget", currency, priority, status,
                 requester_id as "requesterId", approver_id as "approverId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id, actor.id, reason],
    );
    if (res.rows.length === 0) return null;

    await this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "need.reject",
      resourceType: "need",
      resourceId: id,
    });

    return this.mapRow(res.rows[0]);
  }

  /** Map a DB row to the shared Need type (coerce budget to number) */
  private mapRow(row: any): Need {
    return {
      ...row,
      estimatedBudget: Number(row.estimatedBudget),
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : new Date(row.createdAt).toISOString(),
      updatedAt:
        typeof row.updatedAt === "string"
          ? row.updatedAt
          : new Date(row.updatedAt).toISOString(),
    };
  }
}
