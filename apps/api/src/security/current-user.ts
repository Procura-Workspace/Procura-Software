import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { roles, type RoleCode } from "@procura/shared";
import { loadEnv } from "../config/env.js";

const env = loadEnv();

export type CurrentUser = {
  id: string;
  role: RoleCode;
  displayName: string;
};

const roleSet = new Set<string>(roles.map((r) => r.code));

const fallbackUser: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  role: "buyer",
  displayName: "Amine Acheteur",
};

export function getCurrentUser(request: FastifyRequest): CurrentUser {
  // 1. First, check for JWT Authorization Header
  const authHeader = request.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded && decoded.sub && roleSet.has(decoded.role)) {
        return {
          id: decoded.sub,
          role: decoded.role as RoleCode,
          displayName: decoded.name || decoded.email,
        };
      }
    } catch {
      // In case of invalid token, fall through to custom headers/fallback
    }
  }

  // 2. Fall back to custom headers (backward compatibility for dev/mock mode)
  const id = request.headers["x-procura-user-id"];
  const role = request.headers["x-procura-role"];
  const displayName = request.headers["x-procura-display-name"];

  if (
    typeof id !== "string" ||
    typeof role !== "string" ||
    !roleSet.has(role)
  ) {
    return fallbackUser;
  }

  return {
    id,
    role: role as RoleCode,
    displayName: typeof displayName === "string" ? displayName : role,
  };
}
