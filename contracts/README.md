# Procura API Contracts

This directory contains the formal API contracts defined between **Arix** (🔐 Security & Network - Layer 1 to 3) and **Sofiane** (⚙️ Software Engineering - Layer 4 to 7).

## Contract-First Development Protocol

According to MVP Plan §5.2:

1. Every interface between the security layer (e.g. upload DMZ validation, antivirus sandbox) and the business layer (Fastify controllers) must have a signed OpenAPI spec here before development starts.
2. Changes to these contracts require approval from both developers (PR label: `contract`, approval from @arix and @sofiane required).

## Contracts List

- [auth.yaml](./openapi/auth.yaml) — Authentication & Session Management
- [upload.yaml](./openapi/upload.yaml) — Dépôt sécurisé / File Upload (DMZ → LAN)
- [scan-results.yaml](./openapi/scan-results.yaml) — Antivirus & Sandbox Scan Outcomes
