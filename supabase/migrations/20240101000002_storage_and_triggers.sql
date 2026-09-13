-- INFO DOCS - Storage Buckets and Bootstrap
-- Run with: supabase db push

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create infrastructure-photos bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'infrastructure-photos',
  'infrastructure-photos',
  false,
  52428800, -- 50MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Create infrastructure-documents bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'infrastructure-documents',
  'infrastructure-documents',
  false,
  52428800, -- 50MB
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
on conflict (id) do nothing;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Infrastructure Photos Policies
create policy "photos_select_approved" on storage.objects
  for select using (
    bucket_id = 'infrastructure-photos' and 
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and approval_status = 'APPROVED' 
      and account_status = 'APPROVED'
    )
  );

create policy "photos_insert_engineer" on storage.objects
  for insert with check (
    bucket_id = 'infrastructure-photos' and
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role in ('ENGINEER', 'ADMIN')
      and approval_status = 'APPROVED' 
      and account_status = 'APPROVED'
    )
  );

create policy "photos_update_own_or_admin" on storage.objects
  for update using (
    bucket_id = 'infrastructure-photos' and
    (exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'ADMIN'
    ) or owner = auth.uid())
  )
  with check (
    bucket_id = 'infrastructure-photos' and
    (exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'ADMIN'
    ) or owner = auth.uid())
  );

create policy "photos_delete_own_or_admin" on storage.objects
  for delete using (
    bucket_id = 'infrastructure-photos' and
    (exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'ADMIN'
    ) or owner = auth.uid())
  );

-- Infrastructure Documents Policies
create policy "documents_select_approved" on storage.objects
  for select using (
    bucket_id = 'infrastructure-documents' and 
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and approval_status = 'APPROVED' 
      and account_status = 'APPROVED'
    )
  );

create policy "documents_insert_engineer" on storage.objects
  for insert with check (
    bucket_id = 'infrastructure-documents' and
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role in ('ENGINEER', 'ADMIN')
      and approval_status = 'APPROVED' 
      and account_status = 'APPROVED'
    )
  );

create policy "documents_update_own_or_admin" on storage.objects
  for update using (
    bucket_id = 'infrastructure-documents' and
    (exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'ADMIN'
    ) or owner = auth.uid())
  )
  with check (
    bucket_id = 'infrastructure-documents' and
    (exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'ADMIN'
    ) or owner = auth.uid())
  );

create policy "documents_delete_own_or_admin" on storage.objects
  for delete using (
    bucket_id = 'infrastructure-documents' and
    (exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'ADMIN'
    ) or owner = auth.uid())
  );

-- ============================================
-- TRIGGER FOR USER PROFILE CREATION ON SIGNUP
-- ============================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, user_code, name, email, role, account_status, approval_status, is_active)
  values (
    new.id,
    'USR-' || upper(substring(new.id::text from 1 for 8)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'VIEWER',
    'PENDING',
    'PENDING',
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- TRIGGER FOR STATUS HISTORY
-- ============================================

create or replace function public.log_status_change()
returns trigger language plpgsql security definer as $$
declare
  v_old_status infrastructure_status;
  v_new_status infrastructure_status;
  v_record_type text;
  v_record_id uuid;
begin
  -- Determine record type and ID from table name
  v_record_type = TG_TABLE_NAME;
  v_record_id = new.id;
  
  -- Get old and new status
  if TG_OP = 'INSERT' then
    v_old_status = null;
    v_new_status = new.status;
  elsif TG_OP = 'UPDATE' then
    v_old_status = old.status;
    v_new_status = new.status;
  else
    return new;
  end if;
  
  -- Only log if status actually changed
  if v_old_status is distinct from v_new_status then
    insert into public.status_history (record_type, record_id, old_status, new_status, changed_by, reason)
    values (v_record_type, v_record_id, v_old_status, v_new_status, new.updated_by, 'Status changed via application');
  end if;
  
  return new;
end;
$$;

-- Apply status history triggers to infrastructure tables
create trigger log_sites_status before insert or update on public.sites
  for each row execute function public.log_status_change();
create trigger log_rooms_status before insert or update on public.rooms
  for each row execute function public.log_status_change();
create trigger log_racks_status before insert or update on public.racks
  for each row execute function public.log_status_change();
create trigger log_equipment_status before insert or update on public.equipment
  for each row execute function public.log_status_change();
create trigger log_equipment_ports_status before insert or update on public.equipment_ports
  for each row execute function public.log_status_change();
create trigger log_patch_panels_status before insert or update on public.patch_panels
  for each row execute function public.log_status_change();
create trigger log_patch_ports_status before insert or update on public.patch_ports
  for each row execute function public.log_status_change();
create trigger log_cables_status before insert or update on public.cables
  for each row execute function public.log_status_change();