import { z } from "zod";

// ============================================================================
// Catalogue des 22 modules Procura (référentiel)
// ============================================================================

export const procuraModules = [
  { code: "architecture", label: "Architecture & deploiement" },
  { code: "iam", label: "Utilisateurs & acces" },
  { code: "needs", label: "Expression du besoin" },
  { code: "supplierReference", label: "Referentiel fournisseurs ERP" },
  { code: "rfqPublication", label: "RFQ & publication" },
  { code: "supplierPortal", label: "Portail fournisseur DMZ" },
  { code: "secureSubmission", label: "Depot securise des offres" },
  { code: "legalTimestamping", label: "Horodatage & preuve legale" },
  { code: "deadlines", label: "Deadlines & verrouillage" },
  { code: "audit", label: "Audit & tracabilite" },
  { code: "bidOpening", label: "Ouverture des plis" },
  { code: "commission", label: "Commission d'ouverture" },
  { code: "offerAnalysis", label: "Analyse & structuration" },
  { code: "finalOutput", label: "Generation output final" },
  { code: "erpIntegration", label: "Integration ERP" },
  { code: "collaboration", label: "Communication collaborative" },
  { code: "notifications", label: "Notifications systeme" },
  { code: "administration", label: "Administration & parametrage" },
  { code: "globalSecurity", label: "Securite globale" },
  { code: "legalArchiving", label: "Archivage & conservation" },
  { code: "monitoring", label: "Monitoring & exploitation" },
  { code: "support", label: "Documentation & support" }
] as const;

export type ProcuraModuleCode = (typeof procuraModules)[number]["code"];

// ============================================================================
// Roles & Permissions (RBAC complet)
// ============================================================================

export const roles = [
  { code: "requester", label: "Demandeur" },
  { code: "buyer", label: "Acheteur" },
  { code: "supplier", label: "Fournisseur" },
  { code: "commissionMember", label: "Membre Commission" },
  { code: "administrator", label: "Administrateur" },
  { code: "auditor", label: "Auditeur" },
  { code: "erpSystem", label: "Systeme ERP" }
] as const;

export type RoleCode = (typeof roles)[number]["code"];

export const roleLabels: Record<RoleCode, string> = Object.fromEntries(
  roles.map((r) => [r.code, r.label])
) as Record<RoleCode, string>;

export const permissions = [
  "need:create",
  "need:submit",
  "need:approve",
  "need:read",
  "supplier:read",
  "supplier:invite",
  "rfq:create",
  "rfq:publish",
  "rfq:read",
  "rfq:transition",
  "submission:create",
  "submission:seal",
  "submission:open",
  "submission:read",
  "commission:decide",
  "commission:sign",
  "output:generate",
  "erp:export",
  "ticket:create",
  "ticket:reply",
  "audit:read",
  "admin:manage",
  "monitoring:read"
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<RoleCode, readonly Permission[]> = {
  requester: ["need:create", "need:submit", "need:read", "rfq:read"],
  buyer: [
    "need:read",
    "need:approve",
    "supplier:read",
    "supplier:invite",
    "rfq:create",
    "rfq:publish",
    "rfq:read",
    "rfq:transition",
    "submission:read",
    "output:generate",
    "erp:export",
    "audit:read",
    "monitoring:read"
  ],
  supplier: ["rfq:read", "submission:create"],
  commissionMember: [
    "rfq:read",
    "submission:open",
    "submission:read",
    "commission:decide",
    "commission:sign",
    "audit:read",
    "monitoring:read"
  ],
  administrator: [
    "need:read",
    "supplier:read",
    "rfq:read",
    "audit:read",
    "admin:manage",
    "monitoring:read",
    "rfq:transition"
  ],
  auditor: ["need:read", "rfq:read", "audit:read", "monitoring:read", "submission:read"],
  erpSystem: ["supplier:read", "erp:export"]
};

// ============================================================================
// Statuts et enums metier
// ============================================================================

export const priorityLevels = ["low", "medium", "high", "critical"] as const;
export const needStatuses = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "convertedToRfq"
] as const;
export const rfqStatuses = [
  "draft",
  "pendingApproval",
  "published",
  "locked",
  "opening",
  "commissionReview",
  "awarded",
  "exported",
  "archived",
  "cancelled"
] as const;
export const supplierStatuses = ["active", "blocked", "pendingReview"] as const;
export const submissionStatuses = [
  "draft",
  "quarantined",
  "sealed",
  "rejected",
  "opened",
  "opened"
] as const;
export const outputStatuses = ["draft", "generated", "sentToErp", "acknowledged", "failed"] as const;
export const riskLevels = ["low", "medium", "high", "critical"] as const;
export const ticketStatuses = ["open", "awaitingSupplier", "awaitingCompany", "resolved", "closed"] as const;
export const ticketCategories = ["administrative", "documentation", "technical", "delivery"] as const;

