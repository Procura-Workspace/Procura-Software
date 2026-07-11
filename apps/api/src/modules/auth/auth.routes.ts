import type { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import type { AuthService } from "./auth.service.js";
import { getCurrentUser } from "../../security/current-user.js";
import { loadEnv } from "../../config/env.js";

const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerAuthRoutes(
  app: FastifyInstance,
  auth: AuthService,
) {
  const env = loadEnv();
  /**
   * POST /auth/login
   */
  app.post(
    "/auth/login",
    {
      schema: {
        description:
          "Authentifier l'utilisateur localement et retourner les tokens d'accès",
        tags: ["auth"],
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
        response: {
          200: {
            description: "Authentification réussie",
            type: "object",
            properties: {
              token: { type: "string" },
              refreshToken: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  displayName: { type: "string" },
                  role: { type: "string" },
                  email: { type: "string" },
                },
              },
            },
          },
          401: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = loginRequestSchema.parse(request.body);

      const session = await auth.login(email, password, {
        ip: request.ip,
        log: request.log,
      });
      if (!session) {
        return reply.code(401).send({
          error: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      // Generate a random CSRF token
      const csrfToken = crypto.randomUUID();

      const isProd = env.NODE_ENV === "production";
      const secureFlag = isProd ? "Secure;" : "";

      // Set HttpOnly, Secure, SameSite=Strict cookies
      // Note: procura_csrf is NOT HttpOnly, allowing the JS client to read it.
      reply.header("Set-Cookie", [
        `procura_token=${session.token}; Path=/; HttpOnly; ${secureFlag} SameSite=Strict`,
        `procura_refresh_token=${session.refreshToken}; Path=/; HttpOnly; ${secureFlag} SameSite=Strict`,
        `procura_csrf=${csrfToken}; Path=/; ${secureFlag} SameSite=Strict`,
      ]);

      return { user: session.user };
    },
  );

  /**
   * POST /auth/logout
   */
  app.post(
    "/auth/logout",
    {
      preHandler: async (request) => {
        getCurrentUser(request);
      },
      schema: {
        description: "Invalider la session active",
        tags: ["auth"],
        body: {
          type: "object",
          properties: {
            refreshToken: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getCurrentUser(request);

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
      const cookieRefreshToken = cookies.procura_refresh_token;

      const body = request.body as { refreshToken?: string };
      const refreshToken = body?.refreshToken || cookieRefreshToken;

      if (refreshToken) {
        await auth.logout(user.id, refreshToken);
      }

      const isProd = env.NODE_ENV === "production";
      const secureFlag = isProd ? "Secure;" : "";

      // Clear cookies
      reply.header("Set-Cookie", [
        `procura_token=; Path=/; HttpOnly; ${secureFlag} SameSite=Strict; Max-Age=0`,
        `procura_refresh_token=; Path=/; HttpOnly; ${secureFlag} SameSite=Strict; Max-Age=0`,
        `procura_csrf=; Path=/; ${secureFlag} SameSite=Strict; Max-Age=0`,
      ]);

      return { success: true };
    },
  );
}
