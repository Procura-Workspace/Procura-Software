-- Migration : Table permissions, role_permissions et security_scans

-- 1. Table des permissions et de jonction avec les rôles
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  module text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_code text NOT NULL REFERENCES roles(role_code) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insertion des 23 permissions Procura
INSERT INTO permissions (code, description, module) VALUES
  ('need:create', 'Créer une expression de besoin', 'needs'),
  ('need:submit', 'Soumettre une expression de besoin', 'needs'),
  ('need:approve', 'Approuver une expression de besoin', 'needs'),
  ('need:read', 'Lire une expression de besoin', 'needs'),
  ('supplier:read', 'Consulter le référentiel fournisseurs', 'supplierReference'),
  ('supplier:invite', 'Inviter des fournisseurs aux RFQs', 'rfqPublication'),
  ('rfq:create', 'Créer un RFQ', 'rfqPublication'),
  ('rfq:publish', 'Publier un RFQ', 'rfqPublication'),
  ('rfq:read', 'Consulter les RFQs', 'rfqPublication'),
  ('rfq:transition', 'Changer le statut d''un RFQ', 'deadlines'),
  ('submission:create', 'Soumettre une offre', 'secureSubmission'),
  ('submission:seal', 'Sceller une offre déposée', 'secureSubmission'),
  ('submission:open', 'Ouvrir une offre soumise', 'bidOpening'),
  ('submission:read', 'Consulter une offre soumise', 'secureSubmission'),
  ('commission:decide', 'Prendre des décisions de commission', 'commission'),
  ('commission:sign', 'Signer les procès-verbaux de la commission', 'commission'),
  ('output:generate', 'Générer l''output final', 'finalOutput'),
  ('erp:export', 'Exporter vers l''ERP', 'erpIntegration'),
  ('ticket:create', 'Créer un ticket de support/collaboration', 'collaboration'),
  ('ticket:reply', 'Répondre à un ticket', 'collaboration'),
  ('audit:read', 'Consulter les traces d''audit', 'audit'),
  ('admin:manage', 'Gérer l''administration du système', 'administration'),
  ('monitoring:read', 'Consulter les métriques de monitoring', 'monitoring')
ON CONFLICT (code) DO NOTHING;

-- Insertion des associations role_permissions
-- Rôle: requester
INSERT INTO role_permissions (role_code, permission_id)
SELECT 'requester', id FROM permissions WHERE code IN ('need:create', 'need:submit', 'need:read', 'rfq:read')
ON CONFLICT DO NOTHING;

-- Rôle: buyer
INSERT INTO role_permissions (role_code, permission_id)
SELECT 'buyer', id FROM permissions WHERE code IN (
  'need:read', 'need:approve', 'supplier:read', 'supplier:invite', 'rfq:create',
  'rfq:publish', 'rfq:read', 'rfq:transition', 'submission:read', 'output:generate',
  'erp:export', 'audit:read', 'monitoring:read'
)
ON CONFLICT DO NOTHING;

-- Rôle: supplier
INSERT INTO role_permissions (role_code, permission_id)
SELECT 'supplier', id FROM permissions WHERE code IN ('rfq:read', 'submission:create')
ON CONFLICT DO NOTHING;

-- Rôle: commissionMember
INSERT INTO role_permissions (role_code, permission_id)
SELECT 'commissionMember', id FROM permissions WHERE code IN (
  'rfq:read', 'submission:open', 'submission:read', 'commission:decide', 'commission:sign',
  'audit:read', 'monitoring:read'
)
ON CONFLICT DO NOTHING;

-- Rôle: administrator
INSERT INTO role_permissions (role_code, permission_id)
SELECT 'administrator', id FROM permissions WHERE code IN (
  'need:read', 'supplier:read', 'rfq:read', 'audit:read', 'admin:manage', 'monitoring:read', 'rfq:transition'
)
ON CONFLICT DO NOTHING;

-- Rôle: auditor
INSERT INTO role_permissions (role_code, permission_id)
SELECT 'auditor', id FROM permissions WHERE code IN ('need:read', 'rfq:read', 'audit:read', 'monitoring:read', 'submission:read')
ON CONFLICT DO NOTHING;

-- Rôle: erpSystem
INSERT INTO role_permissions (role_code, permission_id)
SELECT 'erpSystem', id FROM permissions WHERE code IN ('supplier:read', 'erp:export')
ON CONFLICT DO NOTHING;

-- 2. Création de la table security_scans
CREATE TABLE IF NOT EXISTS security_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_file_id uuid NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
  scan_type text NOT NULL,
  result text NOT NULL,
  engine_used text NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  CHECK (result IN ('CLEAN', 'SUSPICIOUS', 'MALICIOUS'))
);

-- Suppression de malware_scan dans submissions
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_malware_scan_check;
ALTER TABLE submissions DROP COLUMN IF EXISTS malware_scan;
