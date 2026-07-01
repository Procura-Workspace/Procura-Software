import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";

export function Button({
  icon: Icon,
  children,
  tone = "primary",
  loading,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  children: ReactNode;
  tone?: Tone;
  loading?: boolean;
}) {
  return (
    <button {...rest} className={`btn tone-${tone} ${rest.className ?? ""}`.trim()}>
      {loading ? <span className="spinner" aria-hidden /> : Icon && <Icon size={16} />}
      <span>{children}</span>
    </button>
  );
}