import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    service: "procura-api",
    timestamp: new Date().toISOString()
  }));

  app.get("/ready", async () => ({
    status: "ready",
    checks: {
      api: "ok",
      database: "pending-integration",
      objectStorage: "pending-integration",
      auditChain: "ok",
      rbac: "ok"
    }
  }));
}
