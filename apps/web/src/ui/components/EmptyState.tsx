import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon size={32} />
      <strong>{title}</strong>
      {description && <span>{description}</span>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}