import type { FastifyInstance } from "fastify";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { OutputsService } from "./outputs.service.js";

export async function registerOutputsRoutes(app: FastifyInstance, outputs: OutputsService) {
  app.get("/outputs", { preHandler: requirePermission("rfq:read") }, async () => ({
    data: outputs.list()
  }));

  app.post(
    "/rfqs/:id/output",
    { preHandler: requirePermission("output:generate") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const output = outputs.generate(id, getCurrentUser(request));
      if (!output) return reply.code(409).send({ error: "OUTPUT_NOT_ALLOWED" });
      return reply.code(201).send({ data: output });
    }
  );

  app.post(
    "/outputs/:id/send-to-erp",
    { preHandler: requirePermission("erp:export") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const output = outputs.sendToErp(id, getCurrentUser(request));
      if (!output) return reply.code(409).send({ error: "ERP_EXPORT_NOT_ALLOWED" });
      return { data: output };
    }
  );
}
