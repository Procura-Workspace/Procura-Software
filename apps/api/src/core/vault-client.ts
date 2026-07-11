import type { AppEnv } from "../config/env.js";

export async function fetchSecretsFromVault(
  vaultAddr: string,
  vaultToken: string,
) {
  // HashiCorp Vault KV v2 API endpoint: v1/{mount_point}/data/{path}
  const url = `${vaultAddr}/v1/procura/data/secrets`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Vault-Token": vaultToken,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Vault API error: HTTP ${response.status} - ${response.statusText}`,
    );
  }

  const body = (await response.json()) as any;
  const data = body?.data?.data;

  if (!data) {
    throw new Error(
      "Vault response contains no secrets data at path procura/secrets",
    );
  }

  const { database_url, jwt_secret, audit_hash_pepper } = data;

  if (!database_url || !jwt_secret || !audit_hash_pepper) {
    throw new Error(
      "Vault secrets missing required attributes (database_url, jwt_secret, audit_hash_pepper)",
    );
  }

  return {
    database_url,
    jwt_secret,
    audit_hash_pepper,
  };
}
