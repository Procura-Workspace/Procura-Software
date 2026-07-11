# 🧪 Configuration et Test de l'Intégration LDAP/AD en Local

Ce guide explique comment lancer le serveur LDAP de test local (`openldap`), quels comptes de test sont configurés par défaut, et comment tester la synchronisation d'identité.

---

## 🚀 Étape 1 : Démarrer le conteneur LDAP

Dans le dossier `infra/`, nous avons configuré un fichier dédié [docker-compose.ldap.yml](file:///c:/Users/minett/Desktop/Procura%20MVP/infra/docker-compose.ldap.yml).

1. Lancez le serveur OpenLDAP :
   ```bash
   docker compose -f infra/docker-compose.ldap.yml up -d
   ```
2. Vérifiez que le conteneur `procura-ldap` est actif :
   ```bash
   docker ps | grep procura-ldap
   ```

---

## 👥 Étape 2 : Comptes de test et structure LDAP

Le serveur de test est configuré pour le domaine d'entreprise `procura.dz` (DN racine : `dc=procura,dc=dz`).

Les comptes suivants sont pré-configurés pour vos tests d'authentification :

### 1. Administrateur Système (Bind DN principal)

- **DN** : `cn=admin,dc=procura,dc=dz`
- **Mot de passe** : `admin_password`

### 2. Amine Acheteur (Profil Acheteur d'entreprise)

- **Email / Login** : `amine@procura.dz`
- **Mot de passe** : `Password123!`
- **DN** : `uid=amine,ou=people,dc=procura,dc=dz`
- **Attributs** :
  - `displayName` : "Amine Acheteur"
  - `department` : "Direction des Achats" (déduit le rôle `buyer` dans Procura)

### 3. Sofiane Demandeur (Profil Demandeur d'entreprise)

- **Email / Login** : `sofiane@procura.dz`
- **Mot de passe** : `Password123!`
- **DN** : `uid=sofiane,ou=people,dc=procura,dc=dz`
- **Attributs** :
  - `displayName` : "Sofiane Demandeur"
  - `department` : "Direction Technique" (déduit le rôle `requester` dans Procura)

---

## 💻 Étape 3 : Tester en Développement Local

1. Configurez votre fichier `.env` local pour rediriger vers votre serveur LDAP conteneurisé :
   ```env
   LDAP_URL=ldap://localhost:389
   LDAP_BIND_DN=cn=admin,dc=procura,dc=dz
   LDAP_BIND_PASSWORD=admin_password
   ```
2. Lancez l'API et connectez-vous avec `amine@procura.dz` et le mot de passe `Password123!` depuis le portail de connexion.
3. L'authentification interroge le LDAP local, valide la concordance du mot de passe, et crée/synchronise automatiquement sa fiche utilisateur PostgreSQL locale en lui attribuant le bon rôle RBAC selon son département AD !
