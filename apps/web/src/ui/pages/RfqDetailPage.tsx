import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Gavel,
  GitCompare,
  Hash,
  Lock,
  LockKeyhole,
  Mail,
  Radio,
  Send,
  ShieldCheck,
  UnlockKeyhole
} from "lucide-react";
import { rfqStatusLabel, submissionStatusLabel } from "@procura/shared";
import type { AppData, AppRole } from "../types.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { FormField } from "../components/FormField.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { Modal } from "../components/Modal.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";
import { Stepper, type Step } from "../components/Stepper.js";

type Tab = "overview" | "suppliers" | "submissions" | "comparison" | "decisions" | "pv";

export function RfqDetailPage({
  rfqId,
  data,
  role,
  actions,
  onBack
}: {
  rfqId: string;
  data: AppData;
  role: AppRole;
  actions: {
    publishRfq: (id: string) => Promise<void>;
    lockRfq: (id: string) => Promise<void>;
    openRfq: (id: string) => Promise<void>;
    openSubmissions: (id: string) => Promise<void>;
    decide: (input: {
      rfqId: string;
      supplierId: string;
      technicalScore: number;
      financialScore: number;
      decision: "shortlisted" | "rejected" | "awarded";
      notes: string;
    }) => Promise<void>;
    signPv: (rfqId: string, observations: string) => Promise<void>;
    generateOutput: (id: string) => Promise<void>;
  };
  onBack: () => void;
}) {
  const rfq = data.rfqs.find((r) => r.id === rfqId);
  const submissions = data.submissionsByRfq[rfqId] ?? [];
  const comparison = data.comparisonByRfq[rfqId] ?? [];
  const decisions = data.decisions.filter((d) => d.rfqId === rfqId);
  const need = rfq?.needId ? data.needs.find((n) => n.id === rfq.needId) : null;

  const [tab, setTab] = useState<Tab>("overview");
  const [decisionSupplier, setDecisionSupplier] = useState<string | null>(null);
  const [pvOpen, setPvOpen] = useState(false);

  const suppliers = useMemo(
    () => data.suppliers.filter((s) => rfq?.supplierIds.includes(s.id)),
    [data.suppliers, rfq]
  );

  if (!rfq) {
    return (
      <Panel>
        <EmptyState
          icon={FileText}
          title="RFQ introuvable"
          description="Cette RFQ n'existe pas ou a ete archivee."
          action={
            <Button icon={ArrowLeft} onClick={onBack}>
              Retour aux RFQ
            </Button>
          }
        />
      </Panel>
    );
  }

  const status = rfq.status;
  const cycleSteps: Step[] = [
    {
      label: "Brouillon",
      description: "Module 5",
      state: ["draft", "pendingApproval"].includes(status)
        ? status === "draft"
          ? "current"
          : "done"
        : "done"
    },
    {
      label: "Publiee",
      description: "Modules 5/6",
      state: status === "published"
        ? "current"
        : ["locked", "opening", "commissionReview", "awarded", "exported", "archived"].includes(status)
          ? "done"
          : "pending"
    },
    {
      label: "Verrouillee",
      description: "Module 9",
      state: status === "locked"
        ? "current"
        : ["opening", "commissionReview", "awarded", "exported", "archived"].includes(status)
          ? "done"
          : "pending"
    },
    {
      label: "Ouverture",
      description: "Module 11",
      state: status === "opening"
        ? "current"
        : ["commissionReview", "awarded", "exported", "archived"].includes(status)
          ? "done"
          : "pending"
    },
    {
      label: "Commission",
      description: "Modules 12/13",
      state: status === "commissionReview"
        ? "current"
        : ["awarded", "exported", "archived"].includes(status)
          ? "done"
          : "pending"
    },
    {
      label: "Output ERP",
      description: "Modules 14/15",
      state: status === "awarded"
        ? "current"
        : ["exported", "archived"].includes(status)
          ? "done"
          : "pending"
    }
  ];

  const canManage = role === "buyer" || role === "commissionMember";
  const canDecide = role === "commissionMember";

  const decisionEntry = decisionSupplier
    ? decisions.find((d) => d.supplierId === decisionSupplier)
    : null;

  return (
    <>
      <PageHeader
        eyebrow={`Modules 5 a 15 - ${rfqStatusLabel(status)}`}
        title={`${rfq.reference} - ${rfq.title}`}
        description={rfq.description}
        actions={
          <>
            <Button tone="ghost" icon={ArrowLeft} onClick={onBack}>
              Retour
            </Button>
            {canManage && status === "draft" && (
              <Button icon={Radio} onClick={() => actions.publishRfq(rfq.id)}>
                Publier
              </Button>
            )}
            {canManage && status === "published" && (
              <Button icon={Lock} tone="secondary" onClick={() => actions.lockRfq(rfq.id)}>
                Verrouiller
              </Button>
            )}
            {canManage && status === "locked" && (
              <Button
                icon={UnlockKeyhole}
                tone="success"
                onClick={() => actions.openRfq(rfq.id)}
              >
                Lancer l'ouverture officielle
              </Button>
            )}
            {role === "commissionMember" && status === "opening" && (
              <Button
                icon={LockKeyhole}
                tone="success"
                onClick={() => actions.openSubmissions(rfq.id)}
              >
                Deverrouiller le coffre-fort
              </Button>
            )}
            {role === "commissionMember" && decisions.length > 0 && status === "commissionReview" && (
              <Button icon={ClipboardList} onClick={() => setPvOpen(true)}>
                Signer le PV
              </Button>
            )}
            {role === "buyer" && status === "awarded" && (
              <Button icon={Send} onClick={() => actions.generateOutput(rfq.id)}>
                Generer l'output ERP
              </Button>
            )}
          </>
        }
        meta={
          <div className="page-meta">
            <Badge value={status} label={rfqStatusLabel(status)} />
            <span>
              Deadline : <strong>{new Date(rfq.deadlineAt).toLocaleString("fr-DZ")}</strong>
            </span>
          </div>
        }
      />

      <section className="card-tile">
        <Stepper steps={cycleSteps} />
      </section>

      <nav className="tabs">
        {[
          { key: "overview", label: "Synthese", icon: FileText },
          { key: "suppliers", label: "Fournisseurs invites", icon: Building2 },
          { key: "submissions", label: `Coffre-fort (${submissions.length})`, icon: LockKeyhole },
          { key: "comparison", label: `Comparatif (${comparison.length})`, icon: GitCompare },
          { key: "decisions", label: `Decisions (${decisions.length})`, icon: Gavel },
          { key: "pv", label: "PV numerique", icon: ClipboardList }
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key as Tab)}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <section className="content-grid">
          <Panel
            title="Informations generales"
            description="Identification, scellage, contexte"
            variant="wide"
          >
            <dl className="definition-grid stacked">
              <dt>Reference</dt>
              <dd>{rfq.reference}</dd>
              <dt>Titre</dt>
              <dd>{rfq.title}</dd>
              <dt>Description</dt>
              <dd>{rfq.description}</dd>
              <dt>Statut</dt>
              <dd>
                <Badge value={status} label={rfqStatusLabel(status)} />
              </dd>
              <dt>Deadline</dt>
              <dd>{new Date(rfq.deadlineAt).toLocaleString("fr-DZ")}</dd>
              <dt>Ponderation</dt>
              <dd>
                Technique {rfq.technicalWeight}% / Financier {rfq.financialWeight}%
              </dd>
              <dt>Formats acceptes</dt>
              <dd>{rfq.allowedFormats.join(", ").toUpperCase()}</dd>
              <dt>Besoin source</dt>
              <dd>
                {need ? `${need.reference} - ${need.title}` : "Aucun besoin rattache"}
              </dd>
              <dt>Hash global RFQ</dt>
              <dd>
                <code>{rfq.globalHash ?? "—"}</code>
              </dd>
              <dt>Hash d'integrite</dt>
              <dd>
                <code>
                  <Hash size={12} /> {rfq.globalHash?.slice(0, 32) ?? "—"}
                </code>
              </dd>
            </dl>
          </Panel>

          <Panel title="Statistiques" icon={GitCompare}>
            <ul className="stat-list">
              <li>
                <span>Invitations</span>
                <strong>{rfq.supplierIds.length}</strong>
              </li>
              <li>
                <span>Offres deposees</span>
                <strong>{submissions.length}</strong>
              </li>
              <li>
                <span>Offres ouvertes</span>
                <strong>{submissions.filter((s) => s.status === "opened").length}</strong>
              </li>
              <li>
                <span>Decisions</span>
                <strong>{decisions.length}</strong>
              </li>
              <li>
                <span>Temps avant deadline</span>
                <strong>
                  {Math.max(
                    0,
                    Math.round((Date.parse(rfq.deadlineAt) - Date.now()) / (1000 * 60 * 60))
                  )}{" "}
                  h
                </strong>
              </li>
            </ul>
          </Panel>
        </section>
      )}

      {tab === "suppliers" && (
        <Panel
          title="Fournisseurs invites"
          description="Lecture seule depuis le referentiel ERP, contexte RFQ"
          icon={Mail}
        >
          {suppliers.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Aucun fournisseur invite"
              description="Selectionnez des fournisseurs depuis le referentiel ERP lors de la creation."
            />
          ) : (
            <div className="table">
              <div className="table-head rfq-suppliers">
                <span>ID ERP</span>
                <span>Raison sociale</span>
                <span>Email</span>
                <span>Categories</span>
                <span>Risque</span>
                <span>Statut</span>
              </div>
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="table-row rfq-suppliers">
                  <strong>{supplier.erpId}</strong>
                  <span>{supplier.legalName}</span>
                  <span>{supplier.email}</span>
                  <span>{supplier.categories.join(", ")}</span>
                  <Badge value={supplier.riskLevel} />
                  <Badge value={supplier.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === "submissions" && (
        <Panel
          title="Coffre-fort numerique"
          description="Offres scellees SHA-256, scan AV, horodatage"
          icon={ShieldCheck}
        >
          {submissions.length === 0 ? (
            <EmptyState
              icon={LockKeyhole}
              title="Aucune offre deposee"
              description="Les fournisseurs peuvent deposer leur offre depuis le portail DMZ."
            />
          ) : (
            <div className="table">
              <div className="table-head rfq-submissions">
                <span>Fichier</span>
                <span>Fournisseur</span>
                <span>Statut</span>
                <span>Scan AV</span>
                <span>Montant</span>
                <span>Hash SHA-256</span>
                <span>Date</span>
              </div>
              {submissions.map((submission) => {
                const supplier = data.suppliers.find((s) => s.id === submission.supplierId);
                return (
                  <div key={submission.id} className="table-row rfq-submissions">
                    <strong>{submission.fileName}</strong>
                    <span>{supplier?.legalName ?? "—"}</span>
                    <Badge value={submission.status} label={submissionStatusLabel(submission.status)} />
                    <Badge value={submission.malwareScan} />
                    <span>
                      {submission.financialOffer
                        ? `${submission.financialOffer.toLocaleString("fr-DZ")} ${
                            submission.currency ?? "DZD"
                          }`
                        : "—"}
                    </span>
                    <code>{submission.sha256Hash.slice(0, 18)}...</code>
                    <time>{new Date(submission.createdAt).toLocaleString("fr-DZ")}</time>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === "comparison" && (
        <Panel
          title="Tableau comparatif"
          description="Scoring pondere technique / financier"
          icon={GitCompare}
        >
          {comparison.length === 0 ? (
            <InfoBanner icon={GitCompare} title="Comparatif indisponible">
              Les fournisseurs invites apparaitront ici une fois les offres chargees.
            </InfoBanner>
          ) : (
            <div className="table">
              <div className="table-head rfq-comparison">
                <span>Fournisseur</span>
                <span>Score technique</span>
                <span>Score financier</span>
                <span>Score final</span>
                <span>Montant</span>
                <span>Decision</span>
                <span>Action</span>
              </div>
              {comparison.map((row) => (
                <div key={row.supplierId} className="table-row rfq-comparison">
                  <strong>{row.supplierName}</strong>
                  <span>{row.technicalScore.toFixed(1)}</span>
                  <span>{row.financialScore.toFixed(1)}</span>
                  <strong>{row.finalScore.toFixed(2)}</strong>
                  <span>
                    {row.financialOffer
                      ? `${row.financialOffer.toLocaleString("fr-DZ")}`
                      : "—"}
                  </span>
                  <Badge value={row.decision} />
                  {canDecide &&
                    ["opening", "commissionReview"].includes(status) && (
                      <Button
                        tone="ghost"
                        onClick={() => setDecisionSupplier(row.supplierId)}
                      >
                        {decisionEntry ? "Modifier decision" : "Saisir decision"}
                      </Button>
                    )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === "decisions" && (
        <Panel title="Decisions commission" icon={Gavel}>
          {decisions.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="Aucune decision saisie"
              description="La commission peut saisir ses evaluations depuis l'onglet comparatif."
            />
          ) : (
            <div className="data-list">
              {decisions.map((decision) => {
                const supplier = data.suppliers.find((s) => s.id === decision.supplierId);
                return (
                  <article key={decision.id} className="list-row vertical">
                    <div className="list-row-header">
                      <div>
                        <strong>{supplier?.legalName ?? decision.supplierId}</strong>
                        <span>Par commission #{decision.decidedBy.slice(0, 8)}</span>
                      </div>
                      <Badge value={decision.decision} />
                    </div>
                    <div className="definition-grid inline">
                      <dt>Technique</dt>
                      <dd>{decision.technicalScore}</dd>
                      <dt>Financier</dt>
                      <dd>{decision.financialScore}</dd>
                      <dt>Final pondere</dt>
                      <dd>{decision.finalScore.toFixed(2)}</dd>
                      <dt>Date</dt>
                      <dd>{new Date(decision.decidedAt).toLocaleString("fr-DZ")}</dd>
                    </div>
                    {decision.notes && <p className="muted">{decision.notes}</p>}
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === "pv" && (
        <Panel
          title="Proces-verbal numerique"
          description="PV signe et archive - module 12"
          icon={ClipboardList}
        >
          {decisions.length === 0 ? (
            <InfoBanner icon={ClipboardList} title="PV indisponible">
              Saisissez au moins une decision avant de generer le PV.
            </InfoBanner>
          ) : (
            <div className="pv-preview">
              <header>
                <strong>PV-{rfq.reference.replace("RFQ-", "")}</strong>
                <span>
                  Reference RFQ : <code>{rfq.reference}</code>
                </span>
              </header>
              <ul>
                {decisions.map((decision) => {
                  const supplier = data.suppliers.find((s) => s.id === decision.supplierId);
                  return (
                    <li key={decision.id}>
                      <strong>{supplier?.legalName}</strong> —{" "}
                      <Badge value={decision.decision} /> — Score {decision.finalScore.toFixed(2)}
                      {decision.notes ? ` — ${decision.notes}` : ""}
                    </li>
                  );
                })}
              </ul>
              {canDecide && status === "commissionReview" && (
                <Button icon={CheckCircle2} tone="success" onClick={() => setPvOpen(true)}>
                  Signer le PV numerique
                </Button>
              )}
            </div>
          )}
        </Panel>
      )}

      <DecisionModal
        open={Boolean(decisionSupplier)}
        onClose={() => setDecisionSupplier(null)}
        rfq={rfq}
        supplier={
          decisionSupplier ? data.suppliers.find((s) => s.id === decisionSupplier) ?? null : null
        }
        existing={
          decisionSupplier
            ? decisions.find((d) => d.supplierId === decisionSupplier) ?? null
            : null
        }
        onSubmit={async (payload) => {
          if (!decisionSupplier) return;
          await actions.decide({
            rfqId: rfq.id,
            supplierId: decisionSupplier,
            ...payload
          });
          setDecisionSupplier(null);
        }}
      />

      <Modal
        open={pvOpen}
        title="Signature du PV numerique"
        onClose={() => setPvOpen(false)}
        footer={
          <>
            <Button tone="ghost" onClick={() => setPvOpen(false)}>
              Annuler
            </Button>
            <Button
              tone="success"
              icon={CheckCircle2}
              onClick={async () => {
                await actions.signPv(rfq.id, "PV signe par la commission lors de la seance.");
                setPvOpen(false);
              }}
            >
              Signer et archiver
            </Button>
          </>
        }
      >
        <p>
          Cette action signe le PV numerique et le transmet au module output. Une preuve
          supplementaire est ajoutee a la chaine d'audit.
        </p>
        <InfoBanner icon={ClipboardList} title="Decisions integrees">
          {decisions.length} decision(s) seront integrees dans le PV final.
        </InfoBanner>
        <ul className="pv-list">
          {decisions.map((decision) => (
            <li key={decision.id}>
              <ChevronRight size={14} />{" "}
              {data.suppliers.find((s) => s.id === decision.supplierId)?.legalName} —{" "}
              <Badge value={decision.decision} />
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

function DecisionModal({
  open,
  onClose,
  rfq,
  supplier,
  existing,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  rfq: { technicalWeight: number; financialWeight: number };
  supplier: { id: string; legalName: string } | null;
  existing: { technicalScore: number; financialScore: number; notes: string } | null;
  onSubmit: (input: {
    technicalScore: number;
    financialScore: number;
    decision: "shortlisted" | "rejected" | "awarded";
    notes: string;
  }) => Promise<void>;
}) {
  const [technical, setTechnical] = useState(existing?.technicalScore ?? 70);
  const [financial, setFinancial] = useState(existing?.financialScore ?? 70);
  const [decision, setDecision] = useState<"shortlisted" | "rejected" | "awarded">("shortlisted");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  if (!supplier) return null;

  const finalScore =
    (technical * rfq.technicalWeight + financial * rfq.financialWeight) / 100;

  return (
    <Modal
      open={open}
      title={`Decision commission - ${supplier.legalName}`}
      onClose={onClose}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            icon={Gavel}
            onClick={() =>
              onSubmit({
                technicalScore: technical,
                financialScore: financial,
                decision,
                notes
              })
            }
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <FormField
          label={`Score technique (0 a 100)`}
          hint={`Poids : ${rfq.technicalWeight}%`}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={technical}
            onChange={(e) => setTechnical(Number(e.target.value))}
          />
          <strong>{technical}</strong>
        </FormField>
        <FormField
          label={`Score financier (0 a 100)`}
          hint={`Poids : ${rfq.financialWeight}%`}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={financial}
            onChange={(e) => setFinancial(Number(e.target.value))}
          />
          <strong>{financial}</strong>
        </FormField>
        <FormField label="Decision">
          <select
            value={decision}
            onChange={(e) =>
              setDecision(e.target.value as "shortlisted" | "rejected" | "awarded")
            }
          >
            <option value="shortlisted">Preshelectionne</option>
            <option value="awarded">Attribue</option>
            <option value="rejected">Rejete</option>
          </select>
        </FormField>
        <FormField label="Notes / observations">
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Justification..."
          />
        </FormField>
        <div className="score-summary">
          <span>Score final pondere</span>
          <strong>{finalScore.toFixed(2)}</strong>
        </div>
      </div>
    </Modal>
  );
}
