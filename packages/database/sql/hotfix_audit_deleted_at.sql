-- Hotfix: evita erro "record \"new\" has no field \"deleted_at\""
-- em updates auditados de tabelas que nao possuem essa coluna.

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
  if TG_OP = 'INSERT' then
    v_operation := 'INSERT';
    v_new_data := to_jsonb(new);
    v_record_id := new.id::text;

    if tg_table_name = 'profiles' then
      v_tenant_id := new.tenant_id;
    elsif tg_table_name = 'clientes' then
      v_tenant_id := new.tenant_id;
    end if;

  elsif TG_OP = 'UPDATE' then
    v_old_data := to_jsonb(old);
    v_new_data := to_jsonb(new);
    v_record_id := new.id::text;

    if tg_table_name = 'clientes'
      and (v_new_data ? 'deleted_at')
      and (v_new_data ->> 'deleted_at') is not null
      and (v_old_data ->> 'deleted_at') is null then
      v_operation := 'SOFT_DELETE';
    else
      v_operation := 'UPDATE';
    end if;

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
