-- Insertion des Rôles
insert into roles (role_code, label) values
  ('requester', 'Demandeur'),
  ('buyer', 'Acheteur'),
  ('supplier', 'Fournisseur'),
  ('commissionMember', 'Membre Commission'),
  ('administrator', 'Administrateur'),
  ('auditor', 'Auditeur'),
  ('erpSystem', 'Système ERP');

-- Insertion des Départements
insert into departments (name, code) values
  ('Direction des Achats', 'ACH'),
  ('Direction Financière', 'FIN'),
  ('Département Technique', 'TEC'),
  ('Moyens Généraux', 'MG');

-- Insertion des Utilisateurs
-- (Utilisation d'UUIDs statiques faciles pour le dév / tests curl)
-- Mot de passe par défaut : Password123!
insert into users (user_id, display_name, email, role_code, department_id, is_active, password_hash) values
  ('00000000-0000-4000-8000-000000000001', 'Amine Acheteur', 'amine@procura.dz', 'buyer', (select department_id from departments where code = 'ACH'), true, 'pbkdf2:10000:salt1234:09bf167ecd93c1097cea50ff78e418e0c18c9af9bc41a73fa86d38db33ecd55abfdc9dbd6efc2ff1388d8d070f4fb5b2357b3ff14b349d82658624de0e20de1b'),
  ('00000000-0000-4000-8000-000000000002', 'Sofiane Demandeur', 'sofiane@procura.dz', 'requester', (select department_id from departments where code = 'TEC'), true, 'pbkdf2:10000:salt1234:09bf167ecd93c1097cea50ff78e418e0c18c9af9bc41a73fa86d38db33ecd55abfdc9dbd6efc2ff1388d8d070f4fb5b2357b3ff14b349d82658624de0e20de1b'),
  ('00000000-0000-4000-8000-000000000003', 'Arix Admin', 'arix@procura.dz', 'administrator', (select department_id from departments where code = 'ACH'), true, 'pbkdf2:10000:salt1234:09bf167ecd93c1097cea50ff78e418e0c18c9af9bc41a73fa86d38db33ecd55abfdc9dbd6efc2ff1388d8d070f4fb5b2357b3ff14b349d82658624de0e20de1b'),
  ('00000000-0000-4000-8000-000000000004', 'Mounir Commission', 'mounir@procura.dz', 'commissionMember', (select department_id from departments where code = 'FIN'), true, 'pbkdf2:10000:salt1234:09bf167ecd93c1097cea50ff78e418e0c18c9af9bc41a73fa86d38db33ecd55abfdc9dbd6efc2ff1388d8d070f4fb5b2357b3ff14b349d82658624de0e20de1b'),
  ('00000000-0000-4000-8000-000000000008', 'Auditeur Externe', 'auditor@procura.dz', 'auditor', null, true, 'pbkdf2:10000:salt1234:09bf167ecd93c1097cea50ff78e418e0c18c9af9bc41a73fa86d38db33ecd55abfdc9dbd6efc2ff1388d8d070f4fb5b2357b3ff14b349d82658624de0e20de1b');

-- Insertion des Fournisseurs
insert into suppliers (supplier_id, erp_supplier_id, legal_name, tax_id, country, email, risk_level, status, categories) values
  ('00000000-0000-4000-9000-000000000001', 'SUP-001', 'SARL ElectroAlgerie', '1234567890', 'Algérie', 'contact@electroalgerie.dz', 'low', 'active', '{"matériel électrique", "câbles"}'),
  ('00000000-0000-4000-9000-000000000002', 'SUP-002', 'EURL BatiOuest', '9876543210', 'Algérie', 'info@batiouest.dz', 'medium', 'active', '{"génie civil", "bâtiment"}'),
  ('00000000-0000-4000-9000-000000000003', 'SUP-003', 'SPA Algerie Telecoms', '5555555555', 'Algérie', 'sales@algerietelecoms.dz', 'low', 'active', '{"télécoms", "réseau"}'),
  ('00000000-0000-4000-9000-000000000004', 'SUP-004', 'Cabinet Audit Alger', '2222222222', 'Algérie', 'audit@alger.dz', 'low', 'pendingReview', '{"services", "audit"}');
