-- Remover política permissiva que permite todos lerem categorias_produto
DROP POLICY IF EXISTS "Authenticated users can read categorias_produto" ON categorias_produto;

-- Remover também a política de admin que pode conflitar
DROP POLICY IF EXISTS "Only admins can modify categorias_produto" ON categorias_produto;