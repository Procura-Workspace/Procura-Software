import { useMemo } from "react";
import { ChevronRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { submissionStatusLabel } from "@procura/shared";
import type { AppData, AppRole } from "../types.js";
import { Badge } from "../components/Badge.js";
import { EmptyState } from "../components/EmptyState.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function SubmissionsPage({
  data,
  role,
  onOpenRfq
}: {
  data: AppData;
  role: AppRole;
  onOpenRfq: (id: string) => void;
}) {
  const summary = useMemo(() => {
    const sealed = data.submissions.filter((s) => s.status === "sealed").length;
    const opened = data.submissions.filter((s) => s.status === "opened").length;
    const suspicious = data.submissions.filter((s) => s.malwareScan !== "clean").length;
    return { sealed, opened, suspicious, total: data.submissions.length };
  }, [data.submissions]);

  return (
    <>
      <PageHeader
        eyebrow="Modules 6, 7, 8, 9"
        title="Coffre-fort numerique - depot des offres"
        description="Scan AV, sandbox, hash SHA-256, horodatage, verrouillage pre-deadline."
      />

      <section className="metrics-grid compact">
        <article className="metric-card neutral">
          <span>Total offres</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="metric-card success">
          <span>Scellees</span>
          <strong>{summary.sealed}</strong>
        </article>
        <article className="metric-card info">
          <span>Ouvertes</span>
          <strong>{summary.opened}</strong>
        </article>
        <article className="metric-card warning">
          <span>Suspectes</span>
          <strong>{summary.suspicious}</strong>
        </article>
      </section>

      <InfoBanner icon={ShieldCheck} tone="info" title="Regles du coffre-fort">
        Toute offre est inacessible avant la deadline officielle. Apres ouverture par la
        commission, les offres sont proposees en lecture seule, avec verification d'integrite
        automatique (SHA-256). Toute modification d'une offre scellee invalide son hash.
      </InfoBanner>

      {role === "supplier" ? (
        <Panel>
          <EmptyState
            icon={LockKeyhole}
            title="Vous etes connecte en fournisseur"
            description="Utilisez la rubrique Portail fournisseur pour deposer vos offres."
          />
        </Panel>
      ) : data.submissions.length === 0 ? (
        <Panel>
          <EmptyState
            icon={LockKeyhole}
            title="Aucune offre dans le coffre-fort"
            description="Les offres apparaitront ici apres depot par les fournisseurs."
          />
        </Panel>
      ) : (
        <Panel title="Offres deposees">
          <div className="table">
            <div className="table-head submissions-page">
              <span>RFQ</span>
              <span>Fichier</span>
              <span>Fournisseur</span>
              <span>Statut</span>
              <span>Scan AV</span>
              <span>Hash</span>
              <span>Taille</span>
              <span>Action</span>
            </div>
            {data.submissions.map((submission) => {
              const rfq = data.rfqs.find((r) => r.id === submission.rfqId);
              const supplier = data.suppliers.find((s) => s.id === submission.supplierId);
              return (
                <div key={submission.id} className="table-row submissions-page">
                  <strong>{rfq?.reference ?? "—"}</strong>
                  <span>{submission.fileName}</span>
                  <span>{supplier?.legalName ?? "—"}</span>
                  <Badge
                    value={submission.status}
                    label={submissionStatusLabel(submission.status)}
                  />
                  <Badge value={submission.malwareScan} />
                  <code>{submission.sha256Hash.slice(0, 18)}...</code>
                  <span>{(submission.sizeBytes / 1024).toFixed(1)} Ko</span>
                  <button
                    className="row-link"
                    type="button"
                    onClick={() => rfq && onOpenRfq(rfq.id)}
                  >
                    Detail RFQ <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </>
  );
}
