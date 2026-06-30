import { useState } from "react";
import { CheckCircle2, LifeBuoy, MessageSquare, Plus, Send, ShieldCheck } from "lucide-react";
import type { AppData } from "../types.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { Modal } from "../components/Modal.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function TicketsPage({
  data,
  actions
}: {
  data: AppData;
  actions: {
    createTicket: (input: { subject: string; body: string; category: string }) => Promise<void>;
    replyTicket: (id: string, body: string) => Promise<void>;
    closeTicket: (id: string) => Promise<void>;
  };
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"administrative" | "documentation" | "technical" | "delivery">("administrative");
  const [reply, setReply] = useState("");

  const openTickets = data.tickets.filter((t) => t.status === "open" || t.status === "awaitingSupplier" || t.status === "awaitingCompany");
  const closedTickets = data.tickets.filter((t) => t.status === "resolved" || t.status === "closed");

  const handleCreate = async () => {
    if (!subject.trim() || !body.trim()) return;
    await actions.createTicket({ subject, body, category });
    setSubject("");
    setBody("");
    setCategory("administrative");
    setShowCreate(false);
  };

  const handleReply = async () => {
    if (!replyTarget || !reply.trim()) return;
    await actions.replyTicket(replyTarget, reply);
    setReply("");
    setReplyTarget(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Module 22"
        title="Support et tickets"
        description="Suivi des incidents, demandes fonctionnelles et assistance aux utilisateurs."
      />

      <InfoBanner icon={ShieldCheck} tone="info" title="Confidentialite">
        Les tickets sont reserves au support interne. Les fournisseurs utilisent le portail
        dedie (DMZ) pour leurs echanges contractuels.
      </InfoBanner>

      <Panel
        title="Tickets ouverts"
        description={`${openTickets.length} en cours`}
        icon={LifeBuoy}
        actions={
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Nouveau ticket
          </Button>
        }
      >
        {openTickets.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Aucun ticket ouvert"
            description="Tous les incidents ont ete resolus."
          />
        ) : (
          <div className="ticket-list">
            {openTickets.map((ticket) => (
              <article key={ticket.id} className="ticket-card">
                <header>
                  <Badge value={ticket.category === "technical" ? "danger" : ticket.category === "administrative" ? "info" : "warning"} label={ticket.category} />
                  <Badge value={ticket.status} />
                  <strong>{ticket.subject}</strong>
                  <small>ref {ticket.reference}</small>
                </header>
                {ticket.messages.length > 0 && (
                  <ul className="thread">
                    {ticket.messages.map((msg) => (
                      <li key={msg.id}>
                        <strong>{msg.authorRole} - {msg.authorId.slice(0, 8)}</strong>
                        <span>{msg.body}</span>
                        <time>{new Date(msg.createdAt).toLocaleString("fr-DZ")}</time>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="actions">
                  <Button
                    icon={MessageSquare}
                    tone="secondary"
                    onClick={() => setReplyTarget(ticket.id)}
                  >
                    Repondre
                  </Button>
                  <Button
                    icon={CheckCircle2}
                    tone="success"
                    onClick={() => actions.closeTicket(ticket.id)}
                  >
                    Cloturer
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {closedTickets.length > 0 && (
        <Panel title="Tickets clotures" icon={CheckCircle2}>
          <div className="table">
            <div className="table-head tickets-page">
              <span>Sujet</span>
              <span>Categorie</span>
              <span>Statut</span>
              <span>Mis a jour</span>
            </div>
            {closedTickets.map((ticket) => (
              <div key={ticket.id} className="table-row tickets-page">
                <strong>{ticket.subject}</strong>
                <Badge value={ticket.category === "technical" ? "danger" : ticket.category === "administrative" ? "info" : "warning"} label={ticket.category} />
                <Badge value={ticket.status} />
                <time>{new Date(ticket.updatedAt).toLocaleString("fr-DZ")}</time>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Modal
        open={showCreate}
        title="Nouveau ticket support"
        onClose={() => setShowCreate(false)}
        footer={
          <>
            <Button tone="ghost" onClick={() => setShowCreate(false)}>
              Annuler
            </Button>
            <Button icon={Send} onClick={handleCreate}>
              Creer
            </Button>
          </>
        }
      >
        <label className="form-field">
          <span>Sujet</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Resume court"
          />
        </label>
        <label className="form-field">
          <span>Categorie</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            <option value="administrative">Administratif</option>
            <option value="documentation">Documentation</option>
            <option value="technical">Technique</option>
            <option value="delivery">Livraison</option>
          </select>
        </label>
        <label className="form-field">
          <span>Description</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Detail de la demande ou de l'incident"
          />
        </label>
      </Modal>

      <Modal
        open={replyTarget !== null}
        title="Repondre au ticket"
        onClose={() => setReplyTarget(null)}
        footer={
          <>
            <Button tone="ghost" onClick={() => setReplyTarget(null)}>
              Annuler
            </Button>
            <Button icon={Send} onClick={handleReply}>
              Envoyer
            </Button>
          </>
        }
      >
        <label className="form-field">
          <span>Reponse</span>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            placeholder="Votre reponse..."
          />
        </label>
      </Modal>
    </>
  );
}