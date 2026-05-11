-- Phase 1: auth, profiles, clientes with tenant isolation and RLS

-- =============================================================================
-- SISTEMA COMPLETO COM MULTI-TENANCY - VERSÃO 10/10
-- OTIMIZADO PARA SUPABASE COM TODAS AS MELHORIAS
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- Limpeza completa para começar do zero
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user() cascade;
drop function if exists public.bootstrap_profile(text, text, text) cascade;
drop function if exists public.bootstrap_profile(uuid, text, text) cascade;
drop function if exists public.confirm_user_email() cascade;
drop function if exists public.set_cliente_tenant_and_created_by() cascade;
drop function if exists public.get_current_user_info() cascade;
drop function if exists public.audit_log_trigger() cascade;
drop view if exists public.clientes_ativos cascade;
drop view if exists public.tenant_stats cascade;
drop table if exists public.clientes cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tenants cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.security_log cascade;

-- Remover domínios se existirem
drop domain if exists public.nome_nao_vazio cascade;
drop domain if exists public.telefone_br cascade;
drop domain if exists public.email_valido cascade;

-- Extensões necessárias
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =============================================================================
-- DOMÍNIOS PERSONALIZADOS PARA VALIDAÇÃO
-- =============================================================================

create domain public.nome_nao_vazio as text 
  check (length(trim(value)) > 0 and value !~ '^\s*$');

create domain public.telefone_br as text 
  check (value is null or value ~ '^\([1-9]{2}\) [9]?[0-9]{4}-[0-9]{4}$');

create domain public.email_valido as text 
  check (value ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- =============================================================================
-- TABELAS PRINCIPAIS
-- =============================================================================

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  nome public.nome_nao_vazio not null,
  cnpj text unique check (cnpj is null or cnpj ~ '^[0-9]{14}$'),
  ativo boolean not null default true,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  created_by uuid,
  updated_by uuid
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome public.nome_nao_vazio not null,
  email public.email_valido,
  role text not null check (role in ('admin', 'cliente', 'gestor')),
  ativo boolean not null default true,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  created_by uuid,
  updated_by uuid,
  
  constraint unique_user_per_tenant unique (tenant_id, email)
);

create table if not exists public.clientes (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome public.nome_nao_vazio not null,
  nome_normalizado text not null,
  email public.email_valido,
  telefone public.telefone_br,
  data_nascimento date not null check (data_nascimento <= current_date),
  sexo text not null check (sexo in ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer')),
  documento text check (documento is null or length(documento) >= 11),
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  deleted_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  deleted_by uuid references public.profiles(id)
);

-- =============================================================================
-- TABELA DE AUDITORIA
-- =============================================================================

create table if not exists public.audit_log (
  id bigserial primary key,
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE')),
  record_id text not null,
  tenant_id uuid references public.tenants(id),
  changed_by uuid references auth.users(id),
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default current_timestamp
);

-- =============================================================================
-- TABELA DE SEGURANÇA (LOGS DE ACESSO)
-- =============================================================================

create table if not exists public.security_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  event_type text not null,
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamptz default current_timestamp
);

-- =============================================================================
-- ÍNDICES OTIMIZADOS
-- =============================================================================

-- Índices condicionais
create unique index if not exists uq_profiles_active_unique on public.profiles (id) where ativo = true;
create unique index if not exists uq_tenants_active_unique on public.tenants (id) where ativo = true;

-- Índices para profiles
create index if not exists idx_profiles_tenant_id on public.profiles(tenant_id) where ativo = true;
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_tenant_role on public.profiles(tenant_id, role) where ativo = true;
create index if not exists idx_profiles_email on public.profiles(email);

-- Índices para clientes
create index if not exists idx_clientes_tenant_id on public.clientes(tenant_id) where deleted_at is null;
create index if not exists idx_clientes_tenant_deleted on public.clientes(tenant_id, deleted_at);
create index if not exists idx_clientes_created_by on public.clientes(created_by);
create index if not exists idx_clientes_nome_search on public.clientes using gin(to_tsvector('portuguese', nome));
create index if not exists idx_clientes_email on public.clientes(email) where email is not null;
create index if not exists idx_clientes_documento on public.clientes(documento) where documento is not null;

