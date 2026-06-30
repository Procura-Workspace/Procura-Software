import { useState } from "react";
import {
  Activity,
  Archive,
  Building2,
  ChevronDown,
  FileCheck2,
  Gavel,
  Inbox,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  LogOut,
  Monitor,
  Send,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  UploadCloud
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppRole, NavigationState, ViewKey } from "../types.js";
import { roleLabels } from "../types.js";

type NavItem = {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  roles: AppRole[];
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: ["requester", "buyer", "supplier", "commissionMember", "administrator", "auditor"] },
  { key: "needs", label: "Besoins", icon: FileCheck2, roles: ["requester", "buyer", "administrator", "auditor"] },
  { key: "rfqs", label: "RFQ", icon: Send, roles: ["buyer", "commissionMember", "administrator", "auditor"] },
  { key: "supplierPortal", label: "Portail fournisseur", icon: UploadCloud, roles: ["supplier"] },
  { key: "suppliers", label: "Fournisseurs ERP", icon: Building2, roles: ["buyer", "administrator", "auditor"] },
  { key: "submissions", label: "Coffre-fort", icon: LockKeyhole, roles: ["buyer", "commissionMember", "auditor"] },
  { key: "commission", label: "Commission", icon: Gavel, roles: ["commissionMember", "buyer", "auditor"] },
  { key: "analysis", label: "Analyse comparative", icon: LineChart, roles: ["commissionMember", "buyer", "auditor"] },
  { key: "outputs", label: "Output ERP", icon: Archive, roles: ["buyer", "auditor"] },
  { key: "tickets", label: "Tickets", icon: Inbox, roles: ["buyer", "commissionMember", "supplier", "administrator", "auditor"] },
  { key: "monitoring", label: "Monitoring", icon: Monitor, roles: ["administrator", "auditor", "buyer"] },
  { key: "audit", label: "Audit & chainage", icon: Activity, roles: ["administrator", "auditor"] },
  { key: "admin", label: "Utilisateurs", icon: Users, roles: ["administrator"] },
  { key: "settings", label: "Parametres", icon: SettingsIcon, roles: ["administrator"] }
];

export function Shell({
  role,
  availableRoles,
  onSwitchRole,
  apiState,
  navigation,
  onNavigate,
  notificationsCount,
  alertsCount,
  children
}: {
  role: AppRole;
  availableRoles: AppRole[];
  onSwitchRole: (role: AppRole) => void;
  apiState: "checking" | "online" | "offline";
  navigation: NavigationState;
  onNavigate: (state: NavigationState) => void;
  notificationsCount: number;
  alertsCount: number;
  children: ReactNode;
}) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const isActive = (key: ViewKey) => navigation.view === key;
  const navigate = (state: NavigationState) => onNavigate(state);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navigation principale">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>Procura</strong>
            <span>S2C On-Premise MVP</span>
          </div>
        </div>

        <button
          className="role-switcher"
          type="button"
          onClick={() => setRoleMenuOpen((v) => !v)}
          aria-expanded={roleMenuOpen}
        >
          <div>
            <span className="role-switcher-eyebrow">Profil actif</span>
            <strong>{roleLabels[role]}</strong>
          </div>
          <ChevronDown size={16} />
        </button>

        {roleMenuOpen && (
          <div className="role-menu" role="menu">
            {availableRoles.map((r) => (
              <button
                type="button"
                key={r}
                className={r === role ? "active" : ""}
                onClick={() => {
                  onSwitchRole(r);
                  setRoleMenuOpen(false);
                }}
              >
                {roleLabels[r]}
              </button>
            ))}
            <div className="role-menu-hint">
              <LogOut size={14} />
              <span>Demo MVP : selection libre sans authentification reelle.</span>
            </div>
          </div>
        )}

        <nav className="nav-list" aria-label="Modules">
          {visibleItems.map((item) => (
            <button
              key={item.key}
              className={isActive(item.key) ? "active" : ""}
              type="button"
              onClick={() => navigate({ view: item.key } as Exclude<NavigationState, { view: "rfqDetail" }>)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.key === "monitoring" && alertsCount > 0 && (
                <span className="nav-pill warning">{alertsCount}</span>
              )}
              {item.key === "tickets" && notificationsCount > 0 && (
                <span className="nav-pill info">{notificationsCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="security-note">
          <ShieldCheck size={18} />
          <span>
            Defence en profondeur, audit chainable, separation DMZ/LAN, zero trust entre
            composants. Pret pour validation pre-prod.
          </span>
        </div>
      </aside>

      <section className="workspace">
        <header className="top-bar">
          <div className="top-bar-info">
            <span className={`status-pill ${apiState}`}>
              {apiState === "online" ? "Maquette locale" : `API ${apiState}`}
            </span>
            <span className="top-bar-chip">RBAC : {roleLabels[role]}</span>
            <span className="top-bar-chip">Audit hash-chain actif</span>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}