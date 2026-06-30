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
  Submission,
  Supplier,
  SystemAlert,
  Ticket,
  User
} from "@procura/shared";

// Deterministic IDs for seed data — easier to debug
const iso = (offsetDays = 0, offsetHours = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000 + offsetHours * 3_600_000).toISOString();

// ============================================================================
// Users
// ============================================================================

export const seedUsers: User[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    displayName: "Amine Acheteur",
    email: "amine.acheteur@procura.local",
    role: "buyer",
    department: "Achats",
    active: true,
    createdAt: iso(-90)
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    displayName: "Karim Demandeur",
    email: "karim.demandeur@procura.local",
    role: "requester",
    department: "Technique",
    active: true,
    createdAt: iso(-80)
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    displayName: "Hocine Commission",
    email: "hocine.commission@procura.local",
    role: "commissionMember",
    department: "Commission",
    active: true,
    createdAt: iso(-70)
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    displayName: "Sara Acheteuse",
    email: "sara.acheteuse@procura.local",
    role: "buyer",
    department: "Achats",
    active: true,
    createdAt: iso(-60)
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    displayName: "Lina Maintenance",
    email: "lina.maintenance@procura.local",
    role: "requester",
    department: "Maintenance",
    active: true,
    createdAt: iso(-50)
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    displayName: "Nadia Commission",
    email: "nadia.commission@procura.local",
    role: "commissionMember",
    department: "Commission",
    active: true,
    createdAt: iso(-45)
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    displayName: "Yacine Admin",
    email: "yacine.admin@procura.local",
    role: "administrator",
    department: "IT",
    active: true,
    createdAt: iso(-40)
  },
  {
    id: "00000000-0000-4000-8000-000000000008",
    displayName: "Mohand Auditeur",
    email: "mohand.auditeur@procura.local",
    role: "auditor",
    department: "Audit",
    active: true,
    createdAt: iso(-30)
  }
];

// ============================================================================
// Suppliers (referentiel ERP, lecture seule)
// ============================================================================

export const seedSuppliers: Supplier[] = [
  {
    id: "00000000-0000-4000-8000-00000201",
    erpId: "ERP-FRN-001",
    legalName: "Fournisseur ABC SARL",
    taxId: "001216012345678",
    country: "Algerie",
    email: "contact@abc-sarl.dz",
    riskLevel: "low",
    status: "active",
    categories: ["Cables HT", "Materiel electrique"],
    lastErpSyncAt: iso(-1)
  },
  {
    id: "00000000-0000-4000-8000-00000202",
    erpId: "ERP-FRN-002",
    legalName: "Industrie Delta SPA",
    taxId: "001216023456789",
    country: "Algerie",
    email: "commercial@delta-spa.dz",
    riskLevel: "medium",
    status: "active",
    categories: ["Cables HT", "Transformateurs"],
    lastErpSyncAt: iso(-1)
  },
  {
    id: "00000000-0000-4000-8000-00000203",
    erpId: "ERP-FRN-003",
    legalName: "ElecPro EURL",
    taxId: "001216034567890",
    country: "Algerie",
    email: "info@elecpro.dz",
    riskLevel: "low",
    status: "active",
    categories: ["Materiel electrique", "Eclairage"],
    lastErpSyncAt: iso(-2)
  },
  {
    id: "00000000-0000-4000-8000-00000204",
    erpId: "ERP-FRN-004",
    legalName: "HydroTech Industries",
    taxId: "001216045678901",
    country: "Algerie",
    email: "bids@hydrotech.dz",
    riskLevel: "medium",
    status: "active",
    categories: ["Groupes electrogenes", "Maintenance"],
    lastErpSyncAt: iso(-2)
  }
];

// ============================================================================
// Needs
// ============================================================================

