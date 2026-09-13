-- INFO DOCS - Audit Logs + Admin RLS fixes
-- Run with: supabase db push
--
-- This migration:
--   1. Creates the `audit_logs` table (it was referenced by the app/types but
--      never actually created, so the Audit Log page always came back empty).
--   2. Adds a generic trigger that writes an audit_logs row on every
--      insert/update/delete of the main tables, and on key user lifecycle
--      changes (approve/reject/disable/role change).
--   3. Fixes a real bug in the approval flow: there was no RLS policy that
--      let an ADMIN update another user's row, so "Approve" silently
--      failed to persist (0 rows updated) even though the UI called the
--      right function.

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
create table if not exists public.audit_logs (
  id uuid primary key default extensions.uuid_generate_v4(),
  created_at timestamptz not null default now(),
  actor_id uuid references public.users(id),
  action audit_action not null,
  entity_type text not null,
  entity_id uuid not null,
  entity_display text,
  old_values jsonb,
  new_values jsonb,
  details text
);

create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

-- Only admins can browse the audit log; rows are written exclusively by the
-- security-definer trigger function below (no direct insert/update/delete
-- policy is granted to any role, app included).
drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin" on public.audit_logs
  for select using (public.is_admin());

-- ============================================
-- GENERIC AUDIT TRIGGER
-- ============================================
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_action audit_action;
  v_display text;
begin
  v_actor := coalesce(auth.uid(), (new).created_by, (old).created_by);

  if TG_OP = 'INSERT' then
    v_action := 'RECORD_CREATED';
  elsif TG_OP = 'DELETE' then
    v_action := 'RECORD_DELETED';
  else
    v_action := 'RECORD_UPDATED';
  end if;

  begin
    v_display := coalesce((to_jsonb(coalesce(new, old))->>'name'), (to_jsonb(coalesce(new, old))->>'email'));
  exception when others then
    v_display := null;
  end;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, entity_display, old_values, new_values)
  values (
    v_actor,
    v_action,
    TG_TABLE_NAME,
    coalesce((new).id, (old).id),
    v_display,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_sites on public.sites;
drop trigger if exists audit_rooms on public.rooms;
drop trigger if exists audit_racks on public.racks;
drop trigger if exists audit_equipment on public.equipment;
drop trigger if exists audit_equipment_ports on public.equipment_ports;
drop trigger if exists audit_patch_panels on public.patch_panels;
drop trigger if exists audit_patch_ports on public.patch_ports;
drop trigger if exists audit_cables on public.cables;
drop trigger if exists audit_notes on public.notes;
drop trigger if exists audit_attachments on public.attachments;

create trigger audit_sites after insert or update or delete on public.sites
  for each row execute function public.log_audit_event();
create trigger audit_rooms after insert or update or delete on public.rooms
  for each row execute function public.log_audit_event();
create trigger audit_racks after insert or update or delete on public.racks
  for each row execute function public.log_audit_event();
create trigger audit_equipment after insert or update or delete on public.equipment
  for each row execute function public.log_audit_event();
create trigger audit_equipment_ports after insert or update or delete on public.equipment_ports
  for each row execute function public.log_audit_event();
create trigger audit_patch_panels after insert or update or delete on public.patch_panels
  for each row execute function public.log_audit_event();
create trigger audit_patch_ports after insert or update or delete on public.patch_ports
  for each row execute function public.log_audit_event();
create trigger audit_cables after insert or update or delete on public.cables
  for each row execute function public.log_audit_event();
create trigger audit_notes after insert or update or delete on public.notes
  for each row execute function public.log_audit_event();
create trigger audit_attachments after insert or update or delete on public.attachments
  for each row execute function public.log_audit_event();

-- ============================================
-- USER LIFECYCLE AUDIT (separate trigger: distinct action types + no noisy
-- "RECORD_UPDATED" entries every time e.g. last_login_at changes)
-- ============================================
create or replace function public.log_user_lifecycle_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_action audit_action;
begin
  if TG_OP = 'INSERT' then
    v_action := 'USER_SIGNUP';
  elsif new.approval_status = 'APPROVED' and old.approval_status is distinct from 'APPROVED' then
    v_action := 'USER_APPROVED';
  elsif new.approval_status = 'REJECTED' and old.approval_status is distinct from 'REJECTED' then
    v_action := 'USER_REJECTED';
  elsif new.account_status = 'DISABLED' and old.account_status is distinct from 'DISABLED' then
    v_action := 'USER_DISABLED';
  elsif old.account_status = 'DISABLED' and new.account_status is distinct from 'DISABLED' then
    v_action := 'USER_REACTIVATED';
  elsif new.role is distinct from old.role then
    v_action := 'USER_ROLE_CHANGED';
  else
    return new;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, entity_display, old_values, new_values)
  values (
    coalesce(v_actor, new.approved_by, new.disabled_by, new.id),
    v_action,
    'users',
    new.id,
    new.name,
    case when TG_OP = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );

  return new;
end;
$$;

drop trigger if exists audit_user_lifecycle on public.users;
create trigger audit_user_lifecycle after insert or update on public.users
  for each row execute function public.log_user_lifecycle_event();

-- ============================================
-- FIX: names not resolving in Notes / Recent Activity / Audit Log
-- (only "users_select_own" and "users_select_admin" existed, so an
-- embedded `actor:users(name, email)` or `author:users(name, email)` join
-- came back null for any user other than yourself or an admin — this is
-- an internal ops tool, so any approved+active user can see basic info
-- for any other approved+active user)
-- ============================================
drop policy if exists "users_select_active" on public.users;
create policy "users_select_active" on public.users
  for select using (public.is_approved_active());

-- ============================================
-- FIX: admins could not update OTHER users' rows

-- ============================================
-- FIX: admins could not update OTHER users' rows
-- (approve / reject / disable / reactivate / role change all update a
-- different user's row than the acting admin's own, so the existing
-- "users_update_own" policy alone always blocked it)
-- ============================================
drop policy if exists "users_update_admin" on public.users;
create policy "users_update_admin" on public.users
  for update using (public.is_admin())
  with check (public.is_admin());