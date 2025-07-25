
-- Corrigir as políticas RLS para categorias_estabelecimento
-- Remover as políticas existentes que estão causando problemas
DROP POLICY IF EXISTS "Authenticated users can read categorias_estabelecimento" ON categorias_estabelecimento;
DROP POLICY IF EXISTS "Only admins can modify categorias_estabelecimento" ON categorias_estabelecimento;

-- Criar políticas mais permissivas para usuários autenticados
CREATE POLICY "Authenticated users can read categorias_estabelecimento" 
ON categorias_estabelecimento FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert categorias_estabelecimento" 
ON categorias_estabelecimento FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categorias_estabelecimento" 
ON categorias_estabelecimento FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categorias_estabelecimento" 
ON categorias_estabelecimento FOR DELETE 
USING (auth.uid() IS NOT NULL);
