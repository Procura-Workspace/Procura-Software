# PROCURA — Diagrammes Mermaid Complets
## Cahier des Charges Officiel v1.0 — Plateforme Source-to-Contract On-Premise

> Ce fichier regroupe **tous les diagrammes techniques et fonctionnels** extraits du cahier des charges, modélisés en syntaxe **Mermaid** pour visualisation sur GitHub, GitLab, VS Code ou tout renderer compatible Mermaid.

---

## 📑 Table des Diagrammes

| # | Nom | Type Mermaid |
|---|-----|-------------|
| 1 | Architecture Globale — Zones Réseau | `flowchart` |
| 2 | Workflow Métier Global (9 étapes) | `flowchart` |
| 3 | Cas d'Utilisation — Vue Globale | `flowchart` |
| 4 | Use Cases Détaillés par Acteur | `flowchart` |
| 5 | Diagramme de Séquence — Création & Publication RFQ | `sequenceDiagram` |
| 6 | Diagramme de Séquence — Dépôt d'Offre Fournisseur | `sequenceDiagram` |
| 7 | Diagramme de Séquence — Ouverture des Plis (Commission) | `sequenceDiagram` |
| 8 | Diagramme de Séquence — Transmission ERP | `sequenceDiagram` |
| 9 | Diagramme de Classes — Modèle de Données | `classDiagram` |
| 10 | Diagramme d'Activité — Cycle Source-to-Contract | `flowchart` |
| 11 | Architecture de Déploiement (Docker / K8s On-Premise) | `flowchart` |
| 12 | Architecture de Sécurité (Zero Trust, PKI, HSM) | `flowchart` |
| 13 | Architecture des Données (PostgreSQL, MinIO, WORM, Redis) | `flowchart` |
| 14 | Architecture du Coffre-Fort Numérique | `flowchart` |
| 15 | Architecture Monitoring (Prometheus, Grafana, ELK, Wazuh) | `flowchart` |
| 16 | Architecture Intégration ERP | `flowchart` |
| 17 | Flux de Traitement des Offres (Dépôt → Scellage → LAN) | `flowchart` |
| 18 | Matrice RBAC — Rôles & Permissions | `flowchart` |
| 19 | Diagramme d'État — Cycle de Vie d'une RFQ | `stateDiagram-v2` |
| 20 | Diagramme d'État — Cycle de Vie d'une Offre | `stateDiagram-v2` |
| 21 | Roadmap MVP → V3 (Gantt) | `gantt` |
| 22 | Diagramme de Gouvernance (RACI) | `flowchart` |
| 23 | Cartographie des 22 Modules | `flowchart` |
| 24 | Flux de Communication Inter-Zones | `flowchart` |

---

## 1️⃣ Architecture Globale — Zones Réseau

```mermaid
flowchart TB
    subgraph INTERNET["🌐 ZONE INTERNET (Non fiable)"]
        F1[👤 Fournisseur 1]
        F2[👤 Fournisseur 2]
        F3[👤 Fournisseur N]
    end

    subgraph DMZ["🛡️ ZONE DMZ (Démilitarisée)"]
        RP[Reverse Proxy<br/>Nginx + WAF]
        SCAN[Module Scan<br/>Antivirus + Sandbox]
        DEPOT[Coffre-Fort<br/>Quarantaine chiffrée]
        PORTAL[Portail Fournisseur<br/>React.js]
        SANDBOX[Sandbox<br/>Analyse dynamique]
    end

    subgraph LAN_PROCURA["🏢 ZONE LAN PROCURA (Interne)"]
        APP[Serveur Applicatif<br/>Node.js / TypeScript]
        API[API Gateway<br/>REST + mTLS]
        MODULES[22 Modules<br/>Métier]
        DB[(PostgreSQL<br/>TDE Chiffré)]
        CACHE[(Redis<br/>Cache)]
        QUEUE{{RabbitMQ<br/>File d'attente}}
    end

    subgraph LAN_ERP["💼 ZONE LAN ERP"]
        ERP[(ERP Client<br/>SAP / Oracle / Sage<br/>Dynamics / Propre)]
        APICONN[Connecteur ERP<br/>mTLS]
    end

    subgraph LAN_ADMIN["🔐 ZONE LAN ADMINISTRATION"]
        AD[Active Directory<br/>LDAP / Keycloak]
        PKI[PKI Interne<br/>CA Racine + Intermédiaire]
        HSM[HSM<br/>Signatures matérielles]
        VAULT[HashiCorp Vault<br/>Secrets]
        SIEM[SIEM<br/>Wazuh / ELK]
        NTP[Serveur NTP<br/>Horodatage RFC 3161]
    end

    F1 & F2 & F3 -->|HTTPS TLS 1.3| RP
    RP -->|Filtrage WAF| PORTAL
    PORTAL --> DEPOT
    DEPOT --> SCAN
    SCAN --> SANDBOX
    SCAN -->|Pull sécurisé| API
    API --> APP
    APP --> MODULES
    MODULES --> DB
    MODULES --> CACHE
    MODULES --> QUEUE
    QUEUE --> APICONN
    APICONN --> ERP

    APP <-->|mTLS / SAML| AD
    APP <-->|Signature| HSM
    APP <-->|Secrets| VAULT
    APP <-->|Logs audit| SIEM
    APP <-->|Timestamp| NTP
    APP <-->|Certificats| PKI

    style INTERNET fill:#ffe5e5,stroke:#cc0000
    style DMZ fill:#fff4e5,stroke:#ff8800
    style LAN_PROCURA fill:#e5f5ff,stroke:#0066cc
    style LAN_ERP fill:#e5ffe5,stroke:#009933
    style LAN_ADMIN fill:#f0e5ff,stroke:#6600cc
```

---

## 2️⃣ Workflow Métier Global (9 étapes)

```mermaid
flowchart LR
    E1[1️⃣ Expression<br/>du Besoin<br/>Portail Interne] -->|Validation<br/>multi-niveaux| E2[2️⃣ Validation<br/>Interne<br/>Manager/Achat/Finance]
    E2 -->|Besoin validé| E3[3️⃣ Création RFQ<br/>Acheteur<br/>+ Sélection fournisseurs ERP]
    E3 -->|Scellage HSM<br/>Hash + Signature| E4[4️⃣ Publication<br/>LAN → DMZ<br/>Coffre-fort]
    E4 -->|Invitation email<br/>Lien unique| E5[5️⃣ Réception Offres<br/>Fournisseurs<br/>Portail DMZ]
    E5 -->|Deadline atteinte| E6[6️⃣ Ouverture des Plis<br/>Commission<br/>Authentification MFA]
    E6 -->|Plis déverrouillés| E7[7️⃣ Commission<br/>Décisions + PV<br/>numérique signé]
    E7 -->|Output validé| E8[8️⃣ Génération<br/>Output Final<br/>JSON/XML/CSV normalisé]
    E8 -->|Transmission mTLS| E9[9️⃣ Transmission ERP<br/>Connecteur<br/>File d'attente]

    style E1 fill:#e3f2fd
    style E2 fill:#e3f2fd
    style E3 fill:#fff3e0
    style E4 fill:#fff3e0
    style E5 fill:#fce4ec
    style E6 fill:#f3e5f5
    style E7 fill:#f3e5f5
    style E8 fill:#e8f5e9
    style E9 fill:#e8f5e9
```

---

## 3️⃣ Cas d'Utilisation — Vue Globale

