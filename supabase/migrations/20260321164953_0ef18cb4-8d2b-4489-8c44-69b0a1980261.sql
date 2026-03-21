
-- 1) Fix get_user_role to use deterministic priority
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = $1 
  ORDER BY CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'producao' THEN 2 
    WHEN 'user' THEN 3 
    ELSE 4 END 
  ASC LIMIT 1;
$$;

-- 2) Create get_my_staff_context: returns owner_id and custom_role_id for current user
CREATE OR REPLACE FUNCTION public.get_my_staff_context()
 RETURNS TABLE(owner_id uuid, custom_role_id uuid, staff_role app_role)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT sa.owner_id, sa.custom_role_id, sa.role
  FROM public.staff_accounts sa
  WHERE sa.staff_user_id = auth.uid()
    AND sa.ativo = true
  LIMIT 1;
$$;

-- 3) Create has_route_permission: checks if current user can access a route
CREATE OR REPLACE FUNCTION public.has_route_permission(p_route_key text, p_need_edit boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_role app_role;
  v_custom_role_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN false; END IF;
  
  -- Admin always has full access
  v_role := public.get_user_role(v_user_id);
  IF v_role = 'admin' THEN RETURN true; END IF;
  
  -- Check if user is staff with custom_role_id
  SELECT sa.custom_role_id INTO v_custom_role_id
  FROM public.staff_accounts sa
  WHERE sa.staff_user_id = v_user_id AND sa.ativo = true
  LIMIT 1;
  
  IF v_custom_role_id IS NULL THEN RETURN false; END IF;
  
  -- Check route permission for this custom role
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.custom_role_id = v_custom_role_id
      AND rp.route_key = p_route_key
      AND rp.can_access = true
      AND (NOT p_need_edit OR rp.can_edit = true)
  );
END;
$$;

-- 4) Create is_owner_or_staff: checks if current user is admin/owner or active staff of the owner
CREATE OR REPLACE FUNCTION public.is_owner_or_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN public.get_user_role(auth.uid()) = 'admin' THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.staff_accounts 
        WHERE staff_user_id = auth.uid() AND ativo = true
      ) THEN true
      ELSE false
    END;
$$;

-- 5) Update RLS on role_permissions so staff can only read their own custom_role permissions
DROP POLICY IF EXISTS "Users can read own role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can read role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can read role_permissions" ON public.role_permissions;

CREATE POLICY "Staff reads own custom_role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR custom_role_id = (
    SELECT sa.custom_role_id FROM public.staff_accounts sa
    WHERE sa.staff_user_id = auth.uid() AND sa.ativo = true
    LIMIT 1
  )
);

-- Keep admin write policies
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage role_permissions" ON public.role_permissions;

CREATE POLICY "Admins can insert role_permissions"
ON public.role_permissions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update role_permissions"
ON public.role_permissions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete role_permissions"
ON public.role_permissions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6) Update key operational tables RLS to allow staff access via get_owner_id
-- Products (produtos_finais) - staff needs to see owner's products
DROP POLICY IF EXISTS "Users can view their own products" ON public.produtos_finais;
DROP POLICY IF EXISTS "Users can manage their own products" ON public.produtos_finais;
CREATE POLICY "Owner or staff can view products"
ON public.produtos_finais FOR SELECT
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff with edit can manage products"
ON public.produtos_finais FOR ALL
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()))
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

-- Insumos - staff needs to see owner's insumos
DROP POLICY IF EXISTS "Users can view their own insumos" ON public.insumos;
DROP POLICY IF EXISTS "Users can manage their own insumos" ON public.insumos;
CREATE POLICY "Owner or staff can view insumos"
ON public.insumos FOR SELECT
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff can manage insumos"
ON public.insumos FOR ALL
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()))
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

