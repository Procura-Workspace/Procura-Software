import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../security/rbac.js";
import type { AuditService } from "./audit.service.js";

export async function registerAuditRoutes(
  app: FastifyInstance,
  audit: AuditService,
) {
  app.get(
    "/audit-events",
    { preHandler: requirePermission("audit:read") },
    async () => ({
      data: await audit.list(),
    }),
  );

  app.get(
    "/audit/verify",
    { preHandler: requirePermission("audit:read") },
    async () => ({
      data: await audit.verify(),
    }),
  );
}
