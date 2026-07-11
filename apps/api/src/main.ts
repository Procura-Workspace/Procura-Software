import { loadEnv } from "./config/env.js";

const env = loadEnv();

import { logger } from "./core/logger.js";

// Bootstrap HashiCorp Vault if configured
if (env.VAULT_ADDR && env.VAULT_TOKEN) {
  try {
    logger.info(`Bootstrapping HashiCorp Vault from ${env.VAULT_ADDR}...`);
    const { fetchSecretsFromVault } = await import("./core/vault-client.js");
    const secrets = await fetchSecretsFromVault(
      env.VAULT_ADDR,
      env.VAULT_TOKEN,
    );

    // Inject Vault secrets into process environment
    process.env.DATABASE_URL = secrets.database_url;
    process.env.JWT_SECRET = secrets.jwt_secret;
    process.env.AUDIT_HASH_PEPPER = secrets.audit_hash_pepper;
    process.env.VAULT_LOADED = "true";

    logger.info("Successfully loaded credentials from HashiCorp Vault.");
  } catch (error: any) {
    logger.error(
      error,
      "Critical: Failed to load configuration from HashiCorp Vault",
    );
    process.exit(1);
  }
}

// Now dynamically load the rest of the application with parsed environment variables
const { buildApp } = await import("./app.js");
const app = await buildApp();

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
