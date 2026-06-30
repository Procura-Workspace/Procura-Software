import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../security/rbac.js";
import type { SuppliersService } from "./suppliers.service.js";

export async function registerSuppliersRoutes(app: FastifyInstance, suppliers: SuppliersService) {
  app.get("/suppliers", { preHandler: requirePermission("supplier:read") }, async () => ({
    data: suppliers.list()
  }));
}
