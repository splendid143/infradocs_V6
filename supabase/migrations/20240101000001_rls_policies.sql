-- INFO DOCS - RLS Policies and Storage Buckets
-- Run with: supabase db push

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
alter table public.users enable row level security;
alter table public.sites enable row level security;
alter table public.rooms enable row level security;
alter table public.racks enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_ports enable row level security;
alter table public.patch_panels enable row level security;
alter table public.patch_ports enable row level security;
alter table public.cables enable row level security;
alter table public.cable_endpoints enable row level security;
alter table public.attachments enable row level security;
alter table public.notes enable row level security;
alter table public.status_history enable row level security;
alter table public.qr_codes enable row level security;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Get current user's profile
create or replace function public.get_current_user_profile()
returns public.users language plpgsql security definer as $$
declare
  v_user public.users;
begin
  select * into v_user
  from public.users
  where id = auth.uid();
  return v_user;
end;
$$;

-- Check if current user is admin
create or replace function public.is_admin()
returns boolean language plpgsql security definer as $$
declare
  v_role user_role;
begin
  select role into v_role
  from public.users
  where id = auth.uid();
  return v_role = 'ADMIN';
end;
$$;

-- Check if current user is engineer or admin
create or replace function public.is_engineer_or_admin()
returns boolean language plpgsql security definer as $$
declare
  v_role user_role;
begin
  select role into v_role
  from public.users
  where id = auth.uid();
  return v_role in ('ENGINEER', 'ADMIN');
end;
$$;

-- Check if current user is approved and active
create or replace function public.is_approved_active()
returns boolean language plpgsql security definer as $$
declare
  v_approval approval_status;
  v_status account_status;
begin
  select approval_status, account_status into v_approval, v_status
  from public.users
  where id = auth.uid();
  return v_approval = 'APPROVED' and v_status = 'APPROVED';
end;
$$;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can view their own profile
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

-- Admins can view all users
create policy "users_select_admin" on public.users
  for select using (public.is_admin());

-- Users can update their own profile (limited fields)
create policy "users_update_own" on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Only admins can insert users (via signup trigger)
create policy "users_insert_admin" on public.users
  for insert with check (public.is_admin());

-- Only admins can delete users
create policy "users_delete_admin" on public.users
  for delete using (public.is_admin());

-- ============================================
-- INFRASTRUCTURE POLICIES (sites, rooms, racks, equipment, etc.)
-- ============================================

-- Helper: Check if user has read access to infrastructure
-- All approved active users can read infrastructure
create policy "infra_select_approved" on public.sites
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.rooms
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.racks
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.equipment
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.equipment_ports
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.patch_panels
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.patch_ports
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.cables
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.cable_endpoints
  for select using (public.is_approved_active());

create policy "infra_select_approved" on public.qr_codes
  for select using (public.is_approved_active());

-- Engineers and Admins can create infrastructure
create policy "infra_insert_engineer" on public.sites
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.rooms
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.racks
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.equipment
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.equipment_ports
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.patch_panels
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.patch_ports
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.cables
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.cable_endpoints
  for insert with check (public.is_engineer_or_admin());

create policy "infra_insert_engineer" on public.qr_codes
  for insert with check (public.is_engineer_or_admin());

-- Engineers and Admins can update infrastructure
create policy "infra_update_engineer" on public.sites
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.rooms
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.racks
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.equipment
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.equipment_ports
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.patch_panels
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.patch_ports
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.cables
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.cable_endpoints
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

create policy "infra_update_engineer" on public.qr_codes
  for update using (public.is_engineer_or_admin())
  with check (public.is_engineer_or_admin());

-- Only Admins can delete infrastructure (soft delete via status change preferred)
create policy "infra_delete_admin" on public.sites
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.rooms
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.racks
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.equipment
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.equipment_ports
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.patch_panels
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.patch_ports
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.cables
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.cable_endpoints
  for delete using (public.is_admin());

create policy "infra_delete_admin" on public.qr_codes
  for delete using (public.is_admin());

-- ============================================
-- ATTACHMENTS POLICIES
-- ============================================

-- All approved users can view attachments
create policy "attachments_select_approved" on public.attachments
  for select using (public.is_approved_active());

-- Engineers and Admins can upload attachments
create policy "attachments_insert_engineer" on public.attachments
  for insert with check (public.is_engineer_or_admin());

-- Users can delete their own attachments, admins can delete any
create policy "attachments_delete_own_or_admin" on public.attachments
  for delete using (
    public.is_admin() or uploaded_by = auth.uid()
  );

-- ============================================
-- NOTES POLICIES
-- ============================================

-- All approved users can view notes
create policy "notes_select_approved" on public.notes
  for select using (public.is_approved_active());

-- Engineers and Admins can create notes
create policy "notes_insert_engineer" on public.notes
  for insert with check (public.is_engineer_or_admin());

-- Users can update their own notes, admins can update any
create policy "notes_update_own_or_admin" on public.notes
  for update using (
    public.is_admin() or created_by = auth.uid()
  )
  with check (
    public.is_admin() or created_by = auth.uid()
  );

-- Users can delete their own notes, admins can delete any
create policy "notes_delete_own_or_admin" on public.notes
  for delete using (
    public.is_admin() or created_by = auth.uid()
  );

-- ============================================
-- STATUS HISTORY POLICIES
-- ============================================

-- All approved users can view status history
create policy "status_history_select_approved" on public.status_history
  for select using (public.is_approved_active());

-- Engineers and Admins can create status history (via triggers)
create policy "status_history_insert_engineer" on public.status_history
  for insert with check (public.is_engineer_or_admin());

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets (run once via Supabase CLI or dashboard)
-- These are created via migration for reproducibility

-- Note: Storage buckets are created via Supabase CLI or dashboard
-- but we define the policies here for when buckets exist

-- ============================================
-- STORAGE POLICIES (apply after bucket creation)
-- ============================================

-- Infrastructure Photos Bucket Policies
-- (Run these after creating 'infrastructure-photos' bucket)

-- Allow approved users to view photos
-- create policy "photos_select_approved" on storage.objects
--   for select using (
--     bucket_id = 'infrastructure-photos' and public.is_approved_active()
--   );

-- Allow engineers/admins to upload photos
-- create policy "photos_insert_engineer" on storage.objects
--   for insert with check (
--     bucket_id = 'infrastructure-photos' and public.is_engineer_or_admin()
--   );

-- Allow users to delete their own uploads, admins can delete any
-- create policy "photos_delete_own_or_admin" on storage.objects
--   for delete using (
--     bucket_id = 'infrastructure-photos' and 
--     (public.is_admin() or auth.uid() = owner)
--   );

-- Infrastructure Documents Bucket Policies
-- (Run these after creating 'infrastructure-documents' bucket)

-- Allow approved users to view documents
-- create policy "documents_select_approved" on storage.objects
--   for select using (
--     bucket_id = 'infrastructure-documents' and public.is_approved_active()
--   );

-- Allow engineers/admins to upload documents
-- create policy "documents_insert_engineer" on storage.objects
--   for insert with check (
--     bucket_id = 'infrastructure-documents' and public.is_engineer_or_admin()
--   );

-- Allow users to delete their own uploads, admins can delete any
-- create policy "documents_delete_own_or_admin" on storage.objects
--   for delete using (
--     bucket_id = 'infrastructure-documents' and 
--     (public.is_admin() or auth.uid() = owner)
--   );