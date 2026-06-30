import type { FastifyInstance } from "fastify";
import { createSubmissionSchema } from "@procura/shared";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { SubmissionsService } from "./submissions.service.js";

export async function registerSubmissionsRoutes(app: FastifyInstance, submissions: SubmissionsService) {
  app.get("/submissions", { preHandler: requirePermission("submission:read") }, async () => ({
    data: submissions.list()
  }));

  app.get(
    "/rfqs/:id/submissions",
    { preHandler: requirePermission("submission:read") },
    async (request) => {
      const { id } = request.params as { id: string };
      return { data: submissions.forRfq(id) };
    }
  );

  app.post(
    "/submissions",
    { preHandler: requirePermission("submission:create") },
    async (request, reply) => {
      const input = createSubmissionSchema.parse(request.body);
      const submission = submissions.create(input, getCurrentUser(request));
      if (!submission) return reply.code(409).send({ error: "SUBMISSION_NOT_ALLOWED" });
      return reply.code(201).send({ data: submission });
    }
  );

  app.post(
    "/rfqs/:id/submissions/open",
    { preHandler: requirePermission("submission:open") },
    async (request) => {
      const { id } = request.params as { id: string };
      return { data: submissions.openForRfq(id, getCurrentUser(request)) };
    }
  );
}