import type { FastifyReply, FastifyRequest } from "fastify";
import type { Permission } from "@procura/shared";
import { getCurrentUser } from "./current-user.js";
import { db } from "../core/db.js";

export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);

    // Query database to check if the role has the permission mapping
    const res = await db.query(
      `SELECT 1 
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_code = $1 AND p.code = $2`,
      [user.role, permission],
    );

    if (res.rows.length === 0) {
      request.log.warn(
        {
          userId: user.id,
          userRole: user.role,
          requiredPermission: permission,
          url: request.url,
          method: request.method,
        },
        "Access forbidden (RBAC verification failed)",
      );

      return reply.code(403).send({
        error: "FORBIDDEN",
        message: "Permission insuffisante",
        requiredPermission: permission,
      });
    }
  };
}
