import type { RoleCode, User } from "@procura/shared";
import { db } from "../../core/db.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class AdminService {
  constructor(private readonly audit: AuditService) {}

  async users(): Promise<User[]> {
    const res = await db.query(
      `SELECT user_id as id, display_name as "displayName", email,
              role_code as role, COALESCE(d.name, '') as department,
              is_active as active, u.created_at as "createdAt"
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.department_id
       ORDER BY display_name ASC`,
    );
    return res.rows as User[];
  }

  async createUser(
    input: {
      displayName: string;
      email: string;
      role: RoleCode;
      department: string;
    },
    actor: CurrentUser,
  ): Promise<User> {
    // Resolve department_id from department name
    let departmentId: string | null = null;
    const deptRes = await db.query(
      `SELECT department_id FROM departments WHERE name = $1`,
      [input.department],
    );
    if (deptRes.rows.length > 0) {
      departmentId = deptRes.rows[0].department_id;
    }

    const res = await db.query(
      `INSERT INTO users (display_name, email, role_code, department_id, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING user_id as id, display_name as "displayName", email,
                 role_code as role, is_active as active, created_at as "createdAt"`,
      [input.displayName, input.email, input.role, departmentId],
    );

    const user: User = { ...res.rows[0], department: input.department };

    await this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "user.create",
      resourceType: "user",
      resourceId: user.id,
    });

    return user;
  }

  async toggleActive(id: string, actor: CurrentUser): Promise<User | null> {
    const existing = await db.query(
      `SELECT user_id, is_active FROM users WHERE user_id = $1`,
      [id],
    );
    if (existing.rows.length === 0) return null;

    const newActive = !existing.rows[0].is_active;
    const res = await db.query(
      `UPDATE users SET is_active = $1, updated_at = now()
       WHERE user_id = $2
       RETURNING user_id as id, display_name as "displayName", email,
                 role_code as role, is_active as active, created_at as "createdAt"`,
      [newActive, id],
    );

    const user: User = { ...res.rows[0], department: "" };

    await this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: newActive ? "user.activate" : "user.deactivate",
      resourceType: "user",
      resourceId: id,
    });

    return user;
  }
}
