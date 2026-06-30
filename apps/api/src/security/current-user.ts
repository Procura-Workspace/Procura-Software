import type { FastifyRequest } from "fastify";
import { roles, type RoleCode } from "@procura/shared";

export type CurrentUser = {
  id: string;
  role: RoleCode;
  displayName: string;
};

const roleSet = new Set<string>(roles.map((r) => r.code));

const fallbackUser: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  role: "buyer",
  displayName: "Amine Acheteur"
};

export function getCurrentUser(request: FastifyRequest): CurrentUser {
  const id = request.headers["x-procura-user-id"];
  const role = request.headers["x-procura-role"];
  const displayName = request.headers["x-procura-display-name"];

  if (typeof id !== "string" || typeof role !== "string" || !roleSet.has(role)) {
    return fallbackUser;
  }

  return {
    id,
    role: role as RoleCode,
    displayName: typeof displayName === "string" ? displayName : role
  };
}