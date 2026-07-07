import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuthService } from "./auth.service.js";
import { getCurrentUser } from "../../security/current-user.js";

const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerAuthRoutes(
  app: FastifyInstance,
  auth: AuthService,
) {
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

      const session = await auth.login(email, password);
      if (!session) {
        return reply.code(401).send({
          error: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      return session;
    },
  );

  /**
   * POST /auth/logout
   */
  app.post(
    "/auth/logout",
    {
      schema: {
        description: "Invalider la session active",
        tags: ["auth"],
        body: {
          type: "object",
          required: ["refreshToken"],
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
      const body = request.body as { refreshToken: string };

      await auth.logout(user.id, body.refreshToken);
      return { success: true };
    },
  );
}
