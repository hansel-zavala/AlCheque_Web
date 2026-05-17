-- =====================================================================
-- MIGRACIÓN: Matrículas Anuales, Configuración de Empresa y Log de Automatizaciones
-- Fecha: 2026-05-15
-- =====================================================================

-- 1. Tabla de configuración de la empresa (monto matrícula, etc.)
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  monto_matricula NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage settings of their company" ON public.company_settings;
CREATE POLICY "Users can manage settings of their company"
  ON public.company_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_companies.company_id = company_settings.company_id
        AND user_companies.user_id = auth.uid()
    )
  );

-- 2. Tabla de Matrículas Anuales
CREATE TABLE IF NOT EXISTS public.matriculas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  anio_escolar INTEGER NOT NULL,
  monto NUMERIC NOT NULL DEFAULT 0,
  fecha_pago DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  registrado_por UUID REFERENCES public.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT unique_matricula_anual UNIQUE (paciente_id, anio_escolar, company_id)
);

ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage matriculas of their company" ON public.matriculas;
CREATE POLICY "Users can manage matriculas of their company"
  ON public.matriculas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_companies.company_id = matriculas.company_id
        AND user_companies.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_matriculas_paciente ON public.matriculas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_anio ON public.matriculas(anio_escolar, company_id);

-- 3. Tabla de Log de Automatizaciones
CREATE TABLE IF NOT EXISTS public.log_automatizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id),
  servicio_id UUID,
  resultado TEXT NOT NULL,
  detalle TEXT,
  cuenta_generada_id UUID REFERENCES public.cuentas_por_cobrar(id),
  ejecutado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.log_automatizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs of their company" ON public.log_automatizaciones;
CREATE POLICY "Users can view logs of their company"
  ON public.log_automatizaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_companies.company_id = log_automatizaciones.company_id
        AND user_companies.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert logs" ON public.log_automatizaciones;
CREATE POLICY "Service role can insert logs"
  ON public.log_automatizaciones FOR INSERT
  WITH CHECK (true);

-- 4. Función para generar matrículas en masa
CREATE OR REPLACE FUNCTION public.generar_matriculas_anuales(
  p_company_id UUID,
  p_anio INTEGER,
  p_monto NUMERIC
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_paciente RECORD;
BEGIN
  FOR v_paciente IN
    SELECT id FROM public.pacientes
    WHERE company_id = p_company_id AND activo = true
  LOOP
    INSERT INTO public.matriculas (paciente_id, company_id, anio_escolar, monto, estado)
    VALUES (v_paciente.id, p_company_id, p_anio, p_monto, 'pendiente')
    ON CONFLICT (paciente_id, anio_escolar, company_id) DO NOTHING;
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
