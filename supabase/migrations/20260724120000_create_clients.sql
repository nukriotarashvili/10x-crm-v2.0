-- 10X CRM: clients table (run in Supabase SQL Editor or via CLI)
-- Safe to re-run: upgrades an existing `clients` table missing columns (e.g. owner_email).

create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    owner_email text not null default '',
    name text not null,
    email text not null,
    phone text default '',
    company text default '',
    status text not null default 'Lead'
        check (status in ('Lead', 'Contacted', 'Won', 'Lost')),
    deal_value numeric not null default 0 check (deal_value >= 0),
    image text,
    notes jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

-- Older schemas: table existed before owner_email / other fields were added.
alter table public.clients add column if not exists owner_email text;
alter table public.clients add column if not exists phone text default '';
alter table public.clients add column if not exists company text default '';
alter table public.clients add column if not exists status text default 'Lead';
alter table public.clients add column if not exists deal_value numeric default 0;
alter table public.clients add column if not exists image text;
alter table public.clients add column if not exists notes jsonb default '[]'::jsonb;
alter table public.clients add column if not exists created_at timestamptz default now();

update public.clients
set owner_email = coalesce(nullif(trim(owner_email), ''), email)
where owner_email is null or trim(owner_email) = '';

update public.clients set phone = '' where phone is null;
update public.clients set company = '' where company is null;
update public.clients set status = 'Lead' where status is null;
update public.clients set deal_value = 0 where deal_value is null;
update public.clients set notes = '[]'::jsonb where notes is null;
update public.clients set created_at = now() where created_at is null;

alter table public.clients alter column owner_email set default '';
alter table public.clients alter column owner_email set not null;

create index if not exists clients_owner_email_idx on public.clients (owner_email);
create index if not exists clients_created_at_idx on public.clients (created_at desc);

alter table public.clients enable row level security;

drop policy if exists "crm_clients_anon_all_dev" on public.clients;

-- DEV: open access for anon key + local CRM auth. Tighten when using Supabase Auth.
create policy "crm_clients_anon_all_dev"
    on public.clients
    for all
    to anon, authenticated
    using (true)
    with check (true);
