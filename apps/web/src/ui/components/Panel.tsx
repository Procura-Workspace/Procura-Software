import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Panel({
  title,
  icon: Icon,
  description,
  actions,
  children,
  variant = "default"
}: {
  title?: string;
  icon?: LucideIcon;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  variant?: "default" | "wide" | "narrow";
}) {
  return (
    <section className={`panel ${variant === "wide" ? "wide" : ""}`.trim()}>
      {(title || actions) && (
        <div className="panel-heading">
          <div>
            <h2>
              {Icon && <Icon size={18} />}
              {title}
            </h2>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="panel-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}