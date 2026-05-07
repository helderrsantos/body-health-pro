-- Phase 2.x: remove legacy email from clientes (no longer used)
-- Run this in Supabase SQL Editor for existing environments.

alter table if exists public.clientes
  drop column if exists email;
