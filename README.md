# Procura MVP

Procura est une plateforme **Source-to-Contract (S2C) on-premise** destinee aux organisations
regulieres (marches publics, energies, banque/assurance, industrie) qui souhaitent piloter
leur cycle achat sans sortir les donnees de leur perimetre.

Ce depot contient une **premiere version tres proche du MVP** : backend fonctionnel,
interface web complete, separation des roles, audit hash-chain et integration ERP.

## Modules implementes (22/22)

| # | Module | Statut |
|---|--------|--------|
| 1 | Architecture & deploiement | API + UI + Docker compose |
| 2 | Utilisateurs & acces (IAM/RBAC) | `apps/api/src/security` |
| 3 | Expression du besoin | `apps/api/src/modules/needs` + `NeedsPage` |
| 4 | Referentiel fournisseurs ERP | `apps/api/src/modules/suppliers` |
| 5 | RFQ & publication | `apps/api/src/modules/rfq` + `RfqsPage` |
| 6 | Portail fournisseur DMZ | `apps/api/src/modules/supplierPortal` + `SupplierPortalPage` |
| 7 | Depot securise des offres | `apps/api/src/modules/submissions` + `SubmissionsPage` |
| 8 | Horodatage & preuve legale | service `audit` (SHA-256 chain) |
| 9 | Deadlines & verrouillage | service `audit` + regles RFQ |
| 10 | Audit & tracabilite | `apps/api/src/modules/audit` + `AuditPage` |
| 11 | Ouverture des plis | route `commission` + `CommissionPage` |
| 12 | Commission d'ouverture | `apps/api/src/modules/comparison` + `CommissionPage` |
| 13 | Analyse comparative | `ComparisonPage` |
| 14 | Output final | `OutputsPage` |
| 15 | Integration ERP | route `send-to-erp` |
| 16 | Communication collaborative | `apps/api/src/modules/tickets` + `TicketsPage` |
| 17 | Notifications systeme | `apps/api/src/modules/settings` + `Notifications` |
| 18 | Administration & parametrage | `apps/api/src/modules/admin` + `UsersAdminPage` + `SettingsPage` |
| 19 | Securite globale | RBAC + helmet + rate-limit + CORS |
| 20 | Archivage legal | parametre `archiveRetentionYears` |
| 21 | Monitoring & exploitation | `MonitoringPage` + metriques API |
| 22 | Documentation & support | `TicketsPage` |

## Demarrage rapide

### Mode maquette standalone (recommande pour explorer l'UI)

Le front peut tourner **sans backend** : toutes les donnees et mutations sont gerees
par la couche mock `apps/web/src/data/mockBackend.ts` (donnees seedees, chainage
d'audit local, hash SHA-256, persistance `localStorage`, latence simulee, RBAC simule).
C'est le mode recommande pour utiliser l'app comme maquette.

```bash
# 1. Installation
pnpm install

# 2. Build du package partage (schemas Zod)
pnpm --filter @procura/shared build

# 3. Demarrer le front uniquement
pnpm --filter @procura/web dev          # http://127.0.0.1:5173
```

### Mode API connectee (backend reel)

```bash
# Terminal 1
pnpm --filter @procura/api dev          # http://127.0.0.1:8080

# Terminal 2
VITE_API_URL=http://127.0.0.1:8080 pnpm --filter @procura/web dev
```

Quand `VITE_API_URL` pointe vers l'API reelle, le client delegue chaque appel a
`fetch` au lieu du mock. La signature des fonctions reste identique — quand le
backend sera pret, il suffira de definir `VITE_API_URL` et de remplacer la
delegation dans `apps/web/src/api/client.ts` par des appels `fetch`.

## Roles et permissions

| Role | Acces principaux |
|------|------------------|
| **Acheteur** | Cree/publie les RFQ, genere les outputs, accede a l'audit |
| **Demandeur** | Cree/soumet les besoins, suit leur cycle de validation |
| **Membre commission** | Ouvre les plis, saisit les decisions, signe le PV |
| **Administrateur** | Gere les utilisateurs, parametres plateforme |
| **Auditeur** | Acces en lecture a la totalite du journal d'audit |
| **Fournisseur** | Vue dediee via le portail DMZ, depot d'offre securise |
| **ERP** | Recepconne les outputs finaux (systeme technique) |

## Cycle Source-to-Contract

```
Expression besoin → Validation → RFQ → Publication → Depot offres (scelle)
   → Deadline → Ouverture plis → Commission → PV signe → Output ERP
```

Chaque etape produit un evenement d'audit lie au precedent par hash SHA-256 (`previousHash`
→ `entryHash`). Le endpoint `GET /audit/verify` detecte les ruptures de chaine.

## Tests rapides (curl)

```bash
# Tableau de bord
curl http://127.0.0.1:8080/dashboard \
  -H "x-procura-role: buyer" \
  -H "x-procura-user-id: 00000000-0000-4000-8000-000000000001"

# Liste des RFQ
curl http://127.0.0.1:8080/rfqs \
  -H "x-procura-role: buyer" \
  -H "x-procura-user-id: 00000000-0000-4000-8000-000000000001"

# Verification audit hash-chain
curl http://127.0.0.1:8080/audit/verify \
  -H "x-procura-role: auditor" \
  -H "x-procura-user-id: 00000000-0000-4000-8000-000000000008"

# Creer un besoin (demandeur)
curl -X POST http://127.0.0.1:8080/needs \
  -H "content-type: application/json" \
  -H "x-procura-role: requester" \
  -H "x-procura-user-id: 00000000-0000-4000-8000-000000000002" \
  -d '{"title":"Cables HT","description":"Description detaillee avec plus de 10 caracteres","department":"Technique","estimatedBudget":1000000,"currency":"DZD","priority":"high"}'
```

## Stack technique

- **Backend** : Fastify 5, TypeScript, helmet, cors, rate-limit, Zod
- **Frontend** : React 19, Vite 6, TypeScript, lucide-react
- **Partage** : pnpm workspaces, schemas Zod derives en types
- **Audit** : SHA-256 chain append-only
- **Stockage** : In-memory pour la demo (PostgreSQL + MinIO cibles pour la prod)
- **Auth (demo)** : headers `x-procura-role` / `x-procura-user-id` (a remplacer par OIDC/SSO en prod)

## Conformite visee

- Loi 23-12 cybersecurite (Algerie)
- Loi 18-07 protection des donnees personnelles
- Decret marches publics
- ISO 27001:2022 (controles cles : separation, audit, MFA)
- ISO 9001:2015 (tracabilite processus)
- OWASP Top 10 (helmet, rate-limit, validation entree)

## Structure du depot

```
apps/
  api/        API Fastify (RBAC, audit, modules metier)
  web/        Front React + Vite
    src/
      data/   Mock backend (standalone mode) + seed data
      api/    Client API (delegue au mock ou a l'API reelle)
      ui/     Composants, pages, etat global
packages/
  shared/     Schemas Zod, roles, permissions, enums
docs/         Architecture, decisions, conformite
infra/        Docker Compose cible (Postgres, MinIO, Redis, Wazuh)
```

## Roadmap post-MVP

1. Authentification reelle (OIDC + MFA obligatoire commission)
2. Persistance PostgreSQL avec TDE
3. Coffre MinIO chiffrement AES-256
4. Pipeline antivirus + sandbox (ClamAV + container isole)
5. Horodatage qualifie RFC 3161
6. SIEM Wazuh + alerting SOC
7. Signature electronique qualifiee du PV
8. Deploiement PKI + HSM pour clefs