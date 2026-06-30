import type { Dashboard, SystemAlert } from "@procura/shared";
import type { AppStore } from "../../core/store.js";

export class MonitoringService {
  constructor(private readonly store: AppStore) {}

  dashboard(): Dashboard {
    const rfqs = [...this.store.rfqs.values()];
    const submissions = [...this.store.submissions.values()];
    const tickets = [...this.store.tickets.values()];

    return {
      rfqsActive: rfqs.filter((rfq) =>
        ["published", "locked", "opening", "commissionReview"].includes(rfq.status)
      ).length,
      rfqsPublished: rfqs.filter((rfq) => rfq.status === "published").length,
      rfqsAwarded: rfqs.filter((rfq) => rfq.status === "awarded").length,
      needsPending: [...this.store.needs.values()].filter((need) =>
        ["draft", "submitted"].includes(need.status)
      ).length,
      sealedSubmissions: submissions.filter((submission) => submission.status === "sealed").length,
      openedSubmissions: submissions.filter((submission) => submission.status === "opened").length,
      criticalAlerts: this.store.alerts.filter((alert) => alert.severity === "critical").length,
      auditEvents: this.store.auditEvents.length,
      erpExports: [...this.store.outputs.values()].filter((output) =>
        ["sentToErp", "acknowledged"].includes(output.status)
      ).length,
      openTickets: tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length
    };
  }

  alerts(): SystemAlert[] {
    return [...this.store.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}