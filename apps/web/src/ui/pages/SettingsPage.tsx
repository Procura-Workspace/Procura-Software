import { useState } from "react";
import { Bell, Save, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import type { AppData } from "../types.js";
import { Button } from "../components/Button.js";
import { FormField } from "../components/FormField.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function SettingsPage({
  data,
  actions
}: {
  data: AppData;
  actions: {
    updateSettings: (input: {
      defaultDeadlineHours: number;
      archiveRetentionYears: number;
      maxSubmissionSizeMb: number;
      requireMfaForCommission: boolean;
      autoLockOnDeadline: boolean;
      enableSandboxAnalysis: boolean;
      enableWormArchive: boolean;
      language: "fr" | "ar" | "en";
    }) => Promise<void>;
  };
}) {
  const settings = data.settings;
  const [draft, setDraft] = useState(settings);

  return (
    <>
      <PageHeader
        eyebrow="Module 18"
        title="Parametres de la plateforme"
        description="Configuration globale du cycle S2C, conformite et notifications."
      />

      <InfoBanner icon={ShieldCheck} tone="success" title="Conforme aux referentiels">
        Les reglages ci-dessous appliquent les controles Loi 23-12, Loi 18-07 et ISO
        27001:2022 par defaut. Toute modification est tracee dans l'audit.
      </InfoBanner>

      <Panel title="Cycle S2C" icon={SettingsIcon}>
        <div className="form-grid">
          <FormField label="Delai par defaut (heures)">
            <input
              type="number"
              value={draft.defaultDeadlineHours}
              onChange={(e) =>
                setDraft({ ...draft, defaultDeadlineHours: Number(e.target.value) })
              }
            />
          </FormField>
          <FormField label="Taille max piece jointe (Mo)">
            <input
              type="number"
              value={draft.maxSubmissionSizeMb}
              onChange={(e) =>
                setDraft({ ...draft, maxSubmissionSizeMb: Number(e.target.value) })
              }
            />
          </FormField>
          <FormField label="Duree d'archivage legal (annees)">
            <input
              type="number"
              value={draft.archiveRetentionYears}
              onChange={(e) =>
                setDraft({ ...draft, archiveRetentionYears: Number(e.target.value) })
              }
            />
          </FormField>
          <FormField label="Langue">
            <select
              value={draft.language}
              onChange={(e) =>
                setDraft({ ...draft, language: e.target.value as "fr" | "ar" | "en" })
              }
            >
              <option value="fr">Francais</option>
              <option value="ar">Arabe</option>
              <option value="en">Anglais</option>
            </select>
          </FormField>
          <FormField label="MFA obligatoire pour la commission">
            <label className="form-field-checkbox">
              <input
                type="checkbox"
                checked={draft.requireMfaForCommission}
                onChange={(e) =>
                  setDraft({ ...draft, requireMfaForCommission: e.target.checked })
                }
              />
              <span>Activer le second facteur pour les membres commission</span>
            </label>
          </FormField>
          <FormField label="Verrouillage automatique apres deadline">
            <label className="form-field-checkbox">
              <input
                type="checkbox"
                checked={draft.autoLockOnDeadline}
                onChange={(e) =>
                  setDraft({ ...draft, autoLockOnDeadline: e.target.checked })
                }
              />
              <span>Bloquer la soumission des offres apres la deadline</span>
            </label>
          </FormField>
          <FormField label="Analyse sandbox des pieces jointes">
            <label className="form-field-checkbox">
              <input
                type="checkbox"
                checked={draft.enableSandboxAnalysis}
                onChange={(e) =>
                  setDraft({ ...draft, enableSandboxAnalysis: e.target.checked })
                }
              />
              <span>Scanner chaque piece jointe dans un environnement isole</span>
            </label>
          </FormField>
          <FormField label="Archivage WORM">
            <label className="form-field-checkbox">
              <input
                type="checkbox"
                checked={draft.enableWormArchive}
                onChange={(e) =>
                  setDraft({ ...draft, enableWormArchive: e.target.checked })
                }
              />
              <span>Activer le stockage immuable (Write Once Read Many)</span>
            </label>
          </FormField>
        </div>
      </Panel>

      <Panel title="Notifications recentes" icon={Bell}>
        {data.notifications.length === 0 ? (
          <InfoBanner icon={Bell} title="Aucune notification">
            Vous etes a jour.
          </InfoBanner>
        ) : (
          <ul className="thread">
            {data.notifications.map((n) => (
              <li key={n.id}>
                <strong>{n.title}</strong>
                <span>{n.body}</span>
                <time>{new Date(n.createdAt).toLocaleString("fr-DZ")}</time>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="actions">
        <Button icon={Save} onClick={() => actions.updateSettings(draft)}>
          Enregistrer
        </Button>
      </div>
    </>
  );
}