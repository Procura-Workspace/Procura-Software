import type { FastifyInstance } from "fastify";
import { platformSettingsSchema } from "@procura/shared";
import { requirePermission } from "../../security/rbac.js";
import type { SettingsService } from "./settings.service.js";

export async function registerSettingsRoutes(app: FastifyInstance, settings: SettingsService) {
  app.get("/settings", { preHandler: requirePermission("admin:manage") }, async () => ({
    data: settings.get()
  }));

  app.put(
    "/settings",
    { preHandler: requirePermission("admin:manage") },
    async (request, reply) => {
      const next = platformSettingsSchema.parse(request.body);
      return { data: settings.update(next) };
    }
  );

  app.get("/notifications", { preHandler: requirePermission("audit:read") }, async () => ({
    data: settings.notifications()
  }));

  app.post(
    "/notifications/:id/read",
    { preHandler: requirePermission("audit:read") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updated = settings.markNotificationRead(id);
      if (!updated) return reply.code(404).send({ error: "NOT_FOUND" });
      return { data: updated };
    }
  );
}