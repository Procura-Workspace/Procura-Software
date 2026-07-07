# 📋 Audit Complet & Feuille de Route — Fin de Sprint 1

Ce document dresse un état des lieux sans concession (Audit Technique) de ce qui est prêt, ce qui est simulé, et ce qui pose problème dans la base de code actuelle de **Procura**.

Il propose ensuite une **feuille de route concrète sous forme de prompts détaillés et indépendants** pour guider les IA de développement de Sofiane et Arix afin d'amener le projet au standard de production mondial.

---

## 🔍 PARTIE 1 : L'Audit Technique Complet (Le Vrai du Faux)

### 🟢 Ce qui est TRÈS BON (Normes respectées)

1. **Architecture Monorepo robuste** : Configuration `pnpm workspaces` propre. Séparation claire entre `@procura/shared` (Zod & contrats de types), `apps/api` (Fastify), et `apps/web` (React + Tailwind v4 + shadcn).
2. **Qualité et Rigueur Git** : Outils de validation pré-commit (`Husky`, `commitlint`, `lint-staged`) configurés et actifs. Linter (`ESLint`) et formateur (`Prettier`) bien réglés.
3. **Pipeline CI/CD en place** : Intégration continue prête (`workflows/ci.yml` et `workflows/security-scan.yml`) avec scans de vulnérabilités secrets (Gitleaks) et de code (CodeQL).
4. **Schéma SQL de Haute Qualité** : Le fichier [001_init.sql](file:///c:/Users/minett/Desktop/Procura%20MVP/infra/db/001_init.sql) est complet, bien modélisé, et inclut des colonnes de sécurité critiques (`hsm_signature`, `rfc3161_timestamp`, `previous_hash`, `entry_hash`).
5. **Configuration de sécurité de l'API** : L'API Fastify intègre d'office `Helmet` (politique CSP fermée), `CORS` restrictifs et un `Rate Limiter` natif.

---

### 🔴 Ce qui est MAUVAIS ou SIMULÉ (À corriger pour la prod)

Le principal problème actuel est la coexistence d'un **système de maquette/démo (Mock)** et d'un **début de code réel (PostgreSQL/Redis)**. Rien ne communique réellement entre l'interface utilisateur et le serveur.

1. **Le Backend est "schizophrène"** :
   - Le service d'authentification (`AuthService`) et d'audit (`AuditService`) tentent de lire/écrire dans PostgreSQL/Redis.
   - Mais **tous les autres modules** (`NeedsService`, `RfqService`, `SubmissionsService`, `CommissionService`, etc.) lisent et écrivent dans un magasin en mémoire fictif (`AppStore` dans `core/store.ts`). Ces données sont perdues à chaque redémarrage du serveur.
2. **Le Frontend est 100% simulé (Standalone)** :
   - Le client API dans [client.ts](file:///c:/Users/minett/Desktop/Procura%20MVP/apps/web/src/api/client.ts) appelle `mockBackend.ts`.
   - **Aucune requête HTTP** (`fetch` ou `axios`) n'est envoyée au serveur Fastify (`http://localhost:8080`).
   - Le changement de rôle se fait par un menu déroulant en haut de l'écran, sans aucun formulaire de connexion réel (pas d'écran de login, pas d'authentification par session ou jeton JWT).
3. **Intégration Active Directory inexistante** :
   - Mentionnée dans la documentation, mais aucun connecteur ou code LDAP fonctionnel n'est présent dans `apps/api`.
4. **Secrets de configuration en clair** :
   - Le serveur Fastify charge des valeurs par défaut dans `env.ts` au lieu de requêter Vault dans un environnement de staging/prod.

---

## 🎯 PARTIE 2 : Définition du Don (DoD) pour le Sprint 1 Final

Pour valider le Sprint 1 aux standards bancaires / gouvernementaux, nous devons atteindre l'état suivant :

- [ ] **Connexion Réelle** : L'utilisateur arrive sur un écran de login sur le Web. Il s'authentifie, obtient un JWT, et ce jeton est utilisé dans les requêtes HTTP.
- [ ] **Flux API Connecté** : Le frontend fait de vraies requêtes HTTP vers l'API Fastify.
- [ ] **Persistance DB** : Toutes les données créées (Utilisateurs, Besoins, RFQs, Logs d'audit) sont écrites et lues dans PostgreSQL (et non plus dans le `AppStore` temporaire).
- [ ] **Sessions sécurisées** : Les jetons de rafraîchissement (Refresh Tokens) et les sessions actives sont validés en temps réel dans Redis.
- [ ] **Zéro secrets dans le code** : Vault est utilisé pour initialiser l'API en production.

---

## 🛠️ PARTIE 3 : Roadmaps de développement & Prompts IA (Step-by-Step)

Voici les prompts précis, limités et indépendants à donner à une IA pour finaliser le Sprint 1 de manière propre et compartimentée.

```carousel
### PROMPT 1 : Connexion Réelle de l'API à PostgreSQL & Fin du Store en mémoire (Sofiane)
<!-- slide -->
### PROMPT 2 : Migration des Services Métiers vers PostgreSQL (Sofiane)
<!-- slide -->
### PROMPT 3 : Création de la Page de Connexion & Client HTTP Réel (Sofiane)
<!-- slide -->
### PROMPT 4 : Connecteur LDAP / Active Directory (Sofiane / Arix)
<!-- slide -->
### PROMPT 5 : Durcissement Sécurité & Gestion des Secrets Vault (Arix)
```

---

### 💻 ZONE SOFIANE (Software Engineering)

#### 📝 PROMPT 1 : Connexion Réelle de l'API à PostgreSQL & Fin du Store en mémoire

**Objectif** : Remplacer l'initialisation de l'in-memory store (`core/store.ts`) par des appels SQL réels lors du démarrage de l'API et de la gestion de l'audit.

```text
Rôle : Développeur Backend Node.js / Fastify.
Contexte : Nous voulons connecter l'API de Procura à la base de données PostgreSQL de manière propre en se débarrassant de l'in-memory store.

Tâches à accomplir :
1. Examine le fichier `apps/api/src/core/db.ts` pour t'assurer de la validité du pool de connexion PostgreSQL.
2. Modifie le fichier `apps/api/src/modules/audit/audit.service.ts` pour enlever tout code faisant référence à `store` ou `this.store.auditEvents`. Toutes les requêtes de lecture (list) et d'écriture (append) doivent s'effectuer uniquement sur la table `audit_events` de PostgreSQL en SQL brut.
3. Assure-toi que la validation de l'intégrité de la chaîne de hachage (`verify()`) requête directement PostgreSQL.
4. Ajuste `apps/api/src/modules/audit/audit.routes.ts` pour qu'il gère les promesses asynchrones de manière fluide.
5. Mets à jour le fichier de tests unitaires `audit.spec.ts` (ou crée-le s'il n'existe pas) pour tester l'AuditService avec des mocks de la base de données.
```

---

#### 📝 PROMPT 2 : Migration des Services Métiers vers PostgreSQL

**Objectif** : Migrer les services `needs` et `users` du `AppStore` vers PostgreSQL pour valider le premier flux métier du Sprint 1.

```text
Rôle : Développeur Backend Fastify / SQL.
Contexte : Le module "Needs" (Expressions de Besoins) et la gestion des utilisateurs utilisent encore des listes en mémoire (`AppStore`). Nous devons les connecter à PostgreSQL.

Tâches à accomplir :
1. Modifie `apps/api/src/modules/admin/admin.service.ts` pour que la création d'utilisateurs (`createUser`) et l'activation/désactivation (`toggleActive`) s'effectuent via des requêtes SQL sur la table `users`.
2. Modifie `apps/api/src/modules/needs/needs.service.ts` pour que les opérations `list`, `get`, `create`, `submit`, `approve`, et `reject` effectuent des opérations SQL sur la table `need_expressions` (voir structure dans `infra/db/001_init.sql`).
3. Remplace la génération de références séquentielles en mémoire par une séquence SQL ou un calcul max/count sur la base de données pour la fonction `nextReference`.
4. Rends toutes les méthodes asynchrones et mets à jour les contrôleurs/routes associés dans `needs.routes.ts` et `admin.routes.ts` avec des `await`.
5. Assure-toi que `pnpm build` compile sans aucune erreur de typage TypeScript.
```

---

#### 📝 PROMPT 3 : Création de la Page de Connexion & Client HTTP Réel

**Objectif** : Remplacer l'API Mock du frontend par des appels HTTP réels et ajouter un formulaire de connexion sécurisé.

```text
Rôle : Développeur React / Tailwind / TypeScript.
Contexte : L'application web Procura fonctionne actuellement en mode maquette avec des données locales stockées en mémoire du navigateur. Nous voulons la connecter au vrai serveur d'API Fastify.

Tâches à accomplir :
1. Crée un nouveau composant de page `apps/web/src/ui/pages/LoginPage.tsx` contenant un formulaire de connexion (Email, Mot de passe) élégant, respectant la charte esthétique premium (fond sombre/vitré, effets de transition fluides, gestion des états de chargement).
2. Modifie `apps/web/src/ui/App.tsx` pour gérer un état `isAuthenticated`. Si non authentifié, afficher uniquement la page de connexion.
3. Modifie `apps/web/src/api/client.ts` pour que chaque méthode de `procuraApi` envoie des requêtes réseau réelles via `fetch` vers le serveur Fastify (`http://localhost:8080`) au lieu d'appeler `mockApi`.
4. Gère le stockage du jeton JWT dans un cookie HTTPOnly ou, à défaut pour le développement, dans le `localStorage` et ajoute l'en-tête `Authorization: Bearer <token>` à toutes les requêtes HTTP sortantes.
5. Implémente le bouton "Déconnexion" qui appelle `/auth/logout` et vide le jeton local.
```

---

#### 📝 PROMPT 4 : Connecteur LDAP / Active Directory

**Objectif** : Implémenter le middleware de secours de connexion pour les employés internes de l'entreprise via LDAP/AD.

```text
Rôle : Développeur Node.js Backend / Sécurité.
Contexte : Le cahier des charges impose une intégration avec l'Active Directory interne pour les rôles administratifs, acheteurs et demandeurs.

Tâches à accomplir :
1. Ajoute la dépendance `ldapjs` et ses typages au package `apps/api`.
2. Crée un fichier `apps/api/src/security/ldap.ts` qui expose une fonction `authenticateAD(email, password): Promise<{ displayName: string, role: string, department: string } | null>`.
3. Cette fonction doit se connecter à un serveur LDAP sécurisé (LDAPS, port 636) via les variables de configuration `LDAP_URL`, `LDAP_BIND_DN`, et `LDAP_BIND_PASSWORD`.
4. Modifie la route `/auth/login` : si l'adresse email se termine par le domaine de l'entreprise (ex: `@procura.dz`), l'authentification doit d'abord interroger l'Active Directory. Si l'AD valide la connexion, l'utilisateur est automatiquement synchronisé/créé dans la base PostgreSQL locale s'il n'existe pas, puis ses tokens JWT lui sont délivrés.
```

---

### 🔐 ZONE ARIX (Security & Infrastructure)

Pour les étapes hors programmation pure, voici le plan d'action d'ingénierie système.

#### 🛠️ ÉTAPE 1 : Configuration et Durcissement du Réseau Local

- **Tâche** : Configurer la séparation logique des couches sur le serveur d'hébergement.
- **Comment faire** :
  1. Installez `ufw` (Uncomplicated Firewall) sur la machine hôte.
  2. Bloquez toutes les connexions entrantes par défaut : `sudo ufw default deny incoming`.
  3. Autorisez uniquement le port SSH sécurisé et les ports web publics :
     ```bash
     sudo ufw allow 22/tcp
     sudo ufw allow 80/tcp
     sudo ufw allow 443/tcp
     sudo ufw enable
     ```
  4. Dans le fichier `docker-compose.yml`, assurez-vous que les ports des conteneurs critiques (`5432` pour Postgres, `6379` pour Redis, `8200` pour Vault) n'écoutent pas sur `0.0.0.0` sur l'hôte, mais sont uniquement accessibles via le réseau privé Docker `procura-lan`. Retirez les sections `ports` de ces conteneurs et laissez uniquement `expose`.

---

#### 🛠️ ÉTAPE 2 : Chiffrement PostgreSQL (TDE) & Object Storage MinIO

- **Tâche** : Chiffrer les fichiers de base de données et les documents stockés au repos.
- **Comment faire** :
  1. **PostgreSQL** : Configurez le chiffrement au repos du volume de données via LUKS au niveau de la machine hôte Linux, ou activez SSL entre l'API et Postgres en configurant des certificats auto-signés ou d'autorité interne (CA) dans `infra/db`.
  2. **MinIO** : Activez le chiffrement SSE-KMS ou SSE-S3. Modifiez les commandes d'initialisation de MinIO pour activer le chiffrement par défaut des buckets contenant les offres scellées des fournisseurs.

---

#### 🛠️ ÉTAPE 3 : Configuration du Vault pour la Production

- **Tâche** : Alimenter et verrouiller le coffre-fort HashiCorp Vault.
- **Comment faire** :
  1. Lancez Vault en mode de stockage persistant (et non en mode `-dev`).
  2. Récupérez les 3 clés d'unseal et le Root Token de manière sécurisée.
  3. Écrivez un script d'initialisation shell pour automatiser l'injection des clés d'API et secrets lors du déploiement :
     ```bash
     export VAULT_ADDR='http://127.0.0.1:8200'
     vault login [Votre-Root-Token]
     vault secrets enable -path=procura kv-v2
     vault kv put procura/database url="postgresql://procura:prod_password@postgres:5432/procura"
     vault kv put procura/jwt secret="$(openssl rand -hex 32)"
     ```
