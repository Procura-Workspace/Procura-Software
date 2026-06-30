import { useState } from "react";
import { Building2, FileText, Send, ShieldCheck, Upload } from "lucide-react";
import type { AppData } from "../types.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { FormField } from "../components/FormField.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { Modal } from "../components/Modal.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function SupplierPortalPage({
  data,
  actions
}: {
  data: AppData;
  actions: {
    submitOffer: (input: { rfqId: string; amount: number; technicalNotes: string }) => Promise<void>;
  };
}) {
  const openRfqs = data.openRfqsForSuppliers;
  const mySubmissions = data.supplierSubmissions;
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("offre.pdf");

  const close = () => {
    setSubmitting(null);
    setAmount(0);
    setNotes("");
    setFileName("offre.pdf");
  };

  return (
    <>
      <PageHeader
        eyebrow="Module 6"
        title="Portail fournisseur"
        description="Vue dediee au fournisseur : RFQ ouvertes, depot d'offre securise."
      />

      <InfoBanner icon={ShieldCheck} tone="success" title="Canal securise DMZ">
        Toutes les communications avec Procura transitent par le portail DMZ. Les pieces
        jointes sont scannees, hachees (SHA-256) puis deposees dans le coffre-fort avant
        ouverture par la commission.
      </InfoBanner>

      <Panel title="RFQ ouvertes a la soumission" icon={FileText}>
        {openRfqs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune RFQ ouverte"
            description="Vous serez notifie lorsqu'une nouvelle RFQ sera publiee."
          />
        ) : (
          <div className="data-list">
            {openRfqs.map((rfq) => (
              <article key={rfq.id} className="list-row vertical">
                <div className="list-row-header">
                  <div>
                    <strong>{rfq.reference}</strong>
                    <span>{rfq.title}</span>
                  </div>
                  <Badge value={rfq.status} />
                </div>
                <p className="muted">{rfq.description}</p>
                <div className="definition-grid inline">
                  <dt>Reference</dt>
                  <dd>{rfq.reference}</dd>
                  <dt>Deadline</dt>
                  <dd>{new Date(rfq.deadlineAt).toLocaleString("fr-DZ")}</dd>
                  <dt>Formats acceptes</dt>
                  <dd>{rfq.allowedFormats.length > 0 ? rfq.allowedFormats.join(", ") : "pdf"}</dd>
                  <dt>Ponderation</dt>
                  <dd>
                    Technique {rfq.technicalWeight}% / Financier {rfq.financialWeight}%
                  </dd>
                </div>
                <div className="actions">
                  <Button
                    icon={Upload}
                    onClick={() => {
                      setSubmitting(rfq.id);
                      setAmount(0);
                      setNotes("");
                      setFileName(`offre-${rfq.reference}.pdf`);
                    }}
                  >
                    Deposer une offre
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Mes soumissions" icon={Send}>
        {mySubmissions.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucune soumission"
            description="Vos offres apparaitront ici apres depot."
          />
        ) : (
          <div className="table">
            <div className="table-head supplier-portal">
              <span>RFQ</span>
              <span>Statut</span>
              <span>Montant</span>
              <span>Deposee</span>
              <span>Hash SHA-256</span>
            </div>
            {mySubmissions.map((sub) => (
              <div key={sub.id} className="table-row supplier-portal">
                <strong>{sub.rfqId.slice(0, 8)}</strong>
                <Badge value={sub.status} />
                <span>
                  {sub.financialOffer
                    ? `${sub.financialOffer.toLocaleString("fr-DZ")} ${sub.currency ?? "DZD"}`
                    : "—"}
                </span>
                <time>{new Date(sub.createdAt).toLocaleString("fr-DZ")}</time>
                <code>{sub.sha256Hash.slice(0, 16)}</code>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={Boolean(submitting)}
        title="Depot d'offre securise"
        onClose={close}
        footer={
          <>
            <Button tone="ghost" onClick={close}>
              Annuler
            </Button>
            <Button
              icon={Send}
              onClick={async () => {
                if (!submitting) return;
                await actions.submitOffer({
                  rfqId: submitting,
                  amount,
                  technicalNotes: notes
                });
                close();
              }}
              disabled={amount <= 0}
            >
              Sceller et deposer
            </Button>
          </>
        }
      >
        <InfoBanner icon={ShieldCheck} tone="info" title="Preuve d'integrite">
          Votre offre sera hachee (SHA-256) et scellee avant ouverture par la commission.
          Toute modification ulterieure sera detectee.
        </InfoBanner>
        <div className="form-grid">
          <FormField label="Nom de fichier (simule)">
            <input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </FormField>
          <FormField label="Montant financier (DZD)">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Notes techniques">
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delai de livraison, garantie, certification..."
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
}