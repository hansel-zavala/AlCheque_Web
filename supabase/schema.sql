-- =====================================================================
-- SCHEMA COMPLETO PARA SUPABASE
-- Este archivo consolida todas las migraciones, tipos de datos, tablas, 
-- políticas de RLS, funciones y triggers para inicializar el proyecto.
-- =====================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. CREACIÓN DE TIPOS PERSONALIZADOS
-- =====================================================================
CREATE TYPE public.user_role AS ENUM ('director', 'administrador', 'recepcionista', 'contador');
CREATE TYPE public.transaccion_tipo AS ENUM ('ingreso', 'egreso');
CREATE TYPE public.transaccion_estado AS ENUM ('pagado', 'pendiente', 'parcial');
CREATE TYPE public.cuenta_estado AS ENUM ('al_dia', 'por_vencer', 'vencida', 'pagada');
CREATE TYPE public.beca_tipo AS ENUM ('porcentaje', 'monto_fijo');
CREATE TYPE public.company_role AS ENUM ('owner', 'admin', 'accountant', 'viewer');

-- =====================================================================
-- 2. CREACIÓN DE TABLAS
-- =====================================================================

-- Empresas (Multi-tenant)
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rfc TEXT,
  currency TEXT NOT NULL DEFAULT 'MXN',
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Usuarios (Perfiles sincronizados con auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol public.user_role NOT NULL DEFAULT 'recepcionista',
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Relación de Usuarios y Empresas (Control de Acceso)
CREATE TABLE public.user_companies (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, company_id)
);

-- Configuración de la Empresa
CREATE TABLE public.company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  monto_matricula NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Categorías de Transacciones
CREATE TABLE public.categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  tipo public.transaccion_tipo NOT NULL,
  categoria_padre_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  activa BOOLEAN NOT NULL DEFAULT true
);

-- Catálogo de Servicios
CREATE TABLE public.servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  costo_hnl NUMERIC NOT NULL DEFAULT 0,
  duracion_meses INTEGER NOT NULL DEFAULT 1, -- 0 para pago único
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Becas (Descuentos)
CREATE TABLE public.becas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  paciente_id UUID, -- Llave foránea definida tras crear pacientes
  tipo public.beca_tipo NOT NULL,
  valor NUMERIC NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  autorizado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
  motivo TEXT,
  activa BOOLEAN NOT NULL DEFAULT true
);

-- Pacientes / Clientes
CREATE TABLE public.pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  codigo_interno TEXT NOT NULL,
  nombre_completo TEXT,
  servicio TEXT, -- Retrocompatibilidad
  tarifa_mensual NUMERIC NOT NULL DEFAULT 0, -- Retrocompatibilidad
  beca_id UUID REFERENCES public.becas(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT unique_codigo_interno_por_empresa UNIQUE (codigo_interno, company_id)
);

-- Agregar llave foránea a becas
ALTER TABLE public.becas ADD CONSTRAINT fk_becas_paciente FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;

-- Relación de Pacientes y Servicios (Servicios Asignados)
CREATE TABLE public.pacientes_servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  servicio_id UUID REFERENCES public.servicios(id) ON DELETE CASCADE NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_proximo_cobro DATE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transacciones (Ingresos y Egresos de Caja)
CREATE TABLE public.transacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  tipo public.transaccion_tipo NOT NULL,
  monto_hnl NUMERIC NOT NULL,
  monto_usd NUMERIC,
  tipo_cambio NUMERIC,
  fecha DATE NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) NOT NULL,
  metodo_pago TEXT,
  descripcion TEXT,
  numero_recibo TEXT,
  estado public.transaccion_estado NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  comprobante_url TEXT,
  creado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  anulado BOOLEAN NOT NULL DEFAULT false
);

-- Cuentas por Cobrar
CREATE TABLE public.cuentas_por_cobrar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  servicio_id UUID REFERENCES public.servicios(id) ON DELETE SET NULL,
  monto_total NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  monto_pagado NUMERIC NOT NULL DEFAULT 0,
  fecha_vencimiento DATE NOT NULL,
  estado public.cuenta_estado NOT NULL,
  notas TEXT
);

-- Abonos (Pagos recibidos de cuentas por cobrar)
CREATE TABLE public.abonos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  cuenta_id UUID REFERENCES public.cuentas_por_cobrar(id) ON DELETE CASCADE NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  metodo_pago TEXT,
  registrado_por UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Presupuestos Mensuales
CREATE TABLE public.presupuesto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE CASCADE NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  monto_presupuestado NUMERIC NOT NULL
);

-- Matrículas Anuales
CREATE TABLE public.matriculas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  anio_escolar INTEGER NOT NULL,
  monto NUMERIC NOT NULL DEFAULT 0,
  fecha_pago DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  registrado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT unique_matricula_anual UNIQUE (paciente_id, anio_escolar, company_id)
);

-- Log de Automatizaciones
CREATE TABLE public.log_automatizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  servicio_id UUID REFERENCES public.servicios(id) ON DELETE SET NULL,
  resultado TEXT NOT NULL,
  detalle TEXT,
  cuenta_generada_id UUID REFERENCES public.cuentas_por_cobrar(id) ON DELETE SET NULL,
  ejecutado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Terapeutas
CREATE TABLE public.terapeutas (
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

-- Pagos de Salario Mensuales (Terapeutas)
CREATE TABLE public.pagos_salario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  terapeuta_id UUID REFERENCES public.terapeutas(id) ON DELETE CASCADE NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  monto_total NUMERIC NOT NULL,
  monto_pagado NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT unique_pago_mensual UNIQUE (terapeuta_id, mes, anio, company_id)
);

