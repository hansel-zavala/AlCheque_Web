-- =====================================================================
-- MIGRACIÓN: Agregar detalles de la empresa
-- Fecha: 2026-05-17
-- =====================================================================

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address TEXT;
