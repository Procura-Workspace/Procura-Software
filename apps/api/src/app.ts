import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { ZodError } from "zod";
import { loadEnv } from "./config/env.js";
import { createStore } from "./core/store.js";
import { AdminService } from "./modules/admin/admin.service.js";
import { registerAdminRoutes } from "./modules/admin/admin.routes.js";
import { registerAuditRoutes } from "./modules/audit/audit.routes.js";
import { AuditService } from "./modules/audit/audit.service.js";
import { CommissionService } from "./modules/commission/commission.service.js";
import { registerCommissionRoutes } from "./modules/commission/commission.routes.js";
import { ComparisonService } from "./modules/comparison/comparison.service.js";
import { registerComparisonRoutes } from "./modules/comparison/comparison.routes.js";
import { registerHealthRoutes } from "./modules/health/health.routes.js";
import { MonitoringService } from "./modules/monitoring/monitoring.service.js";
import { registerMonitoringRoutes } from "./modules/monitoring/monitoring.routes.js";
import { NeedsService } from "./modules/needs/needs.service.js";
import { registerNeedsRoutes } from "./modules/needs/needs.routes.js";
import { OutputsService } from "./modules/outputs/outputs.service.js";
import { registerOutputsRoutes } from "./modules/outputs/outputs.routes.js";
import { RfqService } from "./modules/rfq/rfq.service.js";
import { registerRfqRoutes } from "./modules/rfq/rfq.routes.js";
import { registerSettingsRoutes } from "./modules/settings/settings.routes.js";
import { SettingsService } from "./modules/settings/settings.service.js";
import { SubmissionsService } from "./modules/submissions/submissions.service.js";
import { registerSubmissionsRoutes } from "./modules/submissions/submissions.routes.js";
import { SuppliersService } from "./modules/suppliers/suppliers.service.js";
import { registerSuppliersRoutes } from "./modules/suppliers/suppliers.routes.js";
import { registerSupplierPortalRoutes } from "./modules/supplierPortal/supplierPortal.routes.js";
import { SupplierPortalService } from "./modules/supplierPortal/supplierPortal.service.js";
import { registerTicketsRoutes } from "./modules/tickets/tickets.routes.js";
import { TicketsService } from "./modules/tickets/tickets.service.js";

export async function buildApp() {
  const env = loadEnv();
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      redact: ["req.headers.authorization", "req.headers.cookie"]
    },
    trustProxy: true
  });

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    }
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });

  await app.register(rateLimit, {
    max: 150,
    timeWindow: "1 minute"
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        issues: error.issues
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      error: "INTERNAL_ERROR",
      message: "Erreur interne"
    });
  });

  const store = createStore();
  const audit = new AuditService(store, env.AUDIT_HASH_PEPPER);

  await registerHealthRoutes(app);
  await registerMonitoringRoutes(app, new MonitoringService(store));
  await registerAuditRoutes(app, audit);
  await registerAdminRoutes(app, new AdminService(store, audit));
  await registerNeedsRoutes(app, new NeedsService(store, audit));
  await registerSuppliersRoutes(app, new SuppliersService(store));
  await registerRfqRoutes(app, new RfqService(store, audit));
  await registerSubmissionsRoutes(app, new SubmissionsService(store, audit));
  await registerCommissionRoutes(app, new CommissionService(store, audit));
  await registerOutputsRoutes(app, new OutputsService(store, audit));
  await registerComparisonRoutes(app, new ComparisonService(store, audit));
  await registerTicketsRoutes(app, new TicketsService(store, audit));
  await registerSupplierPortalRoutes(app, new SupplierPortalService(store, audit));
  await registerSettingsRoutes(app, new SettingsService(store));

  return app;
}