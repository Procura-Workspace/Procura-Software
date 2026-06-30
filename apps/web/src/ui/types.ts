import type {
  AuditEvent,
  CommissionDecision,
  ComparisonRow,
  Dashboard,
  FinalOutput,
  Need,
  PlatformSettings,
  ProcuraNotification,
  Rfq,
  RoleCode,
  Submission,
  Supplier,
  SystemAlert,
  Ticket,
  User
} from "@procura/shared";

export type AppRole = Exclude<RoleCode, "erpSystem">;

export const appRoles: AppRole[] = [
  "requester",
  "buyer",
  "supplier",
  "commissionMember",
  "administrator",
  "auditor"
];

export type ViewKey =
  | "dashboard"
  | "needs"
  | "rfqs"
  | "rfqDetail"
  | "suppliers"
  | "submissions"
  | "commission"
  | "analysis"
  | "outputs"
  | "audit"
  | "tickets"
  | "monitoring"
  | "admin"
  | "settings"
  | "supplierPortal";

export type AppData = {
  dashboard: Dashboard;
  alerts: SystemAlert[];
  needs: Need[];
  suppliers: Supplier[];
  rfqs: Rfq[];
  submissions: Submission[];
  decisions: CommissionDecision[];
  outputs: FinalOutput[];
  auditEvents: AuditEvent[];
  auditVerify: { total: number; verified: number; broken: number; firstBrokenAt: string | null };
  users: User[];
  tickets: Ticket[];
  notifications: ProcuraNotification[];
  settings: PlatformSettings;
  comparisonByRfq: Record<string, ComparisonRow[]>;
  submissionsByRfq: Record<string, Submission[]>;
  openRfqsForSuppliers: Rfq[];
  supplierSubmissions: Submission[];
};

export type NavigationState =
  | { view: Exclude<ViewKey, "rfqDetail"> }
  | { view: "rfqDetail"; rfqId: string };

export const roleLabels: Record<AppRole, string> = {
  requester: "Demandeur",
  buyer: "Acheteur",
  supplier: "Fournisseur",
  commissionMember: "Membre commission",
  administrator: "Administrateur",
  auditor: "Auditeur"
};

export const roleTagline: Record<AppRole, string> = {
  requester: "Exprimer et suivre les besoins internes",
  buyer: "Creer, publier et suivre les RFQ",
  supplier: "Consulter les RFQ invitees et deposer les offres",
  commissionMember: "Ouvrir les plis, analyser, decider, signer le PV",
  administrator: "Administrer les utilisateurs et la plateforme",
  auditor: "Consulter les journaux et les preuves"
};