-- Abonos de Salario (Terapeutas)
CREATE TABLE public.abonos_salario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  pago_id UUID REFERENCES public.pagos_salario(id) ON DELETE CASCADE NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  metodo_pago TEXT,
  notas TEXT,
  registrado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabla de Auditoría
CREATE TABLE public.auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tabla TEXT NOT NULL,
  registro_id UUID NOT NULL,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 3. HABILITACIÓN DE RLS (ROW LEVEL SECURITY)
-- =====================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.becas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_por_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_automatizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terapeutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_salario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos_salario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 4. POLÍTICAS DE SEGURIDAD RLS
-- =====================================================================

-- Users
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Directors can read all profiles" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'director')
);

-- User Companies
CREATE POLICY "Users can view their own company memberships" ON public.user_companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memberships" ON public.user_companies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Companies
CREATE POLICY "Users can view companies they belong to" ON public.companies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = companies.id AND user_companies.user_id = auth.uid())
);
CREATE POLICY "Admins and Owners can update companies" ON public.companies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = companies.id AND user_companies.user_id = auth.uid() AND user_companies.role IN ('owner', 'admin'))
);
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Company Settings
CREATE POLICY "Users can manage settings of their company" ON public.company_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = company_settings.company_id AND user_companies.user_id = auth.uid())
);

-- Categorías
CREATE POLICY "Users can manage categories of their companies" ON public.categorias FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = categorias.company_id AND user_companies.user_id = auth.uid())
);

-- Servicios
CREATE POLICY "Users can manage servicios of their companies" ON public.servicios FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = servicios.company_id AND user_companies.user_id = auth.uid())
);

-- Becas
CREATE POLICY "Users can manage becas of their companies" ON public.becas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = becas.company_id AND user_companies.user_id = auth.uid())
);

-- Pacientes
CREATE POLICY "Users can manage pacientes of their companies" ON public.pacientes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = pacientes.company_id AND user_companies.user_id = auth.uid())
);

-- Pacientes Servicios
CREATE POLICY "Users can manage pacientes_servicios of their companies" ON public.pacientes_servicios FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = pacientes_servicios.company_id AND user_companies.user_id = auth.uid())
);

-- Transacciones
CREATE POLICY "Users can manage transacciones of their companies" ON public.transacciones FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = transacciones.company_id AND user_companies.user_id = auth.uid())
);

-- Cuentas por Cobrar
CREATE POLICY "Users can manage cuentas_por_cobrar of their companies" ON public.cuentas_por_cobrar FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = cuentas_por_cobrar.company_id AND user_companies.user_id = auth.uid())
);

-- Abonos
CREATE POLICY "Users can manage abonos of their companies" ON public.abonos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = abonos.company_id AND user_companies.user_id = auth.uid())
);

-- Presupuesto
CREATE POLICY "Users can manage presupuesto of their companies" ON public.presupuesto FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = presupuesto.company_id AND user_companies.user_id = auth.uid())
);

-- Matrículas
CREATE POLICY "Users can manage matriculas of their company" ON public.matriculas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = matriculas.company_id AND user_companies.user_id = auth.uid())
);

-- Log Automatizaciones
CREATE POLICY "Users can view logs of their company" ON public.log_automatizaciones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = log_automatizaciones.company_id AND user_companies.user_id = auth.uid())
);
CREATE POLICY "Service role can insert logs" ON public.log_automatizaciones FOR INSERT WITH CHECK (true);

-- Terapeutas
CREATE POLICY "Users can manage terapeutas of their company" ON public.terapeutas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = terapeutas.company_id AND user_companies.user_id = auth.uid())
);

-- Pagos de Salario
CREATE POLICY "Users can manage pagos_salario of their company" ON public.pagos_salario FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = pagos_salario.company_id AND user_companies.user_id = auth.uid())
);

-- Abonos de Salario
CREATE POLICY "Users can manage abonos_salario of their company" ON public.abonos_salario FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_companies WHERE user_companies.company_id = abonos_salario.company_id AND user_companies.user_id = auth.uid())
);

-- Auditoría
CREATE POLICY "Users can view audit of their company" ON public.auditoria FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.rol IN ('director', 'administrador')
  )
);

-- =====================================================================
-- 5. FUNCIONES Y TRIGGERS
-- =====================================================================

-- Trigger: Sincronizar auth.users con public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nombre, rol, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    'recepcionista',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Asignar al creador como Owner de la empresa creada
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (auth.uid(), NEW.id, 'owner');
  
  -- Generar configuraciones por defecto para la empresa
  INSERT INTO public.company_settings (company_id, monto_matricula)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();

-- Función: Generación masiva de matrículas anuales
CREATE OR REPLACE FUNCTION public.generar_matriculas_anuales(
  p_company_id UUID,
  p_anio INTEGER,
  p_monto NUMERIC
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_paciente RECORD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Implementación de la lógica de generación masiva
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

-- Función: Limpieza de datos (Reset de Fábrica)
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
  
  -- Dejamos company_settings intacto con reset
  UPDATE public.company_settings SET monto_matricula = 0 WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 6. ÍNDICES DE RENDIMIENTO
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_matriculas_paciente ON public.matriculas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_anio ON public.matriculas(anio_escolar, company_id);
CREATE INDEX IF NOT EXISTS idx_terapeutas_company ON public.terapeutas(company_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_servicios_company ON public.pacientes_servicios(company_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_servicios_fecha ON public.pacientes_servicios(fecha_proximo_cobro) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_paciente ON public.cuentas_por_cobrar(paciente_id);
