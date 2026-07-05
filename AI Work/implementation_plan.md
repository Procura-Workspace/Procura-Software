# Procura MVP — Full Workspace Preparation Plan

**Goal**: Restructure and prepare the Procura MVP workspace so Arix (🔐 Security & Network) and Sofiane (⚙️ Software Engineering) can immediately begin Sprint 1 with clear ownership boundaries, international-standard tooling, and production-grade foundations.

## Background & Gap Analysis

### What Exists Today (Prototype/Maquette)

The current repo is a **functional prototype** with:

- ✅ Monorepo structure (`apps/api`, `apps/web`, `packages/shared`)
- ✅ 22 modules implemented as in-memory services (Fastify API)
- ✅ React frontend with mock backend (standalone mode)
- ✅ Shared Zod schemas, RBAC model, state machine (FSM) for RFQ/Need
- ✅ Basic Docker Compose (PostgreSQL, Redis, MinIO)
- ✅ SHA-256 hash-chain audit (in-memory)
- ✅ Seed data and mock backend for demo

### What's Missing vs. MVP Plan Requirements

| Area                   | Current State                        | Required for Sprint 1                                                                      |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Git Workflow**       | Single `main` branch, no protections | `main` + `develop` + `feature/arix/*` + `feature/sofiane/*` + branch protections           |
| **CI/CD**              | No pipeline at all                   | GitHub Actions: lint, build, test, secret scan, SAST                                       |
| **Auth**               | Header-based (`x-procura-role`)      | JWT asymmetric with session management                                                     |
| **Database**           | In-memory store                      | PostgreSQL with migration system (existing `001_init.sql` is a start)                      |
| **Docker Compose**     | Dev-only (Postgres, Redis, MinIO)    | Dev + Staging + Prod profiles with all services                                            |
| **Testing**            | No tests, `node --test` script       | Vitest for backend, Vitest + Testing Library for frontend                                  |
| **API Contracts**      | Implicit (code-defined)              | OpenAPI 3.1 specs per module                                                               |
| **Documentation**      | Basic READMEs                        | ADR templates, runbooks, interface contracts                                               |
| **Code Ownership**     | No CODEOWNERS                        | GitHub CODEOWNERS file per MVP Plan exclusivity zones                                      |
| **Commit Standards**   | No convention                        | Conventional Commits enforced via commitlint                                               |
| **PR Templates**       | None                                 | PR template with What/Why/How-to-test                                                      |
| **Issue Templates**    | None                                 | Bug, feature, security templates                                                           |
| **Linting/Formatting** | Prettier only                        | ESLint + Prettier + lint-staged + husky                                                    |
| **Environment Config** | `.env.example` only                  | Proper `.env` validation, Vault-ready secrets structure                                    |
| **Repo Structure**     | Flat `infra/`                        | Structured: `infra/security/`, `infra/monitoring/`, `contracts/`, `scripts/`, `tests/e2e/` |

---

## User Review Required

> [!IMPORTANT]
> **GitHub Repository**: Do you already have a GitHub repo created? If yes, please share the URL so I can configure branch protections and CI/CD properly. If not, I'll prepare everything locally and you can push when ready.

> [!IMPORTANT]
> **GitHub Actions vs GitLab CI**: The MVP Plan mentions both. Which CI/CD platform are you using? I'll default to **GitHub Actions** unless you say otherwise.

> [!WARNING]
> **Breaking Change**: The current prototype stores all data in-memory. Migrating to PostgreSQL means the mock backend (`mockBackend.ts`) stays for standalone UI demos, but the real API will require a running database. The existing `001_init.sql` schema will be significantly expanded.

---

## Open Questions

