import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function InfoBanner({
  icon: Icon,
  title,
  children,
  tone = "info"
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  tone?: "info" | "warning" | "success" | "danger";
}) {
  return (
    <div className={`info-banner tone-${tone}`}>
      <Icon size={18} />
      <div>
        <strong>{title}</strong>
        <span>{children}</span>
      </div>
    </div>
  );
}