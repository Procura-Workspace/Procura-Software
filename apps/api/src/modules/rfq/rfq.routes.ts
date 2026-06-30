import type { FastifyInstance } from "fastify";
import { createRfqSchema } from "@procura/shared";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { RfqService } from "./rfq.service.js";

export async function registerRfqRoutes(app: FastifyInstance, rfqs: RfqService) {
  app.get(
    "/rfqs",
    { preHandler: requirePermission("rfq:read") },
    async () => ({ data: rfqs.list() })
  );

  app.post(
    "/rfqs",
    { preHandler: requirePermission("rfq:create") },
    async (request, reply) => {
      const input = createRfqSchema.parse(request.body);
      const rfq = rfqs.create(input, getCurrentUser(request));
      return reply.code(201).send({ data: rfq });
    }
  );

  app.post(
    "/rfqs/:id/publish",
    { preHandler: requirePermission("rfq:publish") },
    async (request, reply) => {
      const params = request.params as { id: string };
      const rfq = rfqs.publish(params.id, getCurrentUser(request));

      if (!rfq) {
        return reply.code(409).send({
          error: "INVALID_TRANSITION",
          message: "La RFQ doit exister et permettre cette transition"
        });
      }

      return { data: rfq };
    }
  );

  app.post(
    "/rfqs/:id/lock",
    { preHandler: requirePermission("rfq:publish") },
    async (request, reply) => {
      const params = request.params as { id: string };
      const rfq = rfqs.transition(params.id, "locked", getCurrentUser(request));
      if (!rfq) return reply.code(409).send({ error: "INVALID_TRANSITION" });
      return { data: rfq };
    }
  );

  app.post(
    "/rfqs/:id/open",
    { preHandler: requirePermission("submission:open") },
    async (request, reply) => {
      const params = request.params as { id: string };
      const rfq = rfqs.transition(params.id, "opening", getCurrentUser(request));
      if (!rfq) return reply.code(409).send({ error: "INVALID_TRANSITION" });
      return { data: rfq };
    }
  );
}