export type PriorityLevel = (typeof priorityLevels)[number];
export type NeedStatus = (typeof needStatuses)[number];
export type RfqStatus = (typeof rfqStatuses)[number];
export type SupplierStatus = (typeof supplierStatuses)[number];
export type SubmissionStatus = (typeof submissionStatuses)[number];
export type OutputStatus = (typeof outputStatuses)[number];
export type RiskLevel = (typeof riskLevels)[number];
export type TicketStatus = (typeof ticketStatuses)[number];
export type TicketCategory = (typeof ticketCategories)[number];

// ============================================================================
// Schemas Zod
// ============================================================================

export const userSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(roles.map((r) => r.code) as [RoleCode, ...RoleCode[]]),
  department: z.string().min(2).max(120),
  active: z.boolean(),
  createdAt: z.string().datetime()
});

export const needSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().min(3).max(64),
  title: z.string().min(3).max(180),
  description: z.string().min(10).max(4_000),
  department: z.string().min(2).max(120),
  estimatedBudget: z.number().nonnegative(),
  currency: z.string().length(3),
  priority: z.enum(priorityLevels),
  status: z.enum(needStatuses),
  requesterId: z.string().uuid(),
  approverId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createNeedSchema = needSchema.pick({
  title: true,
  description: true,
  department: true,
  estimatedBudget: true,
  currency: true,
  priority: true
});

export const supplierSchema = z.object({
  id: z.string().uuid(),
  erpId: z.string().min(2).max(80),
  legalName: z.string().min(2).max(180),
  taxId: z.string().min(2).max(80),
  country: z.string().min(2).max(80),
  email: z.string().email(),
  riskLevel: z.enum(riskLevels),
  status: z.enum(supplierStatuses),
  categories: z.array(z.string().min(2).max(80)),
  lastErpSyncAt: z.string().datetime()
});

export const rfqSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().min(3).max(64),
  needId: z.string().uuid().nullable(),
  title: z.string().min(3).max(180),
  description: z.string().min(10).max(4_000),
  status: z.enum(rfqStatuses),
  buyerId: z.string().uuid(),
  deadlineAt: z.string().datetime(),
  supplierIds: z.array(z.string().uuid()).default([]),
  technicalWeight: z.number().min(0).max(100),
  financialWeight: z.number().min(0).max(100),
  allowedFormats: z.array(z.string()).default([]),
  globalHash: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createRfqSchema = z.object({
  needId: z.string().uuid().nullable().default(null),
  title: z.string().min(3).max(180),
  description: z.string().min(10).max(4_000),
  deadlineAt: z.string().datetime(),
  supplierIds: z.array(z.string().uuid()).min(1).max(100),
  technicalWeight: z.number().min(0).max(100).default(60),
  financialWeight: z.number().min(0).max(100).default(40),
  allowedFormats: z.array(z.string()).default(["pdf"])
});

