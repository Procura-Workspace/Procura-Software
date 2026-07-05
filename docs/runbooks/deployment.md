# Runbook: Procura Platform Deployment

This operational guide details the installation and verification of the Procura Source-to-Contract Platform on-premise, following the security constraints of Algerian Laws 18-07 and 23-12.

---

## 🏗️ Pre-requisites

### 1. Server Hardening (CIS Benchmark Level 1)

- OS: Ubuntu 22.04 LTS (Minimal Server installation).
- Hardening checklist:
  - Disable root SSH login, use non-root user with `sudo`.
  - Enforce SSH key-based authentication.
  - Setup UFW firewall with explicit ports.
  - Setup Fail2Ban on port 22/443.

### 2. Network Layout

Ensure firewall routing rules are configured to separate:

- **Internet / DMZ**: Exposed reverse proxy (Port 443).
- **LAN**: API service, PostgreSQL, MinIO storage.
- **Admin Zone**: Vault service, Wazuh monitoring.

---

## 🚀 Deployment Steps

### Step 1: Clone and Environment Setup

Create the workspace directories and fetch config variables:

```bash
git clone https://github.com/Procura-Workspace/Procura-Software.git
cd Procura-Software
cp .env.example .env
```

Update `.env` values, specifically database passwords and Vault token secrets.

### Step 2: Initialize Docker Infrastructure

Start the database, queue, cache, and object storage:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Verify all containers are healthy:

```bash
docker compose -f infra/docker-compose.yml ps
```

### Step 3: Run Database Migrations & Seeding

Access the postgres container or run the migrations manually:

```bash
docker exec -i procura-postgres psql -U procura -d procura < infra/db/001_init.sql
docker exec -i procura-postgres psql -U procura -d procura < infra/db/002_seed_dev.sql
```

### Step 4: Configure HashiCorp Vault Secrets

Login to Vault UI at `http://localhost:8200` using the dev root token (`root-token`), and mount the secret engine:

```bash
vault secrets enable -path=procura kv-v2
vault kv put procura/database url="postgresql://procura:procura_dev_password@localhost:5432/procura"
```

---

## 🔒 Verification & Compliance Checks

Execute the verification steps to validate the environment before launching developer sprints:

| Check # | Requirement / Command              | Expected Outcome                            |
| ------- | ---------------------------------- | ------------------------------------------- |
| **1**   | `pg_isready -U procura -d procura` | Postgres is accepting connections           |
| **2**   | `curl -I http://localhost:9000`    | MinIO server responding                     |
| **3**   | Check Vault seal status            | `vault status` shows Sealed = false         |
| **4**   | NTP synchronization check          | `timedatectl status` shows synchronized     |
| **5**   | Port scanning test                 | Ports 5432/6379/8200 blocked from public IP |
