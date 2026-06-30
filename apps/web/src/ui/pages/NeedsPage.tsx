import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  PlusCircle,
  Send,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";
import type { AppData, AppRole } from "../types.js";
import { needStatusLabel } from "@procura/shared";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { FormField } from "../components/FormField.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { Modal } from "../components/Modal.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

type NeedDraft = {
  title: string;
  description: string;
  department: string;
  estimatedBudget: number;
  currency: string;
  priority: "low" | "medium" | "high" | "critical";
};

const emptyDraft: NeedDraft = {
  title: "",
  description: "",
  department: "Technique",
  estimatedBudget: 1_000_000,
  currency: "DZD",
  priority: "medium"
};

export function NeedsPage({
  data,
  role,
  actions
}: {
  data: AppData;
  role: AppRole;
  actions: {
    createNeed: (input: NeedDraft) => Promise<void>;
    submitNeed: (id: string) => Promise<void>;
    approveNeed: (id: string) => Promise<void>;
    rejectNeed: (id: string, reason: string) => Promise<void>;
  };
}) {
  const [draft, setDraft] = useState<NeedDraft>(emptyDraft);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateError(null);
    setCreating(false);
  };

  const submitDraft = async () => {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      await actions.createNeed(draft);
      setDraft(emptyDraft);
      closeCreate();
    } catch (error) {
      setCreateError((error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: data.needs.length,
      pending: data.needs.filter((n) => ["draft", "submitted"].includes(n.status)).length,
      approved: data.needs.filter((n) => n.status === "approved").length
    };
  }, [data.needs]);

  const canCreate = role === "requester";
  const canDecide = role === "buyer";

  return (
    <>
      <PageHeader
        eyebrow="Module 3"
        title="Expression du besoin"
        description="Capture structuree, separation des roles, validation multi-niveaux."
        actions={
          canCreate && (
            <Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>
              Nouveau besoin
            </Button>
          )
        }
      />

      <section className="metrics-grid compact">
        <article className="metric-card neutral">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="metric-card warning">
          <span>En attente</span>
          <strong>{stats.pending}</strong>
        </article>
        <article className="metric-card success">
          <span>Approuves</span>
          <strong>{stats.approved}</strong>
        </article>
      </section>

      <Panel
        title="Liste des besoins"
        description="Selectionnez un besoin pour visualiser le detail et agir"
      >
        {data.needs.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="Aucun besoin"
            description="Commencez par creer un nouveau besoin."
            action={
              canCreate && (
                <Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>
                  Creer
                </Button>
              )
            }
          />
        ) : (
          <div className="data-list">
            {data.needs.map((need) => (
              <article key={need.id} className="list-row vertical">
                <div className="list-row-header">
                  <div>
                    <strong>{need.reference}</strong>
                    <span>{need.title}</span>
                  </div>
                  <Badge value={need.status} label={needStatusLabel(need.status)} />
                </div>
                <p className="muted">{need.description}</p>
                <div className="definition-grid inline">
                  <dt>Departement</dt>
                  <dd>{need.department}</dd>
                  <dt>Budget</dt>
                  <dd>
                    {need.estimatedBudget.toLocaleString("fr-DZ")} {need.currency}
                  </dd>
                  <dt>Priorite</dt>
                  <dd>
                    <Badge value={need.priority} />
                  </dd>
                </div>
                <div className="actions">
                  {need.status === "draft" && need.requesterId && role === "requester" && (
                    <Button
                      icon={Send}
                      tone="primary"
                      onClick={() => actions.submitNeed(need.id)}
                    >
                      Soumettre pour validation
                    </Button>
                  )}
                  {canDecide && ["submitted", "draft"].includes(need.status) && (
                    <>
                      <Button
                        icon={ThumbsUp}
                        tone="success"
                        onClick={() => actions.approveNeed(need.id)}
                      >
                        Approuver
                      </Button>
                      <Button
                        icon={ThumbsDown}
                        tone="danger"
                        onClick={() => {
                          setRejectingId(need.id);
                          setRejectReason("");
                        }}
                      >
                        Refuser
                      </Button>
                    </>
                  )}
                  {need.status === "approved" && (
                    <InfoBanner icon={CheckCircle2} tone="success" title="Approuve">
                      Ce besoin peut etre converti en RFQ depuis le menu RFQ.
                    </InfoBanner>
                  )}
                  {need.status === "rejected" && (
                    <InfoBanner icon={AlertTriangle} tone="warning" title="Refuse">
                      Une justification a ete ajoutee a la description.
                    </InfoBanner>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={createOpen}
        title="Nouveau besoin"
        onClose={closeCreate}
        footer={
          <>
            <Button tone="ghost" onClick={closeCreate} disabled={creating}>
              Annuler
            </Button>
            <Button icon={Send} onClick={submitDraft} disabled={creating}>
              {creating ? "Creation..." : "Creer le besoin"}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          {createError && (
            <InfoBanner tone="danger" title="Creation impossible" icon={AlertTriangle}>
              {createError}
            </InfoBanner>
          )}
          <FormField
            label="Titre du besoin"
            error={draft.title.length > 0 && draft.title.length < 3 ? "Min. 3 caracteres" : undefined}
          >
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Approvisionnement materiel..."
            />
          </FormField>
          <FormField
            label="Description detaillee"
            error={draft.description.length > 0 && draft.description.length < 10 ? "Min. 10 caracteres" : undefined}
          >
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Contexte, perimetre, contraintes techniques..."
            />
          </FormField>
          <div className="form-row">
            <FormField label="Departement">
              <input
                type="text"
                value={draft.department}
                onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              />
            </FormField>
            <FormField label="Devise">
              <select
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              >
                <option value="DZD">DZD</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Budget estime">
              <input
                type="number"
                value={draft.estimatedBudget}
                onChange={(e) =>
                  setDraft({ ...draft, estimatedBudget: Number(e.target.value) })
                }
              />
            </FormField>
            <FormField label="Priorite">
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: e.target.value as NeedDraft["priority"] })
                }
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </FormField>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(rejectingId)}
        title="Refuser le besoin"
        onClose={() => setRejectingId(null)}
        footer={
          <>
            <Button tone="ghost" onClick={() => setRejectingId(null)}>
              Annuler
            </Button>
            <Button
              tone="danger"
              icon={ThumbsDown}
              onClick={async () => {
                if (!rejectingId) return;
                await actions.rejectNeed(rejectingId, rejectReason);
                setRejectingId(null);
              }}
            >
              Confirmer le refus
            </Button>
          </>
        }
      >
        <FormField label="Motif du refus">
          <textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Indiquez la justification..."
          />
        </FormField>
      </Modal>
    </>
  );
}
