-- Create custom types
CREATE TYPE public.user_role AS ENUM ('director', 'administrador', 'recepcionista', 'contador');
CREATE TYPE public.transaccion_tipo AS ENUM ('ingreso', 'egreso');
CREATE TYPE public.transaccion_estado AS ENUM ('pagado', 'pendiente', 'parcial');
CREATE TYPE public.cuenta_estado AS ENUM ('al_dia', 'por_vencer', 'vencida', 'pagada');
CREATE TYPE public.beca_tipo AS ENUM ('porcentaje', 'monto_fijo');

-- Create Tables
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol public.user_role NOT NULL DEFAULT 'recepcionista',
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo public.transaccion_tipo NOT NULL,
  categoria_padre_id UUID REFERENCES public.categorias(id),
  activa BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.becas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID, -- Will define foreign key after pacientes
  tipo public.beca_tipo NOT NULL,
  valor NUMERIC NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  autorizado_por UUID REFERENCES public.users(id),
  motivo TEXT,
  activa BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_interno TEXT NOT NULL UNIQUE,
  nombre_completo TEXT, -- Consider it encrypted on app side
  servicio TEXT,
  tarifa_mensual NUMERIC NOT NULL,
  beca_id UUID REFERENCES public.becas(id),
  activo BOOLEAN NOT NULL DEFAULT true
);

-- Add foreign key to becas
ALTER TABLE public.becas ADD CONSTRAINT fk_becas_paciente FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);

CREATE TABLE public.transacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  paciente_id UUID REFERENCES public.pacientes(id),
  comprobante_url TEXT,
  creado_por UUID REFERENCES public.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  anulado BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE public.cuentas_por_cobrar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES public.pacientes(id) NOT NULL,
  monto_total NUMERIC NOT NULL,
  monto_pagado NUMERIC NOT NULL DEFAULT 0,
  fecha_vencimiento DATE NOT NULL,
  estado public.cuenta_estado NOT NULL,
  notas TEXT
);

CREATE TABLE public.abonos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id UUID REFERENCES public.cuentas_por_cobrar(id) NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  metodo_pago TEXT,
  registrado_por UUID REFERENCES public.users(id)
);

CREATE TABLE public.presupuesto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID REFERENCES public.categorias(id) NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  monto_presupuestado NUMERIC NOT NULL
);

CREATE TABLE public.auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tabla TEXT NOT NULL,
  registro_id UUID NOT NULL,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario_id UUID REFERENCES public.users(id),
  fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.becas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_por_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Base RLS (Can be expanded further)
-- Users can see their own profile, and directors can see everyone
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Directors can read all profiles" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'director')
);

-- Everyone authenticated can read categories
CREATE POLICY "Auth users can read categories" ON public.categorias FOR SELECT USING (auth.role() = 'authenticated');