export const submissionSchema = z.object({
  id: z.string().uuid(),
  rfqId: z.string().uuid(),
  supplierId: z.string().uuid(),
  status: z.enum(submissionStatuses),
  fileName: z.string().min(3).max(240),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive(),
  sha256Hash: z.string().length(64),
  sealedAt: z.string().datetime().nullable(),
  openedAt: z.string().datetime().nullable(),
  malwareScan: z.enum(["clean", "suspicious", "malicious"]),
  createdAt: z.string().datetime(),
  technicalScore: z.number().min(0).max(100).nullable(),
  financialOffer: z.number().nonnegative().nullable(),
  currency: z.string().length(3).nullable()
});

export const createSubmissionSchema = z.object({
  rfqId: z.string().uuid(),
  supplierId: z.string().uuid(),
  fileName: z.string().min(3).max(240),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive(),
  technicalScore: z.number().min(0).max(100).optional(),
  financialOffer: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional()
});

export const commissionDecisionSchema = z.object({
  id: z.string().uuid(),
  rfqId: z.string().uuid(),
  supplierId: z.string().uuid(),
  technicalScore: z.number().min(0).max(100),
  financialScore: z.number().min(0).max(100),
  finalScore: z.number().min(0).max(100),
  decision: z.enum(["shortlisted", "rejected", "awarded"]),
  notes: z.string().max(2_000),
  decidedBy: z.string().uuid(),
  decidedAt: z.string().datetime()
});

export const createCommissionDecisionSchema = commissionDecisionSchema.pick({
  rfqId: true,
  supplierId: true,
  technicalScore: true,
  financialScore: true,
  decision: true,
  notes: true
});

export const finalOutputSchema = z.object({
  id: z.string().uuid(),
  exportId: z.string().min(3).max(80),
  rfqId: z.string().uuid(),
  supplierId: z.string().uuid(),
  status: z.enum(outputStatuses),
  payloadHash: z.string().length(64),
  pvReference: z.string().min(3).max(80),
  generatedAt: z.string().datetime(),
  sentAt: z.string().datetime().nullable(),
  acknowledgedAt: z.string().datetime().nullable()
});

export const auditEventSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string(),
  actorRole: z.string(),
  action: z.string().min(3).max(120),
  resourceType: z.string().min(2).max(80),
  resourceId: z.string().min(1).max(120),
  occurredAt: z.string().datetime(),
  previousHash: z.string().nullable(),
  entryHash: z.string()
});

export const dashboardSchema = z.object({
  rfqsActive: z.number().int().nonnegative(),
  rfqsPublished: z.number().int().nonnegative(),
  rfqsAwarded: z.number().int().nonnegative(),
  needsPending: z.number().int().nonnegative(),
  sealedSubmissions: z.number().int().nonnegative(),
  openedSubmissions: z.number().int().nonnegative(),
  criticalAlerts: z.number().int().nonnegative(),
  auditEvents: z.number().int().nonnegative(),
  erpExports: z.number().int().nonnegative(),
  openTickets: z.number().int().nonnegative()
});

export const systemAlertSchema = z.object({
  id: z.string().uuid(),
  severity: z.enum(["info", "warning", "critical"]),
  title: z.string(),
  message: z.string(),
  module: z.string(),
  createdAt: z.string().datetime()
});

