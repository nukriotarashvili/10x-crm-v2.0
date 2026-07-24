-- 10X CRM: clients table (run in Supabase SQL Editor or via CLI)

create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    owner_email text not null,
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

create index if not exists clients_owner_email_idx on public.clients (owner_email);
create index if not exists clients_created_at_idx on public.clients (created_at desc);

alter table public.clients enable row level security;

-- DEV: open access for anon key + local CRM auth. Tighten when using Supabase Auth.
create policy "crm_clients_anon_all_dev"
    on public.clients
    for all
    to anon, authenticated
    using (true)
    with check (true);
