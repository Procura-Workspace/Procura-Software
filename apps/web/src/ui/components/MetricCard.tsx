import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <article className={`metric-card ${tone ?? ""}`.trim()}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}