create extension if not exists "pgcrypto";

-- Rôles (RBAC)
create table roles (
  role_code text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

-- Départements
create table departments (
  department_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  created_at timestamptz not null default now()
);

-- Utilisateurs
create table users (
  user_id uuid primary key default gen_random_uuid(),
  external_identity text unique,
  display_name text not null,
  email text unique,
  role_code text not null references roles(role_code),
  department_id uuid references departments(department_id),
  is_active boolean not null default true,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fournisseurs
create table suppliers (
  supplier_id uuid primary key default gen_random_uuid(),
  erp_supplier_id text not null unique,
  legal_name text not null,
  tax_id text,
  country text,
  email text,
  risk_level text not null default 'low',
  status text not null default 'active',
  categories text[],
  last_erp_sync_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'blocked', 'pendingReview')),
  check (risk_level in ('low', 'medium', 'high', 'critical'))
);

-- Expressions de Besoins
create table need_expressions (
  need_id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  title text not null,
  description text not null,
  department text not null,
  estimated_budget numeric(15, 2) not null default 0.00,
  currency text not null default 'DZD',
  priority text not null default 'medium',
  status text not null default 'draft',
  requester_id uuid not null references users(user_id),
  approver_id uuid references users(user_id),
  justification text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (priority in ('low', 'medium', 'high', 'critical')),
  check (status in ('draft', 'submitted', 'approved', 'rejected', 'convertedToRfq'))
);

-- RFQs (Request For Quotations)
create table rfqs (
  rfq_id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  need_id uuid references need_expressions(need_id) on delete set null,
  title text not null,
  description text not null,
  status text not null,
  buyer_id uuid not null references users(user_id),
  deadline_at timestamptz not null,
  technical_weight numeric(5, 2) not null default 60.00,
  financial_weight numeric(5, 2) not null default 40.00,
  allowed_formats text[] not null default '{"pdf"}',
  global_hash text,
  hsm_signature text,
  rfc3161_timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in (
    'draft',
    'pendingApproval',
    'published',
    'locked',
    'opening',
    'commissionReview',
    'awarded',
    'exported',
    'archived',
    'cancelled'
  ))
);

-- Documents associés aux RFQs
create table rfq_documents (
  document_id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(rfq_id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  sha256_hash text not null,
  storage_path text not null,
  version integer not null default 1,
  uploaded_at timestamptz not null default now()
);

-- Invités / Fournisseurs invités aux RFQs
create table rfq_suppliers (
  rfq_id uuid not null references rfqs(rfq_id) on delete cascade,
  supplier_id uuid not null references suppliers(supplier_id) on delete cascade,
  invited_at timestamptz not null default now(),
  primary key (rfq_id, supplier_id)
);

-- Offres Soumises (Submissions)
create table submissions (
  submission_id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(rfq_id) on delete cascade,
  supplier_id uuid not null references suppliers(supplier_id) on delete cascade,
  status text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  sha256_hash text not null,
  hsm_signature text,
  rfc3161_timestamp timestamptz,
  sealed_at timestamptz,
  opened_at timestamptz,
  malware_scan text not null default 'clean',
  technical_score numeric(5, 2),
  financial_offer numeric(15, 2),
  currency text,
  created_at timestamptz not null default now(),
  check (status in ('draft', 'quarantined', 'sealed', 'rejected', 'opened')),
  check (malware_scan in ('clean', 'suspicious', 'malicious'))
);

-- Sessions d'ouverture des plis
create table opening_sessions (
  session_id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(rfq_id) on delete cascade,
  opened_at timestamptz not null default now(),
  president_id uuid not null references users(user_id),
  status text not null default 'draft',
  check (status in ('draft', 'active', 'completed'))
);

-- Membres de la commission d'ouverture
create table commission_members (
  member_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references opening_sessions(session_id) on delete cascade,
  user_id uuid not null references users(user_id) on delete cascade,
  role text not null default 'member',
  attended boolean not null default true,
  check (role in ('president', 'member', 'secretary'))
);

-- Décisions de la Commission
create table commission_decisions (
  decision_id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(rfq_id) on delete cascade,
  supplier_id uuid not null references suppliers(supplier_id) on delete cascade,
  technical_score numeric(5, 2) not null,
  financial_score numeric(5, 2) not null,
  final_score numeric(5, 2) not null,
  decision text not null,
  notes text,
  decided_by uuid not null references users(user_id),
  decided_at timestamptz not null default now(),
  check (decision in ('shortlisted', 'rejected', 'awarded'))
);

-- Procès-Verbaux de la Commission
create table process_verbaux (
  pv_id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null unique references rfqs(rfq_id) on delete cascade,
  reference text not null unique,
  signed_by uuid not null references users(user_id),
  signed_at timestamptz not null default now(),
  observations text,
  pdf_path text,
  hash_sha256 text,
  hsm_signature text
);

-- Outputs finaux
create table final_outputs (
  output_id uuid primary key default gen_random_uuid(),
  export_id text not null unique,
  rfq_id uuid not null references rfqs(rfq_id) on delete cascade,
  supplier_id uuid not null references suppliers(supplier_id) on delete cascade,
  status text not null default 'draft',
  payload_hash text not null,
  pv_reference text not null,
  generated_at timestamptz not null default now(),
  sent_at timestamptz,
  acknowledged_at timestamptz,
  check (status in ('draft', 'generated', 'sentToErp', 'acknowledged', 'failed'))
);

-- Événements d'Audit (Chainage SHA-256)
create table audit_events (
  audit_event_id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_role text not null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  occurred_at timestamptz not null default now(),
  previous_hash text,
  entry_hash text not null unique
);

-- Tickets de Communication
create table tickets (
  ticket_id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  rfq_id uuid references rfqs(rfq_id) on delete set null,
  supplier_id uuid references suppliers(supplier_id) on delete set null,
  category text not null,
  status text not null default 'open',
  subject text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (category in ('administrative', 'documentation', 'technical', 'delivery')),
  check (status in ('open', 'awaitingSupplier', 'awaitingCompany', 'resolved', 'closed'))
);

-- Messages de Tickets
create table ticket_messages (
  message_id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(ticket_id) on delete cascade,
  author_id text not null,
  author_role text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Notifications Système
create table notifications (
  notification_id uuid primary key default gen_random_uuid(),
  audience_role text not null,
  title text not null,
  body text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexations
create index idx_rfqs_status on rfqs(status);
create index idx_rfqs_deadline_at on rfqs(deadline_at);
create index idx_submissions_rfq on submissions(rfq_id);
create index idx_audit_resource on audit_events(resource_type, resource_id);
create index idx_audit_occurred_at on audit_events(occurred_at);
create index idx_tickets_rfq on tickets(rfq_id);
create index idx_tickets_supplier on tickets(supplier_id);
create index idx_need_status on need_expressions(status);
