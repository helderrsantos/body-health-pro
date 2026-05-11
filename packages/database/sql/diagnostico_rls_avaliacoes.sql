-- Diagnostico rapido para erro 42501 em public.avaliacoes
-- Uso:
-- 1) Troque os valores no bloco "input".
-- 2) Execute este script no Supabase SQL Editor.
-- 3) Veja o resultado da secao "diagnostico" e "policies_instaladas".

with input as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    0::bigint as cliente_id,
    null::uuid as payload_tenant_id
),
profile_data as (
  select p.id, p.role, p.tenant_id
  from public.profiles p
  join input i on i.user_id = p.id
),
cliente_data as (
  select c.id, c.tenant_id
  from public.clientes c
  join input i on i.cliente_id = c.id
),
ctx as (
  select
    i.user_id,
    i.cliente_id,
    i.payload_tenant_id,
    p.id as profile_id,
    p.role as profile_role,
    p.tenant_id as profile_tenant_id,
    c.tenant_id as cliente_tenant_id,
    coalesce(i.payload_tenant_id, c.tenant_id) as tenant_id_for_insert
  from input i
  left join profile_data p on true
  left join cliente_data c on true
)
select
  c.user_id,
  c.cliente_id,
  c.profile_id is not null as profile_exists,
  c.profile_role,
  c.profile_tenant_id,
  c.cliente_tenant_id,
  c.tenant_id_for_insert,
  (
    c.profile_id is not null
    and c.profile_role = 'admin'
    and c.profile_tenant_id = c.tenant_id_for_insert
  ) as pass_rls_with_check_admin_manage_avaliacoes,
  case
    when c.profile_id is null then 'FALHA: usuario nao existe em public.profiles.'
    when c.profile_role <> 'admin' then 'FALHA: role do usuario nao e admin.'
    when c.tenant_id_for_insert is null then 'FALHA: tenant_id enviado no insert esta nulo e o cliente nao foi encontrado.'
    when c.profile_tenant_id <> c.tenant_id_for_insert then 'FALHA: tenant_id do profile difere do tenant_id da linha inserida.'
    else 'OK: condicao principal de WITH CHECK da policy foi atendida.'
  end as diagnostico
from ctx c;

select
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.avaliacoes'::regclass;

select
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'avaliacoes'
order by policyname;
