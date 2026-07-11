# 🔐 Configuration de HashiCorp Vault pour le Développement

Ce guide explique comment stocker et alimenter les secrets de l'application **Procura** dans HashiCorp Vault lors du développement local.

---

## 🛠️ Étape 1 : Initialiser et se connecter à Vault en Dev

Dans notre environnement de développement local, Vault tourne en conteneur Docker sous le nom `procura-vault`.

1. **Vérifier l'état de Vault** :
   Le conteneur démarre automatiquement via le fichier `docker-compose.yml` avec le Root Token par défaut `root-token`.
2. **Exporter les variables d'environnement de Vault** sur votre machine hôte (ou utilisez la console d'administration sur `http://localhost:8200`) :
   ```bash
   export VAULT_ADDR='http://localhost:8200'
   export VAULT_TOKEN='root-token'
   ```

---

## 🔑 Étape 2 : Créer le moteur KV v2 et peupler les secrets

Exécutez les commandes suivantes dans votre terminal ou à l'intérieur du conteneur Docker de Vault (`docker exec -it procura-vault sh`) :

1. **Activer le moteur de stockage KV de version 2** sur le chemin `procura` (si ce n'est pas déjà fait) :

   ```bash
   vault secrets enable -path=procura kv-v2
   ```

2. **Insérer les secrets critiques de développement** requis au démarrage :

   ```bash
   vault kv put procura/secrets \
     database_url="postgresql://procura:procura_dev_password@procura-postgres:5432/procura" \
     jwt_secret="development-only-secret-key-must-be-very-long-and-random-32chars" \
     audit_hash_pepper="audit-pepper-development-local-salt"
   ```

3. **Vérifier l'insertion des secrets** :
   ```bash
   vault kv get procura/secrets
   ```

---

## 🚀 Étape 3 : Démarrer Procura API en mode Vault

1. Modifiez votre fichier `.env` à la racine de Procura pour y configurer l'accès à Vault :
   ```env
   VAULT_ADDR=http://localhost:8200
   VAULT_TOKEN=root-token
   ```
2. Supprimez ou commentez les variables de secrets directs dans votre `.env` pour valider que l'API lit bien depuis Vault :
   ```env
   # JWT_SECRET=
   # DATABASE_URL=
   # AUDIT_HASH_PEPPER=
   ```
3. Lancez le serveur :
   ```bash
   pnpm dev
   ```
   L'API affiche alors la ligne de chargement suivante confirmant le succès de la récupération :
   `Successfully loaded credentials from HashiCorp Vault.`
