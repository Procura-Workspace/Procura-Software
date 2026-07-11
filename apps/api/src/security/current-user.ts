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

export function getCurrentUser(request: FastifyRequest): CurrentUser {
  const parseCookies = (cookieHeader?: string): Record<string, string> => {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    for (const pair of cookieHeader.split(";")) {
      const [key, val] = pair.split("=");
      if (key && val) {
        cookies[key.trim()] = val.trim();
      }
    }
    return cookies;
  };

  const cookies = parseCookies(request.headers.cookie);
  const cookieToken = cookies.procura_token;

  let token: string | undefined;
  const authHeader = request.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded && decoded.sub && roleSet.has(decoded.role)) {
        return {
          id: decoded.sub,
          role: decoded.role as RoleCode,
          displayName: decoded.name || decoded.email,
        };
      }
    } catch (err: any) {
      const error = new Error(err.message || "Token invalide ou expiré");
      (error as any).statusCode = 401;
      error.name = "UNAUTHORIZED";
      throw error;
    }
  }

  // 2. Fall back to custom headers (backward compatibility for dev/mock mode)
  const id = request.headers["x-procura-user-id"];
  const role = request.headers["x-procura-role"];
  const displayName = request.headers["x-procura-display-name"];

  if (typeof id === "string" && typeof role === "string" && roleSet.has(role)) {
    return {
      id,
      role: role as RoleCode,
      displayName: typeof displayName === "string" ? displayName : role,
    };
  }

  const error = new Error("Authentification requise");
  (error as any).statusCode = 401;
  error.name = "UNAUTHORIZED";
  throw error;
}
