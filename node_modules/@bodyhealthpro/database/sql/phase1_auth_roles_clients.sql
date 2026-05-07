-- Phase 1: auth, profiles, clientes with tenant isolation and RLS
-- Execute in Supabase SQL editor.

-- Drop everything to start fresh (this will cascade and remove old columns)
drop trigger if exists on_auth_user_confirm_email on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.clientes cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tenants cascade;

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  role text not null check (role in ('admin', 'cliente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  nome_normalizado text not null,
  telefone text,
  data_nascimento date not null,
  sexo text not null check (sexo in ('masculino', 'feminino')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists uq_clientes_tenant_nome_normalizado_ativo
  on public.clientes (tenant_id, nome_normalizado)
  where deleted_at is null;

create or replace function public.bootstrap_profile(
  user_id uuid,
  nome text,
  empresa_nome text
)
returns table (
  profile_id uuid,
  tenant_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  -- Create tenant
  insert into public.tenants (nome)
  values (empresa_nome)
  returning id into new_tenant_id;

  -- Create profile with admin role
  insert into public.profiles (id, tenant_id, nome, role)
  values (user_id, new_tenant_id, nome, 'admin')
  on conflict (id) do nothing;

  return query select user_id, new_tenant_id;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.confirm_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set email_confirmed_at = now()
  where id = new.id and email_confirmed_at is null;

  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  profile_nome text;
begin
  insert into public.tenants (nome)
  values (coalesce(new.raw_user_meta_data->>'company_name', 'Tenant ' || left(new.id::text, 8)))
  returning id into new_tenant_id;

  profile_nome := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Usuario'
  );

  insert into public.profiles (id, tenant_id, nome, role)
  values (new.id, new_tenant_id, profile_nome, 'admin')
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.set_cliente_tenant_and_created_by()
returns trigger
language plpgsql
as $$
declare
  profile_tenant uuid;
begin
  select p.tenant_id into profile_tenant
  from public.profiles p
  where p.id = auth.uid();

  if new.tenant_id is null then
    new.tenant_id = profile_tenant;
  end if;

  if new.created_by is null then
    new.created_by = auth.uid();
  end if;

  if new.nome_normalizado is null or length(trim(new.nome_normalizado)) = 0 then
    new.nome_normalizado = regexp_replace(lower(trim(new.nome)), '\\s+', ' ', 'g');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_clientes_updated_at on public.clientes;
create trigger trg_clientes_updated_at
before update on public.clientes
for each row execute function public.set_updated_at();

drop trigger if exists trg_clientes_defaults on public.clientes;
create trigger trg_clientes_defaults
before insert on public.clientes
for each row execute function public.set_cliente_tenant_and_created_by();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create trigger on_auth_user_confirm_email
after insert on auth.users
for each row execute function public.confirm_user_email();

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;

-- Profiles: each authenticated user can read and update only self.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Clientes: admin can CRUD in same tenant.
drop policy if exists clientes_select_admin_tenant on public.clientes;
create policy clientes_select_admin_tenant
  on public.clientes
  for select
  to authenticated
  using (
    tenant_id = (
      select p.tenant_id from public.profiles p where p.id = auth.uid()
    )
    and (
      select p.role from public.profiles p where p.id = auth.uid()
    ) = 'admin'
  );

drop policy if exists clientes_insert_admin_tenant on public.clientes;
create policy clientes_insert_admin_tenant
  on public.clientes
  for insert
  to authenticated
  with check (
    tenant_id = (
      select p.tenant_id from public.profiles p where p.id = auth.uid()
    )
    and (
      select p.role from public.profiles p where p.id = auth.uid()
    ) = 'admin'
  );

drop policy if exists clientes_update_admin_tenant on public.clientes;
create policy clientes_update_admin_tenant
  on public.clientes
  for update
  to authenticated
  using (
    tenant_id = (
      select p.tenant_id from public.profiles p where p.id = auth.uid()
    )
    and (
      select p.role from public.profiles p where p.id = auth.uid()
    ) = 'admin'
  )
  with check (
    tenant_id = (
      select p.tenant_id from public.profiles p where p.id = auth.uid()
    )
    and (
      select p.role from public.profiles p where p.id = auth.uid()
    ) = 'admin'
  );

drop policy if exists clientes_delete_admin_tenant on public.clientes;
create policy clientes_delete_admin_tenant
  on public.clientes
  for delete
  to authenticated
  using (
    tenant_id = (
      select p.tenant_id from public.profiles p where p.id = auth.uid()
    )
    and (
      select p.role from public.profiles p where p.id = auth.uid()
    ) = 'admin'
  );
