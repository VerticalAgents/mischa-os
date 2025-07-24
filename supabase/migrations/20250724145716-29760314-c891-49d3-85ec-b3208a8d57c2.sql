
-- Phase 1: Enable RLS on all unprotected tables and create proper policies

-- Enable RLS on unprotected tables
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

-- Create secure policies for configuration tables (authenticated users can read, admins can modify)
CREATE POLICY "Authenticated users can view categorias_estabelecimento" 
  ON public.categorias_estabelecimento 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage categorias_estabelecimento" 
  ON public.categorias_estabelecimento 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categorias_estabelecimento" 
  ON public.categorias_estabelecimento 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categorias_estabelecimento" 
  ON public.categorias_estabelecimento 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view categorias_produto" 
  ON public.categorias_produto 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage categorias_produto" 
  ON public.categorias_produto 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categorias_produto" 
  ON public.categorias_produto 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categorias_produto" 
  ON public.categorias_produto 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view formas_pagamento" 
  ON public.formas_pagamento 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage formas_pagamento" 
  ON public.formas_pagamento 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update formas_pagamento" 
  ON public.formas_pagamento 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete formas_pagamento" 
  ON public.formas_pagamento 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view movimentacoes_estoque_insumos" 
  ON public.movimentacoes_estoque_insumos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage movimentacoes_estoque_insumos" 
  ON public.movimentacoes_estoque_insumos 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update movimentacoes_estoque_insumos" 
  ON public.movimentacoes_estoque_insumos 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete movimentacoes_estoque_insumos" 
  ON public.movimentacoes_estoque_insumos 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view representantes" 
  ON public.representantes 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage representantes" 
  ON public.representantes 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update representantes" 
  ON public.representantes 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete representantes" 
  ON public.representantes 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view rotas_entrega" 
  ON public.rotas_entrega 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage rotas_entrega" 
  ON public.rotas_entrega 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update rotas_entrega" 
  ON public.rotas_entrega 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete rotas_entrega" 
  ON public.rotas_entrega 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view subcategorias_custos" 
  ON public.subcategorias_custos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage subcategorias_custos" 
  ON public.subcategorias_custos 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update subcategorias_custos" 
  ON public.subcategorias_custos 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete subcategorias_custos" 
  ON public.subcategorias_custos 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view subcategorias_produto" 
  ON public.subcategorias_produto 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage subcategorias_produto" 
  ON public.subcategorias_produto 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update subcategorias_produto" 
  ON public.subcategorias_produto 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete subcategorias_produto" 
  ON public.subcategorias_produto 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view tipos_cobranca" 
  ON public.tipos_cobranca 
  FOR SELECT 
  USING (auth.ud() IS NOT NULL);

CREATE POLICY "Authenticated users can manage tipos_cobranca" 
  ON public.tipos_cobranca 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tipos_cobranca" 
  ON public.tipos_cobranca 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tipos_cobranca" 
  ON public.tipos_cobranca 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view tipos_logistica" 
  ON public.tipos_logistica 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage tipos_logistica" 
  ON public.tipos_logistica 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tipos_logistica" 
  ON public.tipos_logistica 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tipos_logistica" 
  ON public.tipos_logistica 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Fix database functions to prevent search path manipulation attacks
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ultima_entrada_insumo()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.insumos 
    SET ultima_entrada = NEW.data_movimentacao 
    WHERE id = NEW.insumo_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_configuracoes_sistema_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_agendamentos_clientes_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create user roles system for proper admin authentication
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
  ON public.user_roles 
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
