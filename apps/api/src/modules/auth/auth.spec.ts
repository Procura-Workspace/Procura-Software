import { jest } from "@jest/globals";
import { AuthService } from "./auth.service.js";
import { db } from "../../core/db.js";
import { redis } from "../../core/redis.js";

describe("AuthService", () => {
  let authService: AuthService;

  beforeAll(() => {
    // Directly patch properties with Jest mock functions for ESM compatibility
    db.query = jest.fn() as any;
    redis.set = jest.fn() as any;
    redis.del = jest.fn() as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  it("should fail authentication if email does not exist", async () => {
    (db.query as jest.Mock).mockResolvedValue({ rows: [] } as any);

    const result = await authService.login(
      "nonexistent@procura.dz",
      "Password123!",
    );
    expect(result).toBeNull();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it("should fail authentication if password does not match", async () => {
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: "user-uuid",
          display_name: "Test User",
          email: "test@procura.dz",
          role_code: "buyer",
          is_active: true,
          password_hash: "pbkdf2:10000:salt1234:wronghashhere",
        },
      ],
    } as any);

    const result = await authService.login("test@procura.dz", "Password123!");
    expect(result).toBeNull();
  });

  it("should succeed authentication if credentials are valid", async () => {
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: "00000000-0000-4000-8000-000000000001",
          display_name: "Amine Acheteur",
          email: "amine@procura.dz",
          role_code: "buyer",
          is_active: true,
          // PBKDF2 hash of Password123! with salt1234
          password_hash:
            "pbkdf2:10000:salt1234:09bf167ecd93c1097cea50ff78e418e0c18c9af9bc41a73fa86d38db33ecd55abfdc9dbd6efc2ff1388d8d070f4fb5b2357b3ff14b349d82658624de0e20de1b",
        },
      ],
    } as any);
    (redis.set as jest.Mock).mockResolvedValue("OK" as any);

    const result = await authService.login("amine@procura.dz", "Password123!");

    expect(result).not.toBeNull();
    expect(result!.user.displayName).toBe("Amine Acheteur");
    expect(result!.user.role).toBe("buyer");
    expect(result!.token).toBeDefined();
    expect(result!.refreshToken).toBeDefined();
    expect(redis.set).toHaveBeenCalledTimes(1);
  });

  it("should invalidate session on logout", async () => {
    (redis.del as jest.Mock).mockResolvedValue(1 as any);

    await authService.logout("user-uuid", "refresh-token-uuid");
    expect(redis.del).toHaveBeenCalledWith(
      "session:user-uuid:refresh-token-uuid",
    );
  });
});
