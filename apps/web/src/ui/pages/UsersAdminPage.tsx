import { useState } from "react";
import { Plus, ShieldCheck, UserCog } from "lucide-react";
import type { AppData } from "../types.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { InfoBanner } from "../components/InfoBanner.js";
import { Modal } from "../components/Modal.js";
import { PageHeader } from "../components/PageHeader.js";
import { Panel } from "../components/Panel.js";

export function UsersAdminPage({
  data,
  actions
}: {
  data: AppData;
  actions: {
    createUser: (input: {
      email: string;
      fullName: string;
      role: string;
      organization: string;
    }) => Promise<void>;
    toggleUserActive: (id: string) => Promise<void>;
  };
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("buyer");
  const [organization, setOrganization] = useState("");

  const handleCreate = async () => {
    if (!email.trim() || !fullName.trim()) return;
    await actions.createUser({ email, fullName, role, organization });
    setEmail("");
    setFullName("");
    setRole("buyer");
    setOrganization("");
    setShowCreate(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Module 18"
        title="Administration des utilisateurs"
        description="Comptes internes et externes, attribution des roles, separation des fonctions."
      />

      <InfoBanner icon={ShieldCheck} tone="info" title="Separation des fonctions">
        Les profils 'Acheteur' et 'Demandeur' sont incompatibles sur un meme compte. Les
        commissions sont gerees via le module 11 pour limiter les conflits d'interet.
      </InfoBanner>

      <Panel
        title="Annuaire des utilisateurs"
        description={`${data.users.length} comptes actifs ou desactives`}
        icon={UserCog}
        actions={
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Nouvel utilisateur
          </Button>
        }
      >
        <div className="table">
          <div className="table-head users-page">
            <span>Utilisateur</span>
            <span>Email</span>
            <span>Role</span>
            <span>Organisation</span>
            <span>Statut</span>
            <span>Action</span>
          </div>
          {data.users.map((user) => (
            <div key={user.id} className="table-row users-page">
              <strong>{user.displayName}</strong>
              <span>{user.email}</span>
              <Badge value={user.role === "buyer" ? "active" : "info"} label={user.role} />
              <span>{user.department ?? "—"}</span>
              <Badge value={user.active ? "active" : "disabled"} label={user.active ? "actif" : "inactif"} />
              <Button
                tone={user.active ? "danger" : "success"}
                onClick={() => actions.toggleUserActive(user.id)}
              >
                {user.active ? "Desactiver" : "Reactiver"}
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      <Modal
        open={showCreate}
        title="Creer un utilisateur"
        onClose={() => setShowCreate(false)}
        footer={
          <>
            <Button tone="ghost" onClick={() => setShowCreate(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>Creer</Button>
          </>
        }
      >
        <label className="form-field">
          <span>Nom complet</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="form-field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="buyer">Acheteur</option>
            <option value="requester">Demandeur</option>
            <option value="commissionMember">Membre commission</option>
            <option value="administrator">Administrateur</option>
            <option value="auditor">Auditeur</option>
            <option value="supplier">Fournisseur</option>
            <option value="erpSystem">ERP</option>
          </select>
        </label>
        <label className="form-field">
          <span>Organisation</span>
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </label>
      </Modal>
    </>
  );
}