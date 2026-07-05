# ADR-001: Use a Monorepo Structure with pnpm Workspaces

- **Status**: Accepted
- **Owner**: Both
- **Date**: 2026-07-05

## Context and Problem Statement

Procura is a complex platform split between security components, backend API logic, frontend React UI, database files, and system infrastructure.
We need a layout that allows code sharing (contracts, types, database schemas) without separate package registries, keeping builds atomic while maintaining clear ownership boundaries.

## Decision Drivers

- Code reuse ( Zod schemas, roles, validations shared between API and Web UI)
- Dependency management speed and disk efficiency
- Clear separation of directories corresponding to Sofiane and Arix zones

## Considered Options

1. **Multiple Repositories** (Separate git repos for api, web, shared, infra)
2. **Lerna / Yarn Workspaces Monorepo**
3. **pnpm Workspaces Monorepo**

## Decision Outcome

Chosen Option: **pnpm Workspaces Monorepo** (Option 3), because:

- It facilitates immediate sharing of local packages (`@procura/shared`) without publishing them to an external registry.
- It uses hard links and content-addressable storage, saving substantial disk space and making `pnpm install` much faster.
- Fits clean workspaces configuration inside `pnpm-workspace.yaml`.

### Consequences

- **Good**: Simple code sharing, unified workspace setup (`pnpm install` at root).
- **Bad**: Monorepo tooling can sometimes be complex for IDEs to resolve unless typescript configuration is set up properly.
- **Ugly**: None identified.
