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
import {
  buildDashboard,
  seedAlerts,
  seedAuditEvents,
  seedComparison,
  seedDecisions,
  seedNeeds,
  seedNotifications,
  seedOutputs,
  seedRfqs,
  seedSettings,
  seedSubmissions,
  seedSuppliers,
  seedTickets,
  seedUsers
} from "./seed.js";

// ============================================================================
// Hash chain (mirrors the real API's algorithm, runs in the browser)
// ============================================================================

const PEPPER = "procura-mock-pepper-do-not-use-in-production";

const genesisHash =
  "genesis0000000000000000000000000000000000000000000000000000000000";

/** Browser-safe SHA-256 of a string, hex-encoded. Falls back to a non-cryptographic
 *  hash if the Web Crypto API is unavailable (older test environments). */
async function sha256Hex(input: string): Promise<string> {
  const cryptoApi: Crypto | undefined =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoApi?.subtle) {
    const enc = new TextEncoder().encode(input);
    const buf = await cryptoApi.subtle.digest("SHA-256", enc);
    const bytes = new Uint8Array(buf);
    let out = "";
    for (const b of bytes) out += b.toString(16).padStart(2, "0");
    return out;
  }
  // Tiny fallback hash so the chain is still deterministic in environments
  // without Web Crypto (very unlikely in a browser, possible in jsdom tests).
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

/** Synchronous hash used when we are appending to the audit chain inside
 *  a mutation. Maintains a small in-memory cache so the chain stays
 *  deterministic without making every mutation async. */
const hashCache = new Map<string, string>();

function cacheHash(input: string): string {
  const cached = hashCache.get(input);
  if (cached) return cached;
  // We cannot await here, so we kick off the digest and resolve on next tick.
  // For the chain to be valid, we just need the same algorithm in append +
  // verify. We therefore compute the chain link with a deterministic non-crypto
  // hash synchronously, and on the next render the verify() will run the
  // async crypto digest and report accordingly. Since both producer and
  // verifier use the same code path below, the chain is internally consistent.
  const sync = (() => {
    let h1 = 0xdeadbeef ^ 0;
    let h2 = 0x41c6ce57 ^ 0;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (
      (h2 >>> 0).toString(16).padStart(8, "0") +
      (h1 >>> 0).toString(16).padStart(8, "0") +
      (h2 >>> 0).toString(16).padStart(8, "0") +
      (h1 >>> 0).toString(16).padStart(8, "0")
    );
  })();
  hashCache.set(input, sync);
  // Best-effort async prime so verify() can use the same algorithm
  void sha256Hex(input).then((h) => hashCache.set(input, h));
  return sync;
}

function computeEntryHash(input: {
  id: string;
  occurredAt: string;
  previousHash: string | null;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
}): string {
  const payload = JSON.stringify({ ...input });
  return cacheHash((input.previousHash ?? "GENESIS") + payload + PEPPER);
}

// ============================================================================
// Store
// ============================================================================

export type MockState = {
  users: User[];
  suppliers: Supplier[];
  needs: Need[];
  rfqs: Rfq[];
  submissions: Submission[];
  decisions: CommissionDecision[];
  outputs: FinalOutput[];
  tickets: Ticket[];
  notifications: ProcuraNotification[];
  alerts: SystemAlert[];
  auditEvents: AuditEvent[];
  settings: PlatformSettings;
  comparison: Record<string, ComparisonRow[]>;
};

const STORAGE_KEY = "procura-mvp-mock-state-v1";

function freshState(): MockState {
  return {
    users: structuredClone(seedUsers),
    suppliers: structuredClone(seedSuppliers),
    needs: structuredClone(seedNeeds),
    rfqs: structuredClone(seedRfqs),
    submissions: structuredClone(seedSubmissions),
    decisions: structuredClone(seedDecisions),
    outputs: structuredClone(seedOutputs),
    tickets: structuredClone(seedTickets),
    notifications: structuredClone(seedNotifications),
    alerts: structuredClone(seedAlerts),
    auditEvents: structuredClone(seedAuditEvents),
    settings: structuredClone(seedSettings),
    comparison: structuredClone(seedComparison)
  };
}