> [!IMPORTANT]
>
> 1. **NestJS vs Fastify**: The MVP Plan mentions "Fastify ou NestJS". The current code uses Fastify. Do you want to keep Fastify (lighter, already working) or migrate to NestJS (more structured DI, but heavier rewrite)?
> 2. **UI Library**: Plan mentions "shadcn/ui ou MUI". Current frontend uses vanilla CSS + lucide-react. Do you want to introduce shadcn/ui or keep the current approach?
> 3. **Testing framework**: Plan mentions "Jest". I recommend **Vitest** instead since you're on Vite/ESM. Confirm?

---

## Proposed Changes

The preparation is organized into **7 components**, ordered by dependency (foundations first).

---

### Component 1 — Repository Structure & Ownership

Restructure the repository to match the MVP Plan's ownership model.

#### [NEW] [CODEOWNERS](file:///c:/Users/minett/Desktop/Procura%20MVP/.github/CODEOWNERS)

GitHub CODEOWNERS file defining exclusive ownership zones per the MVP Plan §5.1:

- `infra/**` → @arix
- `infra/security/**` → @arix
- `infra/monitoring/**` → @arix
- `apps/api/**` → @sofiane
- `apps/web/**` → @sofiane
- `packages/shared/**` → @arix @sofiane (both required)
- `contracts/**` → @arix @sofiane (both required)
- `.github/workflows/**` → @sofiane (pipeline) + @arix (security steps)

#### [NEW] Directories to create

```
contracts/                    # OpenAPI specs, interface READMEs (🤝 Both)
contracts/openapi/            # OpenAPI 3.1 specs per module
scripts/                      # Deployment, utility scripts (🤝 Both)
scripts/dev/                  # Dev helper scripts
tests/                        # E2E and integration tests (🤝 Both)
tests/e2e/                    # End-to-end tests
tests/load/                   # k6 load test scripts
infra/security/               # WAF rules, seccomp, hardening (🔐 Arix)
infra/monitoring/             # Prometheus, Grafana configs (🔐 Arix)
infra/environments/           # Per-environment Docker overrides
docs/adr/                     # Architecture Decision Records
docs/runbooks/                # Operational runbooks
docs/guides/                  # User guides
```

---

### Component 2 — Git Workflow & Branch Strategy

Set up the branching model from MVP Plan §2.2.

#### [NEW] [.github/pull_request_template.md](file:///c:/Users/minett/Desktop/Procura%20MVP/.github/pull_request_template.md)

PR template with sections: **What**, **Why**, **How to Test**, **Screenshots**, **Checklist** (tests, docs, no secrets).

#### [NEW] [.github/ISSUE_TEMPLATE/bug_report.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/.github/ISSUE_TEMPLATE/bug_report.yml)

Structured bug report template with severity, module, steps to reproduce.

#### [NEW] [.github/ISSUE_TEMPLATE/feature_request.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/.github/ISSUE_TEMPLATE/feature_request.yml)

Feature request template with owner, priority, sprint, effort estimation.

#### [NEW] [.github/ISSUE_TEMPLATE/security_issue.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/.github/ISSUE_TEMPLATE/security_issue.yml)

Security issue template (private by default) with CVSS, affected module, remediation.

#### [MODIFY] [.gitignore](file:///c:/Users/minett/Desktop/Procura%20MVP/.gitignore)

Add entries for: `.env.local`, `secrets/`, `*.pem`, `*.key`, `.vault-token`, coverage reports, IDE files.

#### Git branch setup (manual step documented)

```
git checkout -b develop
git push -u origin develop
# Branch protections for main: require 2 approvals, require CI pass
# Branch protections for develop: require 1 approval, require CI pass
```

---

### Component 3 — CI/CD Pipeline (GitHub Actions)

#### [NEW] [.github/workflows/ci.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/.github/workflows/ci.yml)

Main CI pipeline triggered on PR and push to develop/main:

1. **Lint** — ESLint + TypeScript typecheck
2. **Build** — Build shared, API, and web packages
3. **Test** — Run unit tests with coverage reporting
4. **Secret Scan** — Gitleaks to detect secrets in code
5. **Dependency Audit** — `pnpm audit` for known CVEs
6. **SBOM Generation** — Software Bill of Materials

