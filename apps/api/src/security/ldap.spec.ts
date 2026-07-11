import { jest } from "@jest/globals";

// Mock client methods
const mockClient = {
  on: jest.fn(),
  bind: jest.fn(),
  search: jest.fn(),
  destroy: jest.fn(),
};

// Mock ldapjs module
jest.unstable_mockModule("ldapjs", () => ({
  default: {
    createClient: jest.fn().mockReturnValue(mockClient),
  },
}));

// Mock env configuration before importing ldap.ts
jest.unstable_mockModule("../config/env.js", () => ({
  loadEnv: () => ({
    LDAP_URL: "ldaps://active-directory.procura.dz:636",
    LDAP_BIND_DN: "cn=admin,dc=procura,dc=local",
    LDAP_BIND_PASSWORD: "admin_password",
  }),
}));

const { authenticateAD } = await import("./ldap.js");

describe("LDAP Authenticator (ldap.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.on.mockReset();
    mockClient.bind.mockReset();
    mockClient.search.mockReset();
    mockClient.destroy.mockReset();
  });

  it("should handle LDAP connection client error", async () => {
    mockClient.on.mockImplementation((event: string, callback: any) => {
      if (event === "error") {
        callback(new Error("Connection refused"));
      }
      return mockClient;
    });

    const res = await authenticateAD("amine@procura.dz", "Password123!");
    expect(res).toBeNull();
  });

  it("should handle LDAP system bind failure", async () => {
    mockClient.on.mockReturnValue(mockClient);
    mockClient.bind.mockImplementation(
      (dn: string, password: any, callback: any) => {
        callback(new Error("Invalid system credentials"));
      },
    );

    const res = await authenticateAD("amine@procura.dz", "Password123!");
    expect(res).toBeNull();
    expect(mockClient.destroy).toHaveBeenCalled();
  });

  it("should handle LDAP search error", async () => {
    mockClient.on.mockReturnValue(mockClient);
    mockClient.bind.mockImplementation(
      (dn: string, password: any, callback: any) => {
        callback(null);
      },
    );

    mockClient.search.mockImplementation(
      (base: string, options: any, callback: any) => {
        callback(new Error("Search failed"));
      },
    );

    const res = await authenticateAD("amine@procura.dz", "Password123!");
    expect(res).toBeNull();
    expect(mockClient.destroy).toHaveBeenCalled();
  });

  it("should handle user password verify bind failure", async () => {
    mockClient.on.mockReturnValue(mockClient);
    mockClient.bind.mockImplementationOnce(
      (dn: string, password: any, callback: any) => {
        callback(null);
      },
    );

    const mockResEmitter = {
      on: jest.fn().mockImplementation((event: string, callback: any) => {
        if (event === "searchEntry") {
          callback({
            dn: "uid=amine,dc=procura,dc=local",
            pojo: {
              attributes: [
                { type: "displayName", values: ["Amine Acheteur"] },
                { type: "department", values: ["Direction des Achats"] },
              ],
            },
          });
        } else if (event === "end") {
          callback({});
        }
        return mockResEmitter;
      }),
    };

    mockClient.search.mockImplementation(
      (base: string, options: any, callback: any) => {
        callback(null, mockResEmitter);
      },
    );

    mockClient.bind.mockImplementationOnce(
      (dn: string, password: any, callback: any) => {
        callback(new Error("Invalid user password"));
      },
    );

    const res = await authenticateAD("amine@procura.dz", "WrongPassword!");
    expect(res).toBeNull();
    expect(mockClient.destroy).toHaveBeenCalled();
  });

  it("should authenticate successfully and return LdapUser details", async () => {
    mockClient.on.mockReturnValue(mockClient);
    mockClient.bind.mockImplementationOnce(
      (dn: string, password: any, callback: any) => {
        callback(null);
      },
    );

    const mockResEmitter = {
      on: jest.fn().mockImplementation((event: string, callback: any) => {
        if (event === "searchEntry") {
          callback({
            dn: "uid=amine,dc=procura,dc=local",
            pojo: {
              attributes: [
                { type: "displayName", values: ["Amine Acheteur"] },
                { type: "department", values: ["Direction des Achats"] },
              ],
            },
          });
        } else if (event === "end") {
          callback({});
        }
        return mockResEmitter;
      }),
    };

    mockClient.search.mockImplementation(
      (base: string, options: any, callback: any) => {
        callback(null, mockResEmitter);
      },
    );

    mockClient.bind.mockImplementationOnce(
      (dn: string, password: any, callback: any) => {
        callback(null);
      },
    );

    const res = await authenticateAD("amine@procura.dz", "Password123!");
    expect(res).not.toBeNull();
    expect(res!.displayName).toBe("Amine Acheteur");
    expect(res!.role).toBe("buyer");
    expect(res!.department).toBe("Direction des Achats");
  });
});
