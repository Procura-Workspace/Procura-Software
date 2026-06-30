import type { ReactNode } from "react";

export function FormField({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {hint && !error && <small>{hint}</small>}
      {error && <small className="error">{error}</small>}
    </label>
  );
}