export const ticketSchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  rfqId: z.string().uuid().nullable(),
  supplierId: z.string().uuid().nullable(),
  category: z.enum(ticketCategories),
  status: z.enum(ticketStatuses),
  subject: z.string().min(3).max(180),
  messages: z.array(
    z.object({
      id: z.string().uuid(),
      authorId: z.string(),
      authorRole: z.string(),
      body: z.string().min(1).max(2_000),
      createdAt: z.string().datetime()
    })
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createTicketSchema = z.object({
  rfqId: z.string().uuid().nullable().default(null),
  supplierId: z.string().uuid().nullable().default(null),
  category: z.enum(ticketCategories),
  subject: z.string().min(3).max(180),
  body: z.string().min(3).max(2_000)
});

export const comparisonRowSchema = z.object({
  rfqId: z.string().uuid(),
  supplierId: z.string().uuid(),
  supplierName: z.string(),
  technicalScore: z.number(),
  financialScore: z.number(),
  finalScore: z.number(),
  decision: z.string(),
  financialOffer: z.number().nullable()
});

export const processVerbalSchema = z.object({
  rfqId: z.string().uuid(),
  reference: z.string(),
  signedBy: z.string().uuid(),
  signedAt: z.string().datetime(),
  observations: z.string(),
  decisions: z.array(commissionDecisionSchema)
});

export const notificationSchema = z.object({
  id: z.string().uuid(),
  audienceRole: z.string(),
  title: z.string(),
  body: z.string(),
  link: z.string().nullable(),
  read: z.boolean(),
  createdAt: z.string().datetime()
});

export const platformSettingsSchema = z.object({
  defaultDeadlineHours: z.number().int().min(1).max(720),
  requireMfaForCommission: z.boolean(),
  archiveRetentionYears: z.number().int().min(1).max(99),
  maxSubmissionSizeMb: z.number().int().min(1).max(2048),
  autoLockOnDeadline: z.boolean(),
  enableSandboxAnalysis: z.boolean(),
  enableWormArchive: z.boolean(),
  language: z.enum(["fr", "ar", "en"])
});

// ============================================================================
// Types inferes
// ============================================================================

export type User = z.infer<typeof userSchema>;
export type Need = z.infer<typeof needSchema>;
export type CreateNeedInput = z.infer<typeof createNeedSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type Rfq = z.infer<typeof rfqSchema>;
export type CreateRfqInput = z.infer<typeof createRfqSchema>;
export type Submission = z.infer<typeof submissionSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type CommissionDecision = z.infer<typeof commissionDecisionSchema>;
export type CreateCommissionDecisionInput = z.infer<typeof createCommissionDecisionSchema>;
export type FinalOutput = z.infer<typeof finalOutputSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type SystemAlert = z.infer<typeof systemAlertSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ComparisonRow = z.infer<typeof comparisonRowSchema>;
export type ProcessVerbal = z.infer<typeof processVerbalSchema>;
export type ProcuraNotification = z.infer<typeof notificationSchema>;
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

// ============================================================================
// Helpers RBAC / FSM
// ============================================================================

export function hasPermission(role: RoleCode, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function canTransitionRfq(from: RfqStatus, to: RfqStatus): boolean {
  const transitions: Record<RfqStatus, readonly RfqStatus[]> = {
    draft: ["pendingApproval", "published", "cancelled"],
    pendingApproval: ["published", "cancelled"],
    published: ["locked", "cancelled"],
    locked: ["opening"],
    opening: ["commissionReview"],
    commissionReview: ["awarded", "cancelled"],
    awarded: ["exported", "archived"],
    exported: ["archived"],
    archived: [],
    cancelled: []
  };
  return transitions[from].includes(to);
}

export function rfqStatusLabel(status: RfqStatus): string {
  const labels: Record<RfqStatus, string> = {
    draft: "Brouillon",
    pendingApproval: "En validation",
    published: "Publiee",
    locked: "Verrouillee",
    opening: "En ouverture",
    commissionReview: "En commission",
    awarded: "Attribuee",
    exported: "Exportee ERP",
    archived: "Archivee",
    cancelled: "Annulee"
  };
  return labels[status];
}

export function needStatusLabel(status: NeedStatus): string {
  const labels: Record<NeedStatus, string> = {
    draft: "Brouillon",
    submitted: "Soumis",
    approved: "Approuve",
    rejected: "Refuse",
    convertedToRfq: "Converti en RFQ"
  };
  return labels[status];
}

export function submissionStatusLabel(status: SubmissionStatus): string {
  const labels: Record<SubmissionStatus, string> = {
    draft: "Brouillon",
    quarantined: "En quarantaine",
    sealed: "Scellee",
    rejected: "Rejetee",
    opened: "Ouverte"
  };
  return labels[status];
}