```mermaid
flowchart TB
    subgraph ACTEURS["👥 Acteurs"]
        ACH[Acheteur]
        DEM[Demandeur]
        FOU[Fournisseur]
        COM[Commission]
        ADM[Administrateur]
        ERP[ERP Client]
    end

    subgraph UC_ACH["📦 Use Cases Acheteur"]
        UC1[Consulter dashboard RFQ]
        UC2[Créer RFQ depuis besoin]
        UC3[Sélectionner fournisseurs ERP]
        UC4[Paramétrer dates & critères]
        UC5[Jointre documents]
        UC6[Valider & publier RFQ]
        UC7[Suivre invitations]
        UC8[Consulter offres après ouverture]
        UC9[Exporter comparatifs]
        UC10[Transmettre ERP]
    end

    subgraph UC_DEM["📋 Use Cases Demandeur"]
        UC11[Créer expression besoin]
        UC12[Renseigner formulaire structuré]
        UC13[Jointre docs techniques]
        UC14[Soumettre pour validation]
        UC15[Suivre état demande]
        UC16[Consulter décision]
    end

    subgraph UC_FOU["📨 Use Cases Fournisseur"]
        UC17[Recevoir invitation email]
        UC18[S'authentifier MFA/mTLS]
        UC19[Consulter documents RFQ]
        UC20[Déposer offre PDF/CSV/JPEG]
        UC21[Accusé réception horodaté]
        UC22[Suivre soumission]
        UC23[Ticket post-décision]
    end

    subgraph UC_COM["⚖️ Use Cases Commission"]
        UC24[S'authentifier MFA]
        UC25[Vérifier conditions ouverture]
        UC26[Initier ouverture officielle]
        UC27[Consulter offres déverrouillées]
        UC28[Saisir observations/décisions]
        UC29[Valider PV numérique]
        UC30[Archiver séance]
    end

    subgraph UC_ADM["🔧 Use Cases Administrateur"]
        UC31[Gérer utilisateurs & rôles]
        UC32[Configurer workflows]
        UC33[Paramétrer délais]
        UC34[Superviser services]
        UC35[Gérer templates notification]
        UC36[Administrer connecteurs ERP]
        UC37[Exporter journaux audit]
        UC38[Gérer certificats PKI]
    end

    ACH --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC7 & UC8 & UC9 & UC10
    DEM --> UC11 & UC12 & UC13 & UC14 & UC15 & UC16
    FOU --> UC17 & UC18 & UC19 & UC20 & UC21 & UC22 & UC23
    COM --> UC24 & UC25 & UC26 & UC27 & UC28 & UC29 & UC30
    ADM --> UC31 & UC32 & UC33 & UC34 & UC35 & UC36 & UC37 & UC38
    ERP -.->|Réception| UC10

    style ACTEORS fill:#fff9c4
```

---

## 4️⃣ Use Cases Détaillés par Acteur (Vue agrégée)

```mermaid
flowchart LR
    subgraph SYSTEM["🖥️ Système PROCURA"]
        UC_AUTH((Authentification<br/>IAM + MFA))
        UC_RFQ((Gestion RFQ))
        UC_OFFRE((Gestion Offres))
        UC_COMM((Commission))
        UC_AUDIT((Audit & Logs))
        UC_NOTIF((Notifications))
        UC_INT((Intégration ERP))
        UC_ADMIN((Administration))
    end

    ACH[👤 Acheteur] -->|10 cas| UC_RFQ
    ACH --> UC_AUTH
    DEM[👤 Demandeur] -->|6 cas| UC_RFQ
    DEM --> UC_AUTH
    FOU[🏢 Fournisseur] -->|7 cas| UC_OFFRE
    FOU --> UC_AUTH
    COM[⚖️ Commission] -->|7 cas| UC_COMM
    COM --> UC_AUTH
    ADM[🔧 Admin] -->|8 cas| UC_ADMIN
    ADM --> UC_AUDIT
    ERP[(💼 ERP)] --> UC_INT

    UC_RFQ --> UC_NOTIF
    UC_OFFRE --> UC_NOTIF
    UC_COMM --> UC_NOTIF
    UC_RFQ --> UC_AUDIT
    UC_OFFRE --> UC_AUDIT
    UC_COMM --> UC_AUDIT
    UC_COMM --> UC_INT
```

---

## 5️⃣ Diagramme de Séquence — Création & Publication RFQ

```mermaid
sequenceDiagram
    autonumber
    actor Acheteur
    participant UI as Portail Interne<br/>(React)
    participant API as API Gateway<br/>(Node.js)
    participant IAM as Active Directory<br/>(IAM)
    participant RFQ as Module RFQ
    participant ERP as Référentiel<br/>ERP
    participant HSM as HSM<br/>(Signature)
    participant NTP as Serveur NTP<br/>(RFC 3161)
    participant DMZ as Portail<br/>Fournisseur (DMZ)
    participant SIEM as SIEM<br/>(Audit)
    actor Fournisseur

    Acheteur->>UI: S'authentifier (SSO + MFA)
    UI->>IAM: Vérification identité & rôles
    IAM-->>UI: Token + rôles (RBAC)
    Acheteur->>UI: Créer brouillon RFQ
    UI->>API: POST /rfq (brouillon)
    API->>RFQ: Validation structure
    Acheteur->>UI: Sélectionner fournisseurs
    UI->>API: GET /suppliers (référentiel ERP)
    API->>ERP: Appel API lecture seule
    ERP-->>API: Liste fournisseurs
    API-->>UI: Fournisseurs éligibles
    Acheteur->>UI: Soumettre RFQ pour publication
    UI->>API: POST /rfq/publish
    API->>RFQ: Validation finale + scellage
    RFQ->>HSM: Demande signature (hash RFQ)
    HSM-->>RFQ: Signature + certificat
    RFQ->>NTP: Horodatage RFC 3161
    NTP-->>RFQ: Timestamp officiel
    RFQ->>SIEM: Log événement "RFQ publiée"
    RFQ->>DMZ: Push RFQ (lecture seule)
    DMZ->>Fournisseur: Email invitation (lien unique)
    API-->>UI: Confirmation publication
    UI-->>Acheteur: ✅ RFQ publiée — RFQ-2024-087
```

---

## 6️⃣ Diagramme de Séquence — Dépôt d'Offre Fournisseur

```mermaid
sequenceDiagram
    autonumber
    actor Fournisseur
    participant Email as Système Email<br/>(SMTP)
    participant DMZ_Portal as Portail DMZ<br/>(Nginx + WAF)
    participant Auth as Authentification<br/>(MFA / mTLS)
    participant Depot as Module Dépôt<br/>Sécurisé
    participant Quarantine as Quarantaine<br/>chiffrée (DMZ)
    participant AV as Antivirus<br/>(ClamAV)
    participant Sandbox as Sandbox<br/>Analyse dynamique
    participant HSM as HSM
    participant NTP as NTP / RFC 3161
    participant LAN_Pull as Pull sécurisé<br/>(LAN)
    participant SIEM as SIEM

    Fournisseur->>Email: Reçoit invitation RFQ
    Email->>Fournisseur: Lien unique traçable
    Fournisseur->>DMZ_Portal: Accès portail (HTTPS TLS 1.3)
    DMZ_Portal->>Auth: Vérification identité + MFA/mTLS
    Auth-->>DMZ_Portal: Authentification OK
    Fournisseur->>Depot: Dépôt offre (PDF/CSV/JPEG)
    Depot->>Depot: Vérif extension, MIME, magic bytes
    Depot->>Quarantine: Stockage chiffré AES-256
    Depot->>AV: Scan antivirus multi-moteur
    AV-->>Depot: Verdict: CLEAN / SUSPICIOUS / MALICIOUS
    alt CLEAN
        Depot->>Sandbox: Analyse dynamique en VM isolée
        Sandbox-->>Depot: Rapport comportement
        Depot->>HSM: Calcul SHA-256 + signature
        Depot->>NTP: Horodatage RFC 3161
        Depot->>SIEM: Log "offre scellée"
        Depot->>LAN_Pull: Pull sécurisé vers LAN
        LAN_Pull-->>Depot: ACK + vérif intégrité
        Depot-->>Fournisseur: ✅ Accusé réception signé
    else SUSPICIOUS
        Depot->>SIEM: Alerte SOC — Revue sécurité
    else MALICIOUS
        Depot->>SIEM: 🚨 Isolement + Alerte CRITIQUE
    end
```

