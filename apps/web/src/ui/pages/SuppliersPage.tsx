import { Building2, Database } from "lucide-react";
import type { AppData } from "../types.js";
import { Badge } from "../components/Badge.js";
import { EmptyState } from "../components/EmptyState.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function SuppliersPage({ data }: { data: AppData }) {
  return (
    <>
      <PageHeader
        eyebrow="Module 4"
        title="Referentiel fournisseurs (ERP)"
        description="Lecture seule - aucune donnee fournisseur n'est stockee dans Procura."
      />

      <InfoBanner icon={Database} tone="info" title="Source unique de verite">
        Le referentiel est gere par votre ERP. Procura consomme uniquement les informations
        necessaires a la consultation via une API securisee. Toute mise a jour de la fiche
        fournisseur doit etre effectuee dans l'ERP.
      </InfoBanner>

      {data.suppliers.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Building2}
            title="Aucun fournisseur synchronise"
            description="Lancez la synchronisation avec l'ERP depuis le module administration."
          />
        </Panel>
      ) : (
        <Panel title="Fournisseurs actifs">
          <div className="table">
            <div className="table-head suppliers-page">
              <span>ERP ID</span>
              <span>Raison sociale</span>
              <span>NIF</span>
              <span>Pays</span>
              <span>Email</span>
              <span>Categories</span>
              <span>Risque</span>
              <span>Statut</span>
            </div>
            {data.suppliers.map((supplier) => (
              <div key={supplier.id} className="table-row suppliers-page">
                <strong>{supplier.erpId}</strong>
                <span>{supplier.legalName}</span>
                <span>{supplier.taxId}</span>
                <span>{supplier.country}</span>
                <span>{supplier.email}</span>
                <span>{supplier.categories.join(", ")}</span>
                <Badge value={supplier.riskLevel} />
                <Badge value={supplier.status} />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
