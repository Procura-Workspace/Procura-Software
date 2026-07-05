# ADR-003: On-Premise Only Sovereign Deployment

- **Status**: Accepted
- **Owner**: Arix
- **Date**: 2026-07-05

## Context and Problem Statement

Procura targets regulated organizations (public tenders, banks, telecoms, energy operators) subject to strict sovereign laws (such as Algerian laws 18-07 on personal data protection and 23-12 on cybersecurity). These laws mandate strict local data residency.

## Decision Drivers

- Strict compliance with Law 18-07 (personal data residency) and Law 23-12 (cybersecurity protocols)
- Elimination of public cloud dependencies or metadata leaks
- System must run in disconnected environments (LAN/DMZ separation)

## Considered Options

1. **SaaS / Public Cloud Deployment** (AWS, Azure, GCP)
2. **Hybrid Cloud Deployment** (Data processing locally, metadata/control plane in SaaS)
3. **Pure On-Premise Sovereign Deployment** (100% localized installation within client datacenter)

## Decision Outcome

Chosen Option: **Pure On-Premise Sovereign Deployment** (Option 3), because:

- It completely satisfies local residency and regulatory compliance by keeping 100% of data, metadata, audits, and uploads within the customer's physical infrastructure.
- Zero dependence on public SaaS resources ensures data cannot be intercepted or leaked outside national boundaries.
- Security controls (Antivirus, Sandbox, Vault, HSM, syslog monitoring) can be fully custom-configured to the client's strict network standards.

### Consequences

- **Good**: 100% compliant with local laws, zero reliance on external SaaS vendors, high appeal for secure governmental clients.
- **Bad**: Higher infrastructure provisioning effort, updates require local deployment procedures (runbooks), scaling is bounded by client hardware.
- **Ugly**: Monitoring must rely purely on localized stacks (Prometheus/Grafana/Wazuh).
