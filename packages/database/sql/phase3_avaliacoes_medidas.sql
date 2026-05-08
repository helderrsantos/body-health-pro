-- Phase 3: optional anthropometric measurements in avaliacoes
-- Execute after phase2_avaliacoes.sql

alter table public.avaliacoes
  add column if not exists altura decimal(5, 1),
  add column if not exists ombro decimal(6, 2),
  add column if not exists torax decimal(6, 2),
  add column if not exists cintura decimal(6, 2),
  add column if not exists abdomen decimal(6, 2),
  add column if not exists quadril decimal(6, 2),
  add column if not exists coxa_direita decimal(6, 2),
  add column if not exists coxa_esquerda decimal(6, 2),
  add column if not exists panturrilha_direita decimal(6, 2),
  add column if not exists panturrilha_esquerda decimal(6, 2),
  add column if not exists braco_direito decimal(6, 2),
  add column if not exists braco_esquerdo decimal(6, 2),
  add column if not exists antebraco_direito decimal(6, 2),
  add column if not exists antebraco_esquerdo decimal(6, 2),
  add column if not exists punho_direito decimal(6, 2),
  add column if not exists punho_esquerdo decimal(6, 2);

alter table public.avaliacoes
  drop constraint if exists avaliacoes_altura_check,
  drop constraint if exists avaliacoes_ombro_check,
  drop constraint if exists avaliacoes_torax_check,
  drop constraint if exists avaliacoes_cintura_check,
  drop constraint if exists avaliacoes_abdomen_check,
  drop constraint if exists avaliacoes_quadril_check,
  drop constraint if exists avaliacoes_coxa_direita_check,
  drop constraint if exists avaliacoes_coxa_esquerda_check,
  drop constraint if exists avaliacoes_panturrilha_direita_check,
  drop constraint if exists avaliacoes_panturrilha_esquerda_check,
  drop constraint if exists avaliacoes_braco_direito_check,
  drop constraint if exists avaliacoes_braco_esquerdo_check,
  drop constraint if exists avaliacoes_antebraco_direito_check,
  drop constraint if exists avaliacoes_antebraco_esquerdo_check,
  drop constraint if exists avaliacoes_punho_direito_check,
  drop constraint if exists avaliacoes_punho_esquerdo_check;

alter table public.avaliacoes
  add constraint avaliacoes_altura_check check (altura is null or (altura > 0 and altura < 300)),
  add constraint avaliacoes_ombro_check check (ombro is null or (ombro > 0 and ombro <= 500)),
  add constraint avaliacoes_torax_check check (torax is null or (torax > 0 and torax <= 500)),
  add constraint avaliacoes_cintura_check check (cintura is null or (cintura > 0 and cintura <= 500)),
  add constraint avaliacoes_abdomen_check check (abdomen is null or (abdomen > 0 and abdomen <= 500)),
  add constraint avaliacoes_quadril_check check (quadril is null or (quadril > 0 and quadril <= 500)),
  add constraint avaliacoes_coxa_direita_check check (coxa_direita is null or (coxa_direita > 0 and coxa_direita <= 500)),
  add constraint avaliacoes_coxa_esquerda_check check (coxa_esquerda is null or (coxa_esquerda > 0 and coxa_esquerda <= 500)),
  add constraint avaliacoes_panturrilha_direita_check check (panturrilha_direita is null or (panturrilha_direita > 0 and panturrilha_direita <= 500)),
  add constraint avaliacoes_panturrilha_esquerda_check check (panturrilha_esquerda is null or (panturrilha_esquerda > 0 and panturrilha_esquerda <= 500)),
  add constraint avaliacoes_braco_direito_check check (braco_direito is null or (braco_direito > 0 and braco_direito <= 500)),
  add constraint avaliacoes_braco_esquerdo_check check (braco_esquerdo is null or (braco_esquerdo > 0 and braco_esquerdo <= 500)),
  add constraint avaliacoes_antebraco_direito_check check (antebraco_direito is null or (antebraco_direito > 0 and antebraco_direito <= 500)),
  add constraint avaliacoes_antebraco_esquerdo_check check (antebraco_esquerdo is null or (antebraco_esquerdo > 0 and antebraco_esquerdo <= 500)),
  add constraint avaliacoes_punho_direito_check check (punho_direito is null or (punho_direito > 0 and punho_direito <= 500)),
  add constraint avaliacoes_punho_esquerdo_check check (punho_esquerdo is null or (punho_esquerdo > 0 and punho_esquerdo <= 500));