export const seedNeeds: Need[] = [
  {
    id: "00000000-0000-4000-8000-00000301",
    reference: "NEED-2026-021",
    title: "Approvisionnement cables electriques HT",
    description:
      "Besoin prioritaire pour chantier industriel Sud avec livraison controlee et certification ISO 9001.",
    department: "Technique",
    estimatedBudget: 15_000_000,
    currency: "DZD",
    priority: "critical",
    status: "approved",
    requesterId: "00000000-0000-4000-8000-000000000002",
    approverId: "00000000-0000-4000-8000-000000000001",
    createdAt: iso(-12),
    updatedAt: iso(-8)
  },
  {
    id: "00000000-0000-4000-8000-00000302",
    reference: "NEED-2026-022",
    title: "Maintenance groupe electrogene site Sud",
    description: "Contrat annuel de maintenance preventive et curative pour groupe 2MVA.",
    department: "Maintenance",
    estimatedBudget: 4_200_000,
    currency: "DZD",
    priority: "high",
    status: "submitted",
    requesterId: "00000000-0000-4000-8000-000000000005",
    approverId: null,
    createdAt: iso(-5),
    updatedAt: iso(-5)
  },
  {
    id: "00000000-0000-4000-8000-00000303",
    reference: "NEED-2026-023",
    title: "Renovation salle serveur",
    description: "Travaux de climatisation et onduleurs pour salle serveur principale.",
    department: "IT",
    estimatedBudget: 9_800_000,
    currency: "DZD",
    priority: "medium",
    status: "draft",
    requesterId: "00000000-0000-4000-8000-000000000007",
    approverId: null,
    createdAt: iso(-2),
    updatedAt: iso(-2)
  }
];

// ============================================================================
// RFQ
// ============================================================================

export const seedRfqs: Rfq[] = [
  {
    id: "00000000-0000-4000-8000-00000401",
    reference: "RFQ-2026-087",
    needId: "00000000-0000-4000-8000-00000301",
    title: "Cables electriques HT",
    description:
      "Consultation fournisseur pour 12 km de cables HT avec certification ISO et livraison sur 30 jours.",
    status: "published",
    buyerId: "00000000-0000-4000-8000-000000000001",
    deadlineAt: iso(2),
    supplierIds: [
      "00000000-0000-4000-8000-00000201",
      "00000000-0000-4000-8000-00000202",
      "00000000-0000-4000-8000-00000203"
    ],
    technicalWeight: 60,
    financialWeight: 40,
    allowedFormats: ["pdf"],
    globalHash: "a3f5c8d1e9b274561f0c2d3e4b5a6789",
    createdAt: iso(-7),
    updatedAt: iso(-2)
  },
  {
    id: "00000000-0000-4000-8000-00000402",
    reference: "RFQ-2026-088",
    needId: "00000000-0000-4000-8000-00000302",
    title: "Maintenance groupe electrogene",
    description: "Contrat annuel maintenance preventive + curative groupe 2MVA.",
    status: "draft",
    buyerId: "00000000-0000-4000-8000-000000000004",
    deadlineAt: iso(7),
    supplierIds: [
      "00000000-0000-4000-8000-00000202",
      "00000000-0000-4000-8000-00000204"
    ],
    technicalWeight: 50,
    financialWeight: 50,
    allowedFormats: ["pdf"],
    globalHash: null,
    createdAt: iso(-3),
    updatedAt: iso(-1)
  },
  {
    id: "00000000-0000-4000-8000-00000403",
    reference: "RFQ-2026-085",
    needId: null,
    title: "Logiciel ERP — module reporting",
    description: "Acquisition d'un module de reporting financier integre a l'ERP.",
    status: "awarded",
    buyerId: "00000000-0000-4000-8000-000000000001",
    deadlineAt: iso(-10),
    supplierIds: ["00000000-0000-4000-8000-00000201"],
    technicalWeight: 70,
    financialWeight: 30,
    allowedFormats: ["pdf"],
    globalHash: "f8e7d6c5b4a39281706f5e4d3c2b1a09",
    createdAt: iso(-30),
    updatedAt: iso(-8)
  }
];

// ============================================================================
// Submissions (offres scellees)
// ============================================================================

