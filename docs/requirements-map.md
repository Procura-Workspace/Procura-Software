# Mapping Cahier Des Charges

Source lue: `PROCURA_Cahier_des_Charges_Officiel_v1.0.docx`.

## Synthese Produit

Procura couvre le cycle Source-to-Contract: expression du besoin, validation interne, RFQ, selection fournisseurs depuis ERP, publication, depot securise, verrouillage deadline, ouverture des plis, commission, analyse, PV, output final, transmission ERP, archivage legal et supervision.

## Roles Principaux

- Demandeur: cree et suit les besoins.
- Acheteur: valide, cree les RFQ, publie, analyse, lance l'export ERP.
- Fournisseur: consulte les RFQ invitees et depose les offres.
- Commission: ouvre les plis, saisit decisions, genere le PV.
- Administrateur: gere utilisateurs, roles, workflows, parametrage et connecteurs.
- Auditeur: consulte les journaux et preuves sans modification.
- ERP: expose referentiels en lecture seule et recoit l'output final.

## Modules Cibles

1. Architecture generale et deploiement.
2. Gestion utilisateurs et acces.
3. Expression du besoin.
4. Referentiel fournisseur.
5. Lancement RFQ et publication.
6. Portail fournisseur DMZ.
7. Depot securise des offres.
8. Horodatage et preuve legale.
9. Deadlines et verrouillage.
10. Audit et tracabilite.
11. Ouverture des plis.
12. Commission d'ouverture.
13. Analyse et structuration.
14. Generation output final.
15. Integration ERP.
16. Communication collaborative.
17. Notifications.
18. Administration.
19. Securite globale.
20. Archivage legal.
21. Monitoring et exploitation.
22. Documentation et support.

## Decisions Initiales

- On-premise only, pas de cloud public pour les donnees metier.
- Separation logique des zones Internet, DMZ, LAN Procura, ERP et Administration.
- RBAC applique cote API a chaque requete, pas seulement dans l'UI.
- Audit append-only avec chainage cryptographique des evenements.
- Les offres et documents sont stockes hors base relationnelle dans un object storage chiffre.
- Le referentiel fournisseur reste maitre dans l'ERP, Procura le consomme en lecture seule.
