import { Archive, FileText, Send, ShieldCheck } from "lucide-react";
import type { AppData } from "../types.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function OutputsPage({
  data,
  actions
}: {
  data: AppData;
  actions: {
    generateOutput: (id: string) => Promise<void>;
    sendOutput: (id: string) => Promise<void>;
  };
}) {
  const awardedRfqs = data.rfqs.filter((rfq) =>
    ["awarded", "exported"].includes(rfq.status)
  );
  const eligible = awardedRfqs.filter(
    (rfq) => !data.outputs.some((o) => o.rfqId === rfq.id)
  );

  return (
    <>
      <PageHeader
        eyebrow="Modules 14 et 15"
        title="Output final et transmission ERP"
        description="Consolidation des decisions, hash, transmission securisee."
      />

      <InfoBanner icon={ShieldCheck} tone="success" title="Integrite garantie">
        Chaque output genere est signe SHA-256 et envoye a l'ERP avec une preuve de
        transmission (ACK). Le retrait cote ERP reste maite de l'integration : Procura ne
        devient pas ERP.
      </InfoBanner>

      <Panel title="RFQ attribuees en attente de generation" icon={FileText}>
        {eligible.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="Aucune RFQ attribuee en attente"
            description="Les RFQ avec une decision 'Attribuee' apparaitront ici."
          />
        ) : (
          <div className="data-list">
            {eligible.map((rfq) => {
              const supplier = data.suppliers.find((s) =>
                data.decisions.some(
                  (d) => d.rfqId === rfq.id && d.decision === "awarded" && d.supplierId === s.id
                )
              );
              return (
                <article key={rfq.id} className="list-row">
                  <div>
                    <strong>{rfq.reference}</strong>
                    <span>
                      Attribuee a {supplier?.legalName ?? "fournisseur inconnu"} — {rfq.title}
                    </span>
                  </div>
                  <Button icon={FileText} onClick={() => actions.generateOutput(rfq.id)}>
                    Generer output
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Outputs generes" icon={Archive}>
        {data.outputs.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="Aucun output genere"
            description="Generez un output depuis une RFQ attribuee."
          />
        ) : (
          <div className="table">
            <div className="table-head outputs-page">
              <span>Export ID</span>
              <span>PV</span>
              <span>RFQ</span>
              <span>Statut</span>
              <span>Hash payload</span>
              <span>Genere</span>
              <span>Action</span>
            </div>
            {data.outputs.map((output) => {
              const rfq = data.rfqs.find((r) => r.id === output.rfqId);
              return (
                <div key={output.id} className="table-row outputs-page">
                  <strong>{output.exportId}</strong>
                  <span>{output.pvReference}</span>
                  <span>{rfq?.reference ?? "—"}</span>
                  <Badge value={output.status} />
                  <code>{output.payloadHash.slice(0, 20)}...</code>
                  <time>{new Date(output.generatedAt).toLocaleString("fr-DZ")}</time>
                  {output.status === "generated" ? (
                    <Button icon={Send} onClick={() => actions.sendOutput(output.id)}>
                      Envoyer ERP
                    </Button>
                  ) : (
                    <Badge value="acknowledged" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
