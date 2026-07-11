import { useCallback, useEffect, useMemo, useState } from "react";
import { procuraApi, setActorRole } from "../api/client.js";
import { subscribe } from "../data/mockBackend.js";
import { Shell } from "./components/Shell.js";
import type { ComparisonRow, Submission } from "@procura/shared";
import { AuditPage } from "./pages/AuditPage.js";
import { CommissionPage } from "./pages/CommissionPage.js";
import { ComparisonPage } from "./pages/ComparisonPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { MonitoringPage } from "./pages/MonitoringPage.js";
import { NeedsPage } from "./pages/NeedsPage.js";
import { OutputsPage } from "./pages/OutputsPage.js";
import { RfqDetailPage } from "./pages/RfqDetailPage.js";
import { RfqsPage } from "./pages/RfqsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { SubmissionsPage } from "./pages/SubmissionsPage.js";
import { SupplierPortalPage } from "./pages/SupplierPortalPage.js";
import { SuppliersPage } from "./pages/SuppliersPage.js";
import { TicketsPage } from "./pages/TicketsPage.js";
import { UsersAdminPage } from "./pages/UsersAdminPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import type { AppData, AppRole, NavigationState } from "./types.js";

const emptyData: AppData = {
  dashboard: {
    rfqsActive: 0,
    rfqsPublished: 0,
    rfqsAwarded: 0,
    needsPending: 0,
    sealedSubmissions: 0,
    openedSubmissions: 0,
    criticalAlerts: 0,
    auditEvents: 0,
    erpExports: 0,
    openTickets: 0,
  },
  alerts: [],
  needs: [],
  suppliers: [],
  rfqs: [],
  submissions: [],
  decisions: [],
  outputs: [],
  auditEvents: [],
  auditVerify: { total: 0, verified: 0, broken: 0, firstBrokenAt: null },
  users: [],
  tickets: [],
  notifications: [],
  settings: {
    defaultDeadlineHours: 96,
    requireMfaForCommission: true,
    archiveRetentionYears: 10,
    maxSubmissionSizeMb: 50,
    autoLockOnDeadline: true,
    enableSandboxAnalysis: true,
    enableWormArchive: true,
    language: "fr",
  },
  comparisonByRfq: {},
  submissionsByRfq: {},
  openRfqsForSuppliers: [],
  supplierSubmissions: [],
};

function initialRole(): AppRole {
  if (typeof window === "undefined") return "buyer";
  const stored = window.localStorage.getItem("procura-role") as AppRole | null;
  if (
    stored &&
    [
      "buyer",
      "requester",
      "supplier",
      "commissionMember",
      "administrator",
      "auditor",
    ].includes(stored)
  ) {
    return stored;
  }
  return "buyer";
}