export const seedSubmissions: Submission[] = [
  {
    id: "00000000-0000-4000-8000-00000501",
    rfqId: "00000000-0000-4000-8000-00000401",
    supplierId: "00000000-0000-4000-8000-00000201",
    status: "sealed",
    fileName: "Offre-ABC-Cables-HT.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1_842_376,
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    sealedAt: iso(-1, -3),
    openedAt: null,
    malwareScan: "clean",
    createdAt: iso(-1, -3),
    technicalScore: 82,
    financialOffer: 14_320_000,
    currency: "DZD"
  },
  {
    id: "00000000-0000-4000-8000-00000502",
    rfqId: "00000000-0000-4000-8000-00000401",
    supplierId: "00000000-0000-4000-8000-00000202",
    status: "sealed",
    fileName: "Delta-Cables-HT-offre.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2_104_512,
    sha256Hash: "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    sealedAt: iso(-1, -5),
    openedAt: null,
    malwareScan: "clean",
    createdAt: iso(-1, -5),
    technicalScore: 78,
    financialOffer: 13_900_000,
    currency: "DZD"
  },
  {
    id: "00000000-0000-4000-8000-00000503",
    rfqId: "00000000-0000-4000-8000-00000403",
    supplierId: "00000000-0000-4000-8000-00000201",
    status: "opened",
    fileName: "ABC-Reporting-ERP.pdf",
    mimeType: "application/pdf",
    sizeBytes: 3_450_000,
    sha256Hash: "5d41402abc4b2a76b9719d911017c592051b8d9f5b8a8e0e1d5e9c5e2c1b3a4d",
    sealedAt: iso(-20),
    openedAt: iso(-15),
    malwareScan: "clean",
    createdAt: iso(-20),
    technicalScore: 88,
    financialOffer: 7_500_000,
    currency: "DZD"
  }
];

// ============================================================================
// Comparison
// ============================================================================

export const seedComparison: Record<string, ComparisonRow[]> = {
  "00000000-0000-4000-8000-00000401": [
    {
      rfqId: "00000000-0000-4000-8000-00000401",
      supplierId: "00000000-0000-4000-8000-00000201",
      supplierName: "Fournisseur ABC SARL",
      technicalScore: 82,
      financialScore: 95,
      finalScore: 87.4,
      decision: "shortlisted",
      financialOffer: 14_320_000
    },
    {
      rfqId: "00000000-0000-4000-8000-00000401",
      supplierId: "00000000-0000-4000-8000-00000202",
      supplierName: "Industrie Delta SPA",
      technicalScore: 78,
      financialScore: 98,
      finalScore: 86.0,
      decision: "shortlisted",
      financialOffer: 13_900_000
    },
    {
      rfqId: "00000000-0000-4000-8000-00000401",
      supplierId: "00000000-0000-4000-8000-00000203",
      supplierName: "ElecPro EURL",
      technicalScore: 70,
      financialScore: 80,
      finalScore: 74.0,
      decision: "rejected",
      financialOffer: 15_800_000
    }
  ]
};

// ============================================================================
// Decisions commission
// ============================================================================

export const seedDecisions: CommissionDecision[] = [
  {
    id: "00000000-0000-4000-8000-00000701",
    rfqId: "00000000-0000-4000-8000-00000401",
    supplierId: "00000000-0000-4000-8000-00000201",
    technicalScore: 82,
    financialScore: 95,
    finalScore: 87.4,
    decision: "shortlisted",
    notes: "Bonne conformite technique, delai respecté.",
    decidedBy: "00000000-0000-4000-8000-000000000003",
    decidedAt: iso(-1, -1)
  },
  {
    id: "00000000-0000-4000-8000-00000702",
    rfqId: "00000000-0000-4000-8000-00000401",
    supplierId: "00000000-0000-4000-8000-00000202",
    technicalScore: 78,
    financialScore: 98,
    finalScore: 86.0,
    decision: "shortlisted",
    notes: "Meilleur prix, score technique acceptable.",
    decidedBy: "00000000-0000-4000-8000-000000000003",
    decidedAt: iso(-1, -1)
  }
];

// ============================================================================
// Final outputs (export ERP)
// ============================================================================

export const seedOutputs: FinalOutput[] = [
  {
    id: "00000000-0000-4000-8000-00000801",
    exportId: "EXP-2026-085-001",
    rfqId: "00000000-0000-4000-8000-00000403",
    supplierId: "00000000-0000-4000-8000-00000201",
    status: "sentToErp",
    payloadHash: "b3daa77b4c04aab0d4f1e2f3a4b5c6d7e8f90123456789abcdef0123456789ab",
    pvReference: "PV-2026-085",
    generatedAt: iso(-8),
    sentAt: iso(-8, 1),
    acknowledgedAt: null
  }
];

// ============================================================================
// Tickets
// ============================================================================

