import { useMemo } from "react";
import { ArrowRight, ChevronRight, GitCompare, Trophy } from "lucide-react";
import type { AppData, AppRole } from "../types.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function ComparisonPage({
  data,
  role,
  onOpenRfq
}: {
  data: AppData;
  role: AppRole;
  onOpenRfq: (id: string) => void;
}) {
  const rfqsWithComparison = useMemo(() => {
    return data.rfqs
      .map((rfq) => ({
        rfq,
        rows: data.comparisonByRfq[rfq.id] ?? [],
        submissions: data.submissionsByRfq[rfq.id] ?? []
      }))
      .filter(({ rows }) => rows.length > 0);
  }, [data.rfqs, data.comparisonByRfq, data.submissionsByRfq]);

  return (
    <>
      <PageHeader
        eyebrow="Module 13"
        title="Analyse comparative"
        description="Tableau de bord multi-fournisseurs avec scoring pondere technique/financier."
      />

      {role !== "commissionMember" && (
        <InfoBanner icon={GitCompare} tone="info" title="Comparaison">
          Cette vue est accessible en lecture pour tous les profils metier. La saisie des
          scores reste reservee aux membres commission.
        </InfoBanner>
      )}

      {rfqsWithComparison.length === 0 ? (
        <Panel>
          <EmptyState
            icon={GitCompare}
            title="Aucun comparatif"
            description="Des qu'une RFQ a des offres deposees, le comparatif apparait ici."
          />
        </Panel>
      ) : (
        rfqsWithComparison.map(({ rfq, rows, submissions }) => {
          const sorted = [...rows].sort((a, b) => b.finalScore - a.finalScore);
          const winner = sorted[0];
          return (
            <Panel
              key={rfq.id}
              title={`${rfq.reference} - ${rfq.title}`}
              description={`Ponderation ${rfq.technicalWeight}% / ${rfq.financialWeight}% - ${submissions.length} offres`}
              actions={
                <Button icon={ArrowRight} tone="ghost" onClick={() => onOpenRfq(rfq.id)}>
                  Detail RFQ
                </Button>
              }
            >
              {winner && (
                <div className="winner-banner">
                  <Trophy size={20} />
                  <strong>{winner.supplierName}</strong>
                  <span>
                    Score final <strong>{winner.finalScore.toFixed(2)}</strong>
                  </span>
                </div>
              )}
              <div className="table">
                <div className="table-head comparison-page">
                  <span>Fournisseur</span>
                  <span>Score technique</span>
                  <span>Score financier</span>
                  <span>Score pondere</span>
                  <span>Montant</span>
                  <span>Decision</span>
                  <span>Action</span>
                </div>
                {sorted.map((row, index) => (
                  <div
                    key={row.supplierId}
                    className={`table-row comparison-page ${index === 0 ? "winner" : ""}`}
                  >
                    <strong>{row.supplierName}</strong>
                    <span>{row.technicalScore.toFixed(1)}</span>
                    <span>{row.financialScore.toFixed(1)}</span>
                    <strong>{row.finalScore.toFixed(2)}</strong>
                    <span>
                      {row.financialOffer
                        ? `${row.financialOffer.toLocaleString("fr-DZ")} DZD`
                        : "—"}
                    </span>
                    <Badge value={row.decision} />
                    <button
                      type="button"
                      className="row-link"
                      onClick={() => onOpenRfq(rfq.id)}
                    >
                      Decider <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          );
        })
      )}
    </>
  );
}