#### [NEW] [.github/workflows/security-scan.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/.github/workflows/security-scan.yml)

Weekly security scan + on-demand: OWASP ZAP baseline, dependency check.

#### [NEW] [commitlint.config.js](file:///c:/Users/minett/Desktop/Procura%20MVP/commitlint.config.js)

Enforce Conventional Commits: `feat:`, `fix:`, `infra:`, `sec:`, `docs:`, `test:`, `chore:`.

#### [NEW] [.husky/commit-msg](file:///c:/Users/minett/Desktop/Procura%20MVP/.husky/commit-msg)

Git hook to run commitlint on every commit.

#### [NEW] [.husky/pre-commit](file:///c:/Users/minett/Desktop/Procura%20MVP/.husky/pre-commit)

Git hook to run lint-staged (ESLint + Prettier on staged files).

---

### Component 4 — Development Tooling & Quality

#### [MODIFY] [package.json](file:///c:/Users/minett/Desktop/Procura%20MVP/package.json)

Add devDependencies:

- `eslint` + `@typescript-eslint/*` + `eslint-plugin-react-hooks`
- `husky` + `lint-staged` + `@commitlint/cli` + `@commitlint/config-conventional`
- `vitest` (test runner)

Add scripts:

- `prepare` → `husky` (auto-install hooks)
- `lint` → ESLint across all packages
- `test` → Vitest across all packages

#### [NEW] [eslint.config.mjs](file:///c:/Users/minett/Desktop/Procura%20MVP/eslint.config.mjs)

Flat ESLint config with TypeScript rules, React rules, and security rules.

#### [NEW] [.lintstagedrc.json](file:///c:/Users/minett/Desktop/Procura%20MVP/.lintstagedrc.json)

Run ESLint and Prettier on staged `.ts`, `.tsx`, `.css` files.

#### [MODIFY] [tsconfig.base.json](file:///c:/Users/minett/Desktop/Procura%20MVP/tsconfig.base.json)

Add `"declaration": true`, `"declarationMap": true` for proper shared package consumption.

---

### Component 5 — Infrastructure & Docker Compose

#### [MODIFY] [infra/docker-compose.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/infra/docker-compose.yml)

Expand to include all MVP target services with proper networking:

```yaml
services:
  postgres: # PostgreSQL 17 with TDE-ready config
  redis: # Redis 7 with password + TLS-ready
  minio: # MinIO with SSE-C ready
  rabbitmq: # RabbitMQ 3.13 for message bus
  vault: # HashiCorp Vault (dev mode for local)
  mailhog: # Local SMTP testing (dev only)

networks:
  procura-lan: # Internal LAN network
  procura-dmz: # DMZ network (supplier portal)
  procura-admin: # Admin network (Vault, PKI)
```

#### [NEW] [infra/environments/docker-compose.dev.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/infra/environments/docker-compose.dev.yml)

Dev overrides: relaxed security, debug logging, MailHog.

#### [NEW] [infra/environments/docker-compose.staging.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/infra/environments/docker-compose.staging.yml)

Staging overrides: TLS enabled, stricter security, real SMTP.

#### [MODIFY] [infra/db/001_init.sql](file:///c:/Users/minett/Desktop/Procura%20MVP/infra/db/001_init.sql)

Expand schema to cover all MVP entities with proper:

- Foreign keys, constraints, CHECK enums
- Security columns (hash, signature, timestamp) per Arix's requirements
- Audit trail table with hash chaining
- Proper indexes for performance

#### [NEW] [infra/db/002_seed_dev.sql](file:///c:/Users/minett/Desktop/Procura%20MVP/infra/db/002_seed_dev.sql)

Development seed data matching the current mock backend data.

---

### Component 6 — API Contracts & OpenAPI Specs

#### [NEW] [contracts/README.md](file:///c:/Users/minett/Desktop/Procura%20MVP/contracts/README.md)

