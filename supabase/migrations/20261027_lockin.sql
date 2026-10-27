-- Lock-in migration: additive only. Safe to re-run.

-- 1. Profiles: add email, create profile automatically for every new auth user
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := new.raw_user_meta_data->>'role';
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email,
    case when meta_role in ('admin', 'technician', 'manager') then meta_role::user_role else 'admin'::user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users created before the trigger
insert into public.profiles (id, full_name, email, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
  u.email,
  case when u.raw_user_meta_data->>'role' in ('admin', 'technician', 'manager')
       then (u.raw_user_meta_data->>'role')::user_role else 'admin'::user_role end
from auth.users u
on conflict (id) do nothing;

-- 2. Orders: schedule, reschedule tracking, server-side order numbers
alter table public.orders add column if not exists scheduled_at timestamptz;
alter table public.orders add column if not exists reschedule_count integer not null default 0;

create sequence if not exists public.order_no_seq;
select setval(
  'public.order_no_seq',
  greatest(
    1240,
    coalesce((select max(substring(order_no from 6)::int) from public.orders where order_no ~ '^ORDER[0-9]+$'), 1240)
  )
);
alter table public.orders alter column order_no set default ('ORDER' || nextval('public.order_no_seq'));

update public.orders
set scheduled_at = date_trunc('hour', created_at) + interval '3 hours'
where scheduled_at is null;

-- 3. Completions: itemised extra charges (extra_charges stays the total)
alter table public.service_completions add column if not exists extra_items jsonb not null default '[]'::jsonb;

-- 4. Technicians: link to a login profile
alter table public.technicians add column if not exists profile_id uuid references public.profiles(id) on delete set null;

-- 5. Notifications (WhatsApp deep links + internal alerts)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'internal')),
  audience text not null check (audience in ('customer', 'technician', 'manager', 'admin')),
  event text not null,
  recipient text,
  message text not null,
  link text,
  status text not null default 'ready' check (status in ('ready', 'sent', 'read')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.notifications enable row level security;
drop policy if exists "authenticated users can access notifications" on public.notifications;
create policy "authenticated users can access notifications" on public.notifications
  for all to authenticated using (true) with check (true);
drop policy if exists "prototype_anon_notifications" on public.notifications;
create policy "prototype_anon_notifications" on public.notifications
  for all to anon using (true) with check (true);

-- Profiles readable in demo mode (names for activity timeline)
drop policy if exists "prototype_anon_profiles_read" on public.profiles;
create policy "prototype_anon_profiles_read" on public.profiles
  for select to anon using (true);

-- 6. Indexes for the controlled AI queries and dashboards
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_technician_idx on public.orders (assigned_technician_id);
create index if not exists completions_completed_at_idx on public.service_completions (completed_at);
create index if not exists activity_logs_order_idx on public.activity_logs (order_id, created_at);
create index if not exists notifications_created_idx on public.notifications (created_at desc);

-- 7. Reviewer accounts (@demo.sejuksejuk.app): role from the email, technician linked automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := new.raw_user_meta_data->>'role';
  resolved user_role;
  display text := coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1));
begin
  if new.email = 'admin@demo.sejuksejuk.app' then resolved := 'admin'; display := 'Nurul Aisyah';
  elsif new.email = 'manager@demo.sejuksejuk.app' then resolved := 'manager'; display := 'Rizal Kamal';
  elsif new.email = 'ali@demo.sejuksejuk.app' then resolved := 'technician'; display := 'Ali';
  elsif meta_role in ('admin', 'technician', 'manager') then resolved := meta_role::user_role;
  else resolved := 'admin';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (new.id, display, new.email, resolved)
  on conflict (id) do nothing;

  if new.email = 'ali@demo.sejuksejuk.app' then
    update public.technicians set profile_id = new.id where name = 'Ali';
  end if;
  return new;
end;
$$;

-- 8. Payment receipt photo is stored separately from job evidence.
alter table public.service_files add column if not exists kind text not null default 'evidence';