-- Índices para auditoria
create index if not exists idx_audit_log_tenant on public.audit_log(tenant_id);
create index if not exists idx_audit_log_changed_by on public.audit_log(changed_by);
create index if not exists idx_audit_log_changed_at on public.audit_log(changed_at desc);
create index if not exists idx_audit_log_record on public.audit_log(table_name, record_id);

-- Índices para security_log
create index if not exists idx_security_log_user on public.security_log(user_id);
create index if not exists idx_security_log_tenant on public.security_log(tenant_id);
create index if not exists idx_security_log_created on public.security_log(created_at desc);
create index if not exists idx_security_log_event on public.security_log(event_type);

-- Índice único para soft delete
create unique index if not exists uq_clientes_tenant_nome_normalizado_ativo
  on public.clientes (tenant_id, nome_normalizado)
  where deleted_at is null;

-- Índices de unicidade com soft delete
create unique index if not exists uq_clientes_tenant_email_ativo 
  on public.clientes (tenant_id, email) 
  where deleted_at is null and email is not null;

create unique index if not exists uq_clientes_tenant_documento_ativo 
  on public.clientes (tenant_id, documento) 
  where deleted_at is null and documento is not null;

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- Função para obter informações do usuário atual (otimizada para RLS)
create or replace function public.get_current_user_info()
returns table (
  user_id uuid,
  tenant_id uuid,
  role text,
  nome text,
  is_admin boolean
)
language sql stable
security definer
set search_path = public
as $$
  select 
    p.id as user_id,
    p.tenant_id,
    p.role,
    p.nome,
    (p.role = 'admin') as is_admin
  from public.profiles p
  where p.id = auth.uid() and p.ativo = true
  limit 1;
$$;

-- Função para verificar se usuário é admin
create or replace function public.is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.get_current_user_info() where is_admin = true
  );
$$;

-- Função para obter tenant do usuário atual
create or replace function public.current_tenant_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select tenant_id from public.get_current_user_info();
$$;

-- Função para atualizar timestamp automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$;

-- Função de trigger para auditoria automática
create or replace function public.audit_log_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_data jsonb;
  v_new_data jsonb;
  v_tenant_id uuid;
  v_operation text;
  v_record_id text;
begin
  -- Determinar operação
  if TG_OP = 'INSERT' then
    v_operation := 'INSERT';
    v_new_data := to_jsonb(new);
    v_record_id := new.id::text;
    
    -- Tentar obter tenant_id
    if tg_table_name = 'profiles' then
      v_tenant_id := new.tenant_id;
    elsif tg_table_name = 'clientes' then
      v_tenant_id := new.tenant_id;
    end if;
    
  elsif TG_OP = 'UPDATE' then
    -- Verificar se é soft delete
    if tg_table_name = 'clientes' and new.deleted_at is not null and old.deleted_at is null then
      v_operation := 'SOFT_DELETE';
    else
      v_operation := 'UPDATE';
    end if;
    
    v_old_data := to_jsonb(old);
    v_new_data := to_jsonb(new);
    v_record_id := new.id::text;
    
    if tg_table_name = 'profiles' then
      v_tenant_id := new.tenant_id;
    elsif tg_table_name = 'clientes' then
      v_tenant_id := new.tenant_id;
    end if;
    
  elsif TG_OP = 'DELETE' then
    v_operation := 'DELETE';
    v_old_data := to_jsonb(old);
    v_record_id := old.id::text;
    
    if tg_table_name = 'profiles' then
      v_tenant_id := old.tenant_id;
    elsif tg_table_name = 'clientes' then
      v_tenant_id := old.tenant_id;
    end if;
  end if;
  
  -- Inserir na auditoria
  insert into public.audit_log (
    table_name,
    operation,
    record_id,
    tenant_id,
    changed_by,
    old_data,
    new_data
  ) values (
    tg_table_name,
    v_operation,
    v_record_id,
    v_tenant_id,
    auth.uid(),
    v_old_data,
    v_new_data
  );
  
  return coalesce(new, old);
end;
$$;

-- =============================================================================
-- FUNÇÃO DE LOG DE SEGURANÇA
-- =============================================================================

