# ADR-002: Use Fastify over NestJS for the Backend API

- **Status**: Accepted
- **Owner**: Sofiane
- **Date**: 2026-07-05

## Context and Problem Statement

The Procura S2C platform needs a backend API framework. The MVP execution plan mentions a decision between NestJS (structured module/dependency injection approach) and Fastify (leaner, highly performant, simpler setup).

## Decision Drivers

- Performance & raw throughput
- Development velocity and simplicity
- Maintainability and runtime footprint on-premise
- Current prototype is already built using Fastify

## Considered Options

1. **NestJS** (TypeScript-first framework with Angular-like structure and DI)
2. **Fastify** (Extremely fast, low-overhead web framework)

## Decision Outcome

Chosen Option: **Fastify** (Option 2), because:

- The prototype already has 22 Fastify-based modules implemented. Rewriting them in NestJS would delay the MVP launch.
- Fastify offers superior performance and is natively compatible with TypeScript and Zod schema validations.
- Keeps the runtime lightweight, which is critical for deployments on resource-constrained local environments.

### Consequences

- **Good**: Faster time-to-market, zero refactoring costs from prototype, extremely low latency.
- **Bad**: Dependency injection is handled manually or via simple factory patterns rather than structured decorators.
- **Ugly**: None.
