import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../security/rbac.js";
import type { MonitoringService } from "./monitoring.service.js";

export async function registerMonitoringRoutes(app: FastifyInstance, monitoring: MonitoringService) {
  app.get("/dashboard", { preHandler: requirePermission("monitoring:read") }, async () => ({
    data: monitoring.dashboard()
  }));

  app.get("/alerts", { preHandler: requirePermission("monitoring:read") }, async () => ({
    data: monitoring.alerts()
  }));
}