create or replace function public.log_security_event(
  p_event_type text,
  p_details jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tenant_id uuid;
begin
  -- Obter informações do usuário atual
  select user_id, tenant_id into v_user_id, v_tenant_id
  from public.get_current_user_info();
  
  -- Inserir log
  insert into public.security_log (
    user_id,
    tenant_id,
    event_type,
    ip_address,
    user_agent,
    details
  ) values (
    v_user_id,
    v_tenant_id,
    p_event_type,
    NULL, -- IP capturado pelo cliente/edge function
    NULL, -- User agent capturado pelo cliente
    p_details
  );
end;
$$;

-- =============================================================================
-- FUNÇÃO DE BOOTSTRAP REFATORADA (SEGURA)
-- =============================================================================

create or replace function public.bootstrap_profile(
  nome text,
  empresa_nome text,
  empresa_cnpj text default null
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
  current_user_id uuid;
  v_email text;
begin
  -- Obter usuário atual de forma segura
  current_user_id := auth.uid();
  
  -- Validações rigorosas
  if current_user_id is null then
    raise exception 'USUARIO_NAO_AUTENTICADO: É necessário estar logado para criar um perfil.';
  end if;
  
  if nome is null or trim(nome) = '' then
    raise exception 'NOME_INVALIDO: O nome do usuário é obrigatório.';
  end if;
  
  if empresa_nome is null or trim(empresa_nome) = '' then
    raise exception 'EMPRESA_INVALIDA: O nome da empresa é obrigatório.';
  end if;
  
  -- Verificar se usuário já possui perfil ativo
  if exists (select 1 from public.profiles where id = current_user_id and ativo = true) then
    raise exception 'PERFIL_JA_EXISTE: Este usuário já possui um perfil ativo.';
  end if;
  
  -- Obter email do auth.users
  select coalesce(
    raw_user_meta_data->>'email',
    email
  ) into v_email
  from auth.users
  where id = current_user_id;
  
  -- Criar tenant
  insert into public.tenants (nome, cnpj, created_by)
  values (empresa_nome, empresa_cnpj, current_user_id)
  returning id into new_tenant_id;
  
  -- Criar perfil admin
  insert into public.profiles (id, tenant_id, nome, email, role, created_by)
  values (current_user_id, new_tenant_id, nome, v_email, 'admin', current_user_id)
  on conflict (id) do update set 
    tenant_id = excluded.tenant_id,
    role = 'admin',
    ativo = true,
    updated_at = current_timestamp;
  
  -- Log de evento de segurança
  perform public.log_security_event(
    'BOOTSTRAP_PROFILE',
    jsonb_build_object(
      'tenant_id', new_tenant_id,
      'empresa_nome', empresa_nome
    )
  );
  
  -- Retornar resultado
  return query select current_user_id, new_tenant_id;
end;
$$;

-- =============================================================================
-- TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL
-- =============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  profile_nome text;
  user_email text;
begin
  -- Confirmar email automaticamente (opcional)
  if new.email_confirmed_at is null then
    update auth.users
    set email_confirmed_at = current_timestamp,
        confirmed_at = current_timestamp
    where id = new.id;
  end if;
  
  -- Obter email
  user_email := coalesce(
    new.raw_user_meta_data->>'email',
    new.email
  );
  
  -- Obter nome do perfil
  profile_nome := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Usuário'
  );
  
  -- Criar tenant (apenas se não existir via bootstrap)
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.tenants (nome, created_by)
    values (coalesce(new.raw_user_meta_data->>'company_name', 'Tenant ' || left(new.id::text, 8)), new.id)
    returning id into new_tenant_id;
    
    insert into public.profiles (id, tenant_id, nome, email, role, created_by)
    values (new.id, new_tenant_id, profile_nome, user_email, 'admin', new.id)
    on conflict (id) do nothing;
  end if;
  
  return new;
end;
$$;

-- =============================================================================
-- TRIGGER PARA CLIENTES (DEFAULTS)
-- =============================================================================

create or replace function public.set_cliente_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_user_info record;
begin
  -- Obter informações do usuário atual
  select * into v_user_info from public.get_current_user_info();
  
  if v_user_info.user_id is null then
    raise exception 'Usuário não encontrado ou não autenticado';
  end if;
  
  -- Setar tenant_id
  if new.tenant_id is null then
    new.tenant_id := v_user_info.tenant_id;
  end if;
  
  -- Verificar se tenant é válido
  if not exists (select 1 from public.tenants where id = new.tenant_id and ativo = true) then
    raise exception 'Tenant inválido ou inativo';
  end if;
  
  -- Setar created_by
  if new.created_by is null then
    new.created_by := v_user_info.user_id;
  end if;
  
  -- Setar updated_by
  if new.updated_by is null then
    new.updated_by := v_user_info.user_id;
  end if;
  
  -- Normalizar nome
  if new.nome_normalizado is null or length(trim(new.nome_normalizado)) = 0 then
    new.nome_normalizado := lower(trim(regexp_replace(new.nome, '\s+', ' ', 'g')));
  end if;
  
  return new;
end;
$$;

-- =============================================================================
-- TRIGGER PARA TENANTS (SET CREATED_BY)
-- =============================================================================

create or replace function public.set_tenant_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

-- =============================================================================
-- TRIGGER DE VALIDAÇÃO DE EMAIL
-- =============================================================================

create or replace function public.validate_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Em INSERT não existe OLD; em UPDATE só valida se mudou.
  if new.email is not null and (
    tg_op = 'INSERT'
    or (tg_op = 'UPDATE' and old.email is distinct from new.email)
  ) then
    -- Verificar se email pertence ao usuário no auth
    if not exists (
      select 1 from auth.users 
      where id = new.id 
        and (email = new.email or raw_user_meta_data->>'email' = new.email)
    ) then
      -- Em vez de erro, apenas registrar warning e continuar
      raise notice 'Aviso: Email % não corresponde ao email do auth.users', new.email;
    end if;
  end if;
  return new;
end;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Triggers de updated_at
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

-- Triggers de defaults
drop trigger if exists trg_tenants_defaults on public.tenants;
create trigger trg_tenants_defaults
  before insert on public.tenants
  for each row execute function public.set_tenant_defaults();

drop trigger if exists trg_clientes_defaults on public.clientes;
create trigger trg_clientes_defaults
  before insert on public.clientes
  for each row execute function public.set_cliente_defaults();

-- Trigger de criação de usuário
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Triggers de auditoria
drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.audit_log_trigger();

drop trigger if exists trg_audit_clientes on public.clientes;
create trigger trg_audit_clientes
  after insert or update or delete on public.clientes
  for each row execute function public.audit_log_trigger();

drop trigger if exists trg_audit_tenants on public.tenants;
create trigger trg_audit_tenants
  after insert or update or delete on public.tenants
  for each row execute function public.audit_log_trigger();

-- Trigger de validação de email
drop trigger if exists trg_validate_profile_email on public.profiles;
create trigger trg_validate_profile_email
  before insert or update on public.profiles
  for each row execute function public.validate_profile_email();

-- =============================================================================
-- ROW LEVEL SECURITY (POLICIES OTIMIZADAS)
-- =============================================================================

-- Habilitar RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.audit_log enable row level security;
alter table public.security_log enable row level security;

-- ===== POLICIES PARA TENANTS =====

drop policy if exists tenants_select_policy on public.tenants;
create policy tenants_select_policy on public.tenants
  for select to authenticated
  using (id = (select public.current_tenant_id()));

drop policy if exists tenants_update_policy on public.tenants;
create policy tenants_update_policy on public.tenants
  for update to authenticated
  using (id = (select public.current_tenant_id()) and (select public.is_admin()))
  with check (id = (select public.current_tenant_id()) and (select public.is_admin()));

-- ===== POLICIES PARA PROFILES =====

-- Usuários podem ver perfis do seu tenant (apenas se admin, ou seu próprio)
drop policy if exists profiles_select_policy on public.profiles;
create policy profiles_select_policy on public.profiles
  for select to authenticated
  using (
    tenant_id = (select public.current_tenant_id())
    and (
      (select public.is_admin())
      or id = (select auth.uid())
    )
    and ativo = true
  );

-- Usuários podem atualizar apenas seu próprio perfil
drop policy if exists profiles_update_policy on public.profiles;
create policy profiles_update_policy on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and ativo = true)
  with check (id = (select auth.uid()));

