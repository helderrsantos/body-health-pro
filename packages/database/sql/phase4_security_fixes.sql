drop function if exists public.bootstrap_profile(uuid, text, text) cascade;
drop function if exists public.confirm_user_email() cascade;
drop function if exists public.set_cliente_tenant_and_created_by() cascade;

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

create or replace function public.validate_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null and (
    tg_op = 'INSERT'
    or (tg_op = 'UPDATE' and old.email is distinct from new.email)
  ) then
    if not exists (
      select 1
      from auth.users
      where id = new.id
        and (email = new.email or raw_user_meta_data->>'email' = new.email)
    ) then
      raise notice 'Aviso: Email % não corresponde ao email do auth.users', new.email;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from public;

revoke execute on function public.audit_log_trigger() from authenticated;
revoke execute on function public.handle_new_auth_user() from authenticated;
revoke execute on function public.validate_profile_email() from authenticated;
revoke execute on function public.set_updated_at() from authenticated;
revoke execute on function public.set_tenant_defaults() from authenticated;
revoke execute on function public.set_cliente_defaults() from authenticated;

drop policy if exists security_log_insert_policy on public.security_log;
create policy security_log_insert_policy on public.security_log
  for insert to authenticated
  with check (user_id = (select auth.uid()));

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

revoke execute on function public.log_security_event(text, jsonb) from authenticated;
