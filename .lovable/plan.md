## Causa raiz

A função `public.get_owner_id(uuid)` (usada nas RLS de `tipos_cobranca`, `formas_pagamento`, `categorias_produto`, etc.) consulta APENAS a tabela `staff_accounts`. Quando o usuário logado é um representante (que está em `representante_accounts`, não em `staff_accounts`), a função devolve o próprio `auth.uid()` do representante. Resultado:

- A política `Owner or staff can view ...` resolve para `user_id = auth.uid()` → não bate com nenhuma linha (os registros são do owner).
- Os hooks também filtram por `scopeUserId` correto no JS, mas a RLS ainda nega — porque depende da mesma função.

Por isso os selects continuam vazios mesmo após as últimas mudanças.

Verificações no banco confirmam:
- Owner `7618131a…` tem 3 tipos_cobranca, 3 formas_pagamento e 3 categorias_produto ativas.
- Representante `7d33e0e2…` está vinculado a esse owner em `representante_accounts.ativo = true`.
- `staff_accounts` para esse uid: 0 registros.
- `get_owner_id(rep_uid)` retorna o próprio uid do rep (errado).

## Correção

### 1. Migração — atualizar `get_owner_id`

Estender a função para também olhar em `representante_accounts`, mantendo `staff_accounts` como fallback primário (admins/funcionários):

```sql
CREATE OR REPLACE FUNCTION public.get_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.staff_accounts
       WHERE staff_user_id = _user_id AND ativo = true LIMIT 1),
    (SELECT owner_id FROM public.representante_accounts
       WHERE auth_user_id = _user_id AND ativo = true LIMIT 1),
    _user_id
  )
$$;
```

Com isso, todas as RLS que já usam `get_owner_id` (categorias_produto, tipos_cobranca, formas_pagamento, insumos, categorias_insumo, etc.) passam a funcionar para representantes automaticamente, sem precisar criar novas policies em cada tabela.

### 2. Sem mudanças nos hooks

`useSupabaseTiposCobranca`, `useSupabaseFormasPagamento` e `useSupabaseCategoriasProduto` já resolvem o `scopeUserId` corretamente no JS (consultando `representante_accounts`). Após corrigir a função no banco, a RLS deixa de bloquear e os SELECTs passam a retornar os dados do owner.

### 3. Sem mudanças no formulário

`ClienteFormDialog` já renderiza Tipo de Cobrança, Forma de Pagamento e Categorias de Produto Habilitadas para o representante. Os selects vão popular automaticamente.

## Arquivos afetados

- **Novo**: `supabase/migrations/<timestamp>_fix_get_owner_id_representante.sql`

## Efeito colateral positivo

Qualquer outra tabela que já tenha policy `user_id = get_owner_id(auth.uid())` (insumos, componentes_produto via produtos_finais, etc.) também passa a respeitar o vínculo do representante — o que é o comportamento esperado de multi-tenant.