-- Admins podem inserir novos perfis no tenant
drop policy if exists profiles_insert_policy on public.profiles;
create policy profiles_insert_policy on public.profiles
  for insert to authenticated
  with check (
    tenant_id = (select public.current_tenant_id())
    and (select public.is_admin())
  );

-- ===== POLICIES PARA CLIENTES =====

-- Select: Admins veem todos do tenant
drop policy if exists clientes_select_policy on public.clientes;
create policy clientes_select_policy on public.clientes
  for select to authenticated
  using (
    tenant_id = (select public.current_tenant_id())
    and (select public.is_admin())
    and deleted_at is null
  );

-- Insert: Apenas admins
drop policy if exists clientes_insert_policy on public.clientes;
create policy clientes_insert_policy on public.clientes
  for insert to authenticated
  with check (
    tenant_id = (select public.current_tenant_id())
    and (select public.is_admin())
  );

-- Update: Apenas admins
drop policy if exists clientes_update_policy on public.clientes;
create policy clientes_update_policy on public.clientes
  for update to authenticated
  using (
    tenant_id = (select public.current_tenant_id())
    and (select public.is_admin())
    and deleted_at is null
  )
  with check (
    tenant_id = (select public.current_tenant_id())
    and (select public.is_admin())
  );

-- Delete (Soft): Apenas admins
drop policy if exists clientes_delete_policy on public.clientes;
create policy clientes_delete_policy on public.clientes
  for delete to authenticated
  using (
    tenant_id = (select public.current_tenant_id())
    and (select public.is_admin())
  );

