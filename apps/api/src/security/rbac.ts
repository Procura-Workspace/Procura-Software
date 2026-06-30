import type { FastifyReply, FastifyRequest } from "fastify";
import { hasPermission, type Permission } from "@procura/shared";
import { getCurrentUser } from "./current-user.js";

export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);

    if (!hasPermission(user.role, permission)) {
      return reply.code(403).send({
        error: "FORBIDDEN",
        message: "Permission insuffisante",
        requiredPermission: permission
      });
    }
  };
}
