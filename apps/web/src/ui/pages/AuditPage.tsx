import { Activity, AlertTriangle, CheckCircle2, Hash, ShieldCheck } from "lucide-react";
import type { AppData } from "../types.js";
import { Badge } from "../components/Badge.js";
import { EmptyState } from "../components/EmptyState.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function AuditPage({ data }: { data: AppData }) {
  const verify = data.auditVerify;
  const verifyTone =
    verify.broken === 0 ? "success" : verify.verified === 0 ? "danger" : "warning";

  return (
    <>
      <PageHeader
        eyebrow="Module 10"
        title="Audit et tracabilite"
        description="Chaine d'evenements append-only, hash-chain, verification d'integrite."
      />

      <section className="metrics-grid compact">
        <article className="metric-card info">
          <span>Total evenements</span>
          <strong>{verify.total}</strong>
        </article>
        <article className="metric-card success">
          <span>Verifies</span>
          <strong>{verify.verified}</strong>
        </article>
        <article className={`metric-card ${verify.broken > 0 ? "danger" : ""}`}>
          <span>Brises</span>
          <strong>{verify.broken}</strong>
        </article>
        <article className="metric-card neutral">
          <span>Dernier incident</span>
          <strong>{verify.firstBrokenAt ? new Date(verify.firstBrokenAt).toLocaleString("fr-DZ") : "Aucun"}</strong>
        </article>
      </section>

      <InfoBanner
        icon={verifyTone === "success" ? CheckCircle2 : AlertTriangle}
        tone={verifyTone}
        title="Verification de la chaine"
      >
        {verify.broken === 0
          ? "Tous les evenements sont coherents avec la chaine hash."
          : `${verify.broken} evenement(s) detaches - investigation requise.`}
      </InfoBanner>

      <Panel
        title="Journal d'audit"
        description="Evenements append-only, chacun lie au precedent via previousHash"
        icon={ShieldCheck}
      >
        {data.auditEvents.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Aucun evenement audite"
            description="Les actions apparaitront ici apres la premiere interaction."
          />
        ) : (
          <div className="table">
            <div className="table-head audit-page">
              <span>Date</span>
              <span>Acteur</span>
              <span>Action</span>
              <span>Ressource</span>
              <span>Hash</span>
              <span>Precedent</span>
            </div>
            {data.auditEvents.map((event) => (
              <div key={event.id} className="table-row audit-page">
                <time>{new Date(event.occurredAt).toLocaleString("fr-DZ")}</time>
                <span>
                  <Badge value={event.actorRole === "buyer" ? "active" : "info"} label={event.actorRole} />
                </span>
                <strong>
                  <Hash size={12} /> {event.action}
                </strong>
                <span>
                  {event.resourceType}#{event.resourceId.slice(0, 8)}
                </span>
                <code title={event.entryHash}>{event.entryHash.slice(0, 18)}...</code>
                <code title={event.previousHash ?? "—"}>
                  {event.previousHash ? `${event.previousHash.slice(0, 18)}...` : "GENESIS"}
                </code>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