---

## 7️⃣ Diagramme de Séquence — Ouverture des Plis (Commission)

```mermaid
sequenceDiagram
    autonumber
    actor Président as 👨‍⚖️ Président
    actor Membre1 as 👤 Membre 1
    actor Membre2 as 👤 Membre 2
    participant IAM as IAM (RBAC)
    participant Verify as Module Vérification<br/>Conditions
    participant Open as Module Ouverture<br/>Numérique
    participant Coffre as Coffre-fort<br/>(LAN)
    participant HSM as HSM
    participant PV as Module Commission<br/>(PV numérique)
    participant Output as Module Output<br/>Final
    participant SIEM as SIEM

    Président->>IAM: Authentification MFA
    Membre1->>IAM: Authentification MFA
    Membre2->>IAM: Authentification MFA
    IAM-->>Présédent: Rôles validés (COMMISSION_PRESIDENT)
    IAM-->>Membre1: Rôles validés (COMMISSION_MEMBER)
    IAM-->>Membre2: Rôles validés (COMMISSION_MEMBER)

    Président->>Verify: Demande ouverture RFQ-2024-087
    Verify->>Verify: Check deadline dépassée ?
    Verify->>Verify: Check prolongation active ?
    Verify->>Verify: Check état RFQ = scellée ?
    alt Conditions OK
        Verify-->>Open: ✅ Conditions validées
        Président->>Open: Initier ouverture officielle
        Open->>SIEM: Log "ouverture initiée"
        Open->>Coffre: Déverrouillage logique (1-shot)
        Coffre->>HSM: Vérification signatures + horodatages
        Coffre-->>Open: Offres déchiffrées (lecture seule)
        Open-->>Membre1: Affichage simultané des offres
        Open-->>Membre2: Affichage simultané des offres
        Open-->>Présédent: Affichage simultané des offres
        Membre1->>PV: Saisie observations
        Membre2->>PV: Saisie observations
        Président->>PV: Saisie décisions finales
        Président->>PV: Validation PV + signature
        PV->>HSM: Signature électronique PV
        PV->>SIEM: Log "PV validé"
        PV-->>Output: Transmission données validées
    else Conditions KO
        Verify-->>Présédent: ❌ Ouverture impossible
    end
```

---

## 8️⃣ Diagramme de Séquence — Transmission ERP

```mermaid
sequenceDiagram
    autonumber
    participant Output as Module Output<br/>Final
    participant Normalize as Normaliseur<br/>(UTF-8, formats)
    participant Validator as Validateur<br/>Cohérence
    participant Queue as RabbitMQ<br/>(File persistante)
    participant Connector as Connecteur ERP<br/>(mTLS)
    participant ERP as ERP Client
    participant SIEM as SIEM
    participant HSM as HSM

    Output->>Normalize: Données PV + offres retenues
    Normalize->>Validator: Données normalisées
    Validator->>Validator: Check champs obligatoires
    Validator->>Validator: Check unicité fournisseur
    Validator->>Validator: Check cohérence montants
    Validator->>HSM: Calcul SHA-256 output
    HSM-->>Validator: Hash + identifiant export
    Validator->>Queue: Enqueue export (JSON/XML/CSV)
    Queue->>Connector: Consommation message
    Connector->>ERP: POST/PUT API (TLS 1.3 + mTLS)
    alt ERP Disponible
        ERP-->>Connector: ACK + ID document
        Connector->>SIEM: Log "transmission réussie"
        Connector-->>Output: ✅ Statut = SUCCESS
    else ERP Indisponible
        ERP-->>Connector: Erreur / timeout
        Connector->>Queue: Retry avec backoff exponentiel
        Connector->>SIEM: Log "échec transmission"
    end
```

---

## 9️⃣ Diagramme de Classes — Modèle de Données

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String fullName
        +Enum role
        +UUID departmentId
        +Boolean mfaEnabled
        +DateTime createdAt
        +DateTime lastLogin
    }

    class Department {
        +UUID id
        +String name
        +UUID managerId
        +String code
    }

    class NeedExpression {
        +UUID id
        +String reference
        +UUID requesterId
        +UUID departmentId
        +String description
        +Decimal budgetEstimate
        +Enum status
        +String justification
        +DateTime submittedAt
        +DateTime validatedAt
        +UUID validatorId
        +Integer version
    }

    class RFQ {
        +UUID id
        +String rfqCode
        +UUID needId
        +UUID buyerId
        +DateTime publicationDate
        +DateTime deadline
        +String timezone
        +Enum status
        +String hashSHA256
        +String hsmSignature
        +DateTime rfc3161Timestamp
        +UUID sealedBy
        +String[] allowedFormats
    }

    class RFQDocument {
        +UUID id
        +UUID rfqId
        +String filename
        +String mimeType
        +String hashSHA256
        +String storagePath
        +Integer version
        +DateTime uploadedAt
    }

    class Supplier {
        +String erpId
        +String name
        +Enum category
        +Enum status
        +String contactEmail
        +String address
        +String taxId
    }

    class RFQSupplier {
        +UUID id
        +UUID rfqId
        +String supplierErpId
        +DateTime invitedAt
        +Boolean hasResponded
    }

    class Submission {
        +UUID id
        +UUID rfqId
        +String supplierErpId
        +String filename
        +String mimeType
        +Decimal sizeBytes
        +String hashSHA256
        +String hsmSignature
        +DateTime rfc3161Timestamp
        +Enum status
        +Enum avVerdict
        +DateTime submittedAt
        +Boolean opened
    }

    class OpeningSession {
        +UUID id
        +UUID rfqId
        +DateTime openedAt
        +UUID presidentId
        +Enum status
    }

    class CommissionMember {
        +UUID id
        +UUID sessionId
        +UUID userId
        +Enum role
        +Boolean attended
    }

    class CommissionDecision {
        +UUID id
        +UUID sessionId
        +String supplierErpId
        +Enum decision
        +String motives
        +String observations
    }

    class ProcessVerbal {
        +UUID id
        +UUID sessionId
        +String pvNumber
        +String pdfPath
        +String hashSHA256
        +String hsmSignature
        +DateTime signedAt
        +UUID signedBy
    }

    class FinalOutput {
        +UUID id
        +UUID rfqId
        +String exportId
        +String format
        +String filePath
        +String hashSHA256
        +Enum status
        +DateTime transmittedAt
    }

    class AuditLog {
        +UUID id
        +UUID userId
        +String action
        +String module
        +DateTime timestamp
        +String ipAddress
        +String sessionId
        +String hashChain
        +Boolean immutable
    }

    class LegalProof {
        +UUID id
        +UUID documentId
        +String documentType
        +String hashSHA256
        +DateTime rfc3161Timestamp
        +String hsmSignature
        +UUID certId
    }

    class Notification {
        +UUID id
        +UUID userId
        +Enum type
        +String template
        +String payload
        +Enum status
        +DateTime sentAt
    }

    class Ticket {
        +UUID id
        +UUID rfqId
        +UUID createdBy
        +Enum category
        +Enum status
        +Enum priority
        +DateTime createdAt
        +DateTime closedAt
    }

    User "1" --> "0..*" NeedExpression : requester
    User "1" --> "0..*" NeedExpression : validator
    Department "1" --> "0..*" User : employs
    Department "1" --> "0..*" NeedExpression : originates
    NeedExpression "1" --> "0..1" RFQ : generates
    RFQ "1" --> "0..*" RFQDocument : contains
    RFQ "1" --> "0..*" RFQSupplier : invites
    RFQ "1" --> "0..*" Submission : receives
    Supplier "1" --> "0..*" RFQSupplier : participates
    Supplier "1" --> "0..*" Submission : submits
    RFQ "1" --> "0..1" OpeningSession : opens
    OpeningSession "1" --> "0..*" CommissionMember : includes
    OpeningSession "1" --> "0..*" CommissionDecision : records
    OpeningSession "1" --> "0..1" ProcessVerbal : produces
    RFQ "1" --> "0..1" FinalOutput : generates
    User "1" --> "0..*" AuditLog : performs
    Submission "1" --> "0..1" LegalProof : sealed
    RFQ "1" --> "0..1" LegalProof : sealed
    ProcessVerbal "1" --> "0..1" LegalProof : sealed
    FinalOutput "1" --> "0..1" LegalProof : sealed
    User "1" --> "0..*" Notification : receives
    RFQ "1" --> "0..*" Ticket : relates
