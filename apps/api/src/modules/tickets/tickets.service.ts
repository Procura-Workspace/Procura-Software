import type { Ticket, CreateTicketInput } from "@procura/shared";
import { newId, nextReference, nowIso } from "../../core/ids.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class TicketsService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  list(): Ticket[] {
    return [...this.store.tickets.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  forRfq(rfqId: string): Ticket[] {
    return [...this.store.tickets.values()].filter((t) => t.rfqId === rfqId);
  }

  create(input: CreateTicketInput, actor: CurrentUser): Ticket | null {
    if (input.rfqId) {
      const rfq = this.store.rfqs.get(input.rfqId);
      if (!rfq) return null;
      if (input.supplierId && !rfq.supplierIds.includes(input.supplierId)) {
        return null;
      }
    }

    const now = nowIso();
    const ticket: Ticket = {
      id: newId(),
      reference: nextReference("TKT", this.store.sequences.ticket++),
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      category: input.category,
      status: "open",
      subject: input.subject,
      messages: [
        {
          id: newId(),
          authorId: actor.id,
          authorRole: actor.role,
          body: input.body,
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.store.tickets.set(ticket.id, ticket);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "ticket.create",
      resourceType: "ticket",
      resourceId: ticket.id
    });
    return ticket;
  }

  reply(id: string, body: string, actor: CurrentUser): Ticket | null {
    const ticket = this.store.tickets.get(id);
    if (!ticket) return null;
    const updated: Ticket = {
      ...ticket,
      status: actor.role === "supplier" ? "awaitingCompany" : "awaitingSupplier",
      updatedAt: nowIso(),
      messages: [
        ...ticket.messages,
        {
          id: newId(),
          authorId: actor.id,
          authorRole: actor.role,
          body,
          createdAt: nowIso()
        }
      ]
    };
    this.store.tickets.set(id, updated);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "ticket.reply",
      resourceType: "ticket",
      resourceId: id
    });
    return updated;
  }

  close(id: string, actor: CurrentUser): Ticket | null {
    const ticket = this.store.tickets.get(id);
    if (!ticket) return null;
    const updated: Ticket = {
      ...ticket,
      status: "closed",
      updatedAt: nowIso()
    };
    this.store.tickets.set(id, updated);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "ticket.close",
      resourceType: "ticket",
      resourceId: id
    });
    return updated;
  }
}