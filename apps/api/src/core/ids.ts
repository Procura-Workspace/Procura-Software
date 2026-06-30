import { randomUUID } from "node:crypto";

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nextReference(prefix: string, sequence: number): string {
  return `${prefix}-${new Date().getUTCFullYear()}-${String(sequence).padStart(3, "0")}`;
}
