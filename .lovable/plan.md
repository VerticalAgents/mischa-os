## Objetivo

Permitir que o representante visualize e selecione corretamente os campos de "Configurações Financeiras" (Tipo de Cobrança, Forma de Pagamento, Prazo de Pagamento, Emite Nota Fiscal) e "Categorias de Produtos Habilitadas" no formulário de cliente — usando os parâmetros cadastrados pelo admin (owner). Tal qual feito para categorias de estabelecimento e tipos de logística.

A edição/criação desses parâmetros continua restrita ao admin (já é o comportamento). O representante apenas seleciona entre as opções já cadastradas.

## Diagnóstico

Os campos não carregam para o representante por dois motivos combinados:

1. **RLS** das tabelas `tipos_cobranca` e `formas_pagamento` só permite `SELECT` quando `auth.uid() = user_id`. Como o representante não é o owner, ele não enxerga nada.
   - `categorias_produto` já tem política via `get_owner_id(auth.uid())`, então o representante já consegue ler — falta só o hook usar o escopo correto.
2. **Hooks** `useSupabaseTiposCobranca`, `useSupabaseFormasPagamento` e `useSupabaseCategoriasProduto` filtram por `user.id` (do representante) em vez do `owner_id` resolvido a partir de `representante_accounts`.

## Mudanças

### 1. Migração (RLS)

Adicionar políticas `SELECT` nas tabelas usadas no formulário, espelhando o padrão já usado em `categorias_produto` (via `get_owner_id`):

```sql
-- tipos_cobranca: representante lê os do owner
CREATE POLICY "Owner or staff can view tipos_cobranca"
ON public.tipos_cobranca FOR SELECT
USING (user_id = public.get_owner_id(auth.uid()));

-- formas_pagamento: representante lê os do owner
CREATE POLICY "Owner or staff can view formas_pagamento"
ON public.formas_pagamento FOR SELECT
USING (user_id = public.get_owner_id(auth.uid()));
```

(As políticas existentes `Users can read own ...` continuam valendo para o owner; o representante passa a ler via a nova política.)

### 2. Hooks — escopo do owner

Atualizar os três hooks para resolver o `owner_id` quando o usuário logado é representante (mesmo padrão já usado em `useSupabaseTiposLogistica.ts`):

- `src/hooks/useSupabaseTiposCobranca.ts`
- `src/hooks/useSupabaseFormasPagamento.ts`
- `src/hooks/useSupabaseCategoriasProduto.ts` (atualmente nem filtra por user_id; passar a filtrar pelo owner para consistência multi-tenant)

Lógica:

```ts
const { data: repAccount } = await supabase
  .from('representante_accounts')
  .select('owner_id')
  .eq('auth_user_id', user.id)
  .eq('ativo', true)
  .maybeSingle();

const scopeUserId = repAccount?.owner_id || user.id;
// .eq('user_id', scopeUserId)
```

### 3. UI (sem mudanças funcionais)

- O formulário do cliente (`ClienteFormDialog.tsx`) já renderiza esses campos para o representante; eles vão passar a popular automaticamente após as correções acima.
- A edição dos parâmetros (criar/alterar tipos de cobrança, formas de pagamento, categorias de produto) permanece exclusiva do admin nas Configurações — não há mudança no menu do representante.

## Arquivos afetados

- **Novo**: `supabase/migrations/<timestamp>_rls_rep_financeiro_categorias.sql`
- **Editar**: `src/hooks/useSupabaseTiposCobranca.ts`
- **Editar**: `src/hooks/useSupabaseFormasPagamento.ts`
- **Editar**: `src/hooks/useSupabaseCategoriasProduto.ts`
