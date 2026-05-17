-- =====================================================================
-- MIGRACIÓN: Módulo de Terapeutas y Pagos de Salario
-- Fecha: 2026-05-15
-- =====================================================================

-- 1. Tabla de Terapeutas
CREATE TABLE IF NOT EXISTS public.terapeutas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  puesto TEXT NOT NULL,
  salario_mensual NUMERIC NOT NULL DEFAULT 0,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.terapeutas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage terapeutas of their company" ON public.terapeutas;
CREATE POLICY "Users can manage terapeutas of their company"
  ON public.terapeutas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_companies.company_id = terapeutas.company_id
        AND user_companies.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_terapeutas_company ON public.terapeutas(company_id);

-- 2. Tabla de Pagos de Salario mensuales
CREATE TABLE IF NOT EXISTS public.pagos_salario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  terapeuta_id UUID REFERENCES public.terapeutas(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  monto_total NUMERIC NOT NULL,
  monto_pagado NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT unique_pago_mensual UNIQUE (terapeuta_id, mes, anio, company_id)
);

ALTER TABLE public.pagos_salario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage pagos_salario of their company" ON public.pagos_salario;
CREATE POLICY "Users can manage pagos_salario of their company"
  ON public.pagos_salario FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_companies.company_id = pagos_salario.company_id
        AND user_companies.user_id = auth.uid()
    )
  );

-- 3. Tabla de Abonos de Salario
CREATE TABLE IF NOT EXISTS public.abonos_salario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pago_id UUID REFERENCES public.pagos_salario(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  metodo_pago TEXT,
  notas TEXT,
  registrado_por UUID REFERENCES public.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.abonos_salario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage abonos_salario of their company" ON public.abonos_salario;
CREATE POLICY "Users can manage abonos_salario of their company"
  ON public.abonos_salario FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_companies.company_id = abonos_salario.company_id
        AND user_companies.user_id = auth.uid()
    )
  );
