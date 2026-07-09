# 🔐 Guide de Déploiement Sécurité & Infrastructure (Zone Arix)

Ce guide est destiné à **Arix** (Responsable Sécurité et Réseaux). Il explique pas à pas comment configurer et durcir l'infrastructure système et réseau de la plateforme **Procura** sur le serveur d'hébergement (la machine hôte).

---

## 🛠️ Étape 1 : Configuration du Pare-feu (UFW) sur la Machine Hôte

La machine hôte est le serveur Linux physique ou virtuel sur lequel tourne votre stack Docker.

### Pourquoi le faire ?

Par défaut, Docker contourne les règles de pare-feu UFW classiques de Linux et expose publiquement les ports mappés dans `docker-compose.yml` (comme `5432` pour Postgres ou `8200` pour Vault). Nous devons verrouiller cela.

### Procédure pas à pas :

1. Connectez-vous en SSH à votre serveur de production/pré-production.
2. Installez `ufw` s'il n'est pas présent :
   ```bash
   sudo apt update
   sudo apt install ufw
   ```
3. Définissez la politique par défaut pour bloquer tout trafic entrant et autoriser tout le trafic sortant :
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   ```
4. Autorisez le port SSH (généralement 22, ou le port personnalisé de votre serveur) pour ne pas perdre la connexion :
   ```bash
   sudo ufw allow 22/tcp
   ```
5. Autorisez uniquement les ports HTTP/HTTPS publics (qui seront gérés par Nginx) :
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```
6. Activez le pare-feu :
   ```bash
   sudo ufw enable
   ```
7. **Important (Correction du contournement Docker/UFW)** :
   Pour éviter que Docker ne passe outre UFW, ouvrez le fichier `/etc/docker/daemon.json` (créez-le s'il n'existe pas) et ajoutez :
   ```json
   {
     "iptables": false
   }
   ```
   Puis redémarrez Docker :
   ```bash
   sudo systemctl restart docker
   ```

---

## 🌐 Étape 2 : Sécurisation Réseau Docker-Compose (Isolation LAN)

### Pourquoi le faire ?

Actuellement, votre fichier `docker-compose.yml` mappe des ports comme `"5432:5432"` directement sur l'hôte. N'importe qui sur le réseau local ou public pourrait tenter de forcer l'accès à la base de données.

### Procédure pas à pas :

Modifiez le fichier `infra/docker-compose.yml` pour :

1. **Supprimer les ports publics** des services sensibles (Postgres, Redis, Vault, RabbitMQ, MinIO).
2. **Utiliser `expose`** à la place de `ports`. Les ports déclarés sous `expose` sont accessibles _uniquement_ par les autres conteneurs reliés au même réseau virtuel Docker, et restent invisibles de l'extérieur.

#### Exemple de modification pour PostgreSQL :

```yaml
postgres:
  image: postgres:17-alpine
  container_name: procura-postgres
  # AVANT :
  # ports:
  #   - "5432:5432"
  # APRÈS (Sécurisé) :
  expose:
    - "5432"
  networks:
    - procura-lan
```

Effectuez cette même modification pour `redis` (port `6379`), `vault` (port `8200`), et `rabbitmq` (ports `5672`, `15672`). Seul le service **Nginx** doit garder un mappage `ports` public (`"80:80"`, `"443:443"`) pour servir de point d'entrée unique.

---

## 🔑 Étape 3 : Initialisation pas à pas de Vault en Production

### Pourquoi le faire ?

En mode développement (`-dev`), Vault conserve ses secrets en mémoire vive (perdus à chaque redémarrage) et utilise des clés d'unseal par défaut non sécurisées. En production, Vault doit être configuré pour persister ses clés et être "scellé" au démarrage.

### Procédure pas à pas :

