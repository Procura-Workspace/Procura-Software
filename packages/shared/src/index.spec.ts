import { hasPermission } from "./index.js";

describe("RBAC Permissions", () => {
  it("should allow buyer to create rfqs", () => {
    expect(hasPermission("buyer", "rfq:create")).toBe(true);
  });

  it("should not allow supplier to create rfqs", () => {
    expect(hasPermission("supplier", "rfq:create")).toBe(false);
  });
});
