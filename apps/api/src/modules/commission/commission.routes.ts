import type { FastifyInstance } from "fastify";
import { createCommissionDecisionSchema } from "@procura/shared";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { CommissionService } from "./commission.service.js";

export async function registerCommissionRoutes(app: FastifyInstance, commission: CommissionService) {
  app.get("/commission/decisions", { preHandler: requirePermission("rfq:read") }, async () => ({
    data: commission.list()
  }));

  app.post(
    "/commission/decisions",
    { preHandler: requirePermission("commission:decide") },
    async (request, reply) => {
      const input = createCommissionDecisionSchema.parse(request.body);
      const decision = commission.decide(input, getCurrentUser(request));
      if (!decision) return reply.code(409).send({ error: "DECISION_NOT_ALLOWED" });
      return reply.code(201).send({ data: decision });
    }
  );
}