1. Dans `infra/docker-compose.yml`, assurez-vous que Vault démarre avec une configuration persistante (par exemple avec le stockage `file` ou `raft`) au lieu du flag de développement.
2. Démarrez les conteneurs :
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```
3. Entrez dans le conteneur Vault :
   ```bash
   docker exec -it procura-vault sh
   ```
4. Initialisez l'instance Vault (cette commande génère 5 clés d'unseal et 1 Root Token de production) :
   ```bash
   vault operator init -key-shares=5 -key-threshold=3
   ```
   > ⚠️ **Sauvegardez précieusement et de façon chiffrée les clés d'unseal et le Root Token générés.**
5. Déverrouillez (unseal) le coffre-fort en exécutant la commande suivante 3 fois avec 3 clés différentes :
   ```bash
   vault operator unseal [Clé-1]
   vault operator unseal [Clé-2]
   vault operator unseal [Clé-3]
   ```
6. Connectez-vous avec le Root Token :
   ```bash
   vault login [Votre-Root-Token]
   ```
7. Activez le moteur de stockage KV de version 2 pour Procura :
   ```bash
   vault secrets enable -path=procura kv-v2
   ```
8. Enregistrez les informations secrètes d'accès :
   ```bash
   vault kv put procura/database url="postgresql://procura:procura_prod_password@procura-postgres:5432/procura"
   vault kv put procura/jwt secret="GENERER_ICI_UNE_CLE_DE_64_CARACTERES_ALEATOIRES"
   ```

---

## 📁 Étape 4 : Chiffrement PostgreSQL (TDE) & Object Storage MinIO

### 1. Chiffrement de PostgreSQL (au repos)

Puisque PostgreSQL ne possède pas de module de chiffrement transparent (TDE) natif gratuit, la recommandation standard de production est de chiffrer la partition disque contenant les données sur l'hôte :

1. Utilisez **LUKS** (Linux Unified Key Setup) sur la machine hôte pour créer un volume chiffré sur le disque dur.
2. Montez ce volume sur `/var/lib/postgresql/data` (ou le dossier où vous stockez les volumes Docker de Postgres).
3. configurez Docker pour utiliser ce chemin comme volume persistant. De cette manière, si le disque physique est volé, les données restent totalement illisibles.

### 2. Chiffrement de MinIO

Activez le chiffrement automatique SSE-S3 sur MinIO pour chiffrer tous les documents téléversés par les fournisseurs :

1. Dans la console d'administration MinIO (accessible via Nginx de manière sécurisée), allez dans l'onglet **Buckets**.
2. Sélectionnez le bucket contenant les offres soumises (ex: `submissions`).
3. Cochez l'option **Encryption** (Chiffrement) et choisissez le mode **SSE-S3**.

---

## 👥 Étape 5 : Configurer un Serveur LDAP de Test en Local

Pour valider l'authentification Active Directory développée par Sofiane sans utiliser le serveur de production, vous pouvez installer un serveur OpenLDAP léger sous Docker.

### Procédure pas à pas :

1. Ajoutez le service suivant dans un fichier `docker-compose.ldap.yml` dans votre dossier `infra/` :
   ```yaml
   version: "3.8"
   services:
     openldap:
       image: osixia/openldap:1.5.0
       container_name: procura-ldap
       ports:
         - "389:389"
         - "636:636"
       environment:
         LDAP_ORGANISATION: "Procura"
         LDAP_DOMAIN: "procura.dz"
         LDAP_ADMIN_PASSWORD: "admin_password"
         LDAP_CONFIG_PASSWORD: "config_password"
       volumes:
         - procura-ldap-data:/var/lib/ldap
         - procura-ldap-config:/etc/ldap/slapd.d
       networks:
         - procura-lan

   volumes:
     procura-ldap-data:
     procura-ldap-config:

   networks:
     procura-lan:
       external: true
       name: procura-lan
   ```
2. Démarrez-le :
   ```bash
   docker compose -f infra/docker-compose.ldap.yml up -d
   ```
3. Vos variables de configuration dans l'application Fastify pour ce serveur de test seront :
   - `LDAP_URL` : `ldap://localhost:389` (ou `ldaps://localhost:636`)
   - `LDAP_BIND_DN` : `cn=admin,dc=procura,dc=dz`
   - `LDAP_BIND_PASSWORD` : `admin_password`
