import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Gavel,
  LockKeyhole,
  Send,
  Server,
  UploadCloud
} from "lucide-react";
import type { AppData, AppRole, ViewKey } from "../types.js";
import { roleLabels, roleTagline } from "../types.js";
import { Badge } from "../components/Badge.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { MetricCard } from "../components/MetricCard.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";
import { Stepper } from "../components/Stepper.js";
import type { Step } from "../components/Stepper.js";

const quickLinksByRole: Record<
  AppRole,
  Array<{ view: ViewKey; label: string; description: string; icon: typeof Activity }>
> = {
  buyer: [
    { view: "needs", label: "Besoins", description: "Valider les expressions internes", icon: FileCheck2 },
    { view: "rfqs", label: "RFQ", description: "Creer et publier une consultation", icon: Send },
    { view: "outputs", label: "Output ERP", description: "Generer et transmettre", icon: Archive }
  ],
  requester: [
    { view: "needs", label: "Besoins", description: "Creer mon expression", icon: FileCheck2 },
    { view: "dashboard", label: "Suivi", description: "Etat de mes demandes", icon: Activity }
  ],
  supplier: [
    { view: "supplierPortal", label: "Portail", description: "Consulter et deposer", icon: UploadCloud }
  ],
  commissionMember: [
    { view: "commission", label: "Commission", description: "Saisir decisions et PV", icon: Gavel },
    { view: "analysis", label: "Analyse", description: "Comparatif structure", icon: Send },
    { view: "audit", label: "Audit", description: "Verifier la tracabilite", icon: Activity }
  ],
  administrator: [
    { view: "admin", label: "Utilisateurs", description: "Gestion RBAC", icon: Building2 },
    { view: "settings", label: "Parametres", description: "Configuration plateforme", icon: Server },
    { view: "monitoring", label: "Monitoring", description: "Sante des services", icon: Activity }
  ],
  auditor: [
    { view: "audit", label: "Audit", description: "Verifier chainage", icon: Activity },
    { view: "monitoring", label: "Monitoring", description: "Alertes en cours", icon: Bell }
  ]
};

const cycleSteps: Step[] = [
  { label: "Expression du besoin", description: "Module 3", state: "done" },
  { label: "RFQ publiee", description: "Modules 5/6/7", state: "done" },
  { label: "Coffre-fort scelle", description: "Modules 7/8/9", state: "current" },
  { label: "Ouverture des plis", description: "Module 11", state: "pending" },
  { label: "Commission + PV", description: "Modules 12/13", state: "pending" },
  { label: "Output ERP", description: "Modules 14/15", state: "pending" }
];

export function DashboardPage({
  data,
  role,
  onOpenRfq,
  onNavigate
}: {
  data: AppData;
  role: AppRole;
  onOpenRfq: (id: string) => void;
  onNavigate: (view: ViewKey) => void;
}) {
  const recentRfqs = useMemo(
    () => data.rfqs.slice(0, 5),
    [data.rfqs]
  );

  const metrics = [
    {
      label: "RFQ en cours",
      value: data.dashboard.rfqsActive,
      icon: Send,
      tone: "neutral" as const,
      hint: "publiees + verrouillees + commission"
    },
    {
      label: "Besoins en attente",
      value: data.dashboard.needsPending,
      icon: FileCheck2,
      tone: "warning" as const,
      hint: "a valider ou a convertir"
    },
    {
      label: "Offres scellees",
      value: data.dashboard.sealedSubmissions,
      icon: LockKeyhole,
      tone: "success" as const,
      hint: "dans le coffre-fort"
    },
    {
      label: "Tickets ouverts",
      value: data.dashboard.openTickets,
      icon: AlertTriangle,
      tone: "warning" as const,
      hint: "collaboration post-decision"
    },
    {
      label: "Evenements audit",
      value: data.dashboard.auditEvents,
      icon: Activity,
      tone: "neutral" as const,
      hint: "chaine hash-chain"
    },
    {
      label: "Exports ERP",
      value: data.dashboard.erpExports,
      icon: Archive,
      tone: "success" as const,
      hint: "outputs transmis"
    }
  ];

  return (
    <>
      <PageHeader
        eyebrow="Vue operationnelle"
        title={`Bonjour ${roleLabels[role]}`}
        description={roleTagline[role]}
        meta={
          <InfoBanner icon={CheckCircle2} tone="success" title="Profil :">
            {roleLabels[role]} &mdash; selection modifiable en haut a gauche pour tester les differents parcours.
          </InfoBanner>
        }
      />

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="content-grid">
        <Panel
          title="Cycle Source-to-Contract"
          description="Etat global du dossier RFQ-2026-087 (demo)"
          variant="wide"
        >
          <Stepper steps={cycleSteps} />
          <div className="cycle-stats">
            <div>
              <span>RFQ publiees</span>
              <strong>{data.dashboard.rfqsPublished}</strong>
            </div>
            <div>
              <span>Offres ouvertes</span>
              <strong>{data.dashboard.openedSubmissions}</strong>
            </div>
            <div>
              <span>Attribuees</span>
              <strong>{data.dashboard.rfqsAwarded}</strong>
            </div>
            <div>
              <span>Alertes critiques</span>
              <strong>{data.dashboard.criticalAlerts}</strong>
            </div>
          </div>
        </Panel>

        <Panel title="Acces rapide" icon={ChevronRight}>
          <div className="quick-links">
            {quickLinksByRole[role].map((link) => (
              <button
                type="button"
                className="quick-link"
                key={link.view}
                onClick={() => onNavigate(link.view)}
              >
                <link.icon size={18} />
                <div>
                  <strong>{link.label}</strong>
                  <span>{link.description}</span>
                </div>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel
          title="RFQ recentes"
          description="Selectionnez une RFQ pour ouvrir le detail complet"
          variant="wide"
        >
          <div className="data-list">
            {recentRfqs.length === 0 && (
              <div className="empty-state">
                <Send size={28} />
                <strong>Aucune RFQ</strong>
                <span>Creez votre premiere consultation depuis le menu RFQ.</span>
              </div>
            )}
            {recentRfqs.map((rfq) => (
              <button
                type="button"
                key={rfq.id}
                className="list-row clickable"
                onClick={() => onOpenRfq(rfq.id)}
              >
                <div>
                  <strong>{rfq.reference}</strong>
                  <span>{rfq.title}</span>
                </div>
                <Badge value={rfq.status} />
                <time dateTime={rfq.deadlineAt}>
                  {new Date(rfq.deadlineAt).toLocaleString("fr-DZ")}
                </time>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Alertes" icon={Bell}>
          <div className="stack">
            {data.alerts.length === 0 && (
              <div className="empty-state">
                <Bell size={26} />
                <strong>Aucune alerte</strong>
                <span>Les alertes apparaissent ici en cas d'evenement sensible.</span>
              </div>
            )}
            {data.alerts.map((alert) => (
              <article className="alert-item" key={alert.id}>
                <Badge value={alert.severity} />
                <strong>{alert.title}</strong>
                <span>{alert.message}</span>
                <small>Module : {alert.module}</small>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}
