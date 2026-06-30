import { useMemo } from "react";
import { ChevronRight, Gavel, ShieldCheck } from "lucide-react";
import type { AppData, AppRole } from "../types.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function CommissionPage({
  data,
  role,
  onOpenRfq
}: {
  data: AppData;
  role: AppRole;
  onOpenRfq: (id: string) => void;
}) {
  const readyRfqs = useMemo(
    () =>
      data.rfqs.filter((r) =>
        ["opening", "commissionReview", "locked"].includes(r.status)
      ),
    [data.rfqs]
  );

  const summary = useMemo(() => {
    const awarded = data.decisions.filter((d) => d.decision === "awarded").length;
    const rejected = data.decisions.filter((d) => d.decision === "rejected").length;
    const shortlisted = data.decisions.filter((d) => d.decision === "shortlisted").length;
    return { awarded, rejected, shortlisted, total: data.decisions.length };
  }, [data.decisions]);

  return (
    <>
      <PageHeader
        eyebrow="Modules 11, 12, 13"
        title="Commission d'ouverture"
        description="Procedures d'ouverture des plis, saisie des decisions, generation du PV numerique."
      />

      {role !== "commissionMember" && (
        <InfoBanner icon={ShieldCheck} tone="warning" title="Acces commission">
          La saisie de decision et la signature du PV necessitent un role "Membre commission".
          Basculez sur ce profil pour tester le parcours complet.
        </InfoBanner>
      )}

      <section className="metrics-grid compact">
        <article className="metric-card info">
          <span>RFQ a ouvrir</span>
          <strong>{readyRfqs.length}</strong>
        </article>
        <article className="metric-card success">
          <span>Decisions attribuees</span>
          <strong>{summary.awarded}</strong>
        </article>
        <article className="metric-card warning">
          <span>Preshectionnees</span>
          <strong>{summary.shortlisted}</strong>
        </article>
        <article className="metric-card danger">
          <span>Rejetees</span>
          <strong>{summary.rejected}</strong>
        </article>
      </section>

      <Panel
        title="RFQ en commission"
        description="Selectionnez une RFQ pour ouvrir le detail et saisir les evaluations."
        icon={Gavel}
      >
        {readyRfqs.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="Aucune RFQ en commission"
            description="Les RFQ verrouillees apres deadline apparaitront ici pour ouverture."
          />
        ) : (
          <div className="data-list">
            {readyRfqs.map((rfq) => {
              const submissionCount = data.submissionsByRfq[rfq.id]?.length ?? 0;
              return (
                <article key={rfq.id} className="list-row vertical">
                  <div className="list-row-header">
                    <div>
                      <strong>{rfq.reference}</strong>
                      <span>{rfq.title}</span>
                    </div>
                    <Badge value={rfq.status} />
                  </div>
                  <div className="definition-grid inline">
                    <dt>Deadline</dt>
                    <dd>{new Date(rfq.deadlineAt).toLocaleString("fr-DZ")}</dd>
                    <dt>Offres</dt>
                    <dd>{submissionCount}</dd>
                    <dt>Decisions</dt>
                    <dd>{data.decisions.filter((d) => d.rfqId === rfq.id).length}</dd>
                  </div>
                  <div className="actions">
                    <Button icon={ChevronRight} onClick={() => onOpenRfq(rfq.id)}>
                      Ouvrir le dossier
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
