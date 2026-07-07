import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createNeedSchema } from "@procura/shared";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { NeedsService } from "./needs.service.js";

const rejectSchema = z.object({ reason: z.string().min(3).max(1_000) });

export async function registerNeedsRoutes(
  app: FastifyInstance,
  needs: NeedsService,
) {
  app.get(
    "/needs",
    { preHandler: requirePermission("need:read") },
    async () => ({
      data: await needs.list(),
    }),
  );

  app.get(
    "/needs/:id",
    { preHandler: requirePermission("need:read") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const need = await needs.get(id);
      if (!need) return reply.code(404).send({ error: "NEED_NOT_FOUND" });
      return { data: need };
    },
  );

  app.post(
    "/needs",
    { preHandler: requirePermission("need:create") },
    async (request, reply) => {
      const input = createNeedSchema.parse(request.body);
      return reply
        .code(201)
        .send({ data: await needs.create(input, getCurrentUser(request)) });
    },
  );

  app.post(
    "/needs/:id/submit",
    { preHandler: requirePermission("need:submit") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const need = await needs.submit(id, getCurrentUser(request));
      if (!need) return reply.code(409).send({ error: "INVALID_TRANSITION" });
      return { data: need };
    },
  );

  app.post(
    "/needs/:id/approve",
    { preHandler: requirePermission("need:approve") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const need = await needs.approve(id, getCurrentUser(request));
      if (!need) return reply.code(409).send({ error: "INVALID_TRANSITION" });
      return { data: need };
    },
  );

  app.post(
    "/needs/:id/reject",
    { preHandler: requirePermission("need:approve") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { reason } = rejectSchema.parse(request.body);
      const need = await needs.reject(id, reason, getCurrentUser(request));
      if (!need) return reply.code(409).send({ error: "INVALID_TRANSITION" });
      return { data: need };
    },
  );
}
