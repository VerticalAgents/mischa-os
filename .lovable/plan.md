## Diagnóstico

A Beatriz está logada como funcionária (`role: producao`, `staff_user_id: b7cf88d9...`) vinculada ao proprietário (`owner_id: 7618131a...`). Na aba **Produtos** do Estoque, ela vê:

- **Revenda Padrão**: "0 de 6 produtos" com "Nenhum produto com proporção > 0% nesta categoria" (deveria mostrar Brownie Avelã 30%, Choco Duo 25%, Doce de Leite 15%, Stikadinho 20%, Tradicional 10%).
- **Food Service**: 3 produtos aparecem normalmente (porque não dependem de proporções).

### Causa raiz

O hook `src/hooks/useSupabaseProporoesPadrao.ts` (linha 57) faz a query com filtro explícito:

```ts
.eq('user_id', user.id)
```

Como a Beatriz é funcionária, `user.id` é o ID dela (`b7cf88d9...`), mas as proporções foram salvas pelo proprietário com `user_id = 7618131a...`. Resultado: a query retorna **zero proporções** para a Beatriz, então o toggle "Apenas proporção > 0%" esconde todos os produtos da categoria Revenda Padrão.

A RLS no banco já está correta (`user_id = get_owner_id(auth.uid())` resolve o owner para staff), mas o filtro client-side redundante quebra essa resolução.

## Correção

Remover o filtro redundante `.eq('user_id', user.id)` do hook `useSupabaseProporoesPadrao.ts` na função `carregarProporcoes` (linha 57). A RLS do Supabase já garante que cada usuário veja apenas as proporções do seu owner — não precisa duplicar isso no client.

Auditar o mesmo hook nas funções de criar/atualizar/desativar para garantir consistência:
- Ao **criar** uma nova proporção, usar `get_owner_id` via RPC ou simplesmente deixar o trigger/policy validar — mas no insert, o `user_id` deve ser o `owner_id` (não o `staff_user_id`), senão a policy `WITH CHECK (user_id = get_owner_id(auth.uid()))` rejeitará. Vou ajustar para resolver o `owner_id` antes de inserir/atualizar/deletar quando o usuário for staff.

### Arquivos alterados
- `src/hooks/useSupabaseProporoesPadrao.ts`: remover filtro `.eq('user_id', user.id)` na leitura; resolver `owner_id` (via RPC `get_owner_id` ou consulta a `staff_accounts`) antes de operações de escrita, para que funcionários consigam editar proporções do owner sem violar RLS.

## Verificação

Após a correção, a Beatriz verá:
- Revenda Padrão: 5 produtos com proporção > 0% (Brownie Avelã, Choco Duo, Doce de Leite, Stikadinho, Tradicional).
- Filtro "Apenas proporção > 0%" funcionando corretamente.
- Capacidade de editar proporções (se o perfil tiver `can_edit` na rota).

## Observação adicional

Vale uma varredura futura em outros hooks que usam o padrão `.eq('user_id', user.id)` (ex: `useSupabaseCategoriasProduto`, `useSupabaseProdutos`, etc.) para garantir que nenhum outro módulo apresente o mesmo sintoma para funcionários. Não vou tocar agora para manter o escopo focado, mas posso auditar a seguir se quiser.