-- Receitas base
DROP POLICY IF EXISTS "Users can view their own receitas" ON public.receitas_base;
DROP POLICY IF EXISTS "Users can manage their own receitas" ON public.receitas_base;
CREATE POLICY "Owner or staff can view receitas"
ON public.receitas_base FOR SELECT
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff can manage receitas"
ON public.receitas_base FOR ALL
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()))
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

-- Proporcoes padrao
DROP POLICY IF EXISTS "Users can view their own proporcoes" ON public.proporcoes_padrao;
DROP POLICY IF EXISTS "Users can manage their own proporcoes" ON public.proporcoes_padrao;
CREATE POLICY "Owner or staff can view proporcoes"
ON public.proporcoes_padrao FOR SELECT
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff can manage proporcoes"
ON public.proporcoes_padrao FOR ALL
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()))
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

-- Categorias produto
DROP POLICY IF EXISTS "Users can view their own categorias" ON public.categorias_produto;
DROP POLICY IF EXISTS "Users can manage their own categorias" ON public.categorias_produto;
CREATE POLICY "Owner or staff can view categorias_produto"
ON public.categorias_produto FOR SELECT
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff can manage categorias_produto"
ON public.categorias_produto FOR ALL
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()))
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

-- Categorias insumo
DROP POLICY IF EXISTS "Users can view their own categorias_insumo" ON public.categorias_insumo;
DROP POLICY IF EXISTS "Users can manage their own categorias_insumo" ON public.categorias_insumo;
CREATE POLICY "Owner or staff can view categorias_insumo"
ON public.categorias_insumo FOR SELECT
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff can manage categorias_insumo"
ON public.categorias_insumo FOR ALL
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()))
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

-- Tables without user_id but admin-only: agendamentos_clientes, historico_entregas, historico_producao, clientes
-- These need is_owner_or_staff() for SELECT
DROP POLICY IF EXISTS "Admin users can view agendamentos" ON public.agendamentos_clientes;
DROP POLICY IF EXISTS "Admin users can manage agendamentos" ON public.agendamentos_clientes;
CREATE POLICY "Owner or staff can view agendamentos"
ON public.agendamentos_clientes FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage agendamentos"
ON public.agendamentos_clientes FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

DROP POLICY IF EXISTS "Admin users can view historico_producao" ON public.historico_producao;
DROP POLICY IF EXISTS "Admin users can manage historico_producao" ON public.historico_producao;
CREATE POLICY "Owner or staff can view historico_producao"
ON public.historico_producao FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage historico_producao"
ON public.historico_producao FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

