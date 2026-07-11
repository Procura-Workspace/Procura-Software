import { jest } from "@jest/globals";

// ESM Mocking for LDAP security module
jest.unstable_mockModule("../../security/ldap.js", () => ({
  authenticateAD: jest.fn().mockResolvedValue(null),
}));

// Dynamically import dependencies after mocking
const { AuthService } = await import("./auth.service.js");
const { db } = await import("../../core/db.js");
const { redis } = await import("../../core/redis.js");
const ldap = (await import("../../security/ldap.js")) as any;

describe("AuthService", () => {
  let authService: AuthService;

  beforeAll(() => {
    // Directly patch properties with Jest mock functions for ESM compatibility
    db.query = jest.fn() as any;
    redis.set = jest.fn() as any;
    redis.del = jest.fn() as any;
    redis.get = jest.fn() as any;
    redis.incr = jest.fn() as any;
    redis.expire = jest.fn() as any;
    redis.ttl = jest.fn() as any;
  });

  beforeEach(() => {
    (db.query as jest.Mock).mockReset();
    (redis.set as jest.Mock).mockReset();
    (redis.del as jest.Mock).mockReset();
    (redis.get as jest.Mock).mockReset();
    (redis.incr as jest.Mock).mockReset();
    (redis.expire as jest.Mock).mockReset();
    (redis.ttl as jest.Mock).mockReset();
    ldap.authenticateAD.mockReset();
    ldap.authenticateAD.mockResolvedValue(null);
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
  });

  it("should invalidate session on logout", async () => {
    (redis.del as jest.Mock).mockResolvedValue(1 as any);

    await authService.logout("user-uuid", "refresh-token-uuid");
    expect(redis.del).toHaveBeenCalledWith(
      "session:user-uuid:refresh-token-uuid",
    );
  });

  it("should reject authentication if account is locked in Redis", async () => {
    (redis.get as jest.Mock).mockResolvedValue("locked" as any);
    (redis.ttl as jest.Mock).mockResolvedValue(300 as any);

    await expect(
      authService.login("test@procura.dz", "Password123!"),
    ).rejects.toThrow(
      "Compte verrouillé. Veuillez réessayer dans 5 minute(s).",
    );
  });

  it("should lock account on 5th failed login attempt", async () => {
    (redis.get as jest.Mock).mockResolvedValue(null as any);
    (redis.incr as jest.Mock).mockResolvedValue(5 as any);
    (redis.set as jest.Mock).mockResolvedValue("OK" as any);
    (redis.del as jest.Mock).mockResolvedValue(1 as any);

    // DB user check succeeds but password verify fails
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

    await expect(
      authService.login("test@procura.dz", "Password123!"),
    ).rejects.toThrow(
      "Compte verrouillé pour 15 minutes suite à 5 tentatives échouées.",
    );

    expect(redis.set).toHaveBeenCalledWith(
      "lockout:test@procura.dz",
      "locked",
      "EX",
      900,
    );
    expect(redis.del).toHaveBeenCalledWith("login_attempts:test@procura.dz");
  });

  it("should reset attempts on successful login", async () => {
    (redis.get as jest.Mock).mockResolvedValue(null as any);
    (redis.del as jest.Mock).mockResolvedValue(1 as any);
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: "00000000-0000-4000-8000-000000000001",
          display_name: "Amine Acheteur",
          email: "amine@procura.dz",
          role_code: "buyer",
          is_active: true,
          password_hash:
            "pbkdf2:10000:salt1234:09bf167ecd93c1097cea50ff78e418e0c18c9af9bc41a73fa86d38db33ecd55abfdc9dbd6efc2ff1388d8d070f4fb5b2357b3ff14b349d82658624de0e20de1b",
        },
      ],
    } as any);
    (redis.set as jest.Mock).mockResolvedValue("OK" as any);

    await authService.login("amine@procura.dz", "Password123!");
    expect(redis.del).toHaveBeenCalledWith("login_attempts:amine@procura.dz");
  });

  it("should succeed authentication via LDAP and sync user locally", async () => {
    const mockLdapUser = {
      displayName: "Arix Admin",
      role: "administrator",
      department: "Direction des Achats",
    };

    ldap.authenticateAD.mockResolvedValue(mockLdapUser);

    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ department_id: "dept-uuid" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: "00000000-0000-4000-8000-000000000003",
            display_name: "Arix Admin",
            email: "arix@procura.dz",
            role_code: "administrator",
            is_active: true,
          },
        ],
      } as any);

    (redis.set as jest.Mock).mockResolvedValue("OK" as any);

    const result = await authService.login("arix@procura.dz", "Password123!");

    expect(result).not.toBeNull();
    expect(result!.user.displayName).toBe("Arix Admin");
    expect(result!.user.role).toBe("administrator");
    expect(ldap.authenticateAD).toHaveBeenCalledWith(
      "arix@procura.dz",
      "Password123!",
    );
  });

  it("should fail LDAP authentication if matched database user is inactive", async () => {
    const mockLdapUser = {
      displayName: "Inactive User",
      role: "buyer",
      department: "Direction des Achats",
    };
    ldap.authenticateAD.mockResolvedValue(mockLdapUser);

    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: "inactive-uuid",
          display_name: "Inactive User",
          email: "inactive@procura.dz",
          role_code: "buyer",
          is_active: false,
        },
      ],
    } as any);

    const result = await authService.login(
      "inactive@procura.dz",
      "Password123!",
    );
    expect(result).toBeNull();
  });

  it("should succeed authentication via LDAP and create department if it does not exist", async () => {
    const mockLdapUser = {
      displayName: "New Dept User",
      role: "buyer",
      department: "Nouveau Departement",
    };
    ldap.authenticateAD.mockResolvedValue(mockLdapUser);

    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] } as any) // user check
      .mockResolvedValueOnce({ rows: [] } as any) // dept check (empty, must create)
      .mockResolvedValueOnce({
        rows: [{ department_id: "new-dept-uuid" }],
      } as any) // dept insert
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: "new-user-uuid",
            display_name: "New Dept User",
            email: "newdept@procura.dz",
            role_code: "buyer",
            is_active: true,
          },
        ],
      } as any); // user insert

    (redis.set as jest.Mock).mockResolvedValue("OK" as any);

    const result = await authService.login(
      "newdept@procura.dz",
      "Password123!",
    );
    expect(result).not.toBeNull();
    expect(result!.user.displayName).toBe("New Dept User");
  });

  it("should fail local authentication if database user is inactive", async () => {
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: "inactive-uuid",
          display_name: "Inactive Local",
          email: "inactive-local@procura.dz",
          role_code: "buyer",
          is_active: false,
          password_hash: "pbkdf2:10000:salt:hash",
        },
      ],
    } as any);

    const result = await authService.login(
      "inactive-local@procura.dz",
      "Password123!",
    );
    expect(result).toBeNull();
  });

  it("should fail local authentication if database user password hash is missing", async () => {
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: "no-pw-uuid",
          display_name: "No Password User",
          email: "nopw@procura.dz",
          role_code: "buyer",
          is_active: true,
          password_hash: null,
        },
      ],
    } as any);

    const result = await authService.login("nopw@procura.dz", "Password123!");
    expect(result).toBeNull();
  });

  it("should atomically increment login attempts when 2 failed logins are performed in parallel", async () => {
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: "user-uuid",
          display_name: "Test User",
          email: "parallel@procura.dz",
          role_code: "buyer",
          is_active: true,
          password_hash: "pbkdf2:10000:salt:wronghash",
        },
      ],
    } as any);

    let incrementCount = 0;
    (redis.incr as jest.Mock).mockImplementation(async (key: string) => {
      incrementCount++;
      return incrementCount;
    });

    (redis.get as jest.Mock).mockResolvedValue(null);

    await Promise.all([
      authService.login("parallel@procura.dz", "WrongPassword!"),
      authService.login("parallel@procura.dz", "WrongPassword!"),
    ]);

    expect(incrementCount).toBe(2);
    expect(redis.incr).toHaveBeenCalledTimes(2);
  });
});
