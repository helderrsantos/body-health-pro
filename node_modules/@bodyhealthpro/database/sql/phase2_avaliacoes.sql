-- Phase 2: avaliacoes table with history and RLS
-- Execute in Supabase SQL editor after Phase 1 is complete

-- Create avaliacoes table to store composition assessment history
create table if not exists public.avaliacoes (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id bigint not null references public.clientes(id) on delete cascade,
  
  -- Measurement fields (7 skin folds in mm)
  peitoral decimal(5, 2) not null,
  abdominal decimal(5, 2) not null,
  coxa decimal(5, 2) not null,
  axilar_media decimal(5, 2) not null,
  subescapular decimal(5, 2) not null,
  suprailiaca decimal(5, 2) not null,
  triceps decimal(5, 2) not null,
  
  -- Client data at time of assessment
  altura decimal(5, 1) not null check (altura > 0 and altura < 300),
  peso decimal(6, 2) not null check (peso > 0),
  sexo text not null check (sexo in ('masculino', 'feminino')),
  
  -- Calculated results
  percentual_gordura decimal(5, 2) not null,
  massa_magra_kg decimal(6, 2) not null,
  massa_gordura_kg decimal(6, 2) not null,
  
  -- Metadata
  data_avaliacao date not null default now(),
  criado_por uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_avaliacoes_tenant_id on public.avaliacoes(tenant_id);
create index if not exists idx_avaliacoes_cliente_id on public.avaliacoes(cliente_id);
create index if not exists idx_avaliacoes_data_avaliacao on public.avaliacoes(data_avaliacao);
create index if not exists idx_avaliacoes_criado_por on public.avaliacoes(criado_por);
create index if not exists idx_avaliacoes_cliente_data 
  on public.avaliacoes(cliente_id, data_avaliacao desc);

-- Trigger to update updated_at
drop trigger if exists avaliacoes_updated_at on public.avaliacoes;
create trigger avaliacoes_updated_at
  before update on public.avaliacoes
  for each row
  execute function public.set_updated_at();

-- RLS: Enable row level security
alter table public.avaliacoes enable row level security;

-- RLS Policy 1: Admins can view/create/update/delete avaliacoes for their clients
drop policy if exists admin_manage_avaliacoes on public.avaliacoes;
create policy admin_manage_avaliacoes on public.avaliacoes
  for all
  using (
    auth.uid() in (
      select p.id from public.profiles p
      where p.tenant_id = avaliacoes.tenant_id and p.role = 'admin'
    )
  )
  with check (
    auth.uid() in (
      select p.id from public.profiles p
      where p.tenant_id = avaliacoes.tenant_id and p.role = 'admin'
    )
  );

-- RLS Policy 2: Clientes can only view their own avaliacoes (Phase 2 for client app)
drop policy if exists cliente_view_own_avaliacoes on public.avaliacoes;
create policy cliente_view_own_avaliacoes on public.avaliacoes
  for select
  using (
    false
  );

-- Function to get latest avaliacao for a cliente
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

-- Function to get avaliacao history for a cliente (with evolution stats)
create or replace function public.get_avaliacao_history(cliente_id_param bigint)
returns table (
  id bigint,
  data_avaliacao date,
  percentual_gordura decimal,
  massa_magra_kg decimal,
  massa_gordura_kg decimal,
  gordura_change decimal,
  magra_change decimal,
  dias_desde_anterior int
)
language sql
stable
set search_path = public
as $$
  with avaliacao_data as (
    select 
      id,
      data_avaliacao,
      percentual_gordura,
      massa_magra_kg,
      massa_gordura_kg,
      lag(percentual_gordura) over (order by data_avaliacao) as prev_gordura,
      lag(massa_magra_kg) over (order by data_avaliacao) as prev_magra,
      lag(data_avaliacao) over (order by data_avaliacao) as prev_data
    from public.avaliacoes
    where cliente_id = cliente_id_param
    order by data_avaliacao desc
  )
  select 
    id,
    data_avaliacao,
    percentual_gordura,
    massa_magra_kg,
    massa_gordura_kg,
    round((percentual_gordura - prev_gordura)::decimal, 2) as gordura_change,
    round((massa_magra_kg - prev_magra)::decimal, 2) as magra_change,
    (data_avaliacao - prev_data) as dias_desde_anterior
  from avaliacao_data;
$$;

-- Grant access to authenticated users for functions
grant execute on function public.get_latest_avaliacao(bigint) to authenticated;
grant execute on function public.get_avaliacao_history(bigint) to authenticated;

-- Grant table select to authenticated for reading avaliacoes
grant select on public.avaliacoes to authenticated;
grant insert on public.avaliacoes to authenticated;
grant update on public.avaliacoes to authenticated;
grant delete on public.avaliacoes to authenticated;
