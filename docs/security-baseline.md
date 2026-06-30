# Baseline Securite

Ce socle suit les exigences du cahier des charges: Zero Trust, defense in depth, OWASP, ISO 27001, Loi 18-07, Loi 23-12 et auditabilite forte.

## Controles Implantes Des Le Depart

- Validation stricte des variables d'environnement.
- Headers HTTP de securite.
- CORS restrictif par origine connue.
- Rate limiting sur l'API.
- RBAC centralise dans `packages/shared`.
- Guard backend obligatoire pour chaque action sensible.
- Journal d'audit hash-chain avec `previousHash` et `entryHash`.
- Identifiants UUID pour les objets metier.
- Statuts RFQ explicites et transitions controlees.

## Controles A Ajouter Avant Production

- JWT asymetrique signe avec cle stockee dans Vault/HSM.
- mTLS entre reverse proxy DMZ, API LAN et connecteurs ERP.
- Antivirus/sandbox fichiers avant scellage.
- Horodatage RFC 3161.
- Object storage compatible WORM.
- Chiffrement au repos PostgreSQL et MinIO.
- SIEM Wazuh/ELK avec alertes.
- SAST, DAST, dependency scanning, secret scanning et SBOM en CI.
- Tests d'intrusion avant mise en production.

## Principe Important

Aucune interface front-end ne fait autorite sur les permissions. L'UI cache ou desactive les actions non autorisees pour l'ergonomie, mais l'API revalide toujours le role, les permissions, le statut du dossier et la zone d'origine.
