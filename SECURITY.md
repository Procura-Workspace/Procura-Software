# Security Policy - Procura Platform

Procura processes sensitive corporate procurement contracts, supplier bid pricing, and legal seals. It must be treated as a **critical system**. The platform is designed with a **Defense-in-Depth** and **Zero-Trust** security architecture.

---

## 🛡️ Secure Coding Standards

All developers (Arix & Sofiane) must adhere to these coding guidelines:

1. **Input Validation**: All client entries (via REST query parameters, request bodies, path parameters) must be strictly validated using Zod schemas defined in `packages/shared`.
2. **Access Control (RBAC)**: Front-end controls are strictly for user experience (hiding buttons/tabs). The API **must** validate permissions using the `requirePermission` middleware on every request.
3. **No Hardcoded Secrets**: Credentials, API keys, passwords, certificates, or token salts must **never** be checked into version control. Standard local overrides must stay in `.env` (ignored by git), and production secrets must be managed through HashiCorp Vault.
4. **Data Isolation**: The supplier portal is exposed in a DMZ network. No component inside the DMZ can access the LAN database or services directly. Data transfer from DMZ to LAN must occur via **Pull-Only** mechanisms.
5. **Sanitize File Uploads**: All supplier uploads must go through:
   - MIME/magic bytes validation (no extension spoofing).
   - Multi-engine Antivirus scan.
   - Dynamic sandbox VM verification.
   - HSM scellage with SHA-256 and RFC 3161 timestamping before leaving quarantine.

---

## 🛑 Reporting a Vulnerability

If you identify a security vulnerability, please report it immediately:

- **Security Contacts**:
  - Arix (🔐 Security Lead): arix@procura.dz
  - Sofiane (⚙️ Engineering Lead): sofiane@procura.dz

Please do **not** file public GitHub issues for critical vulnerabilities. Submit them privately to ensure they are patched before release. We aim to triage and respond to all reports within 24 hours.
