import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Load .env file automatically in Node and Jest contexts
function tryLoadEnvFile() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const paths = [
      join(__dirname, "../../../../.env"),
      ".env",
      "../.env",
      "../../.env",
      "../../../.env",
      "../../../../.env",
    ];

    for (const p of paths) {
      if (existsSync(p)) {
        const content = readFileSync(p, "utf-8");
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const index = trimmed.indexOf("=");
          if (index === -1) continue;
          const key = trimmed.substring(0, index).trim();
          let val = trimmed.substring(index + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
        break;
      }
    }
  } catch {
    // Silent fallback
  }
}

// Initial load
tryLoadEnvFile();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    API_HOST: z.string().default("0.0.0.0"),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    WEB_ORIGINS: z
      .string()
      .default("http://localhost:5173,http://127.0.0.1:5173"),
    AUDIT_HASH_PEPPER: z.string().min(12).optional(),
    DATABASE_URL: z.string().optional(),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    JWT_SECRET: z.string().min(32).optional(),
    LDAP_URL: z.string().default("ldaps://localhost:636"),
    LDAP_BIND_DN: z.string().default("cn=admin,dc=procura,dc=local"),
    LDAP_BIND_PASSWORD: z.string().default("admin_password"),
    VAULT_ADDR: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .pipe(z.string().url().optional()),
    VAULT_TOKEN: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),
    APP_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .refine(
    (data) => {
      if (data.APP_ENV === "production") {
        const hasVault = data.VAULT_ADDR && data.VAULT_TOKEN;
        const hasDirectSecrets =
          data.AUDIT_HASH_PEPPER || data.DATABASE_URL || data.JWT_SECRET;

        if (process.env.VAULT_LOADED === "true") {
          return !!hasVault;
        }
        return !!(hasVault && !hasDirectSecrets);
      }

      const hasVault = data.VAULT_ADDR && data.VAULT_TOKEN;
      const hasDirectSecrets =
        data.AUDIT_HASH_PEPPER && data.DATABASE_URL && data.JWT_SECRET;
      return !!(hasVault || hasDirectSecrets);
    },
    {
      message:
        "Vault configurations (VAULT_ADDR, VAULT_TOKEN) are strictly required in production mode, and direct application secrets must not be defined in the initial environment.",
    },
  );

export type AppEnv = Omit<
  z.infer<typeof envSchema>,
  "AUDIT_HASH_PEPPER" | "DATABASE_URL" | "JWT_SECRET"
> & {
  AUDIT_HASH_PEPPER: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  // If variables were reset by test runner (Jest sandbox), reload them
  if (
    !source.JWT_SECRET &&
    !source.DATABASE_URL &&
    !source.AUDIT_HASH_PEPPER &&
    !source.VAULT_ADDR
  ) {
    tryLoadEnvFile();
  }
  return envSchema.parse(source) as unknown as AppEnv;
}
