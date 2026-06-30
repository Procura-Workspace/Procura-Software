import { Bell, Cpu, Database, HardDrive, Network, ShieldCheck } from "lucide-react";
import type { AppData } from "../types.js";
import { Badge } from "../components/Badge.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function MonitoringPage({ data }: { data: AppData }) {
  const services = [
    { name: "API Procura (LAN)", status: "ok", detail: "Fastify 5.x - uptime 99.97%" },
    { name: "Portail fournisseur (DMZ)", status: "ok", detail: "Nginx + WAF" },
    { name: "PostgreSQL", status: "ok", detail: "Connexion chiffree TDE" },
    { name: "MinIO (object storage)", status: "ok", detail: "Coffre-fort chiffre" },
    { name: "Redis", status: "warning", detail: "Memoire 72%" },
    { name: "Vault", status: "ok", detail: "Rotation automatique" },
    { name: "HSM", status: "ok", detail: "PKCS#11 operationnel" },
    { name: "SIEM Wazuh", status: "ok", detail: "Reception logs OK" }
  ];

  return (
    <>
      <PageHeader
        eyebrow="Module 21"
        title="Monitoring et exploitation"
        description="Sante de la plateforme, alertes en temps reel, planification capacitaire."
      />

      <section className="metrics-grid compact">
        <article className="metric-card info">
          <span>RFQ publiees</span>
          <strong>{data.dashboard.rfqsPublished}</strong>
        </article>
        <article className="metric-card success">
          <span>Attribuees</span>
          <strong>{data.dashboard.rfqsAwarded}</strong>
        </article>
        <article className="metric-card warning">
          <span>Alertes critiques</span>
          <strong>{data.dashboard.criticalAlerts}</strong>
        </article>
        <article className="metric-card neutral">
          <span>Evenements audit</span>
          <strong>{data.dashboard.auditEvents}</strong>
        </article>
      </section>

      <InfoBanner icon={ShieldCheck} tone="success" title="Conformite Loi 23-12">
        Tous les services essentiels remontent leur etat vers le SIEM. Les alertes sont
        notifiees en moins de 5 minutes au SOC.
      </InfoBanner>

      <Panel title="Etat des services" icon={Cpu}>
        <div className="services-grid">
          {services.map((service) => (
            <article key={service.name} className="service-card">
              <header>
                <Badge value={service.status === "ok" ? "active" : service.status === "warning" ? "medium" : "critical"} label={service.status} />
                <strong>{service.name}</strong>
              </header>
              <span>{service.detail}</span>
            </article>
          ))}
        </div>
      </Panel>

      <section className="content-grid">
        <Panel title="Alertes recentes" icon={Bell}>
          {data.alerts.length === 0 ? (
            <InfoBanner icon={Bell} title="Aucune alerte">
              Aucun evenement sensible detecte.
            </InfoBanner>
          ) : (
            <div className="stack">
              {data.alerts.map((alert) => (
                <article key={alert.id} className="alert-item">
                  <Badge value={alert.severity} />
                  <strong>{alert.title}</strong>
                  <span>{alert.message}</span>
                  <small>Module {alert.module}</small>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Capacite" icon={HardDrive}>
          <ul className="stat-list">
            <li>
              <span>
                <Database size={14} /> Base de donnees
              </span>
              <strong>62% utilise</strong>
            </li>
            <li>
              <span>
                <HardDrive size={14} /> Coffre-fort MinIO
              </span>
              <strong>34% utilise</strong>
            </li>
            <li>
              <span>
                <Network size={14} /> Bande passante
              </span>
              <strong>18 Mbps</strong>
            </li>
            <li>
              <span>
                <Cpu size={14} /> CPU API
              </span>
              <strong>22%</strong>
            </li>
          </ul>
        </Panel>
      </section>
    </>
  );
}
