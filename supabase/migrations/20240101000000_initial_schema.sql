-- INFO DOCS - Initial Schema Migration
-- This migration creates all core tables, RLS policies, and storage buckets
-- Run with: supabase db push

-- ============================================
-- EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
create type user_role as enum ('ADMIN', 'ENGINEER', 'VIEWER');
create type account_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'DISABLED');
create type approval_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type infrastructure_status as enum ('PLANNED', 'INSTALLED', 'TESTED', 'VERIFIED', 'ISSUE', 'REMOVED', 'ARCHIVED');
create type cable_type as enum ('FIBER', 'COPPER', 'COAX', 'POWER', 'OTHER');
create type endpoint_type as enum ('EQUIPMENT_PORT', 'PATCH_PORT');
create type attachment_type as enum ('PHOTO', 'DOCUMENT');
create type document_type as enum ('INSTALLATION', 'TEST_REPORT', 'COMMISSIONING', 'VENDOR_DOC', 'DIAGRAM', 'INSPECTION', 'OTHER');
create type audit_action as enum (
  'USER_LOGIN', 'USER_LOGOUT', 'USER_SIGNUP', 'USER_APPROVED', 'USER_REJECTED',
  'USER_DISABLED', 'USER_REACTIVATED', 'USER_ROLE_CHANGED', 'USER_DELETED',
  'RECORD_CREATED', 'RECORD_UPDATED', 'RECORD_ARCHIVED', 'RECORD_DELETED',
  'STATUS_CHANGED', 'FILE_UPLOADED', 'FILE_DELETED', 'CABLE_CONNECTED', 'CABLE_DISCONNECTED'
);

-- ============================================
-- USERS TABLE (extends Supabase Auth)
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  user_code text not null unique,
  name text not null,
  email text not null,
  role user_role not null default 'VIEWER',
  account_status account_status not null default 'PENDING',
  approval_status approval_status not null default 'PENDING',
  is_active boolean not null default false,
  department text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  disabled_at timestamptz,
  disabled_by uuid references public.users(id),
  last_login_at timestamptz
);

-- Index for user lookups
create index idx_users_email on public.users(email);
create index idx_users_user_code on public.users(user_code);
create index idx_users_approval_status on public.users(approval_status);
create index idx_users_account_status on public.users(account_status);
create index idx_users_role on public.users(role);

-- ============================================
-- SITES
-- ============================================
create table public.sites (
  id uuid primary key default uuid_generate_v4(),
  site_id text not null unique,
  name text not null,
  description text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  latitude numeric,
  longitude numeric,
  status infrastructure_status not null default 'PLANNED',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

create index idx_sites_site_id on public.sites(site_id);
create index idx_sites_status on public.sites(status);

-- ============================================
-- ROOMS
-- ============================================
create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid not null references public.sites(id) on delete restrict,
  room_id text not null,
  name text not null,
  description text,
  room_type text,
  floor text,
  status infrastructure_status not null default 'PLANNED',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  unique (site_id, room_id)
);

create index idx_rooms_site_id on public.rooms(site_id);
create index idx_rooms_room_id on public.rooms(room_id);
create index idx_rooms_status on public.rooms(status);

-- ============================================
-- RACKS
-- ============================================
create table public.racks (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  rack_id text not null,
  name text not null,
  description text,
  rack_type text,
  height_u integer default 42,
  position integer,
  status infrastructure_status not null default 'PLANNED',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  unique (room_id, rack_id)
);

create index idx_racks_room_id on public.racks(room_id);
create index idx_racks_rack_id on public.racks(rack_id);
create index idx_racks_status on public.racks(status);

-- ============================================
-- EQUIPMENT
-- ============================================
create table public.equipment (
  id uuid primary key default uuid_generate_v4(),
  rack_id uuid not null references public.racks(id) on delete restrict,
  equipment_id text not null,
  name text not null,
  description text,
  equipment_type text,
  manufacturer text,
  model text,
  serial_number text,
  asset_tag text,
  position_u integer,
  height_u integer default 1,
  status infrastructure_status not null default 'PLANNED',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  unique (rack_id, equipment_id)
);

create index idx_equipment_rack_id on public.equipment(rack_id);
create index idx_equipment_equipment_id on public.equipment(equipment_id);
create index idx_equipment_status on public.equipment(status);
create index idx_equipment_serial on public.equipment(serial_number);
create index idx_equipment_asset_tag on public.equipment(asset_tag);

