import { jest } from "@jest/globals";

// Import modules to mutate for ESM test mocking
import { db } from "../../core/db.js";
import { redis } from "../../core/redis.js";

const { buildApp } = await import("../../app.js");
const { loadEnv } = await import("../../config/env.js");

describe("Security Integration - CSRF & Vault Strictness", () => {
  beforeAll(() => {
    db.query = jest.fn() as any;
    redis.get = jest.fn() as any;
    redis.set = jest.fn() as any;
    redis.del = jest.fn() as any;
    redis.incr = jest.fn() as any;
    redis.expire = jest.fn() as any;
    redis.ttl = jest.fn() as any;
  });

  describe("CSRF Protection validation (R.19)", () => {
    let app: any;

    beforeAll(async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      app = await buildApp();
      await app.ready();
    });

    afterAll(async () => {
      await app.close();
    });

    it("should reject POST /needs request with 403 Forbidden when X-CSRF-Token header is missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/needs",
        headers: {
          cookie: "procura_token=valid_token; procura_csrf=csrf_value_here",
        },
        payload: {
          title: "New Need",
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("FORBIDDEN");
      expect(body.message).toBe("Validation CSRF échouée");
    });

    it("should reject POST /needs request with 403 Forbidden when X-CSRF-Token does not match cookie", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/needs",
        headers: {
          cookie: "procura_token=valid_token; procura_csrf=csrf_value_here",
          "x-csrf-token": "wrong_csrf_value",
        },
        payload: {
          title: "New Need",
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("FORBIDDEN");
      expect(body.message).toBe("Validation CSRF échouée");
    });

    it("should bypass CSRF check for public auth login POST request", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: "test@procura.dz",
          password: "wrongpassword",
        },
      });

      // It should bypass CSRF and proceed to actual login logic which returns 401 Unauthorized rather than 403 Forbidden CSRF failure
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe("Email ou mot de passe incorrect");
    });
  });

  describe("Vault Production Enforce Strictness (R.20)", () => {
    it("should throw error and crash at boot if APP_ENV=production but Vault credentials are missing", () => {
      const mockProdEnv = {
        APP_ENV: "production",
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://procura:procura@localhost:5432/procura",
        JWT_SECRET:
          "development-only-secret-key-must-be-very-long-and-random-32chars",
        AUDIT_HASH_PEPPER: "audit-pepper-development-local-salt",
      };

      const originalVaultLoaded = process.env.VAULT_LOADED;
      delete process.env.VAULT_LOADED;

      expect(() => loadEnv(mockProdEnv as any)).toThrow();
      try {
        loadEnv(mockProdEnv as any);
      } catch (err: any) {
        expect(err.message).toContain(
          "Vault configurations (VAULT_ADDR, VAULT_TOKEN) are strictly required in production mode",
        );
      }

      if (originalVaultLoaded) {
        process.env.VAULT_LOADED = originalVaultLoaded;
      }
    });

    it("should succeed validation in production if Vault parameters are present", () => {
      const mockProdEnv = {
        APP_ENV: "production",
        NODE_ENV: "production",
        VAULT_ADDR: "http://127.0.0.1:8200",
        VAULT_TOKEN: "vault-token-xyz",
      };

      const originalVaultLoaded = process.env.VAULT_LOADED;
      delete process.env.VAULT_LOADED;

      const parsed = loadEnv(mockProdEnv as any);
      expect(parsed).toBeDefined();
      expect(parsed.VAULT_ADDR).toBe("http://127.0.0.1:8200");
      expect(parsed.VAULT_TOKEN).toBe("vault-token-xyz");

      if (originalVaultLoaded) {
        process.env.VAULT_LOADED = originalVaultLoaded;
      }
    });
  });
});
