# Procura S2C — Sovereign Procurement Platform

Procura is a state-of-the-art, **100% on-premise, sovereign Source-to-Contract (S2C) platform** built for highly regulated sectors (public tenders, energy, banking, telecoms, and industrial entities). It ensures complete compliance with local laws (such as Algerian Laws 18-07 and 23-12) by retaining all sensitive files, contracts, audits, and database records locally within the customer's secure network.

This repository contains the monorepo structure for the Procura MVP.

---

## 👥 The Founders & Code Ownership

Per the **Procura MVP Execution Plan**, development is split strictly between the co-founders according to their domain expertise:

- **🔐 Arix (@arix) — Security & Networks**: Owners of L1 to L3 (Infrastructure, Networking, TLS/mTLS config, Vault, PKI/HSM, Sandboxing, SIEM, Audit Signature).
- **⚙️ Sofiane (@sofiane) — Software Engineering**: Owners of L4 to L7 (REST API, Backend Logic, PostgreSQL schema, React Frontends, Notification templates, CI/CD pipelines).

Please refer to [.github/CODEOWNERS](.github/CODEOWNERS) for directory-level validation.

---

## 📂 Project Structure

```
contracts/              # OpenAPI specs, interface contracts (🤝 Both)
  openapi/              # OpenAPI 3.1 YAML descriptors
docs/                   # Documentation files (🤝 Both)
  adr/                  # Architecture Decision Records (ADRs)
  runbooks/             # Operational runbooks for deploy/monitoring
  guides/               # User and administrator guides
infra/                  # Datacenter on-premise configurations (🔐 Arix)
  db/                   # Database migrations (001_init.sql) and seeds
  security/             # WAF rules, seccomp profiles
  monitoring/           # Prometheus, Grafana, SIEM configs
  environments/         # Environment specific compose configurations
apps/
  api/                  # Backend REST API (Fastify) (⚙️ Sofiane)
  web/                  # React UI (interne + portail fournisseur) (⚙️ Sofiane)
packages/
  shared/               # Common validation schemas (Zod) and permissions (🤝 Both)
scripts/                # Utilities, local seeds, helper scripts (🤝 Both)
tests/                  # E2E and load test scripts (k6) (🤝 Both)
```

---

## 🛠️ Git & Branch Workflow

To keep development frictionless and standard, we enforce the following branching strategy:

- `main`: Represents production-ready code. No direct pushes. Merges only via pull requests approved by both developers.
- `develop`: Integration branch. Merges from features. CI pipeline must pass before merging.
- `feature/arix/*`: Workspace for Arix's security and infra tasks.
- `feature/sofiane/*`: Workspace for Sofiane's business logic and frontend tasks.
- `hotfix/*`: Production bugs fixes.

We enforce **Conventional Commits**: `feat:`, `fix:`, `infra:`, `sec:`, `docs:`, `test:`, `chore:`.

---

## 🚀 Quick Start

### 1. Installation

Install all monorepo dependencies and setup Husky git hooks:

```bash
pnpm install
```

### 2. Standalone Maquette Mode (React Web only)

To explore or demo the user interface without running Fastify or Docker infrastructure, you can spin up the client mock backend (persisted in `localStorage`):

```bash
pnpm --filter @procura/shared build
pnpm --filter @procura/web dev
```

### 3. Local Development (Reel stack)

Start the Docker Compose services:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Inject the schema and dev seed database:

```bash
docker exec -i procura-postgres psql -U procura -d procura < infra/db/001_init.sql
docker exec -i procura-postgres psql -U procura -d procura < infra/db/002_seed_dev.sql
```

Start the API and Web applications:

```bash
# Starts both services concurrently
pnpm dev
```

---

## 🧪 Testing and Linting

- Run ESLint checks: `pnpm lint`
- Run Jest tests: `pnpm test`
- Format code: `pnpm format`
