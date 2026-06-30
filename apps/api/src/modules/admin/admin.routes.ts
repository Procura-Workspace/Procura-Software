import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { roles, type RoleCode } from "@procura/shared";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { AdminService } from "./admin.service.js";

const createUserSchema = z.object({
  displayName: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(roles.map((r) => r.code) as [RoleCode, ...RoleCode[]]),
  department: z.string().min(2).max(120)
});

export async function registerAdminRoutes(app: FastifyInstance, admin: AdminService) {
  app.get("/admin/users", { preHandler: requirePermission("admin:manage") }, async () => ({
    data: admin.users()
  }));

  app.post("/admin/users", { preHandler: requirePermission("admin:manage") }, async (request, reply) => {
    const input = createUserSchema.parse(request.body);
    return reply.code(201).send({ data: admin.createUser(input, getCurrentUser(request)) });
  });

  app.post(
    "/admin/users/:id/toggle",
    { preHandler: requirePermission("admin:manage") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updated = admin.toggleActive(id, getCurrentUser(request));
      if (!updated) return reply.code(404).send({ error: "USER_NOT_FOUND" });
      return { data: updated };
    }
  );
}