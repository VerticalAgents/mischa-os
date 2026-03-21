

# Funcionários por Empresa — Acesso Isolado Multi-Tenant

## Problema Atual
O role `producao` é global. Qualquer admin pode atribuir o role a qualquer usuário. Não existe vínculo "este funcionário pertence a esta empresa". Enzo e Lucca são ambos donos de empresa, mas o sistema trata todos como iguais.

## Conceito
- **Dono de empresa** = qualquer usuário com role `admin` ou `user` (quem cria conta é dono)
- **Funcionário** = conta criada pelo dono, com role `producao`, vinculada ao dono via `owner_id`
- Funcionários do Lucca não veem dados do Enzo e vice-versa
- A página Segurança (`/security`) continua sendo só para você (super-admin da plataforma)

## Plano de Implementação

### 1. Migration SQL — Tabela `staff_accounts`

Nova tabela para vincular funcionários aos donos:

```sql
CREATE TABLE public.staff_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'producao',
  nome text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, staff_user_id)
);

ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;

-- Donos veem só seus funcionários
CREATE POLICY "Owners can manage own staff"
ON staff_accounts FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());
```

Adicionar `owner_id` na tabela `user_roles` para saber a quem o `producao` pertence:

```sql
ALTER TABLE user_roles ADD COLUMN owner_id uuid REFERENCES auth.users(id);
```

### 2. Edge Function — `create-staff-user`

Uma Edge Function que o dono de empresa chama para criar a conta do funcionário:

- Recebe: `email`, `password`, `nome`, `role` (por enquanto só `producao`)
- Usa o Supabase Admin API (`supabase.auth.admin.createUser`) para criar o usuário
- Insere na `staff_accounts` com `owner_id = auth.uid()` do chamador
- Insere na `user_roles` com role `producao` e `owner_id`

Isso garante que o dono define email e senha do funcionário.

### 3. Nova aba em Configurações — "Funcionários"

- Criar `src/components/configuracoes/tabs/FuncionariosTab.tsx`
- Adicionar na navegação de Configurações (grupo "Administração")
- Interface: lista de funcionários cadastrados, botão "Adicionar Funcionário"
- Modal de cadastro: campos email, senha, nome, role (select com "Gerente de Produção")
- Ações: desativar/remover funcionário

### 4. RLS — Dados isolados por empresa

As tabelas que o `producao` acessa (agendamentos, estoque, PCP, etc.) precisam de policies que permitam acesso quando o usuário é funcionário vinculado ao dono dos dados. Isso requer:

- Criar função `get_owner_id(user_id)` que retorna o `owner_id` do staff, ou o próprio `user_id` se for dono
- Adicionar policies: `USING (owner_id = get_owner_id(auth.uid()))` nas tabelas relevantes

**Importante**: Essa etapa de RLS é a mais sensível e pode ser feita incrementalmente, tabela por tabela.

### 5. Ajustar `UserManager` (Segurança)

- Remover a opção "Gerente de Produção" do dropdown — esse role não se atribui globalmente
- Manter só `admin` e `user` como opções (donos de empresa)
- Funcionários aparecem numa seção separada ou nem aparecem aqui

## Arquivos Novos
- `supabase/functions/create-staff-user/index.ts` — Edge Function
- `src/components/configuracoes/tabs/FuncionariosTab.tsx` — Aba de funcionários
- 1 migration SQL (tabela + policies + função helper)

## Arquivos Modificados
- `src/components/configuracoes/ConfiguracoesNavigation.tsx` — adicionar aba "Funcionários"
- `src/components/configuracoes/ConfiguracoesTabs.tsx` — registrar componente
- `src/components/security/UserManager.tsx` — remover opção `producao` do dropdown
- RLS policies das tabelas de dados (incremental)

## O que NÃO muda
- `AdminGuard`, `ProducaoGuard`, `RoleBasedRoute` — continuam funcionando
- Sidebar filtrada por role — continua igual
- Página de Segurança — continua só para super-admin
- Roles existentes de Lucca (admin) e Enzo (user)

## Ordem de Execução Sugerida
1. Migration SQL (tabela + função)
2. Edge Function `create-staff-user`
3. Aba "Funcionários" em Configurações
4. Ajustar UserManager
5. RLS incremental nas tabelas de dados (etapa futura, mais sensível)

