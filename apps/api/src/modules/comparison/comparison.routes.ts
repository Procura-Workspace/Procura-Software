import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { ComparisonService } from "./comparison.service.js";

export async function registerComparisonRoutes(app: FastifyInstance, comparison: ComparisonService) {
  app.get("/rfqs/:id/comparison", { preHandler: requirePermission("rfq:read") }, async (request) => {
    const { id } = request.params as { id: string };
    return {
      data: comparison.build(id)
    };
  });

  const pvSchema = z.object({
    observations: z.string().min(3).max(4_000)
  });

  app.post("/rfqs/:id/pv", { preHandler: requirePermission("commission:sign") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { observations } = pvSchema.parse(request.body);
    const pv = comparison.buildPv(id, observations, getCurrentUser(request));
    if (!pv) return reply.code(409).send({ error: "PV_NOT_AVAILABLE" });
    return reply.code(201).send({
      data: {
        ...pv,
        hash: comparison.pvHash(pv)
      }
    });
  });
}