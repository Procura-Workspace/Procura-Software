import type { CreateSubmissionInput, Rfq, Submission, Supplier } from "@procura/shared";
import { sha256 } from "../../core/hash.js";
import { newId, nowIso } from "../../core/ids.js";
import type { AppStore } from "../../core/store.js";
import type { CurrentUser } from "../../security/current-user.js";
import type { AuditService } from "../audit/audit.service.js";

export class SupplierPortalService {
  constructor(
    private readonly store: AppStore,
    private readonly audit: AuditService
  ) {}

  private resolveSupplier(actor: CurrentUser): Supplier | null {
    const supplier = this.store.suppliers.get(actor.id);
    if (!supplier) return null;
    return supplier;
  }

  dashboard(actor: CurrentUser): {
    supplier: Supplier | null;
    invitations: Array<{ rfq: Rfq; deadlineRemainingMs: number }>;
    mySubmissions: Submission[];
  } {
    const supplier = this.resolveSupplier(actor);
    if (!supplier) {
      return { supplier: null, invitations: [], mySubmissions: [] };
    }

    const invitations = [...this.store.rfqs.values()]
      .filter((rfq) => rfq.status === "published" && rfq.supplierIds.includes(supplier.id))
      .map((rfq) => ({
        rfq,
        deadlineRemainingMs: Date.parse(rfq.deadlineAt) - Date.now()
      }));

    const mySubmissions = [...this.store.submissions.values()].filter(
      (s) => s.supplierId === supplier.id
    );

    return { supplier, invitations, mySubmissions };
  }

  rfqDetail(rfqId: string, actor: CurrentUser): {
    rfq: Rfq | null;
    supplier: Supplier | null;
    alreadySubmitted: boolean;
    deadlinePassed: boolean;
  } {
    const supplier = this.resolveSupplier(actor);
    if (!supplier) return { rfq: null, supplier: null, alreadySubmitted: false, deadlinePassed: false };

    const rfq = this.store.rfqs.get(rfqId) ?? null;
    if (!rfq || !rfq.supplierIds.includes(supplier.id)) {
      return { rfq: null, supplier, alreadySubmitted: false, deadlinePassed: false };
    }

    const alreadySubmitted = [...this.store.submissions.values()].some(
      (s) => s.rfqId === rfqId && s.supplierId === supplier.id
    );

    return {
      rfq,
      supplier,
      alreadySubmitted,
      deadlinePassed: Date.parse(rfq.deadlineAt) <= Date.now()
    };
  }

  submit(input: CreateSubmissionInput, actor: CurrentUser): Submission | null {
    const supplier = this.resolveSupplier(actor);
    if (!supplier || supplier.id !== input.supplierId) return null;

    const rfq = this.store.rfqs.get(input.rfqId);
    if (!rfq || rfq.status !== "published") return null;
    if (!rfq.supplierIds.includes(supplier.id)) return null;
    if (Date.parse(rfq.deadlineAt) <= Date.now()) return null;

    const already = [...this.store.submissions.values()].some(
      (s) => s.rfqId === input.rfqId && s.supplierId === supplier.id
    );
    if (already) return null;

    const maxBytes = (this.store.settings.maxSubmissionSizeMb ?? 50) * 1024 * 1024;
    if (input.sizeBytes > maxBytes) return null;

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
}