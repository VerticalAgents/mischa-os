-- Fix critical security issue: Restrict access to sensitive financial data
-- Tables like custos_fixos, custos_variaveis, and pedidos contain sensitive business information
-- that should only be accessible to authorized personnel

-- 1. SECURE CUSTOS_FIXOS TABLE
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can read custos_fixos" ON public.custos_fixos;
DROP POLICY IF EXISTS "Authenticated users can insert custos_fixos" ON public.custos_fixos;
DROP POLICY IF EXISTS "Authenticated users can update custos_fixos" ON public.custos_fixos;
DROP POLICY IF EXISTS "Authenticated users can delete custos_fixos" ON public.custos_fixos;

-- Create admin-only policies for custos_fixos
CREATE POLICY "Only admins can read custos_fixos" 
ON public.custos_fixos 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert custos_fixos" 
ON public.custos_fixos 
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update custos_fixos" 
ON public.custos_fixos 
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete custos_fixos" 
ON public.custos_fixos 
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. SECURE CUSTOS_VARIAVEIS TABLE
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can read custos_variaveis" ON public.custos_variaveis;
DROP POLICY IF EXISTS "Authenticated users can insert custos_variaveis" ON public.custos_variaveis;
DROP POLICY IF EXISTS "Authenticated users can update custos_variaveis" ON public.custos_variaveis;
DROP POLICY IF EXISTS "Authenticated users can delete custos_variaveis" ON public.custos_variaveis;

-- Create admin-only policies for custos_variaveis
CREATE POLICY "Only admins can read custos_variaveis" 
ON public.custos_variaveis 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert custos_variaveis" 
ON public.custos_variaveis 
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update custos_variaveis" 
ON public.custos_variaveis 
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete custos_variaveis" 
ON public.custos_variaveis 
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. SECURE PEDIDOS TABLE
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage pedidos" ON public.pedidos;

-- Create admin-only policies for pedidos
CREATE POLICY "Only admins can read pedidos" 
ON public.pedidos 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert pedidos" 
ON public.pedidos 
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update pedidos" 
ON public.pedidos 
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete pedidos" 
ON public.pedidos 
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));