# Procura MVP — Workspace Preparation Tasks

## Component 1 — Repository Structure & Ownership

- [ ] Create all new directories with .gitkeep files
- [ ] Create `.github/CODEOWNERS`
- [ ] Update `.gitignore`

## Component 2 — Git Workflow & Branch Strategy

- [ ] Create `.github/pull_request_template.md`
- [ ] Create `.github/ISSUE_TEMPLATE/bug_report.yml`
- [ ] Create `.github/ISSUE_TEMPLATE/feature_request.yml`
- [ ] Create `.github/ISSUE_TEMPLATE/security_issue.yml`

## Component 3 — CI/CD Pipeline (GitHub Actions)

- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.github/workflows/security-scan.yml`
- [ ] Create `commitlint.config.js`

## Component 4 — Development Tooling & Quality

- [ ] Create `eslint.config.mjs`
- [ ] Create `.lintstagedrc.json`
- [ ] Update root `package.json` (devDeps, scripts, lint-staged)
- [ ] Setup husky hooks
- [ ] Update `tsconfig.base.json`
- [ ] Setup Jest configuration

## Component 5 — Infrastructure & Docker Compose

- [ ] Expand `infra/docker-compose.yml` with all services
- [ ] Create `infra/environments/docker-compose.dev.yml`
- [ ] Expand `infra/db/001_init.sql` (full schema)
- [ ] Create `infra/db/002_seed_dev.sql`

## Component 6 — API Contracts & OpenAPI Specs

- [ ] Create `contracts/README.md`
- [ ] Create `contracts/openapi/auth.yaml`
- [ ] Create `contracts/openapi/upload.yaml`
- [ ] Create `contracts/openapi/scan-results.yaml`

## Component 7 — Documentation Templates

- [ ] Create `docs/adr/000-template.md`
- [ ] Create ADRs (001, 002, 003)
- [ ] Create `docs/runbooks/deployment.md`
- [ ] Update `README.md`
- [ ] Update `SECURITY.md`

## Component 8 — shadcn/ui Setup

- [ ] Install Tailwind CSS + PostCSS in web app
- [ ] Create Tailwind config
- [ ] Setup shadcn/ui (cn utility, components.json)
- [ ] Update CSS with Tailwind directives
