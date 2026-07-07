# Sprint 1 — Complete Walkthrough & Handover

This document outlines the software foundations completed for **Sprint 1** and provides a step-by-step instruction manual for the remaining security and network infrastructure setup owned by **Arix** (🔐 Security & Network).

---

## ⚙️ Part 1: Completed Software Foundations (Sofiane's Zone)

We have implemented the core backend authentication services, session management layer, and database hooks to a Microsoft-level standard.

### 1. Database & Cache Connectivity

- **PostgreSQL Pool**: Implemented in [apps/api/src/core/db.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/api/src/core/db.ts) using `pg`. Reads dynamically from `env.DATABASE_URL`.
- **Redis Client**: Implemented in [apps/api/src/core/redis.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/api/src/core/redis.ts) using `ioredis`. Connects lazily so the application won't crash if Redis starts up slowly.

### 2. JWT Authentication & Redis Sessions

- **Auth Service**: Written in [apps/api/src/modules/auth/auth.service.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/api/src/modules/auth/auth.service.ts).
  - Verifies local user credentials in PostgreSQL using salted PBKDF2 hash checking.
  - Generates secure JWT access tokens valid for 1 hour.
  - Issues UUID refresh tokens and records active sessions in Redis with a 7-day expiration.
  - Implements logout by immediately invalidating the session key in Redis.
- **Auth Routes**: Defined in [apps/api/src/modules/auth/auth.routes.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/api/src/modules/auth/auth.routes.ts) providing:
  - `POST /auth/login`
  - `POST /auth/logout`

### 3. Middleware Integration & RBAC

- **JWT Checking**: Updated [apps/api/src/security/current-user.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/api/src/security/current-user.ts) to intercept `Authorization: Bearer <JWT>` headers, decode payloads, verify signatures against `env.JWT_SECRET`, and bind users to Fastify request contexts.
- **RBAC Engine**: The middleware in [apps/api/src/security/rbac.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/api/src/security/rbac.ts) is fully integrated. Passing authorization tokens instantly validates roles and permissions against Zod rules.

### 4. Interactive API Documentation (Swagger)

- **Automatic OpenAPI Schemas**: Registered `@fastify/swagger` and `@fastify/swagger-ui` in [apps/api/src/app.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/api/src/app.ts).
- **Location**: Once you start the API, open a browser to `http://localhost:8080/docs` to see the live interactive API specs.

### 5. Automated Tests

- **Auth Tests**: Implemented in [apps/api/src/modules/auth/auth.spec.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/api/src/modules/auth/auth.spec.ts) covering incorrect logins, correct passwords, and session deletions.
- Run tests with: `pnpm test`

---

## 🔐 Part 2: Security & Infrastructure Runbook (Arix's Zone)

Since certain hardware configurations, networking configurations, and infrastructure setups must be performed directly in your local environment, follow this detailed guide to complete Sprint 1.

---

### Step 1: Configure TLS 1.3 on Nginx Reverse Proxy

Deploy an Nginx instance in the DMZ network acting as a reverse proxy, enforcing modern TLS 1.3 options.

Create your Nginx configuration at `infra/security/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name procura.corp.local;

    # SSL/TLS Configurations (enforcing TLS 1.3 exclusively)
    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';

    # Certificates (mapped inside container)
    ssl_certificate /etc/nginx/certs/procura.crt;
    ssl_certificate_key /etc/nginx/certs/procura.key;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'none';" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Expose web application
    location / {
        proxy_pass http://procura-web:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Expose Fastify API
    location /api/ {
        proxy_pass http://procura-api:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Step 2: Initialize & Configure HashiCorp Vault

Start Vault container defined in your compose stack. Run these CLI commands inside the container to configure the secrets store:

```bash
# Access Vault CLI
docker exec -it procura-vault sh

# Initialize Vault (if running in standard storage, save unseal keys and root token)
# (For dev compose, Vault automatically boots in dev mode using root-token)

# Enable KV Secrets Engine
vault secrets enable -path=procura kv-v2

# Store Database & JWT Secrets securely
vault kv put procura/database url="postgresql://procura:procura_dev_password@procura-postgres:5432/procura"
vault kv put procura/jwt secret="super-secret-key-that-is-at-least-32-chars-long-change-me"
```

---

### Step 3: Hardening Database Encryption

Ensure the PostgreSQL TDE (Transparent Data Encryption) or storage-level encryption is active on the hosting OS. In the docker stack:

1. Enforce SSL connections for all backend access.
2. Bind the PostgreSQL container **strictly** to the `procura-lan` bridge network so it remains inaccessible from the DMZ or public interfaces.

---

### Step 4: Active Directory / LDAP Integration

For corporate users, LDAP validation is mapped to Fastify. Add the client lookup configuration:

To enable corporate directory mapping:

1. Ensure the AD controller is reachable on port `636` (LDAPS).
2. Store AD binds credentials inside HashiCorp Vault.
3. Utilize standard LDAP packages (e.g. `ldapjs`) inside a dedicated authentication pipeline to synchronize corporate profiles.

---

### Step 5: Setup OS Hardening & Fail2Ban

Enforce Fail2Ban rules on the host machine to block brute-force attempts on Nginx proxy or SSH services.

Create `/etc/fail2ban/jail.d/procura.local.conf`:

```ini
[nginx-http-auth]
enabled  = true
filter   = nginx-http-auth
port     = http,https
logpath  = /var/log/nginx/error.log
maxretry = 5
bantime  = 86400 # Ban IP for 24 hours
```

Apply security hardening using standard Ubuntu benchmarks (e.g. CIS benchmarks level 1).