export const seedTickets: Ticket[] = [
  {
    id: "00000000-0000-4000-8000-00000901",
    reference: "TKT-2026-001",
    rfqId: "00000000-0000-4000-8000-00000401",
    supplierId: "00000000-0000-4000-8000-00000201",
    category: "documentation",
    status: "awaitingCompany",
    subject: "Complement certificat ISO",
    messages: [
      {
        id: "00000000-0000-4000-8000-00000a01",
        authorId: "00000000-0000-4000-8000-00000201",
        authorRole: "supplier",
        body: "Bonjour, pouvez-vous nous confirmer la liste des documents ISO a fournir ?",
        createdAt: iso(-3)
      }
    ],
    createdAt: iso(-3),
    updatedAt: iso(-2)
  }
];

// ============================================================================
// Notifications
// ============================================================================

export const seedNotifications: ProcuraNotification[] = [
  {
    id: "00000000-0000-4000-8000-00000b01",
    audienceRole: "buyer",
    title: "2 offres scellees",
    body: "Les fournisseurs ABC et Delta ont depose leur offre pour RFQ-2026-087.",
    link: "/rfqs",
    read: false,
    createdAt: iso(-1)
  },
  {
    id: "00000000-0000-4000-8000-00000b02",
    audienceRole: "commissionMember",
    title: "RFQ prete a ouvrir",
    body: "La deadline de RFQ-2026-087 approche, ouverture disponible.",
    link: "/commission",
    read: false,
    createdAt: iso(-1, -2)
  }
];

// ============================================================================
// Alerts
// ============================================================================

export const seedAlerts: SystemAlert[] = [
  {
    id: "00000000-0000-4000-8000-00000c01",
    severity: "warning",
    title: "Memoire Redis elevee",
    message: "Utilisation memoire 72%, surveillance recommandee.",
    module: "monitoring",
    createdAt: iso(-1)
  },
  {
    id: "00000000-0000-4000-8000-00000c02",
    severity: "info",
    title: "Synchronisation ERP",
    message: "4 fournisseurs synchronises depuis l'ERP.",
    module: "supplierReference",
    createdAt: iso(-2)
  }
];

// ============================================================================
// Audit
// ============================================================================

export const seedAuditEvents: AuditEvent[] = [
  {
    id: "00000000-0000-4000-8000-00000d01",
    actorId: "00000000-0000-4000-8000-000000000001",
    actorRole: "buyer",
    action: "rfq.publish",
    resourceType: "rfq",
    resourceId: "00000000-0000-4000-8000-00000401",
    occurredAt: iso(-7),
    previousHash: "genesis0000000000000000000000000000000000000000000000000000000000",
    entryHash: "a1b2c3d4e5f60718293a4b5c6d7e8f9001234567890abcdef0123456789abcdef"
  }
];

// ============================================================================
// Settings
// ============================================================================

export const seedSettings: PlatformSettings = {
  defaultDeadlineHours: 96,
  requireMfaForCommission: true,
  archiveRetentionYears: 10,
  maxSubmissionSizeMb: 50,
  autoLockOnDeadline: true,
  enableSandboxAnalysis: true,
  enableWormArchive: true,
  language: "fr"
};

// ============================================================================
// Dashboard
// ============================================================================

export function buildDashboard(
  needs: Need[],
  rfqs: Rfq[],
  submissions: Submission[],
  tickets: Ticket[],
  outputs: FinalOutput[],
  auditEvents: AuditEvent[]
): Dashboard {
  return {
    rfqsActive: rfqs.filter((r) =>
      ["published", "locked", "opening", "commissionReview"].includes(r.status)
    ).length,
    rfqsPublished: rfqs.filter((r) => r.status === "published").length,
    rfqsAwarded: rfqs.filter((r) => r.status === "awarded" || r.status === "exported").length,
    needsPending: needs.filter((n) => ["draft", "submitted"].includes(n.status)).length,
    sealedSubmissions: submissions.filter((s) => s.status === "sealed").length,
    openedSubmissions: submissions.filter((s) => s.status === "opened").length,
    criticalAlerts: 1,
    auditEvents: auditEvents.length,
    erpExports: outputs.filter((o) => o.status === "sentToErp" || o.status === "acknowledged").length,
    openTickets: tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length
  };
}
