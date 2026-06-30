import type {
  AuditEvent,
  CommissionDecision,
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

const now = new Date().toISOString();
const hours = (n: number) => new Date(Date.now() + 1000 * 60 * 60 * n).toISOString();
const days = (n: number) => hours(24 * n);

export type AppStore = {
  users: Map<string, User>;
  needs: Map<string, Need>;
  suppliers: Map<string, Supplier>;
  rfqs: Map<string, Rfq>;
  submissions: Map<string, Submission>;
  decisions: Map<string, CommissionDecision>;
  outputs: Map<string, FinalOutput>;
  auditEvents: AuditEvent[];
  alerts: SystemAlert[];
  tickets: Map<string, Ticket>;
  notifications: ProcuraNotification[];
  settings: PlatformSettings;
  sequences: {
    need: number;
    rfq: number;
    output: number;
    ticket: number;
  };
};

// Identifiants deterministes pour la demo MVP.
const u = (suffix: string) => `00000000-0000-4000-8000-${suffix}`;

const buyerId = u("00000001");
const buyer2Id = u("00000004");
const requesterId = u("00000002");
const requester2Id = u("00000005");
const commissionId = u("00000003");
const commission2Id = u("00000006");
const adminId = u("00000007");
const auditorId = u("00000008");

const supplierA = u("00000201");
const supplierB = u("00000202");
const supplierC = u("00000203");
const supplierD = u("00000204");

const needId = u("00000301");
const need2Id = u("00000302");
const need3Id = u("00000303");

const rfqId = u("00000401");
const rfq2Id = u("00000402");

const ticketId = u("00000601");

const defaultSettings: PlatformSettings = {
  defaultDeadlineHours: 96,
  requireMfaForCommission: true,
  archiveRetentionYears: 10,
  maxSubmissionSizeMb: 50,
  autoLockOnDeadline: true,
  enableSandboxAnalysis: true,
  enableWormArchive: true,
  language: "fr"
};

export function createStore(): AppStore {
  const store: AppStore = {
    users: new Map([
      [
        buyerId,
        {
          id: buyerId,
          displayName: "Amine Acheteur",
          email: "amine.acheteur@procura.local",
          role: "buyer",
          department: "Achats",
          active: true,
          createdAt: now
        }
      ],
      [
        buyer2Id,
        {
          id: buyer2Id,
          displayName: "Sara Acheteuse",
          email: "sara.acheteuse@procura.local",
          role: "buyer",
          department: "Achats",
          active: true,
          createdAt: now
        }
      ],
      [
        requesterId,
        {
          id: requesterId,
          displayName: "Karim Demandeur",
          email: "karim.demandeur@procura.local",
          role: "requester",
          department: "Technique",
          active: true,
          createdAt: now
        }
      ],
      [
        requester2Id,
        {
          id: requester2Id,
          displayName: "Lina Maintenance",
          email: "lina.maintenance@procura.local",
          role: "requester",
          department: "Maintenance",
          active: true,
          createdAt: now
        }
      ],
      [
        commissionId,
        {
          id: commissionId,
          displayName: "Hocine Commission",
          email: "hocine.commission@procura.local",
          role: "commissionMember",
          department: "Commission",
          active: true,
          createdAt: now
        }
      ],
      [
        commission2Id,
        {
          id: commission2Id,
          displayName: "Nadia Commission",
          email: "nadia.commission@procura.local",
          role: "commissionMember",
          department: "Commission",
          active: true,
          createdAt: now
        }
      ],
      [
        adminId,
        {
          id: adminId,
          displayName: "Yacine Admin",
          email: "yacine.admin@procura.local",
          role: "administrator",
          department: "IT",
          active: true,
          createdAt: now
        }
      ],
      [
        auditorId,
        {
          id: auditorId,
          displayName: "Mohand Auditeur",
          email: "mohand.auditeur@procura.local",
          role: "auditor",
          department: "Audit",
          active: true,
          createdAt: now
        }
      ]
    ]),
    needs: new Map([
      [
        needId,
        {
          id: needId,
          reference: "NEED-2026-021",
          title: "Approvisionnement cables electriques HT",
          description:
            "Besoin prioritaire pour chantier industriel avec livraison controlee et certification ISO 9001.",
          department: "Technique",
          estimatedBudget: 15_000_000,
          currency: "DZD",
          priority: "critical",
          status: "approved",
          requesterId,
          approverId: buyerId,
          createdAt: now,
          updatedAt: now
        }
      ],
      [
        need2Id,
        {
          id: need2Id,
          reference: "NEED-2026-022",
          title: "Maintenance groupe electrogene site Sud",
          description: "Contrat annuel de maintenance preventive et curative.",
          department: "Maintenance",
          estimatedBudget: 4_200_000,
          currency: "DZD",
          priority: "high",
          status: "submitted",
          requesterId: requester2Id,
          approverId: null,
          createdAt: now,
          updatedAt: now
        }
      ],
      [
        need3Id,
        {
          id: need3Id,
          reference: "NEED-2026-023",
          title: "Renovation salle serveur",
          description: "Travaux de climatisation et onduleurs pour salle serveur principale.",
          department: "IT",
          estimatedBudget: 9_800_000,
          currency: "DZD",
          priority: "medium",
          status: "draft",
          requesterId: adminId,
          approverId: null,
          createdAt: now,
          updatedAt: now
        }
      ]
    ]),
    suppliers: new Map([
      [
        supplierA,
        {
          id: supplierA,
          erpId: "FOURN-0042",
          legalName: "Fournisseur ABC SARL",
          taxId: "NIF-123456",
          country: "Algerie",
          email: "contact@abc.example",
          riskLevel: "low",
          status: "active",
          categories: ["Electricite", "Cables"],
          lastErpSyncAt: now
        }
      ],
      [
        supplierB,
        {
          id: supplierB,
          erpId: "FOURN-0088",
          legalName: "Industrie Delta SPA",
          taxId: "NIF-998877",
          country: "Algerie",
          email: "ao@delta.example",
          riskLevel: "medium",
          status: "active",
          categories: ["Industrie", "Maintenance"],
          lastErpSyncAt: now
        }
      ],
      [
        supplierC,
        {
          id: supplierC,
          erpId: "FOURN-0103",
          legalName: "ElecPro EURL",
          taxId: "NIF-554433",
          country: "Algerie",
          email: "commercial@elecpro.example",
          riskLevel: "low",
          status: "active",
          categories: ["Electricite", "Equipement industriel"],
          lastErpSyncAt: now
        }
      ],
      [
        supplierD,
        {
          id: supplierD,
          erpId: "FOURN-0204",
          legalName: "HydroTech SARL",
          taxId: "NIF-778899",
          country: "Algerie",
          email: "offres@hydrotech.example",
          riskLevel: "medium",
          status: "active",
          categories: ["Maintenance", "Energie"],
          lastErpSyncAt: now
        }
      ]
    ]),
    rfqs: new Map([
      [
        rfqId,
        {
          id: rfqId,
          reference: "RFQ-2026-087",
          needId,
          title: "Cables electriques HT",
          description:
            "Consultation fournisseur pour 12 km de cables HT avec certification ISO et livraison sur 30 jours.",
          status: "published",
          buyerId,
          deadlineAt: hours(48),
          supplierIds: [supplierA, supplierB, supplierC],
          technicalWeight: 60,
          financialWeight: 40,
          allowedFormats: ["pdf"],
          globalHash: null,
          createdAt: now,
          updatedAt: now
        }
      ],
      [
        rfq2Id,
        {
          id: rfq2Id,
          reference: "RFQ-2026-088",
          needId: need2Id,
          title: "Maintenance groupe electrogene",
          description: "Contrat annuel maintenance preventive + curative groupe 2MVA.",
          status: "draft",
          buyerId: buyer2Id,
          deadlineAt: days(7),
          supplierIds: [supplierB, supplierD],
          technicalWeight: 50,
          financialWeight: 50,
          allowedFormats: ["pdf"],
          globalHash: null,
          createdAt: now,
          updatedAt: now
        }
      ]
    ]),
    submissions: new Map([
      [
        u("00000501"),
        {
          id: u("00000501"),
          rfqId,
          supplierId: supplierA,
          status: "sealed",
          fileName: "offre-ABC-cables-HT.pdf",
          mimeType: "application/pdf",
          sizeBytes: 248_000,
          sha256Hash: "a".repeat(64),
          sealedAt: now,
          openedAt: null,
          malwareScan: "clean",
          createdAt: now,
          technicalScore: null,
          financialOffer: 14_320_000,
          currency: "DZD"
        }
      ],
      [
        u("00000502"),
        {
          id: u("00000502"),
          rfqId,
          supplierId: supplierB,
          status: "sealed",
          fileName: "offre-Delta-cables-HT.pdf",
          mimeType: "application/pdf",
          sizeBytes: 312_500,
          sha256Hash: "b".repeat(64),
          sealedAt: now,
          openedAt: null,
          malwareScan: "clean",
          createdAt: now,
          technicalScore: null,
          financialOffer: 13_900_000,
          currency: "DZD"
        }
      ]
    ]),
    decisions: new Map(),
    outputs: new Map(),
    auditEvents: [],
    alerts: [
      {
        id: u("00000701"),
        severity: "warning",
        title: "Deadline proche",
        message: "RFQ-2026-087 arrive a echeance dans moins de 48h.",
        module: "deadlines",
        createdAt: now
      },
      {
        id: u("00000702"),
        severity: "info",
        title: "ERP synchronise",
        message: "Le referentiel fournisseurs a ete synchronise avec succes.",
        module: "supplierReference",
        createdAt: now
      },
      {
        id: u("00000703"),
        severity: "critical",
        title: "Scan sandbox en alerte",
        message: "Une offre est marquee SUSPICIOUS et necessite revue.",
        module: "secureSubmission",
        createdAt: now
      }
    ],
    tickets: new Map([
      [
        ticketId,
        {
          id: ticketId,
          reference: "TKT-2026-001",
          rfqId,
          supplierId: supplierA,
          category: "documentation",
          status: "awaitingCompany",
          subject: "Complement certificat ISO",
          messages: [
            {
              id: u("00000801"),
              authorId: supplierA,
              authorRole: "supplier",
              body: "Bonjour, pouvez-vous nous confirmer la liste des documents ISO a fournir ?",
              createdAt: now
            }
          ],
          createdAt: now,
          updatedAt: now
        }
      ]
    ]),
    notifications: [
      {
        id: u("00000901"),
        audienceRole: "buyer",
        title: "2 offres scellees",
        body: "Les fournisseurs ABC et Delta ont depose leur offre pour RFQ-2026-087.",
        link: "/rfqs",
        read: false,
        createdAt: now
      },
      {
        id: u("00000902"),
        audienceRole: "commissionMember",
        title: "RFQ prete a ouvrir",
        body: "La deadline de RFQ-2026-087 est atteinte, ouverture disponible.",
        link: "/commission",
        read: false,
        createdAt: now
      }
    ],
    settings: defaultSettings,
    sequences: {
      need: 24,
      rfq: 89,
      output: 1,
      ticket: 2
    }
  };

  return store;
}