# Security Policy

Procura manipule des donnees achat sensibles et doit etre traite comme un systeme critique.

## Regles Pour Le Developpement

- Toute action sensible doit passer par un controle RBAC backend.
- Toute mutation metier doit produire un evenement d'audit.
- Les secrets ne sont jamais commites. Utiliser `.env.example` comme contrat seulement.
- Les donnees fournisseur restent referencees depuis l'ERP; Procura ne devient pas maitre du referentiel.
- Les uploads doivent passer par antivirus, sandbox, hash SHA-256, scellement et stockage chiffre avant exploitation.

## Avant Production

- Activer JWT asymetrique avec rotation de cles.
- Remplacer le stockage audit memoire par PostgreSQL append-only + retention.
- Brancher Vault/HSM pour les secrets, signatures et preuves.
- Activer mTLS inter-services.
- Ajouter SAST, DAST, scan dependances, secret scanning et SBOM dans la CI.
- Executer un pentest complet et une revue de configuration on-premise.