DROP POLICY IF EXISTS "Admin users can view historico_entregas" ON public.historico_entregas;
DROP POLICY IF EXISTS "Admin users can manage historico_entregas" ON public.historico_entregas;
CREATE POLICY "Owner or staff can view historico_entregas"
ON public.historico_entregas FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage historico_entregas"
ON public.historico_entregas FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Clientes
DROP POLICY IF EXISTS "Admin users can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin users can manage clientes" ON public.clientes;
CREATE POLICY "Owner or staff can view clientes"
ON public.clientes FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage clientes"
ON public.clientes FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Movimentacoes estoque produtos
DROP POLICY IF EXISTS "Admin users can view movimentacoes_estoque_produtos" ON public.movimentacoes_estoque_produtos;
DROP POLICY IF EXISTS "Admin users can manage movimentacoes_estoque_produtos" ON public.movimentacoes_estoque_produtos;
CREATE POLICY "Owner or staff can view mov_estoque_produtos"
ON public.movimentacoes_estoque_produtos FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage mov_estoque_produtos"
ON public.movimentacoes_estoque_produtos FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Movimentacoes estoque insumos
DROP POLICY IF EXISTS "Admin users can view movimentacoes_estoque_insumos" ON public.movimentacoes_estoque_insumos;
DROP POLICY IF EXISTS "Admin users can manage movimentacoes_estoque_insumos" ON public.movimentacoes_estoque_insumos;
CREATE POLICY "Owner or staff can view mov_estoque_insumos"
ON public.movimentacoes_estoque_insumos FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage mov_estoque_insumos"
ON public.movimentacoes_estoque_insumos FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Itens receita
DROP POLICY IF EXISTS "Admin users can view itens_receita" ON public.itens_receita;
DROP POLICY IF EXISTS "Admin users can manage itens_receita" ON public.itens_receita;
CREATE POLICY "Owner or staff can view itens_receita"
ON public.itens_receita FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage itens_receita"
ON public.itens_receita FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Componentes produto
DROP POLICY IF EXISTS "Admin users can view componentes_produto" ON public.componentes_produto;
DROP POLICY IF EXISTS "Admin users can manage componentes_produto" ON public.componentes_produto;
CREATE POLICY "Owner or staff can view componentes_produto"
ON public.componentes_produto FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage componentes_produto"
ON public.componentes_produto FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Clientes categorias
DROP POLICY IF EXISTS "Admin users can view clientes_categorias" ON public.clientes_categorias;
DROP POLICY IF EXISTS "Admin users can manage clientes_categorias" ON public.clientes_categorias;
CREATE POLICY "Owner or staff can view clientes_categorias"
ON public.clientes_categorias FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage clientes_categorias"
ON public.clientes_categorias FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Precos categoria cliente
DROP POLICY IF EXISTS "Admin users can view precos_categoria_cliente" ON public.precos_categoria_cliente;
DROP POLICY IF EXISTS "Admin users can manage precos_categoria_cliente" ON public.precos_categoria_cliente;
CREATE POLICY "Owner or staff can view precos_cat_cliente"
ON public.precos_categoria_cliente FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage precos_cat_cliente"
ON public.precos_categoria_cliente FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Confirmacoes reposicao
DROP POLICY IF EXISTS "Admin users can view confirmacoes_reposicao" ON public.confirmacoes_reposicao;
DROP POLICY IF EXISTS "Admin users can manage confirmacoes_reposicao" ON public.confirmacoes_reposicao;
CREATE POLICY "Owner or staff can view confirmacoes_reposicao"
ON public.confirmacoes_reposicao FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage confirmacoes_reposicao"
ON public.confirmacoes_reposicao FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Subcategorias produto
DROP POLICY IF EXISTS "Users can view their own subcategorias" ON public.subcategorias_produto;
DROP POLICY IF EXISTS "Users can manage their own subcategorias" ON public.subcategorias_produto;
CREATE POLICY "Owner or staff can view subcategorias_produto"
ON public.subcategorias_produto FOR SELECT
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff can manage subcategorias_produto"
ON public.subcategorias_produto FOR ALL
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()))
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

-- Rendimentos receita produto
DROP POLICY IF EXISTS "Admin users can view rendimentos" ON public.rendimentos_receita_produto;
DROP POLICY IF EXISTS "Admin users can manage rendimentos" ON public.rendimentos_receita_produto;
CREATE POLICY "Owner or staff can view rendimentos"
ON public.rendimentos_receita_produto FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage rendimentos"
ON public.rendimentos_receita_produto FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Categorias estabelecimento
DROP POLICY IF EXISTS "Admin users can view categorias_estabelecimento" ON public.categorias_estabelecimento;
DROP POLICY IF EXISTS "Admin users can manage categorias_estabelecimento" ON public.categorias_estabelecimento;
CREATE POLICY "Owner or staff can view cat_estabelecimento"
ON public.categorias_estabelecimento FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage cat_estabelecimento"
ON public.categorias_estabelecimento FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

-- Giros semanais personalizados
DROP POLICY IF EXISTS "Admin users can view giros_semanais" ON public.giros_semanais_personalizados;
DROP POLICY IF EXISTS "Admin users can manage giros_semanais" ON public.giros_semanais_personalizados;
CREATE POLICY "Owner or staff can view giros_semanais"
ON public.giros_semanais_personalizados FOR SELECT
TO authenticated
USING (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can manage giros_semanais"
ON public.giros_semanais_personalizados FOR ALL
TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());