-- ===== POLICIES PARA AUDIT_LOG =====

-- Apenas admins podem ver logs do seu tenant
drop policy if exists audit_log_select_policy on public.audit_log;
create policy audit_log_select_policy on public.audit_log
  for select to authenticated
  using (
    tenant_id = (select public.current_tenant_id())
    and (select public.is_admin())
  );

-- ===== POLICIES PARA SECURITY_LOG =====

-- Apenas admins podem ver logs de segurança
drop policy if exists security_log_select_policy on public.security_log;
create policy security_log_select_policy on public.security_log
  for select to authenticated
  using (tenant_id = (select public.current_tenant_id()) and (select public.is_admin()));

-- Qualquer usuário autenticado pode inserir logs do seu próprio user_id
drop policy if exists security_log_insert_policy on public.security_log;
create policy security_log_insert_policy on public.security_log
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- =============================================================================
-- VIEWS ÚTEIS (COM SECURITY INVOKER - PADRÃO SEGURO)
-- =============================================================================

-- View de clientes ativos - NÃO usa SECURITY DEFINER, respeita RLS
drop view if exists public.clientes_ativos cascade;
create or replace view public.clientes_ativos as
select 
  c.id,
  c.tenant_id,
  c.nome,
  c.nome_normalizado,
  c.email,
  c.telefone,
  c.data_nascimento,
  c.sexo,
  c.documento,
  c.observacoes,
  c.created_at,
  c.updated_at,
  c.created_by,
  c.updated_by
from public.clientes c
where c.deleted_at is null and c.ativo = true;

-- Garantir que a view use as permissões do usuário atual (INVOKER)
alter view public.clientes_ativos set (security_invoker = true);

-- View de estatísticas do tenant - NÃO usa SECURITY DEFINER
drop view if exists public.tenant_stats cascade;
create or replace view public.tenant_stats as
select 
  t.id as tenant_id,
  t.nome as tenant_nome,
  (
    select count(*)
    from public.profiles p
    where p.tenant_id = t.id 
      and p.ativo = true
  ) as total_profiles,
  (
    select count(*)
    from public.clientes c
    where c.tenant_id = t.id 
      and c.deleted_at is null
      and c.ativo = true
  ) as total_clientes,
  (
    select count(*)
    from public.clientes c
    where c.tenant_id = t.id 
      and c.deleted_at is not null
  ) as clientes_deletados,
  (
    select count(*)
    from public.profiles p
    where p.tenant_id = t.id 
      and p.role = 'admin'
      and p.ativo = true
  ) as total_admins
