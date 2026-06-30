import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createTicketSchema } from "@procura/shared";
import { getCurrentUser } from "../../security/current-user.js";
import { requirePermission } from "../../security/rbac.js";
import type { TicketsService } from "./tickets.service.js";

export async function registerTicketsRoutes(app: FastifyInstance, tickets: TicketsService) {
  app.get("/tickets", { preHandler: requirePermission("audit:read") }, async () => ({
    data: tickets.list()
  }));

  app.get("/rfqs/:id/tickets", { preHandler: requirePermission("rfq:read") }, async (request) => {
    const { id } = request.params as { id: string };
    return { data: tickets.forRfq(id) };
  });

  app.post("/tickets", { preHandler: requirePermission("ticket:create") }, async (request, reply) => {
    const input = createTicketSchema.parse(request.body);
    const ticket = tickets.create(input, getCurrentUser(request));
    if (!ticket) return reply.code(409).send({ error: "TICKET_NOT_ALLOWED" });
    return reply.code(201).send({ data: ticket });
  });

  const replySchema = z.object({ body: z.string().min(3).max(2_000) });

  app.post("/tickets/:id/reply", { preHandler: requirePermission("ticket:reply") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { body } = replySchema.parse(request.body);
    const ticket = tickets.reply(id, body, getCurrentUser(request));
    if (!ticket) return reply.code(409).send({ error: "TICKET_NOT_FOUND" });
    return { data: ticket };
  });

  app.post("/tickets/:id/close", { preHandler: requirePermission("ticket:reply") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticket = tickets.close(id, getCurrentUser(request));
    if (!ticket) return reply.code(409).send({ error: "TICKET_NOT_FOUND" });
    return { data: ticket };
  });
}