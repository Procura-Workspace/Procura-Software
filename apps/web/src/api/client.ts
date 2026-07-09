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
  RoleCode,
} from "@procura/shared";

const BASE_URL = "http://localhost:8080";

async function requestHttp<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = window.localStorage.getItem("procura_token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return {} as T;
  }

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || "Erreur de communication avec le serveur");
  }

  return body.data !== undefined ? body.data : body;
}

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

  dashboard: (): Promise<Dashboard> => requestHttp("/monitoring/dashboard"),

  alerts: (): Promise<SystemAlert[]> => requestHttp("/monitoring/alerts"),

  needs: (): Promise<Need[]> => requestHttp("/needs"),

  need: (id: string): Promise<Need | null> => requestHttp(`/needs/${id}`),

  suppliers: (): Promise<Supplier[]> => requestHttp("/suppliers"),

  rfqs: (): Promise<Rfq[]> => requestHttp("/rfqs"),

  rfq: (id: string): Promise<Rfq | null> => requestHttp(`/rfqs/${id}`),

  submissions: (): Promise<Submission[]> => requestHttp("/submissions"),

  rfqSubmissions: (id: string): Promise<Submission[]> =>
    requestHttp(`/submissions/rfq/${id}`),

  decisions: (): Promise<CommissionDecision[]> =>
    requestHttp("/commission-decisions"),

  outputs: (): Promise<FinalOutput[]> => requestHttp("/outputs"),

  auditEvents: (): Promise<AuditEvent[]> => requestHttp("/audit-events"),

  auditVerify: () => requestHttp("/audit/verify"),

  comparison: (id: string): Promise<ComparisonRow[]> =>
    requestHttp(`/comparison/${id}`),

  tickets: (): Promise<Ticket[]> => requestHttp("/tickets"),

  notifications: (): Promise<ProcuraNotification[]> =>
    requestHttp("/notifications"),

  settings: (): Promise<PlatformSettings> => requestHttp("/settings"),

  users: (): Promise<User[]> => requestHttp("/admin/users"),

  portalDashboard: (): Promise<SupplierPortalDashboard> =>
    requestHttp("/supplier-portal/dashboard"),

  portalRfq: async (id: string): Promise<SupplierPortalDetail> => {
    const detail: SupplierPortalDetail = await requestHttp(
      `/supplier-portal/rfq/${id}`,
    );
    return detail;
  },

  // ---------- Mutations: needs ----------

  createNeed: (input: {
    title: string;
    description: string;
    department: string;
    estimatedBudget: number;
    currency: string;
    priority: string;
  }) =>
    requestHttp("/needs", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  submitNeed: (id: string) =>
    requestHttp(`/needs/${id}/submit`, { method: "POST" }),

  approveNeed: (id: string) =>
    requestHttp(`/needs/${id}/approve`, { method: "POST" }),

  rejectNeed: (id: string, reason: string) =>
    requestHttp(`/needs/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // ---------- Mutations: RFQ ----------

  publishRfq: (id: string) =>
    requestHttp(`/rfqs/${id}/publish`, { method: "POST" }),
  lockRfq: (id: string) => requestHttp(`/rfqs/${id}/lock`, { method: "POST" }),
  openRfq: (id: string) => requestHttp(`/rfqs/${id}/open`, { method: "POST" }),
  commissionReviewRfq: (id: string) =>
    requestHttp(`/rfqs/${id}/commission-review`, { method: "POST" }),

  decide: (input: {
    rfqId: string;
    supplierId: string;
    technicalScore: number;
    financialScore: number;
    decision: "shortlisted" | "rejected" | "awarded";
    notes: string;
  }) =>
    requestHttp("/commission-decisions", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  openSubmissions: (id: string) =>
    requestHttp(`/rfqs/${id}/open-submissions`, { method: "POST" }),

  generateOutput: (id: string) =>
    requestHttp(`/outputs/${id}/generate`, { method: "POST" }),
  sendOutput: (id: string) =>
    requestHttp(`/outputs/${id}/send`, { method: "POST" }),

  // ---------- Mutations: tickets ----------

  createTicket: (input: {
    rfqId?: string | null;
    supplierId?: string | null;
    category: "administrative" | "documentation" | "technical" | "delivery";
    subject: string;
    body: string;
  }) =>
    requestHttp("/tickets", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  replyTicket: (id: string, body: string) =>
    requestHttp(`/tickets/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  closeTicket: (id: string) =>
    requestHttp(`/tickets/${id}/close`, { method: "POST" }),

  // ---------- Mutations: portal ----------

  portalSubmit: (input: {
    rfqId: string;
    supplierId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    financialOffer: number;
    currency: string;
  }) =>
    requestHttp("/supplier-portal/submit", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // ---------- PV ----------

  signPv: (rfqId: string, observations: string): Promise<PvPayload> =>
    requestHttp(`/rfqs/${rfqId}/sign-pv`, {
      method: "POST",
      body: JSON.stringify({ observations }),
    }),

  // ---------- Admin ----------

  createUser: (input: {
    displayName: string;
    email: string;
    role: string;
    department: string;
  }) =>
    requestHttp("/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  toggleUser: (id: string) =>
    requestHttp(`/admin/users/${id}/toggle`, { method: "POST" }),

  updateSettings: (input: Partial<PlatformSettings>) =>
    requestHttp("/settings", {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  // ---------- Dev / demo helpers ----------

  simulateBreach: () =>
    requestHttp("/monitoring/simulate-breach", { method: "POST" }),

  resetMockData: () =>
    requestHttp("/monitoring/reset-data", { method: "POST" }),
};

export function setActorRole(role: string, userId?: string) {
  // Keep signature for types/compatibility, but we now rely on real authenticated user profiles.
  window.dispatchEvent(new CustomEvent("procura:role-changed"));
}

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
  User,
};