Explains the contract-first approach: every interface between Arix and Sofiane's layers must have a signed OpenAPI spec before implementation.

#### [NEW] [contracts/openapi/auth.yaml](file:///c:/Users/minett/Desktop/Procura%20MVP/contracts/openapi/auth.yaml)

Auth service API contract: login, logout, refresh, verify, MFA.

#### [NEW] [contracts/openapi/upload.yaml](file:///c:/Users/minett/Desktop/Procura%20MVP/contracts/openapi/upload.yaml)

Upload API contract (DMZ → LAN): file upload, scan result, quarantine status.

#### [NEW] [contracts/openapi/scan-results.yaml](file:///c:/Users/minett/Desktop/Procura%20MVP/contracts/openapi/scan-results.yaml)

Scan results API contract: `GET /scan/result/{submissionId}`.

---

### Component 7 — Documentation Templates

#### [NEW] [docs/adr/000-template.md](file:///c:/Users/minett/Desktop/Procura%20MVP/docs/adr/000-template.md)

ADR template: Title, Status, Context, Decision, Consequences.

#### [NEW] [docs/adr/001-monorepo-pnpm-workspaces.md](file:///c:/Users/minett/Desktop/Procura%20MVP/docs/adr/001-monorepo-pnpm-workspaces.md)

First ADR documenting the monorepo + pnpm workspace decision.

#### [NEW] [docs/adr/002-fastify-over-nestjs.md](file:///c:/Users/minett/Desktop/Procura%20MVP/docs/adr/002-fastify-over-nestjs.md)

ADR for framework choice (pending your decision on the open question).

#### [NEW] [docs/adr/003-on-premise-only.md](file:///c:/Users/minett/Desktop/Procura%20MVP/docs/adr/003-on-premise-only.md)

ADR documenting the on-premise-only deployment constraint.

#### [NEW] [docs/runbooks/deployment.md](file:///c:/Users/minett/Desktop/Procura%20MVP/docs/runbooks/deployment.md)

Deployment runbook template aligned with the cahier des charges §30 checklist.

#### [MODIFY] [README.md](file:///c:/Users/minett/Desktop/Procura%20MVP/README.md)

Update to reflect the new structure, add badges for CI status, add team ownership section (Arix & Sofiane), update getting started instructions.

#### [MODIFY] [SECURITY.md](file:///c:/Users/minett/Desktop/Procura%20MVP/SECURITY.md)

Expand with vulnerability reporting process, security contact, and responsible disclosure policy.

---

## Verification Plan

### Automated Tests

```bash
# After all changes, verify:
pnpm install                           # Dependencies install cleanly
pnpm --filter @procura/shared build    # Shared package builds
pnpm --filter @procura/api build       # API builds (typecheck)
pnpm --filter @procura/web build       # Web builds (typecheck + Vite)
pnpm lint                              # ESLint passes
pnpm format                            # Prettier formatting
```

### Manual Verification

1. Verify all new directories are created with appropriate `.gitkeep` files
2. Verify `docker compose -f infra/docker-compose.yml up` starts all services
3. Verify the mock standalone mode still works: `pnpm --filter @procura/web dev`
4. Verify the API dev mode still works: `pnpm --filter @procura/api dev`
5. Verify Git hooks work: a non-conventional commit should be rejected
6. Verify PR template appears when creating a new PR on GitHub

### Post-Setup: Sprint 1 Readiness Checklist

After this preparation, the team should be ready to:

- [x] Clone the repo and run `pnpm install`
- [x] Start all infrastructure with Docker Compose
- [x] Create feature branches (`feature/arix/*`, `feature/sofiane/*`)
- [x] Write code with proper linting and formatting
- [x] Make Conventional Commits
- [x] Open PRs with the template and get cross-reviews
- [x] Have CI automatically validate code quality
- [ ] Begin Sprint 1 Day 1: Planning + Interface Contract signing
