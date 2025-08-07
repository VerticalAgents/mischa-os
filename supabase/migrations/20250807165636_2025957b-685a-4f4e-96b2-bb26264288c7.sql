
-- Phase 1: Critical Security Fixes

-- 1. Create initial admin user (assign admin role to the current user)
-- This assumes there's at least one user in the system
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'luccab.milleto@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Fix overly permissive RLS policies - Replace "true" policies with proper access controls

-- Fix clientes table - users should only see clients they have access to
DROP POLICY IF EXISTS "Authenticated users can manage clientes" ON public.clientes;

CREATE POLICY "Users can view all clientes" ON public.clientes
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage clientes" ON public.clientes
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix produtos table
DROP POLICY IF EXISTS "Authenticated users can manage produtos" ON public.produtos;

CREATE POLICY "Users can view produtos" ON public.produtos
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage produtos" ON public.produtos
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix sabores table
DROP POLICY IF EXISTS "Authenticated users can manage sabores" ON public.sabores;

CREATE POLICY "Users can view sabores" ON public.sabores
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sabores" ON public.sabores
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix insumos table
DROP POLICY IF EXISTS "Usuários autenticados podem acessar insumos" ON public.insumos;

CREATE POLICY "Users can view insumos" ON public.insumos
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage insumos" ON public.insumos
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix receitas_base table
DROP POLICY IF EXISTS "Usuários autenticados podem acessar receitas_base" ON public.receitas_base;

CREATE POLICY "Users can view receitas_base" ON public.receitas_base
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage receitas_base" ON public.receitas_base
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix itens_receita table
DROP POLICY IF EXISTS "Usuários autenticados podem acessar itens_receita" ON public.itens_receita;

CREATE POLICY "Users can view itens_receita" ON public.itens_receita
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage itens_receita" ON public.itens_receita
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix componentes_produto table
DROP POLICY IF EXISTS "Usuários autenticados podem acessar componentes_produto" ON public.componentes_produto;

CREATE POLICY "Users can view componentes_produto" ON public.componentes_produto
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage componentes_produto" ON public.componentes_produto
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix produtos_finais table
DROP POLICY IF EXISTS "Usuários autenticados podem acessar produtos_finais" ON public.produtos_finais;

CREATE POLICY "Users can view produtos_finais" ON public.produtos_finais
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage produtos_finais" ON public.produtos_finais
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix historico_producao table
DROP POLICY IF EXISTS "Authenticated users can manage historico_producao" ON public.historico_producao;

CREATE POLICY "Users can view historico_producao" ON public.historico_producao
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage historico_producao" ON public.historico_producao
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix function security issues - Update functions to use proper search paths
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = required_role
  );
$$;

-- 4. Create a secure IP detection function to replace external dependency
CREATE OR REPLACE FUNCTION public.get_request_ip()
RETURNS inet
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  -- Return a placeholder IP for now - this will be handled in the application layer
  SELECT '127.0.0.1'::inet;
$$;

-- 5. Add table for security events logging
CREATE TABLE IF NOT EXISTS public.security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    details jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Only admins can view security_events" ON public.security_events
    FOR SELECT 
    USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert security events
CREATE POLICY "System can insert security_events" ON public.security_events
    FOR INSERT 
    WITH CHECK (true);
