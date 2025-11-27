-- Fase 2C: Corrigir RLS da tabela historico_producao
-- Remove políticas permissivas atuais
DROP POLICY IF EXISTS "Users can view historico_producao" ON historico_producao;
DROP POLICY IF EXISTS "Users can insert historico_producao" ON historico_producao;
DROP POLICY IF EXISTS "Users can update historico_producao" ON historico_producao;
DROP POLICY IF EXISTS "Users can delete historico_producao" ON historico_producao;

-- Manter apenas as políticas de admin (já existentes, mas garantir consistência)
-- Se já existem políticas de admin, não precisamos recriar