export function App() {
  const [role, setRole] = useState<AppRole>(initialRole);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("procura-user-id")
    );
  });
  const [navigation, setNavigation] = useState<NavigationState>({
    view: "dashboard",
  });
  const [data, setData] = useState<AppData>(emptyData);
  const [toast, setToast] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (tone: "success" | "error", message: string) => {
      setToast({ tone, message });
      window.setTimeout(() => setToast(null), 4_000);
    },
    [],
  );

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [
        dashboard,
        alerts,
        needs,
        suppliers,
        rfqs,
        submissions,
        decisions,
        outputs,
        auditEvents,
        auditVerify,
        tickets,
        notifications,
        settings,
        users,
      ] = await Promise.all([
        procuraApi.dashboard(),
        procuraApi.alerts(),
        procuraApi.needs(),
        procuraApi.suppliers(),
        procuraApi.rfqs(),
        procuraApi.submissions(),
        procuraApi.decisions(),
        procuraApi.outputs(),
        procuraApi.auditEvents(),
        procuraApi.auditVerify(),
        procuraApi.tickets(),
        procuraApi.notifications(),
        procuraApi.settings(),
        procuraApi.users(),
      ]);

      const submissionsByRfq: Record<string, Submission[]> = {};
      const rfqIds = rfqs.map((r) => r.id);
      const perRfq = await Promise.all(
        rfqIds.map((id) =>
          procuraApi.rfqSubmissions(id).catch(() => [] as Submission[]),
        ),
      );
      rfqIds.forEach((id, idx) => {
        submissionsByRfq[id] = perRfq[idx] ?? [];
      });

      const comparisonByRfq: Record<string, ComparisonRow[]> = {};
      const comparisons = await Promise.all(
        rfqIds.map((id) =>
          procuraApi.comparison(id).catch(() => [] as ComparisonRow[]),
        ),
      );
      rfqIds.forEach((id, idx) => {
        comparisonByRfq[id] = comparisons[idx] ?? [];
      });

      const openRfqsForSuppliers = rfqs.filter(
        (r) =>
          r.status === "published" &&
          new Date(r.deadlineAt).getTime() > Date.now(),
      );
      const supplierSubmissions = submissions.filter(
        (s) => s.supplierId === "00000000-0000-4000-8000-00000201",
      );

      setData({
        dashboard,
        alerts,
        needs,
        suppliers,
        rfqs,
        submissions,
        decisions,
        outputs,
        auditEvents,
        auditVerify,
        tickets,
        notifications,
        settings,
        users,
        comparisonByRfq,
        submissionsByRfq,
        openRfqsForSuppliers,
        supplierSubmissions,
      });
    } catch (error) {
      console.error("Procura data load failed", error);
      showToast("error", "Erreur de chargement des donnees locales.");
    }
  }, [showToast]);

  // Initial load + re-load on role change + re-load on mock backend mutation
  useEffect(() => {
    if (isAuthenticated) {
      void loadData();
    }
  }, [loadData, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleRoleChanged = () => {
      void loadData();
      setNavigation({ view: "dashboard" });
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "procura-role") void loadData();
    };
    window.addEventListener("procura:role-changed", handleRoleChanged);
    window.addEventListener("storage", handleStorage);
    const unsubscribe = subscribe(() => {
      void loadData();
    });
    return () => {
      window.removeEventListener("procura:role-changed", handleRoleChanged);
      window.removeEventListener("storage", handleStorage);
      unsubscribe();
    };
  }, [loadData, isAuthenticated]);

  const actions = useMemo(
    () => ({
      refresh: loadData,
      toast: showToast,
      createNeed: async (input: {
        title: string;
        description: string;
        department: string;
        estimatedBudget: number;
        currency: string;
        priority: string;
      }) => {
        try {
          await procuraApi.createNeed(input);
          await loadData();
          showToast("success", "Besoin cree avec succes.");
        } catch (error) {
          showToast("error", (error as Error).message);
          throw error;
        }
      },
      submitNeed: async (id: string) => {
        try {
          await procuraApi.submitNeed(id);
          await loadData();
          showToast("success", "Besoin soumis pour validation.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      approveNeed: async (id: string) => {
        try {
          await procuraApi.approveNeed(id);
          await loadData();
          showToast("success", "Besoin approuve.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      rejectNeed: async (id: string, reason: string) => {
        try {
          await procuraApi.rejectNeed(id, reason);
          await loadData();
          showToast("success", "Besoin refuse.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      publishRfq: async (id: string) => {
        try {
          await procuraApi.publishRfq(id);
          await loadData();
          showToast("success", "RFQ publiee et fournisseurs invites.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      lockRfq: async (id: string) => {
        try {
          await procuraApi.lockRfq(id);
          await loadData();
          showToast("success", "RFQ verrouillee.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      openRfq: async (id: string) => {
        try {
          await procuraApi.openRfq(id);
          await loadData();
          showToast("success", "Ouverture officielle declenchee.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      openSubmissions: async (id: string) => {
        try {
          await procuraApi.openSubmissions(id);
          await loadData();
          showToast("success", "Coffre-fort deverrouille pour la commission.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      decide: async (input: {
        rfqId: string;
        supplierId: string;
        technicalScore: number;
        financialScore: number;
        decision: "shortlisted" | "rejected" | "awarded";
        notes: string;
      }) => {
        try {
          await procuraApi.decide(input);
          await loadData();
          showToast("success", "Decision commission enregistree.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      signPv: async (rfqId: string, observations: string) => {
        try {
          await procuraApi.signPv(rfqId, observations);
          await loadData();
          showToast("success", "PV signe et archive.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      generateOutput: async (id: string) => {
        try {
          await procuraApi.generateOutput(id);
          await loadData();
          showToast("success", "Output genere et signe.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      sendOutput: async (id: string) => {
        try {
          await procuraApi.sendOutput(id);
          await loadData();
          showToast("success", "Output transmis a l'ERP.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      createTicket: async (input: {
        subject: string;
        body: string;
        category: string;
      }) => {
        try {
          await procuraApi.createTicket({
            rfqId: null,
            supplierId: null,
            category:
              (input.category as
                | "administrative"
                | "documentation"
                | "technical"
                | "delivery") ?? "administrative",
            subject: input.subject,
            body: input.body,
          });
          await loadData();
          showToast("success", "Ticket cree.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      replyTicket: async (id: string, body: string) => {
        try {
          await procuraApi.replyTicket(id, body);
          await loadData();
          showToast("success", "Reponse ajoutee au ticket.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      closeTicket: async (id: string) => {
        try {
          await procuraApi.closeTicket(id);
          await loadData();
          showToast("success", "Ticket cloture.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      submitOffer: async (input: {
        rfqId: string;
        amount: number;
        technicalNotes: string;
      }) => {
        try {
          await procuraApi.portalSubmit({
            rfqId: input.rfqId,
            supplierId: "00000000-0000-4000-8000-00000201",
            fileName: `offre-${input.rfqId}.pdf`,
            mimeType: "application/pdf",
            sizeBytes: 0,
            financialOffer: input.amount,
            currency: "DZD",
          });
          await loadData();
          showToast("success", "Offre deposee et scellee dans le coffre-fort.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      createUser: async (input: {
        email: string;
        fullName: string;
        role: string;
        organization: string;
      }) => {
        try {
          await procuraApi.createUser({
            displayName: input.fullName,
            email: input.email,
            role: input.role,
            department: input.organization,
          });
          await loadData();
          showToast("success", "Utilisateur cree.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      toggleUserActive: async (id: string) => {
        try {
          await procuraApi.toggleUser(id);
          await loadData();
          showToast("success", "Statut utilisateur modifie.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
      updateSettings: async (input: {
        defaultDeadlineHours: number;
        archiveRetentionYears: number;
        maxSubmissionSizeMb: number;
        requireMfaForCommission: boolean;
        autoLockOnDeadline: boolean;
        enableSandboxAnalysis: boolean;
        enableWormArchive: boolean;
        language: "fr" | "ar" | "en";
      }) => {
        try {
          await procuraApi.updateSettings(input);
          await loadData();
          showToast("success", "Parametres mis a jour.");
        } catch (error) {
          showToast("error", (error as Error).message);
        }
      },
    }),
    [loadData, showToast],
  );

  const visibleRole: AppRole = role;
  const availableRoles: AppRole[] = [
    "buyer",
    "requester",
    "supplier",
    "commissionMember",
    "administrator",
    "auditor",
  ];

  const openRfqDetail = (rfqId: string) =>
    setNavigation({ view: "rfqDetail", rfqId });

  const handleLogout = useCallback(async () => {
    try {
      await fetch("http://localhost:8080/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout request failed:", e);
    } finally {
      window.localStorage.removeItem("procura-role");
      window.localStorage.removeItem("procura-user-id");
      setIsAuthenticated(false);
      showToast("success", "Déconnecté avec succès.");
    }
  }, [showToast]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLoginSuccess={(user) => {
            window.localStorage.setItem("procura-role", user.role);
            window.localStorage.setItem("procura-user-id", user.id);
            setRole(user.role as AppRole);
            setIsAuthenticated(true);
          }}
          showToast={showToast}
        />
        {toast && (
          <div className={`toast ${toast.tone}`} role="status">
            {toast.message}
          </div>
        )}
      </>
    );
  }

  return (
    <Shell
      role={visibleRole}
      availableRoles={availableRoles}
      onSwitchRole={(r) => {
        setRole(r);
        setActorRole(r);
      }}
      apiState="online"
      navigation={navigation}
      onNavigate={setNavigation}
      notificationsCount={data.notifications.filter((n) => !n.read).length}
      alertsCount={data.alerts.filter((a) => a.severity !== "info").length}
      onLogout={handleLogout}
    >
      {navigation.view === "dashboard" && (
        <DashboardPage
          data={data}
          role={visibleRole}
          onOpenRfq={openRfqDetail}
          onNavigate={(v) =>
            setNavigation({ view: v } as Exclude<
              NavigationState,
              { view: "rfqDetail" }
            >)
          }
        />
      )}
      {navigation.view === "needs" && (
        <NeedsPage data={data} role={visibleRole} actions={actions} />
      )}
      {navigation.view === "rfqs" && (
        <RfqsPage
          data={data}
          role={visibleRole}
          actions={actions}
          onOpenRfq={openRfqDetail}
        />
      )}
      {navigation.view === "rfqDetail" && (
        <RfqDetailPage
          rfqId={navigation.rfqId}
          data={data}
          role={visibleRole}
          actions={actions}
          onBack={() => setNavigation({ view: "rfqs" })}
        />
      )}
      {navigation.view === "suppliers" && <SuppliersPage data={data} />}
      {navigation.view === "submissions" && (
        <SubmissionsPage
          data={data}
          role={visibleRole}
          onOpenRfq={openRfqDetail}
        />
      )}
      {navigation.view === "commission" && (
        <CommissionPage
          data={data}
          role={visibleRole}
          onOpenRfq={openRfqDetail}
        />
      )}
      {navigation.view === "analysis" && (
        <ComparisonPage
          data={data}
          role={visibleRole}
          onOpenRfq={openRfqDetail}
        />
      )}
      {navigation.view === "outputs" && (
        <OutputsPage data={data} actions={actions} />
      )}
      {navigation.view === "tickets" && (
        <TicketsPage data={data} actions={actions} />
      )}
      {navigation.view === "audit" && <AuditPage data={data} />}
      {navigation.view === "monitoring" && <MonitoringPage data={data} />}
      {navigation.view === "admin" && (
        <UsersAdminPage data={data} actions={actions} />
      )}
      {navigation.view === "settings" && (
        <SettingsPage data={data} actions={actions} />
      )}
      {navigation.view === "supplierPortal" && (
        <SupplierPortalPage data={data} actions={actions} />
      )}

      {toast && (
        <div className={`toast ${toast.tone}`} role="status">
          {toast.message}
        </div>
      )}
    </Shell>
  );
}
