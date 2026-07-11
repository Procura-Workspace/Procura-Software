import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

// Mock the DB module before importing security components
jest.unstable_mockModule("../core/db.js", () => ({
  db: {
    query: jest.fn(),
  },
}));

// Dynamically import components to apply mock
const { getCurrentUser } = await import("./current-user.js");
const { requirePermission } = await import("./rbac.js");
const { db } = (await import("../core/db.js")) as any;
const { loadEnv } = await import("../config/env.js");

const env = loadEnv();

describe("Security Modules", () => {
  describe("current-user.ts (getCurrentUser)", () => {
    it("should throw 401 if token is absent and no backward-compatibility headers are present", () => {
      const mockReq = {
        headers: {},
      } as any;

      expect(() => getCurrentUser(mockReq)).toThrow("Authentification requise");
      try {
        getCurrentUser(mockReq);
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.name).toBe("UNAUTHORIZED");
      }
    });

    it("should throw 401 if token is invalid", () => {
      const mockReq = {
        headers: {
          authorization: "Bearer invalidtokenhere",
        },
      } as any;

      expect(() => getCurrentUser(mockReq)).toThrow();
      try {
        getCurrentUser(mockReq);
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
      }
    });

    it("should throw 401 if token role is unknown", () => {
      const payload = {
        sub: "user-id",
        role: "unknown-role-xyz",
        name: "Test User",
      };
      const token = jwt.sign(payload, env.JWT_SECRET);
      const mockReq = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any;

      expect(() => getCurrentUser(mockReq)).toThrow("Authentification requise");
    });

    it("should extract user correctly if token is valid (Authorization Header)", () => {
      const payload = {
        sub: "user-1234",
        role: "buyer",
        name: "Test Buyer",
      };
      const token = jwt.sign(payload, env.JWT_SECRET);
      const mockReq = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any;

      const user = getCurrentUser(mockReq);
      expect(user).toBeDefined();
      expect(user.id).toBe("user-1234");
      expect(user.role).toBe("buyer");
      expect(user.displayName).toBe("Test Buyer");
    });

    it("should extract user correctly if token is valid (Cookie)", () => {
      const payload = {
        sub: "user-1234",
        role: "buyer",
        name: "Test Buyer",
      };
      const token = jwt.sign(payload, env.JWT_SECRET);
      const mockReq = {
        headers: {
          cookie: `procura_token=${token}`,
        },
      } as any;

      const user = getCurrentUser(mockReq);
      expect(user).toBeDefined();
      expect(user.id).toBe("user-1234");
      expect(user.role).toBe("buyer");
    });

    it("should extract user correctly if backward-compatibility headers are present", () => {
      const mockReq = {
        headers: {
          "x-procura-user-id": "user-dev",
          "x-procura-role": "buyer",
          "x-procura-display-name": "Developer Buyer",
        },
      } as any;

      const user = getCurrentUser(mockReq);
      expect(user).toBeDefined();
      expect(user.id).toBe("user-dev");
      expect(user.role).toBe("buyer");
      expect(user.displayName).toBe("Developer Buyer");
    });
  });

  describe("rbac.ts (requirePermission)", () => {
    let mockReq: any;
    let mockReply: any;

    beforeEach(() => {
      jest.clearAllMocks();

      const payload = {
        sub: "user-123",
        role: "buyer",
        name: "Amine Acheteur",
      };
      const token = jwt.sign(payload, env.JWT_SECRET);

      mockReq = {
        headers: {
          authorization: `Bearer ${token}`,
        },
        url: "/needs",
        method: "POST",
        log: {
          warn: jest.fn(),
        },
      };

      mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
    });

    it("should allow request if database check returns a match", async () => {
      db.query.mockResolvedValue({
        rows: [{ 1: 1 }],
      } as any);

      const middleware = requirePermission("need:create");
      await middleware(mockReq, mockReply);

      expect(db.query).toHaveBeenCalled();
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it("should reject with 403 and log a warning if database check returns no match", async () => {
      db.query.mockResolvedValue({
        rows: [],
      } as any);

      const middleware = requirePermission("need:approve");
      await middleware(mockReq, mockReply);

      expect(db.query).toHaveBeenCalled();
      expect(mockReq.log.warn).toHaveBeenCalledWith(
        {
          userId: "user-123",
          userRole: "buyer",
          requiredPermission: "need:approve",
          url: "/needs",
          method: "POST",
        },
        "Access forbidden (RBAC verification failed)",
      );
      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "FORBIDDEN",
        message: "Permission insuffisante",
        requiredPermission: "need:approve",
      });
    });
  });
});
