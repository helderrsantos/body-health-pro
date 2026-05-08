-- Phase 4: Security fixes for existing database
-- Addresses all Supabase linter warnings without dropping tables/data
-- Execute no SQL Editor do Supabase

-- =============================================================================
-- 1. REMOVER FUNÇÕES ANTIGAS (versões legadas ainda presentes no DB)
-- =============================================================================

-- Overload antigo de bootstrap_profile com user_id como parâmetro
drop function if exists public.bootstrap_profile(uuid, text, text) cascade;

-- Função de trigger legada
drop function if exists public.confirm_user_email() cascade;

-- Função de trigger legada substituída por set_cliente_defaults
drop function if exists public.set_cliente_tenant_and_created_by() cascade;

-- =============================================================================
-- 2. ADICIONAR set search_path AOS TRIGGERS SEM ELE
-- =============================================================================

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

create or replace function public.set_cliente_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_user_info record;
begin
  select * into v_user_info from public.get_current_user_info();

  if v_user_info.user_id is null then
    raise exception 'Usuário não encontrado ou não autenticado';
  end if;

  if new.tenant_id is null then
    new.tenant_id := v_user_info.tenant_id;
  end if;

  if not exists (select 1 from public.tenants where id = new.tenant_id and ativo = true) then
    raise exception 'Tenant inválido ou inativo';
  end if;

  if new.created_by is null then
    new.created_by := v_user_info.user_id;
  end if;

  if new.updated_by is null then
    new.updated_by := v_user_info.user_id;
  end if;

  if new.nome_normalizado is null or length(trim(new.nome_normalizado)) = 0 then
    new.nome_normalizado := lower(trim(regexp_replace(new.nome, '\s+', ' ', 'g')));
  end if;

  return new;
end;
$$;

-- =============================================================================
-- 3. REVOGAR ACESSO ANÔNIMO A TODAS AS FUNÇÕES
-- =============================================================================

revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from public;

-- =============================================================================
-- 4. REVOGAR FUNÇÕES DE TRIGGER DO ROLE AUTHENTICATED (não devem ser chamadas via RPC)
-- =============================================================================

revoke execute on function public.audit_log_trigger() from authenticated;
revoke execute on function public.handle_new_auth_user() from authenticated;
revoke execute on function public.validate_profile_email() from authenticated;
revoke execute on function public.set_updated_at() from authenticated;
revoke execute on function public.set_tenant_defaults() from authenticated;
revoke execute on function public.set_cliente_defaults() from authenticated;

-- =============================================================================
-- 5. CORRIGIR POLÍTICA RLS security_log_insert_policy (with check true → restringe ao próprio user)
-- =============================================================================

drop policy if exists security_log_insert_policy on public.security_log;
create policy security_log_insert_policy on public.security_log
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- =============================================================================
-- 6. CONVERTER FUNÇÕES DE APP PARA SECURITY INVOKER
--    (RLS nas tabelas subjacentes já protege, não precisam de security definer)
-- =============================================================================

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
  v_user_info := public.get_current_user_info();

  if not v_user_info.is_admin then
    raise exception 'Apenas administradores podem deletar clientes';
  end if;

  update public.clientes
  set
    deleted_at = current_timestamp,
    deleted_by = v_user_info.user_id,
    ativo = false
  where id = p_cliente_id
    and tenant_id = v_user_info.tenant_id
    and deleted_at is null;

  perform public.log_security_event(
    'SOFT_DELETE_CLIENTE',
    jsonb_build_object('cliente_id', p_cliente_id)
  );

  return found;
end;
$$;

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

  perform public.log_security_event(
    'RESTORE_CLIENTE',
    jsonb_build_object('cliente_id', p_cliente_id)
  );

  return found;
end;
$$;

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

-- Funções de avaliação (phase 2)
create or replace function public.get_latest_avaliacao(cliente_id_param bigint)
returns public.avaliacoes
language sql
stable
set search_path = public
as $$
  select *
  from public.avaliacoes
  where cliente_id = cliente_id_param
  order by data_avaliacao desc
  limit 1;
$$;

-- =============================================================================
-- 7. REVOGAR log_security_event DE authenticated
--    (chamada apenas internamente por funções security definer, não via RPC direto)
-- =============================================================================

revoke execute on function public.log_security_event(text, jsonb) from authenticated;

-- =============================================================================
-- AVISOS RESTANTES (INTENCIONAIS - NÃO CORRIGIR)
-- =============================================================================
--
-- As funções abaixo continuarão a gerar warnings no linter do Supabase.
-- Isso é esperado e CORRETO para esta arquitetura:
--
-- 1. bootstrap_profile(nome, empresa_nome, empresa_cnpj)
--    Precisa de SECURITY DEFINER para criar tenant+profile de um usuário recém-cadastrado
--    que ainda não tem RLS configurado. Não pode ser SECURITY INVOKER.
--
-- 2. get_current_user_info() / is_admin() / current_tenant_id()
--    São helpers de RLS usados nas políticas de todas as tabelas.
--    O PostgreSQL avalia policies no contexto do role `authenticated`, que PRECISA
--    ter EXECUTE nessas funções. Revogar quebra o RLS com "permission denied".
--    Converter para SECURITY INVOKER causaria recursão infinita (função consulta
--    `profiles`, que tem RLS que chama a função).
--
-- 3. auth_leaked_password_protection
--    Não é SQL — habilitar no Supabase Dashboard:
--    Authentication → Settings → Password Security → Leaked Password Protection
-- =============================================================================
