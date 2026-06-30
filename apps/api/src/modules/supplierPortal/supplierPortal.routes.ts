import type { FastifyInstance } from "fastify";
import { createSubmissionSchema } from "@procura/shared";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { SupplierPortalService } from "./supplierPortal.service.js";

export async function registerSupplierPortalRoutes(
  app: FastifyInstance,
  portal: SupplierPortalService
) {
  app.get("/portal/dashboard", { preHandler: requirePermission("rfq:read") }, async (request) => ({
    data: portal.dashboard(getCurrentUser(request))
  }));

  app.get(
    "/portal/rfqs/:id",
    { preHandler: requirePermission("rfq:read") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const detail = portal.rfqDetail(id, getCurrentUser(request));
      if (!detail.rfq) return reply.code(404).send({ error: "RFQ_NOT_FOUND" });
      return { data: detail };
    }
  );

  app.post(
    "/portal/submissions",
    { preHandler: requirePermission("submission:create") },
    async (request, reply) => {
      const input = createSubmissionSchema.parse(request.body);
      const submission = portal.submit(input, getCurrentUser(request));
      if (!submission) return reply.code(409).send({ error: "SUBMISSION_NOT_ALLOWED" });
      return reply.code(201).send({ data: submission });
    }
  );
}