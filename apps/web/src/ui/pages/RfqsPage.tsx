import { useMemo } from "react";
import { ArrowRight, Lock, Radio, Send, UnlockKeyhole } from "lucide-react";
import { rfqStatusLabel } from "@procura/shared";
import type { AppData, AppRole } from "../types.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

const statusToneByStatus = ["draft", "pendingApproval"];

export function RfqsPage({
  data,
  role,
  actions,
  onOpenRfq
}: {
  data: AppData;
  role: AppRole;
  actions: {
    publishRfq: (id: string) => Promise<void>;
    lockRfq: (id: string) => Promise<void>;
    openRfq: (id: string) => Promise<void>;
  };
  onOpenRfq: (id: string) => void;
}) {
  const canManage = role === "buyer" || role === "commissionMember";

  const grouped = useMemo(() => {
    const live = data.rfqs.filter((r) => ["published", "locked", "opening", "commissionReview"].includes(r.status));
    const preparing = data.rfqs.filter((r) => statusToneByStatus.includes(r.status));
    const finished = data.rfqs.filter((r) =>
      ["awarded", "exported", "archived", "cancelled"].includes(r.status)
    );
    return { live, preparing, finished };
  }, [data.rfqs]);

  const RfqCard = ({ rfq }: { rfq: (typeof data.rfqs)[number] }) => {
    const submissionsCount = data.submissionsByRfq[rfq.id]?.length ?? 0;
    const supplierNames = rfq.supplierIds
      .map((id) => data.suppliers.find((s) => s.id === id)?.legalName)
      .filter(Boolean)
      .join(", ");

    return (
      <article key={rfq.id} className="entity-card">
        <div className="entity-card-header">
          <div>
            <strong>{rfq.reference}</strong>
            <span>{rfq.title}</span>
          </div>
          <Badge value={rfq.status} label={rfqStatusLabel(rfq.status)} />
        </div>
        <p>{rfq.description}</p>
        <dl className="definition-grid">
          <dt>Deadline</dt>
          <dd>{new Date(rfq.deadlineAt).toLocaleString("fr-DZ")}</dd>
          <dt>Fournisseurs invites</dt>
          <dd>{supplierNames || "Aucun"}</dd>
          <dt>Poids technique</dt>
          <dd>{rfq.technicalWeight}%</dd>
          <dt>Poids financier</dt>
          <dd>{rfq.financialWeight}%</dd>
          <dt>Offres deposees</dt>
          <dd>{submissionsCount}</dd>
          <dt>Hash global</dt>
          <dd>
            <code>{rfq.globalHash?.slice(0, 18) ?? "—"}</code>
          </dd>
        </dl>
        <div className="actions">
          <Button icon={ArrowRight} tone="ghost" onClick={() => onOpenRfq(rfq.id)}>
            Ouvrir le detail
          </Button>
          {canManage && rfq.status === "draft" && (
            <Button icon={Radio} onClick={() => actions.publishRfq(rfq.id)}>
              Publier
            </Button>
          )}
          {canManage && rfq.status === "published" && (
            <Button icon={Lock} tone="secondary" onClick={() => actions.lockRfq(rfq.id)}>
              Verrouiller
            </Button>
          )}
          {canManage && rfq.status === "locked" && (
            <Button icon={UnlockKeyhole} tone="success" onClick={() => actions.openRfq(rfq.id)}>
              Ouvrir les plis
            </Button>
          )}
        </div>
      </article>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Modules 5, 9, 11"
        title="RFQ et publication"
        description="Cycle complet : creation, scellage, verrouillage automatique, ouverture officielle."
      />

      {data.rfqs.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Send}
            title="Aucune RFQ creee"
            description="Lancez une nouvelle consultation depuis un besoin approuve."
          />
        </Panel>
      ) : (
        <>
          <Panel
            title="RFQ en cours"
            description="Selectionnez une RFQ pour suivre son avancement"
          >
            {grouped.live.length === 0 ? (
              <InfoBanner icon={Send} title="Aucune RFQ active">
                Publiez ou verouillez une RFQ pour la voir apparaitre ici.
              </InfoBanner>
            ) : (
              <div className="cards-grid">
                {grouped.live.map((rfq) => (
                  <RfqCard key={rfq.id} rfq={rfq} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Brouillons et en validation">
            {grouped.preparing.length === 0 ? (
              <InfoBanner icon={Send} title="Aucun brouillon">
                Les RFQ non encore publiees apparaissent dans cette section.
              </InfoBanner>
            ) : (
              <div className="cards-grid">
                {grouped.preparing.map((rfq) => (
                  <RfqCard key={rfq.id} rfq={rfq} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Terminees">
            {grouped.finished.length === 0 ? (
              <InfoBanner icon={Send} title="Aucun dossier termine">
                Les RFQ attribuees ou archivees apparaitront ici.
              </InfoBanner>
            ) : (
              <div className="cards-grid">
                {grouped.finished.map((rfq) => (
                  <RfqCard key={rfq.id} rfq={rfq} />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
