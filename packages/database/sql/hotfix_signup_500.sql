
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
      raise notice 'Aviso: Email % nao corresponde ao email do auth.users', new.email;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_profile_email on public.profiles;
create trigger trg_validate_profile_email
  before insert or update on public.profiles
  for each row execute function public.validate_profile_email();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  profile_nome text;
  tenant_nome text;
  user_email text;
begin
  begin
    user_email := coalesce(
      nullif(trim(new.raw_user_meta_data->>'email'), ''),
      new.email
    );

    profile_nome := coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    );

    tenant_nome := coalesce(
      nullif(trim(new.raw_user_meta_data->>'company_name'), ''),
      'Tenant ' || left(new.id::text, 8)
    );

    if not exists (select 1 from public.profiles where id = new.id) then
      insert into public.tenants (nome, created_by)
      values (tenant_nome, new.id)
      returning id into new_tenant_id;

      insert into public.profiles (id, tenant_id, nome, email, role, created_by)
      values (new.id, new_tenant_id, profile_nome, user_email, 'admin', new.id)
      on conflict (id) do nothing;
    end if;
  exception
    when others then
      raise warning 'handle_new_auth_user failed for user %, error: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
select
  t.tgname as trigger_name,
  p.proname as function_name
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'profiles'
  and t.tgname = 'trg_validate_profile_email'
  and not t.tgisinternal;

select
  t.tgname as trigger_name,
  p.proname as function_name
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relname = 'users'
  and t.tgname = 'on_auth_user_created'
  and not t.tgisinternal;