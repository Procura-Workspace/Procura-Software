// ============================================================================
// Procura Web API client
// ----------------------------------------------------------------------------
// The web app runs as a STANDALONE maquette by default — every call below is
// resolved locally by the mock backend in `../data/mockBackend.ts` so the
// frontend can be demoed, screenshotted, or used as a UX reference without
// the real API running.
//
// When the real backend is ready, point VITE_API_URL to it and flip
// `USE_REAL_API` to `true` (or remove the flag) — the call signatures stay
// identical.
// ============================================================================

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
  User,
  RoleCode
} from "@procura/shared";
import { mockApi } from "../data/mockBackend.js";

// ---- Actor context (role + userId) -----------------------------------------
//
// The standalone mock layer mirrors the backend's x-procura-* headers so that
// every call site can later be swapped for HTTP without changing callers.

const ROLE_KEY = "procura-role";
const USER_KEY = "procura-user-id";

const roleMap: Record<string, RoleCode> = {
  buyer: "buyer",
  requester: "requester",
  supplier: "supplier",
  commissionMember: "commissionMember",
  administrator: "administrator",
  auditor: "auditor"
};

function seedUserForRole(role: RoleCode): string {
  switch (role) {
    case "buyer":
      return "00000000-0000-4000-8000-000000000001";
    case "requester":
      return "00000000-0000-4000-8000-000000000002";
    case "commissionMember":
      return "00000000-0000-4000-8000-000000000003";
    case "administrator":
      return "00000000-0000-4000-8000-000000000007";
    case "auditor":
      return "00000000-0000-4000-8000-000000000008";
    case "supplier":
      return "00000000-0000-4000-8000-00000201";
    case "erpSystem":
      return "00000000-0000-4000-8000-000000000099";
  }
}

function readActor(): { role: RoleCode; userId: string } {
  if (typeof window === "undefined") {
    return { role: "buyer", userId: seedUserForRole("buyer") };
  }
  const rawRole = window.localStorage.getItem(ROLE_KEY) ?? "buyer";
  const role = roleMap[rawRole] ?? "buyer";
  let userId = window.localStorage.getItem(USER_KEY);
  if (!userId) {
    userId = seedUserForRole(role);
    window.localStorage.setItem(USER_KEY, userId);
  }
  return { role, userId };
}

export function setActorRole(role: string, userId?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
  const resolvedRole = roleMap[role] ?? "buyer";
  window.localStorage.setItem(USER_KEY, userId ?? seedUserForRole(resolvedRole));
  window.dispatchEvent(new CustomEvent("procura:role-changed"));
}

// ============================================================================
// Client surface — mirrors the real REST endpoints
// ============================================================================

export type SupplierPortalDashboard = {
  openRfqs: Rfq[];
  mySubmissions: Submission[];
};

export type SupplierPortalDetail = {
  rfq: Rfq | null;
  alreadySubmitted: boolean;
  deadlinePassed: boolean;
};

export type PvPayload = {
  rfqId: string;
  reference: string;
  signedBy: string;
  signedAt: string;
  observations: string;
  decisions: CommissionDecision[];
  hash: string;
};

