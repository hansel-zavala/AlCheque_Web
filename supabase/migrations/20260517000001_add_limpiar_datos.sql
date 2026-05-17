-- =====================================================================
-- MIGRACIÓN: Función para Limpiar Datos (Reset de Fábrica)
-- Fecha: 2026-05-17
-- =====================================================================

CREATE OR REPLACE FUNCTION public.limpiar_datos_empresa(p_company_id UUID)
RETURNS void AS $$
BEGIN
  -- Verificar permisos (asegurar que el usuario es owner o admin de la empresa)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador para realizar esta acción.';
  END IF;

  -- Borrar datos en orden para evitar problemas de foreign keys
  DELETE FROM public.log_automatizaciones WHERE company_id = p_company_id;
  
  -- Hay algunas tablas que podrían no tener company_id en un inicio pero se les añadió.
  -- Usamos sentencias controladas.
  
  -- Módulo Terapeutas
  DELETE FROM public.abonos_salario WHERE company_id = p_company_id;
  DELETE FROM public.pagos_salario WHERE company_id = p_company_id;
  DELETE FROM public.terapeutas WHERE company_id = p_company_id;
  
  -- Transacciones y Cuentas
  DELETE FROM public.abonos WHERE company_id = p_company_id;
  DELETE FROM public.cuentas_por_cobrar WHERE company_id = p_company_id;
  DELETE FROM public.transacciones WHERE company_id = p_company_id;
  
  -- Pacientes y Servicios
  DELETE FROM public.pacientes_servicios WHERE company_id = p_company_id;
  DELETE FROM public.matriculas WHERE company_id = p_company_id;
  DELETE FROM public.becas WHERE company_id = p_company_id;
  DELETE FROM public.pacientes WHERE company_id = p_company_id;
  
  -- Catálogos
  DELETE FROM public.servicios WHERE company_id = p_company_id;
  DELETE FROM public.categorias WHERE company_id = p_company_id;
  
  -- Dejamos company_settings intacto (o se puede hacer update si se requiere resetear configs)
  UPDATE public.company_settings SET monto_matricula = 0 WHERE company_id = p_company_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