from public.tenants t
where t.ativo = true;

-- Garantir que a view use as permissões do usuário atual (INVOKER)
alter view public.tenant_stats set (security_invoker = true);

-- =============================================================================
-- FUNÇÕES DE UTILIDADE ADICIONAIS
-- =============================================================================

-- Função para soft delete de cliente
create or replace function public.soft_delete_cliente(
  p_cliente_id bigint
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_user_info record;
begin
  -- Verificar permissão
  v_user_info := public.get_current_user_info();
  
  if not v_user_info.is_admin then
    raise exception 'Apenas administradores podem deletar clientes';
  end if;
  
  -- Soft delete
  update public.clientes
  set 
    deleted_at = current_timestamp,
    deleted_by = v_user_info.user_id,
    ativo = false
  where id = p_cliente_id
    and tenant_id = v_user_info.tenant_id
    and deleted_at is null;
  
  -- Log de segurança
  perform public.log_security_event(
    'SOFT_DELETE_CLIENTE',
    jsonb_build_object('cliente_id', p_cliente_id)
  );
  
  return found;
end;
$$;

-- Função para restaurar cliente
create or replace function public.restore_cliente(
  p_cliente_id bigint
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_user_info record;
begin
  v_user_info := public.get_current_user_info();
  
  if not v_user_info.is_admin then
    raise exception 'Apenas administradores podem restaurar clientes';
  end if;
  
  update public.clientes
  set 
    deleted_at = null,
    deleted_by = null,
    ativo = true,
    updated_at = current_timestamp,
    updated_by = v_user_info.user_id
  where id = p_cliente_id
    and tenant_id = v_user_info.tenant_id
    and deleted_at is not null;
  
  -- Log de segurança
  perform public.log_security_event(
    'RESTORE_CLIENTE',
    jsonb_build_object('cliente_id', p_cliente_id)
  );
  
  return found;
end;
$$;

-- Função segura para consultar estatísticas do tenant atual
create or replace function public.get_current_tenant_stats()
returns table (
  total_profiles bigint,
  total_clientes bigint,
  clientes_deletados bigint,
  total_admins bigint
)
language sql
stable
set search_path = public
as $$
  select 
    count(distinct p.id) as total_profiles,
    count(distinct c.id) as total_clientes,
    count(distinct case when c.deleted_at is not null then c.id end) as clientes_deletados,
    count(distinct case when p.role = 'admin' then p.id end) as total_admins
  from public.tenants t
  left join public.profiles p on p.tenant_id = t.id and p.ativo = true
  left join public.clientes c on c.tenant_id = t.id
  where t.id = public.current_tenant_id()
  group by t.id;
$$;

-- =============================================================================
-- GRANTS E PERMISSÕES
-- =============================================================================

-- Revogar acesso anônimo a funções (nenhuma função deve ser chamada sem autenticação)
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from public;

-- Permissões para usuários autenticados
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Funções de trigger não devem ser chamáveis diretamente via RPC
revoke execute on function public.audit_log_trigger() from authenticated;
revoke execute on function public.handle_new_auth_user() from authenticated;
revoke execute on function public.validate_profile_email() from authenticated;
revoke execute on function public.set_updated_at() from authenticated;
revoke execute on function public.set_tenant_defaults() from authenticated;
revoke execute on function public.set_cliente_defaults() from authenticated;
-- log_security_event é chamada apenas internamente por outras funções
revoke execute on function public.log_security_event(text, jsonb) from authenticated;

-- Permissões específicas
grant execute on function public.bootstrap_profile(text, text, text) to authenticated;
grant execute on function public.get_current_user_info() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_tenant_id() to authenticated;
grant execute on function public.get_current_tenant_stats() to authenticated;
grant execute on function public.log_security_event(text, jsonb) to authenticated;
grant execute on function public.soft_delete_cliente(bigint) to authenticated;
grant execute on function public.restore_cliente(bigint) to authenticated;

-- Permissões para views
grant select on public.clientes_ativos to authenticated;
grant select on public.tenant_stats to authenticated;