export const procuraApi = {
  // ---------- Reads ----------

  dashboard: (): Promise<Dashboard> => mockApi.dashboard(readActor()),

  alerts: (): Promise<SystemAlert[]> => mockApi.alerts(readActor()),

  needs: (): Promise<Need[]> => mockApi.needs(readActor()),

  need: async (id: string): Promise<Need | null> => {
    const list = await mockApi.needs(readActor());
    return list.find((n) => n.id === id) ?? null;
  },

  suppliers: (): Promise<Supplier[]> => mockApi.suppliers(readActor()),

  rfqs: (): Promise<Rfq[]> => mockApi.rfqs(readActor()),

  rfq: async (id: string): Promise<Rfq | null> => {
    const list = await mockApi.rfqs(readActor());
    return list.find((r) => r.id === id) ?? null;
  },

  submissions: (): Promise<Submission[]> => mockApi.submissions(readActor()),

  rfqSubmissions: (id: string): Promise<Submission[]> =>
    mockApi.rfqSubmissions(readActor(), id),

  decisions: (): Promise<CommissionDecision[]> => mockApi.decisions(readActor()),

  outputs: (): Promise<FinalOutput[]> => mockApi.outputs(readActor()),

  auditEvents: (): Promise<AuditEvent[]> => mockApi.auditEvents(readActor()),

  auditVerify: () => mockApi.auditVerify(readActor()),

  comparison: (id: string): Promise<ComparisonRow[]> =>
    mockApi.comparison(readActor(), id),

  tickets: (): Promise<Ticket[]> => mockApi.tickets(readActor()),

  notifications: (): Promise<ProcuraNotification[]> =>
    mockApi.notifications(readActor()),

  settings: (): Promise<PlatformSettings> => mockApi.settings(readActor()),

  users: (): Promise<User[]> => mockApi.users(readActor()),

  portalDashboard: (): Promise<SupplierPortalDashboard> =>
    mockApi.portalDashboard(readActor()),

  portalRfq: async (id: string): Promise<SupplierPortalDetail> => {
    const actor = readActor();
    const { openRfqs, mySubmissions } = await mockApi.portalDashboard(actor);
    const rfq = openRfqs.find((r) => r.id === id) ?? null;
    return {
      rfq,
      alreadySubmitted: mySubmissions.some((s) => s.rfqId === id),
      deadlinePassed: rfq ? new Date(rfq.deadlineAt).getTime() < Date.now() : true
    };
  },

  // ---------- Mutations: needs ----------

  createNeed: (input: {
    title: string;
    description: string;
    department: string;
    estimatedBudget: number;
    currency: string;
    priority: string;
  }) => mockApi.createNeed(readActor(), input),

  submitNeed: (id: string) => mockApi.submitNeed(readActor(), id),

  approveNeed: (id: string) => mockApi.approveNeed(readActor(), id),

  rejectNeed: (id: string, reason: string) =>
    mockApi.rejectNeed(readActor(), id, reason),

  // ---------- Mutations: RFQ ----------

  publishRfq: (id: string) => mockApi.publishRfq(readActor(), id),
  lockRfq: (id: string) => mockApi.lockRfq(readActor(), id),
  openRfq: (id: string) => mockApi.openRfq(readActor(), id),
  commissionReviewRfq: (id: string) => mockApi.openSubmissions(readActor(), id),

  decide: (input: {
    rfqId: string;
    supplierId: string;
    technicalScore: number;
    financialScore: number;
    decision: "shortlisted" | "rejected" | "awarded";
    notes: string;
  }) => mockApi.decide(readActor(), input),

  openSubmissions: (id: string) => mockApi.openSubmissions(readActor(), id),

  generateOutput: (id: string) => mockApi.generateOutput(readActor(), id),
  sendOutput: (id: string) => mockApi.sendOutput(readActor(), id),

  // ---------- Mutations: tickets ----------

  createTicket: (input: {
    rfqId?: string | null;
    supplierId?: string | null;
    category: "administrative" | "documentation" | "technical" | "delivery";
    subject: string;
    body: string;
  }) => mockApi.createTicket(readActor(), input),

  replyTicket: (id: string, body: string) => mockApi.replyTicket(readActor(), id, body),
  closeTicket: (id: string) => mockApi.closeTicket(readActor(), id),

  // ---------- Mutations: portal ----------

  portalSubmit: (input: {
    rfqId: string;
    supplierId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    financialOffer: number;
    currency: string;
  }) => mockApi.portalSubmit(readActor(), input),

  // ---------- PV ----------

  signPv: async (rfqId: string, observations: string): Promise<PvPayload> => {
    const rfq = await mockApi.signPv(readActor(), rfqId, observations);
    const decisions = (await mockApi.decisions(readActor())).filter((d) => d.rfqId === rfqId);
    return {
      rfqId,
      reference: rfq.reference,
      signedBy: readActor().userId,
      signedAt: new Date().toISOString(),
      observations,
      decisions,
      hash: createHashHex(rfqId + ":" + observations + ":" + Date.now())
    };
  },

  // ---------- Admin ----------

  createUser: (input: {
    displayName: string;
    email: string;
    role: string;
    department: string;
  }) => mockApi.createUser(readActor(), { ...input, role: input.role as RoleCode }),

  toggleUser: (id: string) => mockApi.toggleUser(readActor(), id),

  updateSettings: (input: Partial<PlatformSettings>) =>
    mockApi.updateSettings(readActor(), input),

  // ---------- Dev / demo helpers ----------

  simulateBreach: () => mockApi.simulateBreach(),

  resetMockData: () => mockApi.resetData()
};

function createHashHex(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8) + "pv-hash-placeholder";
}

// ============================================================================
// Re-exports — keep callers happy
// ============================================================================

export type {
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
};