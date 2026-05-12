-- 1. Create Companies table
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rfc TEXT,
  currency TEXT NOT NULL DEFAULT 'MXN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create User_Companies table for role-based access control
CREATE TYPE public.company_role AS ENUM ('owner', 'admin', 'accountant', 'viewer');

CREATE TABLE public.user_companies (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, company_id)
);

-- 3. Add company_id to existing tables as nullable first to allow migration of existing data
ALTER TABLE public.categorias ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.pacientes ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.becas ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.transacciones ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.cuentas_por_cobrar ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.abonos ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.presupuesto ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 4. Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for multi-tenancy

-- User_Companies: Users can see which companies they belong to
CREATE POLICY "Users can view their own company memberships" 
  ON public.user_companies FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships"
  ON public.user_companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Companies: Users can only view companies they are members of
CREATE POLICY "Users can view companies they belong to" 
  ON public.companies FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = companies.id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Companies: Users can update companies if they are owner or admin
CREATE POLICY "Admins and Owners can update companies" 
  ON public.companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = companies.id 
      AND user_companies.user_id = auth.uid()
      AND user_companies.role IN ('owner', 'admin')
    )
  );

-- Companies: Only authenticated users can create companies
CREATE POLICY "Authenticated users can create companies" 
  ON public.companies FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Trigger to automatically add the creator as the owner of the company
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (auth.uid(), NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company();

-- 7. Multi-tenant RLS Policies for existing tables
-- First, drop the old policy if it exists (for categorias)
DROP POLICY IF EXISTS "Auth users can read categories" ON public.categorias;

-- Reusable condition: Does the user belong to the company_id of the row?
-- Categories
CREATE POLICY "Users can manage categories of their companies" ON public.categorias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = categorias.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Pacientes
CREATE POLICY "Users can manage pacientes of their companies" ON public.pacientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = pacientes.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Becas
CREATE POLICY "Users can manage becas of their companies" ON public.becas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = becas.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Transacciones
CREATE POLICY "Users can manage transacciones of their companies" ON public.transacciones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = transacciones.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Cuentas por Cobrar
CREATE POLICY "Users can manage cuentas_por_cobrar of their companies" ON public.cuentas_por_cobrar
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = cuentas_por_cobrar.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Abonos
CREATE POLICY "Users can manage abonos of their companies" ON public.abonos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = abonos.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Presupuesto
CREATE POLICY "Users can manage presupuesto of their companies" ON public.presupuesto
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_companies 
      WHERE user_companies.company_id = presupuesto.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );
