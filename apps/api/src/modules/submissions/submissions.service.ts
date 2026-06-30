import type { CreateSubmissionInput, Submission } from "@procura/shared";
import { sha256 } from "../../core/hash.js";
import { newId, nowIso } from "../../core/ids.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class SubmissionsService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  list(): Submission[] {
    return [...this.store.submissions.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  forRfq(rfqId: string): Submission[] {
    return [...this.store.submissions.values()].filter((s) => s.rfqId === rfqId);
  }

  create(input: CreateSubmissionInput, actor: CurrentUser): Submission | null {
    const rfq = this.store.rfqs.get(input.rfqId);
    if (!rfq || rfq.status !== "published" || !rfq.supplierIds.includes(input.supplierId)) {
      return null;
    }
    if (Date.parse(rfq.deadlineAt) <= Date.now()) return null;

    const now = nowIso();
    const contentHash = sha256({
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      fileName: input.fileName,
      sizeBytes: input.sizeBytes,
      submittedAt: now
    });
    const submission: Submission = {
      id: newId(),
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      status: "sealed",
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      sha256Hash: contentHash,
      sealedAt: now,
      openedAt: null,
      malwareScan: "clean",
      createdAt: now,
      technicalScore: input.technicalScore ?? null,
      financialOffer: input.financialOffer ?? null,
      currency: input.currency ?? "DZD"
    };

    this.store.submissions.set(submission.id, submission);
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "submission.seal",
      resourceType: "submission",
      resourceId: submission.id
    });
    return submission;
  }

  openForRfq(rfqId: string, actor: CurrentUser): Submission[] {
    const openedAt = nowIso();
    const opened: Submission[] = [];
    for (const submission of this.store.submissions.values()) {
      if (submission.rfqId === rfqId && submission.status === "sealed") {
        const updated = { ...submission, status: "opened" as const, openedAt };
        this.store.submissions.set(submission.id, updated);
        opened.push(updated);
      }
    }
    this.audit.append({
      actorId: actor.id,
      actorRole: actor.role,
      action: "submission.openForRfq",
      resourceType: "rfq",
      resourceId: rfqId
    });
    return opened;
  }
}