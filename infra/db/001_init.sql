create extension if not exists "pgcrypto";

create table roles (
  role_code text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table users (
  user_id uuid primary key default gen_random_uuid(),
  external_identity text unique,
  display_name text not null,
  email text unique,
  role_code text not null references roles(role_code),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table suppliers (
  supplier_id uuid primary key default gen_random_uuid(),
  erp_supplier_id text not null unique,
  legal_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table rfqs (
  rfq_id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  title text not null,
  description text not null,
  status text not null,
  buyer_id uuid not null references users(user_id),
  deadline_at timestamptz not null,
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

create table rfq_suppliers (
  rfq_id uuid not null references rfqs(rfq_id) on delete cascade,
  supplier_id uuid not null references suppliers(supplier_id),
  invited_at timestamptz not null default now(),
  primary key (rfq_id, supplier_id)
);

create table submissions (
  submission_id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(rfq_id),
  supplier_id uuid not null references suppliers(supplier_id),
  status text not null,
  object_key text not null,
  sha256_hash text not null,
  sealed_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  check (status in ('uploaded', 'sealed', 'quarantined', 'opened', 'rejected'))
);

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

create index idx_rfqs_status on rfqs(status);
create index idx_rfqs_deadline_at on rfqs(deadline_at);
create index idx_submissions_rfq on submissions(rfq_id);
create index idx_audit_resource on audit_events(resource_type, resource_id);
create index idx_audit_occurred_at on audit_events(occurred_at);