-- ============================================
-- EQUIPMENT PORTS
-- ============================================
create table public.equipment_ports (
  id uuid primary key default uuid_generate_v4(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  port_number text not null,
  port_name text,
  port_type text,
  speed text,
  protocol text,
  status infrastructure_status not null default 'PLANNED',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  unique (equipment_id, port_number)
);

create index idx_equipment_ports_equipment_id on public.equipment_ports(equipment_id);
create index idx_equipment_ports_status on public.equipment_ports(status);

-- ============================================
-- PATCH PANELS
-- ============================================
create table public.patch_panels (
  id uuid primary key default uuid_generate_v4(),
  rack_id uuid not null references public.racks(id) on delete restrict,
  panel_id text not null,
  name text not null,
  description text,
  panel_type text,
  port_count integer default 48,
  position_u integer,
  height_u integer default 1,
  status infrastructure_status not null default 'PLANNED',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  unique (rack_id, panel_id)
);

create index idx_patch_panels_rack_id on public.patch_panels(rack_id);
create index idx_patch_panels_panel_id on public.patch_panels(panel_id);
create index idx_patch_panels_status on public.patch_panels(status);

-- ============================================
-- PATCH PORTS
-- ============================================
create table public.patch_ports (
  id uuid primary key default uuid_generate_v4(),
  patch_panel_id uuid not null references public.patch_panels(id) on delete cascade,
  port_number text not null,
  port_name text,
  port_type text,
  status infrastructure_status not null default 'PLANNED',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  unique (patch_panel_id, port_number)
);

create index idx_patch_ports_patch_panel_id on public.patch_ports(patch_panel_id);
create index idx_patch_ports_status on public.patch_ports(status);

-- ============================================
-- CABLES
-- ============================================
create table public.cables (
  id uuid primary key default uuid_generate_v4(),
  cable_id text not null unique,
  cable_type cable_type not null,
  specification text,
  length_m numeric,
  length_ft numeric,
  quantity integer default 1,
  status infrastructure_status not null default 'PLANNED',
  notes text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

create index idx_cables_cable_id on public.cables(cable_id);
create index idx_cables_cable_type on public.cables(cable_type);
create index idx_cables_status on public.cables(status);

-- ============================================
-- CABLE ENDPOINTS
-- ============================================
create table public.cable_endpoints (
  id uuid primary key default uuid_generate_v4(),
  cable_id uuid not null references public.cables(id) on delete cascade,
  endpoint_label text not null check (endpoint_label in ('A', 'B')),
  endpoint_type endpoint_type not null,
  equipment_port_id uuid references public.equipment_ports(id) on delete set null,
  patch_port_id uuid references public.patch_ports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cable_id, endpoint_label),
  check (
    (endpoint_type = 'EQUIPMENT_PORT' and equipment_port_id is not null and patch_port_id is null) or
    (endpoint_type = 'PATCH_PORT' and patch_port_id is not null and equipment_port_id is null)
  )
);

create index idx_cable_endpoints_cable_id on public.cable_endpoints(cable_id);
create index idx_cable_endpoints_equipment_port on public.cable_endpoints(equipment_port_id);
create index idx_cable_endpoints_patch_port on public.cable_endpoints(patch_port_id);

-- ============================================
-- ATTACHMENTS
-- ============================================
create table public.attachments (
  id uuid primary key default uuid_generate_v4(),
  record_type text not null,
  record_id uuid not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by uuid not null references public.users(id),
  uploaded_at timestamptz not null default now(),
  description text,
  document_type document_type,
  attachment_type attachment_type not null
);

create index idx_attachments_record on public.attachments(record_type, record_id);
create index idx_attachments_uploaded_by on public.attachments(uploaded_by);
create index idx_attachments_type on public.attachments(attachment_type);

-- ============================================
-- NOTES
-- ============================================
create table public.notes (
  id uuid primary key default uuid_generate_v4(),
  record_type text not null,
  record_id uuid not null,
  content text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

create index idx_notes_record on public.notes(record_type, record_id);
create index idx_notes_created_by on public.notes(created_by);

-- ============================================
-- STATUS HISTORY
-- ============================================
create table public.status_history (
  id uuid primary key default uuid_generate_v4(),
  record_type text not null,
  record_id uuid not null,
  old_status infrastructure_status,
  new_status infrastructure_status not null,
  changed_by uuid not null references public.users(id),
  changed_at timestamptz not null default now(),
  reason text
);

create index idx_status_history_record on public.status_history(record_type, record_id);
create index idx_status_history_changed_by on public.status_history(changed_by);
create index idx_status_history_changed_at on public.status_history(changed_at);

-- ============================================
-- QR CODES
-- ============================================
create table public.qr_codes (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.users(id),
  expires_at timestamptz,
  is_active boolean not null default true,
  unique (entity_type, entity_id)
);

create index idx_qr_codes_token on public.qr_codes(token);
create index idx_qr_codes_entity on public.qr_codes(entity_type, entity_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger update_sites_updated_at before update on public.sites
  for each row execute function public.update_updated_at_column();
create trigger update_rooms_updated_at before update on public.rooms
  for each row execute function public.update_updated_at_column();
create trigger update_racks_updated_at before update on public.racks
  for each row execute function public.update_updated_at_column();
create trigger update_equipment_updated_at before update on public.equipment
  for each row execute function public.update_updated_at_column();
create trigger update_equipment_ports_updated_at before update on public.equipment_ports
  for each row execute function public.update_updated_at_column();
create trigger update_patch_panels_updated_at before update on public.patch_panels
  for each row execute function public.update_updated_at_column();
create trigger update_patch_ports_updated_at before update on public.patch_ports
  for each row execute function public.update_updated_at_column();
create trigger update_cables_updated_at before update on public.cables
  for each row execute function public.update_updated_at_column();
create trigger update_cable_endpoints_updated_at before update on public.cable_endpoints
  for each row execute function public.update_updated_at_column();
create trigger update_notes_updated_at before update on public.notes
  for each row execute function public.update_updated_at_column();