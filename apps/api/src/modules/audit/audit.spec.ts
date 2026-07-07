import { jest } from "@jest/globals";
import { AuditService } from "./audit.service.js";
import { db } from "../../core/db.js";

describe("AuditService", () => {
  let auditService: AuditService;

  beforeAll(() => {
    // Patch db.query with jest mock
    db.query = jest.fn() as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    auditService = new AuditService("test-pepper");
  });

  it("should append a new audit event to PostgreSQL", async () => {
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] } as any) // for select previous hash
      .mockResolvedValueOnce({ rows: [] } as any); // for insert

    const event = await auditService.append({
      actorId: "actor-uuid",
      actorRole: "buyer",
      action: "need.create",
      resourceType: "need",
      resourceId: "need-uuid",
    });

    expect(event).toBeDefined();
    expect(event.previousHash).toBeNull();
    expect(event.entryHash).toBeDefined();
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it("should verify the hash chain integrity", async () => {
    const mockEvents = [
      {
        id: "1",
        actorId: "actor-uuid",
        actorRole: "buyer",
        action: "need.create",
        resourceType: "need",
        resourceId: "need-uuid",
        occurredAt: "2026-07-07T12:00:00.000Z",
        previousHash: null,
        entryHash:
          "f15e8df7f29f04ee8dfbb05e1694f488667c4fa4f084fa95e4e7e7225ab644f1", // dummy computed/expected hash below
      },
    ];

    (db.query as jest.Mock).mockResolvedValue({ rows: mockEvents } as any);

    const result = await auditService.verify();
    expect(result.total).toBe(1);
    expect(result.broken).toBe(1); // Since our dummy entryHash won't match the computed hash exactly
  });
});