```

---

## 🔟 Diagramme d'Activité — Cycle Source-to-Contract

```mermaid
flowchart TD
    START([🚀 Démarrage]) --> EB[Expression du Besoin<br/>par Demandeur]
    EB --> VALID1{Validation<br/>interne<br/>multi-niveaux}
    VALID1 -->|Refusé| REFUSE1[❌ Besoin refusé<br/>avec justification]
    REFUSE1 --> NOTIF1[Notification demandeur]
    VALID1 -->|Validé| CREATE_RFQ[Acheteur crée RFQ<br/>+ sélection fournisseurs ERP]

    CREATE_RFQ --> SEAL[Scellage RFQ<br/>Hash SHA-256<br/>Signature HSM<br/>Timestamp RFC 3161]
    SEAL --> PUBLISH[Publication LAN → DMZ<br/>en lecture seule]
    PUBLISH --> INVITE[📧 Invitations fournisseurs<br/>via email sécurisé]
    INVITE --> WAIT[⏳ Fenêtre de dépôt<br/>ouverte]

    WAIT --> DEPOT{Fournisseurs<br/>déposent offres}
    DEPOT -->|Hors délai| LATE[❌ Rejet automatique]
    DEPOT -->|Dans délai| QUARANT[Stockage quarantaine<br/>chiffrée DMZ]
    QUARANT --> SCAN[Scan AV + Sandbox]
    SCAN -->|MALICIOUS| ALERT_SOC[🚨 Alerte SOC<br/>Isolement]
    SCAN -->|CLEAN/SUSPICIOUS| SCELL_OFFRE[Scellage offre<br/>SHA-256 + HSM + RFC 3161]
    SCELL_OFFRE --> PULL[Pull sécurisé DMZ → LAN]

    PULL --> DEADLINE{Date limite<br/>atteinte ?}
    DEADLINE -->|Non| WAIT
    DEADLINE -->|Oui| VEROUILLAGE[Verrouillage automatique<br/>Portail fermé]
    VEROUILLAGE --> OUVERTURE{Commission<br/>initie ouverture}
    OUVERTURE -->|Conditions OK| DEVERR[Déverrouillage<br/>logique unique]
    OUVERTURE -->|Conditions KO| BLOCK[❌ Blocage]

    DEVERR --> CONSULTE[👥 Consultation<br/>simultanée offres<br/>en lecture seule]
    CONSULTE --> DECISIONS[Saisie décisions<br/>par Commission]
    DECISIONS --> PV[Génération PV<br/>numérique signé]
    PV --> OUTPUT[Génération Output Final<br/>JSON / XML / CSV normalisé]
    OUTPUT --> COHER[Contrôle cohérence<br/>+ Hash SHA-256]
    COHER --> TRANSMIT[📤 Transmission ERP<br/>via mTLS]
    TRANSMIT --> ACK{ERP ACK ?}
    ACK -->|Oui| SUCCESS([✅ Succès<br/>Dossier archivé WORM])
    ACK -->|Non| RETRY[🔄 Retry<br/>file persistante]
    RETRY --> TRANSMIT

    style START fill:#4caf50,color:#fff
    style SUCCESS fill:#4caf50,color:#fff
    style REFUSE1 fill:#f44336,color:#fff
    style BLOCK fill:#f44336,color:#fff
    style LATE fill:#ff9800,color:#fff
    style ALERT_SOC fill:#f44336,color:#fff