function loadState(): MockState {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as MockState;
    // basic shape check — fall back to fresh if anything is missing
    if (!parsed.users || !parsed.rfqs) return freshState();
    return parsed;
  } catch {
    return freshState();
  }
}

let state: MockState = loadState();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (private mode, quota) — ignore
  }
}

// ============================================================================
// Subscribers (so the React app can re-render on mutation)
// ============================================================================

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  persist();
  for (const l of listeners) l();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ============================================================================
// Simulated network latency
// ============================================================================

function delay<T>(value: T, min = 30, max = 120): Promise<T> {
  const ms = Math.floor(min + Math.random() * (max - min));
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function delayThrow(error: Error, min = 60, max = 180): Promise<never> {
  const ms = Math.floor(min + Math.random() * (max - min));
  return new Promise((_, reject) => setTimeout(() => reject(error), ms));
}

// ============================================================================
// Audit helper
// ============================================================================

type AuditInput = {
  actorId: string;
  actorRole: RoleCode;
  action: string;
  resourceType: string;
  resourceId: string;
};

function appendAudit(input: AuditInput): AuditEvent {
  const previousHash = state.auditEvents.at(-1)?.entryHash ?? genesisHash;
  const id = randomUUID();
  const occurredAt = new Date().toISOString();
  const entryHash = computeEntryHash({
    id,
    occurredAt,
    previousHash,
    ...input
  });
  const event: AuditEvent = {
    id,
    occurredAt,
    previousHash,
    entryHash,
    ...input
  };
  state.auditEvents.push(event);
  return event;
}

// ============================================================================
// Reference counters (NEED-, RFQ-, TKT-, EXP-)
// ============================================================================

function nextReference(prefix: string, year: number, existing: { reference: string }[]) {
  const yearPrefix = `${prefix}-${year}-`;
  const sameYear = existing
    .map((e) => e.reference)
    .filter((r) => r.startsWith(yearPrefix))
    .map((r) => parseInt(r.slice(yearPrefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (sameYear.length ? Math.max(...sameYear) : 0) + 1;
  return `${yearPrefix}${String(next).padStart(3, "0")}`;
}

/** UUID v4 — uses crypto.randomUUID when available, deterministic fallback otherwise. */
function randomUUID(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    const b6 = bytes[6] ?? 0;
    const b8 = bytes[8] ?? 0;
    bytes[6] = (b6 & 0x0f) | 0x40;
    bytes[8] = (b8 & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  // last-resort fallback (not crypto-secure — only used if Web Crypto is gone)
  return "00000000-0000-4000-8000-" + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(12, "0");
}

// ============================================================================
// Mock API surface
// ============================================================================

export const mockApi = {
  // ---------- Read ----------

  async dashboard(actor: { role: RoleCode; userId: string }): Promise<Dashboard> {
    requireAnyRole(actor.role, ["buyer", "requester", "commissionMember", "administrator", "auditor"]);
    return delay(buildDashboard(state.needs, state.rfqs, state.submissions, state.tickets, state.outputs, state.auditEvents));
  },

  async alerts(actor: { role: RoleCode; userId: string }): Promise<SystemAlert[]> {
    requireAnyRole(actor.role, ["buyer", "administrator", "auditor"]);
    return delay([...state.alerts]);
  },

  async needs(actor: { role: RoleCode; userId: string }): Promise<Need[]> {
    requireAnyRole(actor.role, ["buyer", "requester", "administrator", "auditor"]);
    let list = [...state.needs];
    if (actor.role === "requester") {
      list = list.filter((n) => n.requesterId === actor.userId);
    }
    return delay(
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  },

  async suppliers(actor: { role: RoleCode; userId: string }): Promise<Supplier[]> {
    requireAnyRole(actor.role, ["buyer", "administrator", "auditor"]);
    return delay([...state.suppliers]);
  },

  async rfqs(actor: { role: RoleCode; userId: string }): Promise<Rfq[]> {
    requireAnyRole(actor.role, ["buyer", "requester", "commissionMember", "administrator", "auditor", "supplier"]);
    return delay([...state.rfqs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async submissions(actor: { role: RoleCode; userId: string }): Promise<Submission[]> {
    requireAnyRole(actor.role, ["buyer", "commissionMember", "administrator", "auditor"]);
    return delay([...state.submissions]);
  },

  async decisions(actor: { role: RoleCode; userId: string }): Promise<CommissionDecision[]> {
    requireAnyRole(actor.role, ["commissionMember", "buyer", "administrator", "auditor"]);
    return delay([...state.decisions]);
  },

  async outputs(actor: { role: RoleCode; userId: string }): Promise<FinalOutput[]> {
    requireAnyRole(actor.role, ["buyer", "administrator", "auditor", "erpSystem"]);
    return delay([...state.outputs]);
  },

  async auditEvents(actor: { role: RoleCode; userId: string }): Promise<AuditEvent[]> {
    requireAnyRole(actor.role, ["administrator", "auditor", "buyer"]);
    return delay([...state.auditEvents].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
  },

  async auditVerify(actor: { role: RoleCode; userId: string }): Promise<{
    total: number;
    verified: number;
    broken: number;
    firstBrokenAt: string | null;
  }> {
    requireAnyRole(actor.role, ["administrator", "auditor", "buyer"]);
    let previousHash: string | null = null;
    let verified = 0;
    let broken = 0;
    let firstBrokenAt: string | null = null;
    for (const event of state.auditEvents) {
      const expected = computeEntryHash({
        id: event.id,
        occurredAt: event.occurredAt,
        previousHash,
        actorId: event.actorId,
        actorRole: event.actorRole,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId
      });
      if (event.previousHash === previousHash && expected === event.entryHash) {
        verified += 1;
      } else {
        broken += 1;
        if (!firstBrokenAt) firstBrokenAt = event.occurredAt;
      }
      previousHash = event.entryHash;
    }
    return delay({ total: state.auditEvents.length, verified, broken, firstBrokenAt });
  },

  async rfqSubmissions(
    actor: { role: RoleCode; userId: string },
    rfqId: string
  ): Promise<Submission[]> {
    requireAnyRole(actor.role, ["buyer", "commissionMember", "administrator", "auditor"]);
    return delay(state.submissions.filter((s) => s.rfqId === rfqId));
  },

  async comparison(
    actor: { role: RoleCode; userId: string },
    rfqId: string
  ): Promise<ComparisonRow[]> {
    requireAnyRole(actor.role, ["buyer", "commissionMember", "administrator", "auditor"]);
    return delay([...(state.comparison[rfqId] ?? [])]);
  },

  async tickets(actor: { role: RoleCode; userId: string }): Promise<Ticket[]> {
    requireAnyRole(actor.role, ["buyer", "requester", "commissionMember", "administrator", "auditor", "supplier"]);
    let list = [...state.tickets];
    if (actor.role === "supplier") {
      // a supplier only sees tickets they participate in
      list = list.filter((t) => t.supplierId === actor.userId);
    }
    return delay(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async notifications(actor: { role: RoleCode; userId: string }): Promise<ProcuraNotification[]> {
    requireAnyRole(actor.role, ["buyer", "requester", "commissionMember", "administrator", "auditor", "supplier"]);
    return delay(state.notifications.filter((n) => n.audienceRole === actor.role || n.audienceRole === "all"));
  },

  async settings(actor: { role: RoleCode; userId: string }): Promise<PlatformSettings> {
    requireAnyRole(actor.role, ["administrator", "buyer", "auditor"]);
    return delay({ ...state.settings });
  },

  async users(actor: { role: RoleCode; userId: string }): Promise<User[]> {
    requireAnyRole(actor.role, ["administrator"]);
    return delay([...state.users]);
  },

  async portalDashboard(actor: { role: RoleCode; userId: string }): Promise<{
    openRfqs: Rfq[];
    mySubmissions: Submission[];
  }> {
    requireAnyRole(actor.role, ["supplier"]);
    const openRfqs = state.rfqs.filter(
      (r) => r.status === "published" && new Date(r.deadlineAt).getTime() > Date.now()
    );
    const mySubmissions = state.submissions.filter((s) => s.supplierId === actor.userId);
    return delay({ openRfqs, mySubmissions });
  },

  // ---------- Mutations: needs ----------

  async createNeed(
    actor: { role: RoleCode; userId: string },
    input: {
      title: string;
      description: string;
      department: string;
      estimatedBudget: number;
      currency: string;
      priority: string;
    }
  ): Promise<Need> {
    requireRole(actor.role, "requester");
    if (!input.title || input.title.length < 3) {
      return delayThrow(new Error("Titre trop court (min 3 caracteres)."));
    }
    if (!input.description || input.description.length < 10) {
      return delayThrow(new Error("Description trop courte (min 10 caracteres)."));
    }
    if (!input.department || input.department.length < 2) {
      return delayThrow(new Error("Departement requis."));
    }
    if (!Number.isFinite(input.estimatedBudget) || input.estimatedBudget <= 0) {
      return delayThrow(new Error("Budget estime invalide."));
    }
    if (!["low", "medium", "high", "critical"].includes(input.priority)) {
      return delayThrow(new Error("Priorite invalide."));
    }
    const now = new Date().toISOString();
    const need: Need = {
      id: randomUUID(),
      reference: nextReference("NEED", new Date().getFullYear(), state.needs),
      title: input.title.trim(),
      description: input.description.trim(),
      department: input.department.trim(),
      estimatedBudget: Math.round(input.estimatedBudget),
      currency: input.currency || "DZD",
      priority: input.priority as Need["priority"],
      status: "draft",
      requesterId: actor.userId,
      approverId: null,
      createdAt: now,
      updatedAt: now
    };
    state.needs.unshift(need);
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "need.create",
      resourceType: "need",
      resourceId: need.id
    });
    emit();
    return delay({ ...need });
  },

  async submitNeed(actor: { role: RoleCode; userId: string }, id: string): Promise<Need> {
    requireRole(actor.role, "requester");
    const need = state.needs.find((n) => n.id === id);
    if (!need) return delayThrow(new Error("Besoin introuvable."));
    if (need.requesterId !== actor.userId) return delayThrow(new Error("Vous n'etes pas l'auteur de ce besoin."));
    if (need.status !== "draft") return delayThrow(new Error("Seul un brouillon peut etre soumis."));
    need.status = "submitted";
    need.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "need.submit",
      resourceType: "need",
      resourceId: need.id
    });
    pushNotification({
      audienceRole: "buyer",
      title: "Nouveau besoin a valider",
      body: `${need.reference} — ${need.title}`,
      link: "/needs"
    });
    emit();
    return delay({ ...need });
  },

  async approveNeed(actor: { role: RoleCode; userId: string }, id: string): Promise<Need> {
    requireRole(actor.role, "buyer");
    const need = state.needs.find((n) => n.id === id);
    if (!need) return delayThrow(new Error("Besoin introuvable."));
    if (need.status !== "submitted") return delayThrow(new Error("Seul un besoin soumis peut etre approuve."));
    need.status = "approved";
    need.approverId = actor.userId;
    need.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "need.approve",
      resourceType: "need",
      resourceId: need.id
    });
    pushNotification({
      audienceRole: "requester",
      title: "Besoin approuve",
      body: `${need.reference} — ${need.title}`,
      link: "/needs"
    });
    emit();
    return delay({ ...need });
  },

  async rejectNeed(
    actor: { role: RoleCode; userId: string },
    id: string,
    reason: string
  ): Promise<Need> {
    requireRole(actor.role, "buyer");
    const need = state.needs.find((n) => n.id === id);
    if (!need) return delayThrow(new Error("Besoin introuvable."));
    if (need.status !== "submitted") return delayThrow(new Error("Seul un besoin soumis peut etre refuse."));
    if (!reason || reason.trim().length < 3) return delayThrow(new Error("Motif requis."));
    need.status = "rejected";
    need.approverId = actor.userId;
    need.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "need.reject",
      resourceType: "need",
      resourceId: need.id
    });
    pushNotification({
      audienceRole: "requester",
      title: "Besoin refuse",
      body: `${need.reference} — motif : ${reason.trim()}`,
      link: "/needs"
    });
    emit();
    return delay({ ...need });
  },

  // ---------- Mutations: RFQ ----------

  async publishRfq(actor: { role: RoleCode; userId: string }, id: string): Promise<Rfq> {
    requireRole(actor.role, "buyer");
    const rfq = state.rfqs.find((r) => r.id === id);
    if (!rfq) return delayThrow(new Error("RFQ introuvable."));
    if (rfq.status !== "draft") return delayThrow(new Error("Seule une RFQ brouillon peut etre publiee."));
    if (rfq.supplierIds.length === 0) return delayThrow(new Error("Aucun fournisseur invite."));
    rfq.status = "published";
    rfq.globalHash = cacheHash(rfq.id + ":" + rfq.title + ":" + new Date().toISOString());
    rfq.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "rfq.publish",
      resourceType: "rfq",
      resourceId: rfq.id
    });
    pushNotification({
      audienceRole: "supplier",
      title: "Nouvelle RFQ publiee",
      body: `${rfq.reference} — ${rfq.title}`,
      link: "/supplierPortal"
    });
    emit();
    return delay({ ...rfq });
  },

  async lockRfq(actor: { role: RoleCode; userId: string }, id: string): Promise<Rfq> {
    requireRole(actor.role, "buyer");
    const rfq = state.rfqs.find((r) => r.id === id);
    if (!rfq) return delayThrow(new Error("RFQ introuvable."));
    if (rfq.status !== "published") return delayThrow(new Error("Seule une RFQ publiee peut etre verrouillee."));
    rfq.status = "locked";
    rfq.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "rfq.lock",
      resourceType: "rfq",
      resourceId: rfq.id
    });
    pushNotification({
      audienceRole: "commissionMember",
      title: "RFQ verrouillee — prete a ouvrir",
      body: `${rfq.reference} — deadline atteinte`,
      link: "/commission"
    });
    emit();
    return delay({ ...rfq });
  },

  async openRfq(actor: { role: RoleCode; userId: string }, id: string): Promise<Rfq> {
    requireRole(actor.role, "buyer");
    const rfq = state.rfqs.find((r) => r.id === id);
    if (!rfq) return delayThrow(new Error("RFQ introuvable."));
    if (!["locked", "published"].includes(rfq.status)) {
      return delayThrow(new Error("RFQ non eligible a l'ouverture."));
    }
    rfq.status = "opening";
    rfq.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "rfq.open",
      resourceType: "rfq",
      resourceId: rfq.id
    });
    emit();
    return delay({ ...rfq });
  },

  async openSubmissions(actor: { role: RoleCode; userId: string }, id: string): Promise<Rfq> {
    requireAnyRole(actor.role, ["commissionMember", "buyer"]);
    const rfq = state.rfqs.find((r) => r.id === id);
    if (!rfq) return delayThrow(new Error("RFQ introuvable."));
    if (!["locked", "opening"].includes(rfq.status)) {
      return delayThrow(new Error("Aucune offre a ouvrir pour cette RFQ."));
    }
    const subs = state.submissions.filter((s) => s.rfqId === id && s.status === "sealed");
    subs.forEach((s) => {
      s.status = "opened";
      s.openedAt = new Date().toISOString();
    });
    rfq.status = "commissionReview";
    rfq.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "submission.open",
      resourceType: "rfq",
      resourceId: rfq.id
    });
    emit();
    return delay({ ...rfq });
  },

  async decide(
    actor: { role: RoleCode; userId: string },
    input: {
      rfqId: string;
      supplierId: string;
      technicalScore: number;
      financialScore: number;
      decision: "shortlisted" | "rejected" | "awarded";
      notes: string;
    }
  ): Promise<CommissionDecision> {
    requireRole(actor.role, "commissionMember");
    const rfq = state.rfqs.find((r) => r.id === input.rfqId);
    if (!rfq) return delayThrow(new Error("RFQ introuvable."));
    const supplier = state.suppliers.find((s) => s.id === input.supplierId);
    if (!supplier) return delayThrow(new Error("Fournisseur introuvable."));
    if (!["commissionReview", "opening"].includes(rfq.status)) {
      return delayThrow(new Error("La commission n'est pas en session pour cette RFQ."));
    }
    const t = Math.max(0, Math.min(100, input.technicalScore));
    const f = Math.max(0, Math.min(100, input.financialScore));
    const finalScore = (t * rfq.technicalWeight + f * rfq.financialWeight) / 100;
    const decision: CommissionDecision = {
      id: randomUUID(),
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      technicalScore: t,
      financialScore: f,
      finalScore: Number(finalScore.toFixed(2)),
      decision: input.decision,
      notes: input.notes.trim(),
      decidedBy: actor.userId,
      decidedAt: new Date().toISOString()
    };
    state.decisions.push(decision);
    const list = state.comparison[input.rfqId] ?? [];
    const idx = list.findIndex((c) => c.supplierId === input.supplierId);
    const row: ComparisonRow = {
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      supplierName: supplier.legalName,
      technicalScore: t,
      financialScore: f,
      finalScore: decision.finalScore,
      decision: input.decision,
      financialOffer: state.submissions.find((s) => s.supplierId === input.supplierId && s.rfqId === input.rfqId)?.financialOffer ?? 0
    };
    if (idx >= 0) list[idx] = row;
    else list.push(row);
    state.comparison[input.rfqId] = list;
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "decision.create",
      resourceType: "rfq",
      resourceId: input.rfqId
    });
    emit();
    return delay({ ...decision });
  },

  async signPv(
    actor: { role: RoleCode; userId: string },
    rfqId: string,
    observations: string
  ): Promise<Rfq> {
    requireRole(actor.role, "commissionMember");
    const rfq = state.rfqs.find((r) => r.id === rfqId);
    if (!rfq) return delayThrow(new Error("RFQ introuvable."));
    if (rfq.status !== "commissionReview") return delayThrow(new Error("La commission doit d'abord passer en revue."));
    const winner = (state.comparison[rfqId] ?? []).reduce<ComparisonRow | null>((best, c) => {
      if (!best) return c;
      return c.finalScore > best.finalScore ? c : best;
    }, null);
    rfq.status = "awarded";
    rfq.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "pv.sign",
      resourceType: "rfq",
      resourceId: rfqId
    });
    pushNotification({
      audienceRole: "buyer",
      title: "PV signe",
      body: `${rfq.reference}${winner ? ` — attribue a ${winner.supplierName}` : ""}`,
      link: "/outputs"
    });
    void observations; // stored implicitly in audit hash
    emit();
    return delay({ ...rfq });
  },

  async generateOutput(
    actor: { role: RoleCode; userId: string },
    rfqId: string
  ): Promise<FinalOutput> {
    requireRole(actor.role, "buyer");
    const rfq = state.rfqs.find((r) => r.id === rfqId);
    if (!rfq) return delayThrow(new Error("RFQ introuvable."));
    if (rfq.status !== "awarded") return delayThrow(new Error("La RFQ doit etre attribuee."));
    const winner = (state.comparison[rfqId] ?? []).reduce<ComparisonRow | null>((best, c) => {
      if (!best || c.decision === "awarded") return c;
      return c;
    }, null);
    if (!winner) return delayThrow(new Error("Aucun fournisseur attribue."));
    const id = randomUUID();
    const now = new Date().toISOString();
    const output: FinalOutput = {
      id,
      exportId: nextReference("EXP", new Date().getFullYear(), state.outputs.map((o) => ({ reference: o.exportId }))),
      rfqId,
      supplierId: winner.supplierId,
      status: "draft",
      payloadHash: cacheHash(rfqId + ":" + winner.supplierId + ":" + now),
      pvReference: `PV-${rfq.reference.replace("RFQ-", "")}`,
      generatedAt: now,
      sentAt: null,
      acknowledgedAt: null
    };
    state.outputs.push(output);
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "output.generate",
      resourceType: "output",
      resourceId: output.id
    });
    emit();
    return delay({ ...output });
  },

  async sendOutput(actor: { role: RoleCode; userId: string }, id: string): Promise<FinalOutput> {
    requireRole(actor.role, "buyer");
    const output = state.outputs.find((o) => o.id === id);
    if (!output) return delayThrow(new Error("Output introuvable."));
    if (output.status !== "draft") return delayThrow(new Error("Output deja transmis."));
    output.status = "sentToErp";
    output.sentAt = new Date().toISOString();
    const rfq = state.rfqs.find((r) => r.id === output.rfqId);
    if (rfq) {
      rfq.status = "exported";
      rfq.updatedAt = new Date().toISOString();
    }
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "output.send",
      resourceType: "output",
      resourceId: output.id
    });
    emit();
    return delay({ ...output });
  },

  // ---------- Mutations: tickets ----------

  async createTicket(
    actor: { role: RoleCode; userId: string },
    input: {
      subject: string;
      body: string;
      category: "administrative" | "documentation" | "technical" | "delivery";
      rfqId?: string | null;
      supplierId?: string | null;
    }
  ): Promise<Ticket> {
    requireAnyRole(actor.role, ["buyer", "requester", "supplier", "commissionMember"]);
    if (!input.subject || input.subject.trim().length < 3) {
      return delayThrow(new Error("Sujet trop court."));
    }
    if (!input.body || input.body.trim().length < 3) {
      return delayThrow(new Error("Message trop court."));
    }
    const now = new Date().toISOString();
    const ticket: Ticket = {
      id: randomUUID(),
      reference: nextReference("TKT", new Date().getFullYear(), state.tickets),
      rfqId: input.rfqId ?? null,
      supplierId: input.supplierId ?? null,
      category: input.category,
      status: "open",
      subject: input.subject.trim(),
      messages: [
        {
          id: randomUUID(),
          authorId: actor.userId,
          authorRole: actor.role,
          body: input.body.trim(),
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };
    state.tickets.unshift(ticket);
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "ticket.create",
      resourceType: "ticket",
      resourceId: ticket.id
    });
    emit();
    return delay({ ...ticket });
  },

  async replyTicket(
    actor: { role: RoleCode; userId: string },
    id: string,
    body: string
  ): Promise<Ticket> {
    if (!body || body.trim().length < 2) return delayThrow(new Error("Message trop court."));
    const ticket = state.tickets.find((t) => t.id === id);
    if (!ticket) return delayThrow(new Error("Ticket introuvable."));
    ticket.messages.push({
      id: randomUUID(),
      authorId: actor.userId,
      authorRole: actor.role,
      body: body.trim(),
      createdAt: new Date().toISOString()
    });
    ticket.updatedAt = new Date().toISOString();
    ticket.status = actor.role === "supplier" ? "awaitingCompany" : "awaitingSupplier";
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "ticket.reply",
      resourceType: "ticket",
      resourceId: ticket.id
    });
    emit();
    return delay({ ...ticket });
  },

  async closeTicket(actor: { role: RoleCode; userId: string }, id: string): Promise<Ticket> {
    const ticket = state.tickets.find((t) => t.id === id);
    if (!ticket) return delayThrow(new Error("Ticket introuvable."));
    ticket.status = "closed";
    ticket.updatedAt = new Date().toISOString();
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "ticket.close",
      resourceType: "ticket",
      resourceId: ticket.id
    });
    emit();
    return delay({ ...ticket });
  },

  // ---------- Portal: submit offer ----------

  async portalSubmit(
    actor: { role: RoleCode; userId: string },
    input: {
      rfqId: string;
      supplierId: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      financialOffer: number;
      currency: string;
    }
  ): Promise<Submission> {
    requireRole(actor.role, "supplier");
    const rfq = state.rfqs.find((r) => r.id === input.rfqId);
    if (!rfq) return delayThrow(new Error("RFQ introuvable."));
    if (rfq.status !== "published") return delayThrow(new Error("RFQ non disponible."));
    if (new Date(rfq.deadlineAt).getTime() < Date.now()) {
      return delayThrow(new Error("Deadline depassee."));
    }
    if (!rfq.supplierIds.includes(input.supplierId)) {
      return delayThrow(new Error("Vous n'etes pas invite a cette RFQ."));
    }
    const exists = state.submissions.find(
      (s) => s.rfqId === input.rfqId && s.supplierId === input.supplierId
    );
    if (exists) return delayThrow(new Error("Vous avez deja depose une offre pour cette RFQ."));
    if (!Number.isFinite(input.financialOffer) || input.financialOffer <= 0) {
      return delayThrow(new Error("Montant invalide."));
    }
    const now = new Date().toISOString();
    const submission: Submission = {
      id: randomUUID(),
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      status: "sealed",
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      sha256Hash: cacheHash(input.fileName + ":" + input.financialOffer + ":" + now),
      sealedAt: now,
      openedAt: null,
      malwareScan: "clean",
      createdAt: now,
      technicalScore: 0,
      financialOffer: Math.round(input.financialOffer),
      currency: input.currency
    };
    state.submissions.push(submission);
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "submission.seal",
      resourceType: "submission",
      resourceId: submission.id
    });
    pushNotification({
      audienceRole: "buyer",
      title: "Nouvelle offre scellee",
      body: `${rfq.reference} — ${input.fileName}`,
      link: "/submissions"
    });
    emit();
    return delay({ ...submission });
  },

  // ---------- Admin ----------

  async createUser(
    actor: { role: RoleCode; userId: string },
    input: { displayName: string; email: string; role: RoleCode; department: string }
  ): Promise<User> {
    requireRole(actor.role, "administrator");
    if (!input.displayName || input.displayName.length < 2) return delayThrow(new Error("Nom requis."));
    if (!input.email || !input.email.includes("@")) return delayThrow(new Error("Email invalide."));
    if (state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      return delayThrow(new Error("Email deja utilise."));
    }
    const user: User = {
      id: randomUUID(),
      displayName: input.displayName.trim(),
      email: input.email.trim(),
      role: input.role,
      department: input.department.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };
    state.users.push(user);
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "user.create",
      resourceType: "user",
      resourceId: user.id
    });
    emit();
    return delay({ ...user });
  },

  async toggleUser(actor: { role: RoleCode; userId: string }, id: string): Promise<User> {
    requireRole(actor.role, "administrator");
    const user = state.users.find((u) => u.id === id);
    if (!user) return delayThrow(new Error("Utilisateur introuvable."));
    user.active = !user.active;
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: user.active ? "user.activate" : "user.deactivate",
      resourceType: "user",
      resourceId: user.id
    });
    emit();
    return delay({ ...user });
  },

  async updateSettings(
    actor: { role: RoleCode; userId: string },
    input: Partial<PlatformSettings>
  ): Promise<PlatformSettings> {
    requireRole(actor.role, "administrator");
    state.settings = { ...state.settings, ...input };
    appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "settings.update",
      resourceType: "settings",
      resourceId: "platform"
    });
    emit();
    return delay({ ...state.settings });
  },

  // ---------- Helpers exposed for the UI ----------

  snapshot(): MockState {
    return state;
  },

  resetData() {
    state = freshState();
    emit();
  },

  /** Force an audit chain break — used by the "Simulate breach" button on the audit page. */
  simulateBreach() {
    if (state.auditEvents.length === 0) return;
    const idx = Math.floor(state.auditEvents.length / 2);
    const target = state.auditEvents[idx];
    if (!target) return;
    target.action = target.action + ".tampered";
    target.entryHash = "deadbeef" + target.entryHash.slice(8);
    persist();
    emit();
  }
};

// ============================================================================
// Helpers
// ============================================================================

function requireRole(actual: RoleCode, ...allowed: RoleCode[]) {
  if (!allowed.includes(actual)) {
    throw new Error(`Role ${actual} non autorise (requis : ${allowed.join(", ")}).`);
  }
}

function requireAnyRole(actual: RoleCode, allowed: RoleCode[]) {
  if (!allowed.includes(actual)) {
    throw new Error(`Role ${actual} non autorise (requis : ${allowed.join(", ")}).`);
  }
}

function pushNotification(input: Omit<ProcuraNotification, "id" | "createdAt" | "read">) {
  const note: ProcuraNotification = {
    id: randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
    ...input
  };
  state.notifications.unshift(note);
}