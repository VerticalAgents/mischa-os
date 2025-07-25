
-- Phase 1: Critical Database Security Fixes

-- 1. Create user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = required_role
  );
$$;

-- 2. Enable RLS on unprotected tables
ALTER TABLE public.categorias_estabelecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotas_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias_custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_logistica ENABLE ROW LEVEL SECURITY;

-- 3. Create proper RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Add restrictive policies to previously unprotected tables
-- Categorias estabelecimento - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read categorias_estabelecimento"
ON public.categorias_estabelecimento
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify categorias_estabelecimento"
ON public.categorias_estabelecimento
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Categorias produto - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read categorias_produto"
ON public.categorias_produto
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify categorias_produto"
ON public.categorias_produto
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Formas pagamento - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read formas_pagamento"
ON public.formas_pagamento
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify formas_pagamento"
ON public.formas_pagamento
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Movimentações estoque insumos - authenticated users can manage
CREATE POLICY "Authenticated users can manage movimentacoes_estoque_insumos"
ON public.movimentacoes_estoque_insumos
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Representantes - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read representantes"
ON public.representantes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify representantes"
ON public.representantes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Rotas entrega - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read rotas_entrega"
ON public.rotas_entrega
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify rotas_entrega"
ON public.rotas_entrega
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Subcategorias custos - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read subcategorias_custos"
ON public.subcategorias_custos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify subcategorias_custos"
ON public.subcategorias_custos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Subcategorias produto - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read subcategorias_produto"
ON public.subcategorias_produto
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify subcategorias_produto"
ON public.subcategorias_produto
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tipos cobrança - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read tipos_cobranca"
ON public.tipos_cobranca
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify tipos_cobranca"
ON public.tipos_cobranca
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tipos logistica - authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can read tipos_logistica"
ON public.tipos_logistica
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify tipos_logistica"
ON public.tipos_logistica
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix existing database functions with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ultima_entrada_insumo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.insumos 
    SET ultima_entrada = NEW.data_movimentacao 
    WHERE id = NEW.insumo_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_configuracoes_sistema_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_agendamentos_clientes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. Create audit log table for security monitoring
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