```

---

## 1️⃣1️⃣ Architecture de Déploiement (Docker / K8s On-Premise)

```mermaid
flowchart TB
    subgraph CLIENT_DC["🏢 Data Center Client (On-Premise)"]
        subgraph HARDENING["🔒 OS Hardening"]
            OS[OS durci<br/>CIS Benchmarks]
        end

        subgraph FW["🔥 Firewalls Inter-zones"]
            FW1[FW Internet ↔ DMZ]
            FW2[FW DMZ ↔ LAN]
            FW3[FW LAN ↔ ERP]
            FW4[FW LAN ↔ Admin]
        end

        subgraph DMZ_ZONE["🛡️ DMZ Cluster"]
            NGINX[Reverse Proxy<br/>Nginx + ModSecurity]
            WAF[WAF<br/>OWASP Rules]
            PORTAL_APP[Portail Fournisseur<br/>React Container]
            DEPOT_SVC[Service Dépôt Offres<br/>Node.js Container]
            SCAN_SVC[Service Scan/Sandbox<br/>ClamAV + Sandbox VM]
        end

        subgraph LAN_ZONE["🏢 LAN Procura Cluster"]
            API_GW[API Gateway<br/>Node.js + Express]
            AUTH_SVC[Service Auth<br/>IAM + MFA]
            RFQ_SVC[Service RFQ]
            COMMISSION_SVC[Service Commission]
            OUTPUT_SVC[Service Output ERP]
            NOTIF_SVC[Service Notifications]
            WORKER[Workers async<br/>BullMQ + Redis]
        end

        subgraph DATA["💾 Couche Données"]
            PG[(PostgreSQL 16<br/>TDE Chiffré)]
            MINIO[(MinIO S3<br/>SSE-C Chiffré)]
            REDIS[(Redis 7<br/>Cache + Queue)]
            RABBIT[{{RabbitMQ<br/>File persistante}}]
            WORM[(Archivage WORM<br/>MinIO Object Lock)]
        end

        subgraph ADMIN_ZONE["🔐 Zone Admin"]
            VAULT_SVC[HashiCorp Vault<br/>Secrets]
            HSM_SVC[HSM Physique<br/>PKCS#11]
            PKI_SVC[PKI Interne<br/>EJBCA]
            LDAP_SVC[Active Directory<br/>LDAPS]
            NTP_SVC[NTP Serveur<br/>Stratum 1]
            SIEM_SVC[SIEM<br/>Wazuh + ELK]
            SMTP_SVC[SMTP<br/>Postfix]
        end

        subgraph MONITOR["📊 Monitoring"]
            PROM[Prometheus]
            GRAF[Grafana]
            LOKI[Loki]
            ALERT[Alertmanager]
        end

        OS --> FW
        FW1 --> NGINX
        FW1 --> WAF
        NGINX --> PORTAL_APP
        WAF --> DEPOT_SVC
        DEPOT_SVC --> SCAN_SVC

        FW2 --> API_GW
        API_GW --> AUTH_SVC
        API_GW --> RFQ_SVC
        API_GW --> COMMISSION_SVC
        API_GW --> OUTPUT_SVC
        API_GW --> NOTIF_SVC
        RFQ_SVC --> WORKER

        API_GW --> PG
        API_GW --> MINIO
        API_GW --> REDIS
        WORKER --> RABBIT
        MINIO --> WORM

        FW3 -.-> ERP[(ERP Client)]
        FW4 --> VAULT_SVC
        FW4 --> HSM_SVC
        FW4 --> PKI_SVC
        FW4 --> LDAP_SVC
        FW4 --> NTP_SVC
        FW4 --> SIEM_SVC
        FW4 --> SMTP_SVC

        PROM --> GRAF
        PROM --> ALERT
        SIEM_SVC --> LOKI
    end
```

---

## 1️⃣2️⃣ Architecture de Sécurité (Zero Trust, PKI, HSM)

```mermaid
flowchart TB
    subgraph PRINCIPES["🛡️ Principes Fondateurs"]
        P1[Security by Design]
        P2[Zero Trust<br/>Aucun composant n'est implicitement fiable]
        P3[Défense en Profondeur]
        P4[Least Privilege]
    end

    subgraph AUTH_LAYER["🔑 Couche Authentification"]
        MFA[MFA obligatoire<br/>Admin + Commission]
        SAML[SSO SAML 2.0 / OIDC]
        LDAP_INTEG[AD / LDAP / Keycloak]
        SESSION[Sessions chiffrées<br/>HttpOnly + Secure<br/>Expiration auto]
        BRUTE[Blocage après<br/>5 échecs]
    end

    subgraph ENCRYPT["🔒 Couche Chiffrement"]
        TLS[TLS 1.3<br/>Tous flux]
        MTLS[mTLS<br/>Services critiques]
        AES256[AES-256<br/>Données au repos]
        TDE[TDE PostgreSQL]
        SSEC[SSE-C MinIO]
        VAULT_SEC[Vault<br/>Secrets centralisés]
    end

    subgraph PKI_HSM["🔐 PKI & HSM"]
        CA_ROOT[CA Racine<br/>Offline]
        CA_INT[CA Intermédiaire<br/>Services]
        CERT_SRV[Certificats services<br/>Rotation auto]
        HSM_DEV[HSM Physique<br/>FIPS 140-2]
        SIGN[Signature électronique<br/>PKCS#11]
    end

    subgraph AUDIT_SEC["📜 Audit & Conformité"]
        LOG_IMMU[Logs immuables<br/>Hash chainés]
        SIEM_SOC[SIEM SOC<br/>Wazuh]
        OWASP[Protection OWASP Top 10]
        ANOMALY[Détection anomalies<br/>comportementales]
        EXPORT_LOG[Export logs<br/>PDF / CSV / JSON]
    end

    subgraph TIMESTAMP["⏰ Horodatage Légal"]
        RFC3161[RFC 3161<br/>Timestamping Protocol]
        NTP_SYNC[NTP Stratum 1<br/>Synchronisation]
        LEGAL_PROOF[Preuves légales<br/>UUID + Hash + Timestamp + Signature]
    end

    subgraph NETWORK_SEC["🌐 Sécurité Réseau"]
        VLAN[VLAN segmentation]
        FW_STATE[Firewalls stateful]
        IDS_IPS[IDS / IPS]
        DMZ_ISO[Isolation DMZ]
    end

    PRINCIPES --> AUTH_LAYER
    AUTH_LAYER --> ENCRYPT
    ENCRYPT --> PKI_HSM
    PKI_HSM --> AUDIT_SEC
    AUDIT_SEC --> TIMESTAMP
    PRINCIPES --> NETWORK_SEC

    style PRINCIPES fill:#fff3e0
    style AUTH_LAYER fill:#e3f2fd
    style ENCRYPT fill:#f3e5f5
    style PKI_HSM fill:#fce4ec
    style AUDIT_SEC fill:#e8f5e9
    style TIMESTAMP fill:#fff9c4
    style NETWORK_SEC fill:#ffebee
```

---

## 1️⃣3️⃣ Architecture des Données (PostgreSQL, MinIO, WORM, Redis)

```mermaid
flowchart LR
    subgraph HOT["🔥 Données Chaudes (HOT)"]
        PG[(PostgreSQL 16<br/>TDE AES-256<br/>Données métier)]
        REDIS_H[(Redis 7<br/>Cache LRU<br/>TTL configurable)]
    end

    subgraph WARM["🌡️ Données Tièdes (WARM)"]
        MINIO_WARM[(MinIO Standard<br/>SSE-C chiffrement<br/>Documents actifs)]
    end

    subgraph COLD["❄️ Données Froides (COLD)"]
        MINIO_WORM[(MinIO Object Lock<br/>WORM — Write Once<br/>Read Many)]
        ARCHIVE[(Archivage Légal<br/>Conservation réglementaire)]
    end

    subgraph BACKUP["💾 Sauvegardes"]
        BKP_FULL[Sauvegarde complète<br/>hebdomadaire chiffrée]
        BKP_INCR[Sauvegarde incrémentale<br/>quotidienne chiffrée]
        BKP_TEST[Tests restauration<br/>mensuels]
    end

    APP[Application Procura] -->|CRUD| PG
    APP -->|Cache| REDIS_H
    APP -->|Documents| MINIO_WARM
    MINIO_WARM -->|Rotation auto| MINIO_WORM
    MINIO_WORM -->|Durée légale| ARCHIVE

    PG --> BKP_INCR
    MINIO_WARM --> BKP_INCR
    BKP_INCR --> BKP_FULL
    BKP_FULL --> BKP_TEST

    style HOT fill:#ffebee
    style WARM fill:#fff3e0
    style COLD fill:#e3f2fd
    style BACKUP fill:#e8f5e9
```

---

## 1️⃣4️⃣ Architecture du Coffre-Fort Numérique

```mermaid
flowchart TB
    DEPOT[📥 Dépôt Fournisseur<br/>PDF / CSV / JPEG / PNG] --> VERIF1{Vérification<br/>extension & MIME<br/>& magic bytes}
    VERIF1 -->|KO| REJ[❌ Rejet format]
    VERIF1 -->|OK| QUAR[Quarantaine chiffrée<br/>AES-256<br/>DMZ]

    QUAR --> AV_SCAN[Scan Antivirus<br/>ClamAV + Commercial]
    AV_SCAN -->|MALICIOUS| ISO_SOC[🚨 Isolation + Alerte SOC]
    AV_SCAN -->|SUSPICIOUS| REV_SEC[⚠️ Revue Sécurité]
    AV_SCAN -->|CLEAN| SANDBOX[Sandbox<br/>Analyse dynamique]

    REV_SEC -->|Validé| SANDBOX
    REV_SEC -->|Rejeté| ISO_SOC

    SANDBOX --> HASH[Calcul SHA-256]
    HASH --> HSM_SIG[Signature HSM]
    HSM_SIG --> RFC_TS[Horodatage<br/>RFC 3161]
    RFC_TS --> SEAL[Preuve légale<br/>UUID + Hash + TS + Signature]

    SEAL --> WORM[(Archivage WORM<br/>Immuable)]
    SEAL --> PULL[Pull sécurisé<br/>vers LAN]
    PULL --> VERIF_INT{Vérification<br/>intégrité}
    VERIF_INT -->|OK| LAN_STORE[(Stockage LAN<br/>coffre-fort)]
    VERIF_INT -->|KO| ALERT_INT[🚨 Alerte intégrité]

    LAN_STORE --> ACCUSE[📧 Accusé réception<br/>au fournisseur]
    LAN_STORE --> WAIT_DEAD{Attente<br/>deadline}
    WAIT_DEAD -->|Avant deadline| LOCKED[🔒 INACCESSIBLE<br/>Aucune lecture]
    WAIT_DEAD -->|Après deadline| OPEN[Ouverture officielle<br/>Commission]

    style ISO_SOC fill:#f44336,color:#fff
    style REV_SEC fill:#ff9800,color:#fff
    style SEAL fill:#4caf50,color:#fff
    style WORM fill:#1976d2,color:#fff
    style LOCKED fill:#d32f2f,color:#fff
    style OPEN fill:#388e3c,color:#fff
```

---

## 1️⃣5️⃣ Architecture Monitoring (Prometheus, Grafana, ELK, Wazuh)

```mermaid
flowchart TB
    subgraph COLLECT["📡 Collecte"]
        EXP_PROM[Prometheus<br/>Node Exporter<br/>sur tous services]
        EXP_NGINX[Nginx Exporter]
        EXP_PG[PostgreSQL Exporter]
        EXP_RABBIT[RabbitMQ Exporter]
        EXP_REDIS[Redis Exporter]
        FILEBEAT[Filebeat<br/>→ ELK]
        WAZUH_AG[Wazuh Agents<br/>sur tous hosts]
    end

    subgraph STOCKAGE["💾 Stockage Time-Series & Logs"]
        PROM_DB[(Prometheus TSDB)]
        ELASTIC[(Elasticsearch)]
        LOKI_DB[(Loki)]
        WAZUH_DB[(Wazuh Indexer)]
    end

    subgraph VISU["📊 Visualisation"]
        GRAF[Grafana<br/>Dashboards Ops]
        KIBANA[Kibana<br/>Dashboards Sécurité]
        WAZUH_DASH[Wazuh Dashboard<br/>SOC]
    end

    subgraph ALERTING["🚨 Alerting"]
        ALERT_MGR[Alertmanager]
        SLACK[Slack / Teams]
        EMAIL_ALERT[Email]
        SMS[SMS via webhook]
        PAGER[PagerDuty]
    end

    subgraph METRIQUES["📈 Indicateurs Supervisés"]
        M1[Disponibilité services<br/>🟢🟠🔴]
        M2[CPU / RAM / Stockage / BP]
        M3[Temps réponse API & Pages]
        M4[État connecteurs ERP]
        M5[État authentification]
        M6[Réussite sauvegardes]
        M7[Taille files RabbitMQ]
    end

    EXP_PROM & EXP_NGINX & EXP_PG & EXP_RABBIT & EXP_REDIS --> PROM_DB
    FILEBEAT --> ELASTIC
    FILEBEAT --> LOKI_DB
    WAZUH_AG --> WAZUH_DB

    PROM_DB --> GRAF
    ELASTIC --> KIBANA
    WAZUH_DB --> WAZUH_DASH

    PROM_DB --> ALERT_MGR
    LOKI_DB --> ALERT_MGR
    WAZUH_DB --> ALERT_MGR

    ALERT_MGR --> SLACK
    ALERT_MGR --> EMAIL_ALERT
    ALERT_MGR --> SMS
    ALERT_MGR --> PAGER

    GRAF --> METRIQUES
```

---

## 1️⃣6️⃣ Architecture Intégration ERP

```mermaid
flowchart LR
    subgraph PROCURA_LAN["🏢 Procura LAN"]
        OUTPUT[Module Output Final<br/>JSON / XML / CSV]
        VALIDATOR[Validateur<br/>Cohérence + Hash]
        QUEUE[RabbitMQ<br/>File persistante<br/>Retry exponentiel]
    end

    subgraph CONNECTORS["🔌 Connecteurs ERP"]
        SAP_CONN[SAP Connector<br/>IDoc / RFC / OData]
        ORACLE_CONN[Oracle Connector<br/>XML Gateway]
        SAGE_CONN[Sage Connector<br/>CSV / API]
        DYN_CONN[Dynamics 365<br/>OData / REST]
        CUSTOM_CONN[Connecteur Propriétaire<br/>CSV / XML / API custom]
    end

    subgraph TRANSPORT["🚚 Transport Sécurisé"]
        MTLS_CH[mTLS<br/>TLS 1.3]
        APIKEY[API Keys]
        OAUTH2[OAuth2]
        SFTP_CH[SFTP chiffré<br/>fallback]
    end

    subgraph ERP_ZONE["💼 Zone ERP Client"]
        SAP[(SAP<br/>S/4HANA)]
        ORACLE[(Oracle<br/>ERP Cloud)]
        SAGE[(Sage X3)]
        DYN[(Dynamics 365)]
        CUSTOM[(ERP Propriétaire)]
        READONLY[API Read-Only<br/>Référentiel fournisseurs]
    end

    OUTPUT --> VALIDATOR
    VALIDATOR --> QUEUE
    QUEUE --> SAP_CONN & ORACLE_CONN & SAGE_CONN & DYN_CONN & CUSTOM_CONN

    SAP_CONN --> MTLS_CH
    ORACLE_CONN --> MTLS_CH
    SAGE_CONN --> APIKEY
    DYN_CONN --> OAUTH2
    CUSTOM_CONN --> SFTP_CH

    MTLS_CH --> SAP & ORACLE
    APIKEY --> SAGE
    OAUTH2 --> DYN
    SFTP_CH --> CUSTOM

    SAP & ORACLE & SAGE & DYN & CUSTOM -.->|Lecture seule| READONLY
    READONLY -.->|Référentiel fournisseurs| PROCURA_LAN
```

---

## 1️⃣7️⃣ Flux de Traitement des Offres (Dépôt → Scellage → LAN)

```mermaid
flowchart TB
    START([📨 Offre reçue DMZ]) --> T1[1️⃣ Réception HTTPS TLS 1.3 + mTLS]
    T1 --> T2[2️⃣ Vérif extension + MIME + magic bytes]
    T2 -->|KO| ERR1[❌ Rejet format invalide]
    T2 -->|OK| T3[3️⃣ Stockage en quarantaine chiffrée AES-256]
    T3 --> T4[4️⃣ Analyse statique<br/>PDF: scripts actifs<br/>CSV: injections<br/>Images: métadonnées]
    T4 --> T5[5️⃣ Scan AV multi-moteur<br/>ClamAV + Commercial]
    T5 -->|MALICIOUS| ERR2[🚨 Isolement + SOC]
    T5 -->|SUSPICIOUS| ERR3[⚠️ Revue sécurité]
    T5 -->|CLEAN| T6[6️⃣ Sandbox dynamique<br/>VM isolée]
    ERR3 -->|Validé| T6
    T6 --> T7[7️⃣ Décision sécurité finale]
    T7 --> T8[8️⃣ Calcul SHA-256 + UUID]
    T8 --> T9[9️⃣ Signature HSM]
    T9 --> T10[🔟 Horodatage RFC 3161]
    T10 --> T11[1️⃣1️⃣ Archivage WORM immuable]
    T11 --> T12[1️⃣2️⃣ Pull sécurisé DMZ → LAN]
    T12 --> T13[1️⃣3️⃣ Vérification intégrité post-pull]
    T13 -->|KO| ERR4[🚨 Alerte intégrité compromise]
    T13 -->|OK| T14[1️⃣4️⃣ Stockage LAN coffre-fort]
    T14 --> T15[1️⃣5️⃣ Accusé réception signé<br/>au fournisseur]
    T15 --> T16[1️⃣6️⃣ Verrouillage logique<br/>INACCESSIBLE avant deadline]
    T16 --> WAIT([⏳ Attente ouverture officielle])

    style ERR1 fill:#ff9800
    style ERR2 fill:#f44336,color:#fff
    style ERR3 fill:#ff9800
    style ERR4 fill:#f44336,color:#fff
    style T11 fill:#1976d2,color:#fff
    style T16 fill:#d32f2f,color:#fff
    style WAIT fill:#388e3c,color:#fff
```

---

## 1️⃣8️⃣ Matrice RBAC — Rôles & Permissions

```mermaid
flowchart TB
    subgraph ROLES["👥 Rôles RBAC"]
        R1[👤 DEMANDEUR]
        R2[👤 ACHETEUR]
        R3[👤 VALIDATEUR<br/>Manager/Achat/Finance]
        R4[👤 PRESIDENT_COMMISSION]
        R5[👤 MEMBRE_COMMISSION]
        R6[👤 ADMIN_TECHNIQUE]
        R7[👤 ADMIN_SECURITE]
        R8[👤 AUDITEUR]
        R9[🏢 FOURNISSEUR]
        R10[💼 ERP_SERVICE]
    end

    subgraph PERMS["🔐 Permissions"]
        P1[Créer expression besoin]
        P2[Créer / Publier RFQ]
        P3[Valider besoin]
        P4[Signer PV commission]
        P5[Consulter offres pré-ouverture]
        P6[Gérer utilisateurs]
        P7[Administrer PKI / HSM]
        P8[Lire logs audit]
        P9[Déposer offre]
        P10[Recevoir output final]
    end

    subgraph MODULES["📦 Modules Accessibles"]
        M1[Module 3<br/>Expression Besoin]
        M2[Module 5<br/>RFQ & Publication]
        M3[Module 4<br/>Référentiel Fournisseur]
        M4[Module 11<br/>Ouverture Plis]
        M5[Module 12<br/>Commission]
        M6[Module 18<br/>Administration]
        M7[Module 10<br/>Audit]
        M8[Module 7<br/>Dépôt Sécurisé]
        M9[Module 15<br/>Intégration ERP]
    end

    R1 --> P1 --> M1
    R2 --> P2 --> M2
    R2 --> P3 --> M3
    R3 --> P3 --> M1
    R4 --> P4 --> M4 & M5
    R5 --> P5 --> M4
    R5 --> P4 --> M5
    R6 --> P6 --> M6
    R7 --> P7 --> M6
    R8 --> P8 --> M7
    R9 --> P9 --> M8
    R10 --> P10 --> M9

    style ROLES fill:#fff9c4
    style PERMS fill:#e1f5fe
    style MODULES fill:#f3e5f5
```

---

## 1️⃣9️⃣ Diagramme d'État — Cycle de Vie d'une RFQ

```mermaid
stateDiagram-v2
    [*] --> Brouillon : Acheteur crée RFQ

    Brouillon --> EnValidation : Soumission<br/>validation interne
    EnValidation --> Validee : Validation OK
    EnValidation --> Rejetee : Validation KO<br/>(refus motivé)

    Validee --> Scellee : Scellage<br/>HSM + Hash + RFC 3161
    Scellee --> Publiee : Publication<br/>LAN → DMZ

    Publiee --> DepotEnCours : Fenêtre dépôt ouverte
    DepotEnCours --> DepotEnCours : Fournisseurs déposent<br/>(offres scellées)
    DepotEnCours --> Cloturee : Deadline atteinte<br/>Verrouillage auto

    Cloturee --> EnOuverture : Commission initie<br/>(après deadline)
    EnOuverture --> PlisOuverts : Déverrouillage logique

    PlisOuverts --> EnCommission : Commission analyse
    EnCommission --> PVValide : PV signé<br/>décisions enregistrées

    PVValide --> OutputGenere : Output Final généré
    OutputGenere --> TransmiseERP : Transmission ERP
    TransmiseERP --> Archivee : ERP ACK<br/>Dossier archivé WORM

    Rejetee --> [*]
    Archivee --> [*]

    note right of Scellee : 🔒 Intégrité garantie<br/>par HSM
    note right of DepotEnCours : 🔐 Offres INACCESSIBLES<br/>avant deadline
    note right of PlisOuverts : 👁️ Lecture seule<br/>simultanée
```

---

## 2️⃣0️⃣ Diagramme d'État — Cycle de Vie d'une Offre

```mermaid
stateDiagram-v2
    [*] --> Recue : Dépôt fournisseur<br/>HTTPS TLS 1.3

    Recue --> EnQuarantaine : Stockage chiffré AES-256<br/>DMZ
    EnQuarantaine --> EnAnalyse : Scan AV + Sandbox

    EnAnalyse --> Scellee : Verdict CLEAN<br/>SHA-256 + HSM + RFC 3161
    EnAnalyse --> Suspecte : Verdict SUSPICIOUS
    EnAnalyse --> Rejetee : Verdict MALICIOUS

    Suspecte --> Scellee : Validation sécurité
    Suspecte --> Rejetee : Rejet sécurité

    Scellee --> ArchiveeWORM : Archivage WORM
    ArchiveeWORM --> TransfereeLAN : Pull sécurisé DMZ → LAN
    TransfereeLAN --> CoffreLAN : Vérification intégrité OK

    CoffreLAN --> Verrouillee : Statut = Verrouillée<br/>INACCESSIBLE

    Verrouillee --> Verrouillee : En attente<br/>deadline
    Verrouillee --> Deverrouillee : Deadline atteinte<br/>+ ouverture commission

    Deverrouillee --> Consulee : Lecture seule<br/>par commission
    Consulee --> Retenue : Décision = RETENUE
    Consulee --> NonRetenue : Décision = NON RETENUE

    Retenue --> DansOutput : Intégrée Output Final
    DansOutput --> TransmiseERP : Export vers ERP
    TransmiseERP --> [*]

    NonRetenue --> [*]
    Rejetee --> [*]

    note right of CoffreLAN : 🔐 Coffre-fort numérique<br/>immuable
    note right of Deverrouillee : 🔓 Déverrouillage unique<br/>non réversible
```

---

## 2️⃣1️⃣ Roadmap MVP → V3 (Gantt)

```mermaid
gantt
    title Roadmap PROCURA — MVP → V3
    dateFormat  YYYY-MM-DD
    axisFormat  %b

    section Phase MVP (M1-M4)
    Module 1 - Architecture & Déploiement      :m1, 2026-01-01, 30d
    Module 2 - Gestion utilisateurs & RBAC     :m2, after m1, 30d
    Module 3 - Expression besoin simplifié     :m3, after m2, 25d
    Module 5 - RFQ basique + publication       :m4, after m3, 30d
    Module 6 - Portail fournisseur (PDF)       :m5, after m4, 30d
    Module 7 - Dépôt sécurisé + AV             :m6, after m5, 25d
    Module 9 - Deadlines & verrouillage        :m7, after m6, 20d
    Module 10 - Audit & traçabilité de base    :m8, after m7, 20d
    Module 17 - Notifications email            :m9, after m8, 15d

    section Phase V1 (M5-M8)
    Module 4 - Référentiel fournisseur ERP     :v1a, 2026-05-01, 30d
    Module 8 - RFC 3161 & HSM                  :v1b, after v1a, 25d
    Module 11 - Ouverture plis numérique       :v1c, after v1b, 25d
    Module 12 - Commission + PV numérique      :v1d, after v1c, 25d
    Module 13 - Analyse & comparatifs          :v1e, after v1d, 20d
    Module 14 - Output Final                   :v1f, after v1e, 20d
    Module 15 - Intégration ERP (SAP/Oracle/Sage):v1g, after v1f, 30d
    Module 18 - Administration & paramétrage   :v1h, after v1g, 25d
    Module 19 - Sécurité (WAF/Sandbox/PKI)     :v1i, after v1h, 30d

    section Phase V2 (M9-M12)
    Module 16 - Ticketing post-décision        :v2a, 2026-09-01, 25d
    Module 20 - Archivage WORM                  :v2b, after v2a, 20d
    Module 21 - Monitoring avancé              :v2c, after v2b, 30d
    Module 22 - Documentation & support        :v2d, after v2c, 20d
    Tests de charge + sécurité + audit externe :v2e, after v2d, 30d
    Optimisations performance & UX            :v2f, after v2e, 20d

    section Phase V3 (M13+)
    Multi-entités / multi-sites                :v3a, 2027-01-01, 60d
    Connecteurs ERP supplémentaires            :v3b, after v3a, 45d
    Module BI avancée & KPIs achats            :v3c, after v3b, 60d
    Formats e-procurement / PEPPOL             :v3d, after v3c, 45d
    Certification ISO 27001                    :v3e, after v3d, 90d
    Expansion multi-marchés                    :v3f, after v3e, 60d
```

---

## 2️⃣2️⃣ Diagramme de Gouvernance (RACI)

```mermaid
flowchart TB
    subgraph COMITES["🏛️ Comités de Gouvernance"]
        COPIL[Comité de Pilotage<br/>📅 Mensuel<br/>Décisions stratégiques]
        COTECH[Comité Technique<br/>📅 Hebdomadaire<br/>Revue technique & blocages]
        COSEC[Comité Sécurité<br/>📅 À chaque livraison majeure<br/>Validation sécurité]
        COSPR[Revue de Sprint<br/>📅 Bi-mensuelle<br/>Démo fonctionnalités]
    end

    subgraph ACTEURS_GOV["👥 Acteurs"]
        SP[🚀 Sponsor]
        CDO[👤 Chef de Projet]
        ARCH[🏗️ Architecte]
        LEAD[👨‍💻 Lead Dev]
        DEV[👨‍💻 Équipe Dev]
        SEC[🔐 RSSI]
        QA[✅ QA Lead]
        CLIENT[🏢 Client]
    end

    subgraph MATRICE["📋 Matrice RACI (extrait)"]
        R1[Conception architecture<br/>A=ARCH, R=LEAD, C=SEC, I=CDO]
        R2[Développement modules<br/>A=LEAD, R=DEV, C=ARCH, I=CDO]
        R3[Tests sécurité<br/>A=SEC, R=QA, C=ARCH, I=CDO]
        R4[Recette utilisateur<br/>A=CLIENT, R=QA, C=CDO, I=SP]
        R5[Validation sécurité<br/>A=SEC, R=ARCH, C=CDO, I=SP]
        R6[Décisions budget<br/>A=SP, R=CDO, C=ARCH, I=CLIENT]
    end

    SP --> COPIL
    CDO --> COPIL & COTECH & COSPR
    SEC --> COSEC
    ARCH --> COTECH & COSEC
    LEAD --> COSPR
    CLIENT --> COPIL & COSPR

    ACTEURS_GOV --> MATRICE

    style COPIL fill:#1976d2,color:#fff
    style COTECH fill:#388e3c,color:#fff
    style COSEC fill:#d32f2f,color:#fff
    style COSPR fill:#f57c00,color:#fff
```

> **Légende RACI** : **R** = Responsible (exécute) · **A** = Accountable (responsable final) · **C** = Consulted (consulté) · **I** = Informed (informé)

---

## 2️⃣3️⃣ Cartographie des 22 Modules

```mermaid
flowchart TB
    subgraph INFRA["🏗️ INFRASTRUCTURE & SÉCURITÉ"]
        M1[Module 1<br/>Architecture & Déploiement]
        M2[Module 2<br/>Gestion Utilisateurs & RBAC]
        M19[Module 19<br/>Sécurité Globale]
        M20[Module 20<br/>Archivage & Conservation Légal]
        M21[Module 21<br/>Monitoring & Exploitation]
        M22[Module 22<br/>Documentation & Support]
    end

    subgraph METIER["💼 CŒUR MÉTIER (Source-to-Contract)"]
        M3[Module 3<br/>Expression du Besoin]
        M4[Module 4<br/>Référentiel Fournisseur ERP]
        M5[Module 5<br/>Lancement RFQ & Publication]
        M6[Module 6<br/>Portail Fournisseur DMZ]
        M7[Module 7<br/>Dépôt Sécurisé des Offres]
        M9[Module 9<br/>Gestion Deadlines & Verrouillage]
        M11[Module 11<br/>Ouverture des Plis Numérique]
        M12[Module 12<br/>Commission d'Ouverture]
        M13[Module 13<br/>Analyse & Structuration]
        M14[Module 14<br/>Génération Output Final]
    end

    subgraph TRANSVERSE["🔄 MODULES TRANSVERSES"]
        M8[Module 8<br/>Horodatage & Preuve Légale<br/>RFC 3161 + HSM]
        M10[Module 10<br/>Audit & Traçabilité]
        M15[Module 15<br/>Intégration ERP]
        M16[Module 16<br/>Communication Collaborative<br/>Ticketing]
        M17[Module 17<br/>Notifications & Messagerie]
        M18[Module 18<br/>Administration & Paramétrage]
    end

    M3 --> M5
    M5 --> M6
    M6 --> M7
    M7 --> M9
    M9 --> M11
    M11 --> M12
    M12 --> M13
    M13 --> M14
    M14 --> M15

    M8 -.-> M5 & M7 & M11 & M12 & M14
    M10 -.->|Audit tous| M3 & M5 & M7 & M11 & M12
    M17 -.->|Notif tous| M3 & M5 & M6 & M9 & M11 & M12
    M2 -.->|RBAC| M3 & M5 & M6 & M11
    M19 -.->|Sécurité| M6 & M7
    M20 -.->|Archive| M5 & M7 & M12 & M14
    M21 -.->|Supervision| M1 & M6 & M7
    M22 -.->|Docs| M18 & M21

    style INFRA fill:#e3f2fd
    style METIER fill:#fff3e0
    style TRANSVERSE fill:#f3e5f5
```

---

## 2️⃣4️⃣ Flux de Communication Inter-Zones

```mermaid
sequenceDiagram
    autonumber
    actor Fournisseur
    participant RP as Reverse Proxy<br/>(DMZ)
    participant Portal as Portail<br/>(DMZ)
    participant Depot as Dépôt<br/>(DMZ)
    participant Sandbox as Sandbox<br/>(DMZ)
    participant App as App Server<br/>(LAN)
    participant DB as PostgreSQL<br/>(LAN)
    participant ERP as ERP<br/>(LAN ERP)
    participant HSM as HSM<br/>(LAN Admin)
    participant SIEM as SIEM<br/>(LAN Admin)
    participant LDAP as AD/LDAP<br/>(LAN Admin)

    Note over Fournisseur,LDAP: 🌐 Étape 1 — Authentification Fournisseur
    Fournisseur->>RP: HTTPS TLS 1.3 + MFA/mTLS
    RP->>Portal: Routage authentifié
    Portal->>LDAP: Vérification identité (via API interne mTLS)
    LDAP-->>Portal: Identité validée

    Note over Fournisseur,LDAP: 📨 Étape 2 — Dépôt Offre
    Fournisseur->>Portal: Upload offre
    Portal->>Depot: Transfert chiffré AES-256
    Depot->>Sandbox: Analyse dynamique

    Note over Fournisseur,LDAP: 🔐 Étape 3 — Scellage & Signature
    Depot->>HSM: Demande signature (mTLS)
    HSM-->>Depot: Signature + certificat

    Note over Fournisseur,LDAP: 📤 Étape 4 — Pull vers LAN
    Depot->>App: Pull sécurisé (offre scellée)
    App->>DB: Persistance données (TDE)
    App->>SIEM: Log audit (mTLS)

    Note over Fournisseur,LDAP: 💼 Étape 5 — Transmission ERP
    App->>ERP: POST output final (mTLS + API Key/OAuth2)
    ERP-->>App: ACK + ID document
    App->>SIEM: Log transmission
```

---

## 📌 Notes de Conformité

| Texte | Application |
|-------|-------------|
| **Loi 23-12** (Cybersécurité, Algérie) | Notification incidents, journalisation SOC, hébergement national |
| **Loi 18-07** (Données personnelles, Algérie) | Hébergement local strict, minimisation, droit à l'information |
| **Décret Marchés Publics** | Commission ouverture plis physique préservée, égalité de traitement, traçabilité légale |
| **ISO 27001:2022** | SMSI, gestion des risques, contrôles sécurité |
| **ISO 9001:2015** | Qualité, amélioration continue |
| **OWASP Top 10 (2021)** | Protection applicative |
| **RFC 3161** | Horodatage légal des preuves |
| **NIST SP 800-53 Rev.5** | Référentiel contrôles sécurité |
| **FIPS 140-2/3** | Modules cryptographiques (HSM) |
| **PKCS#11** | Interface HSM |
| **SAML 2.0 / OIDC** | SSO |
| **TLS 1.3** | Chiffrement transport |

---

## 🎯 Objectifs Stratégiques Mesurables

- ⏱️ **Time-to-market** cycle AO : **-30% à -50%**
- ✅ **Conformité audit** : 100%
- 🏰 **Souveraineté** : 100% on-premise
- 🔒 **Sécurité** : Chiffrement AES-256 + HSM + TLS 1.3 + mTLS
- 📊 **Couverture tests** : ≥ 80% backend (Jest)
- ⚡ **Performance** : < 2s (500 users) · < 30s (50 dépôts simultanés)
- 🛡️ **RTO** : < 4h · **RPO** : < 24h

---

**Fin du document — PROCURA Diagrammes Mermaid v1.0**
*Plateforme Source-to-Contract — On-Premise — 100% souveraine*