type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneByValue: Record<string, BadgeTone> = {
  draft: "neutral",
  submitted: "info",
  approved: "success",
  convertedToRfq: "success",
  published: "info",
  locked: "warning",
  opening: "warning",
  commissionReview: "warning",
  awarded: "success",
  exported: "success",
  archived: "neutral",
  cancelled: "danger",
  rejected: "danger",
  active: "success",
  sealed: "success",
  quarantined: "warning",
  opened: "success",
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "success",
  open: "info",
  awaitingSupplier: "warning",
  awaitingCompany: "warning",
  resolved: "success",
  closed: "neutral",
  generated: "info",
  sentToErp: "info",
  acknowledged: "success",
  failed: "danger",
  shortlisted: "info",
  administrative: "neutral",
  documentation: "info",
  technical: "warning",
  delivery: "info",
  clean: "success",
  suspicious: "warning",
  malicious: "danger",
  pendingReview: "warning",
  blocked: "danger"
};

export function Badge({ value, label }: { value: string; label?: string }) {
  const tone = toneByValue[value] ?? "neutral";
  return <span className={`badge ${tone}`}>{label ?? value}</span>;
}

export function ToneBadge({ tone, label }: { tone: BadgeTone; label: string }) {
  return <span className={`badge ${tone}`}>{label}</span>;
}