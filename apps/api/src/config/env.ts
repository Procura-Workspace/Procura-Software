import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  AUDIT_HASH_PEPPER: z.string().min(12).default("change-me-in-vault"),
  DATABASE_URL: z
    .string()
    .default(
      "postgresql://procura:procura_dev_password@localhost:5432/procura",
    ),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z
    .string()
    .min(32)
    .default("super-secret-key-that-is-at-least-32-chars-long-change-me"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
