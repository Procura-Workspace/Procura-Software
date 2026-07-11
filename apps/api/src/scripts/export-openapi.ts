import { buildApp } from "../app.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  // Enforce dev mock environment variables so the validation schemas compile without Vault
  process.env.NODE_ENV = "development";
  process.env.DATABASE_URL =
    "postgresql://procura:procura_dev_password@localhost:5433/procura";
  process.env.JWT_SECRET =
    "development-only-secret-key-must-be-very-long-and-random-32chars";
  process.env.AUDIT_HASH_PEPPER = "audit-pepper-development-local-salt";

  const app = await buildApp();

  // Ready triggers Fastify plugins compilation, including swagger initialization
  await app.ready();

  const yaml = app.swagger({ yaml: true });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Target folder: contracts/openapi/ relative to root workspace
  const outDir = join(__dirname, "../../../../contracts/openapi");
  mkdirSync(outDir, { recursive: true });

  const outFile = join(outDir, "openapi.yaml");
  writeFileSync(outFile, yaml, "utf-8");

  console.log(`OpenAPI schema successfully exported to: ${outFile}`);
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to export OpenAPI schema:", err);
  process.exit(1);
});
