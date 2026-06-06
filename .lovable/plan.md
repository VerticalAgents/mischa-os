## Problema

No `AgendamentoEditModal`, às vezes aparece "Nenhum produto disponível para as categorias habilitadas deste cliente" mesmo quando o cliente tem categorias configuradas.

**Causa raiz:** `ProdutoQuantidadeSelector` (e os editores de Trocas/Bonificações) decide mostrar a mensagem com base em `produtosFiltrados.length === 0`, sem considerar:

1. **`produtos` ainda carregando** — `useSupabaseProdutos` expõe um `loading` que hoje é ignorado. Enquanto produtos não chegam, `produtosFiltrados` é `[]` e a mensagem aparece indevidamente.
2. **Cliente ainda não hidratado no store** — quando a prop `categoriasHabilitadas` não vem (ou vem vazia momentaneamente), o componente faz fallback para `getClientePorId(clienteId)?.categoriasHabilitadas ?? []`. Se o `useClienteStore` ainda não populou aquele cliente, `habilitadas` fica `[]` e a mensagem dispara.

Resultado: condição de corrida que mostra o aviso até a próxima re-renderização.

## Mudanças

### 1. `src/components/agendamento/ProdutoQuantidadeSelector.tsx`
- Consumir `loading` de `useSupabaseProdutos`.
- Substituir o bloco único de mensagem (linhas ~300-309) por três estados:
  - `loading` ou `produtos.length === 0` → "Carregando produtos…" (texto neutro, sem alarme).
  - `!loading && habilitadas.length === 0` → "Configure as categorias do cliente primeiro."
  - `!loading && habilitadas.length > 0 && produtosFiltrados.length === 0` → "Nenhum produto ativo nas categorias habilitadas deste cliente."
  - `produtosDisponiveis.length === 0 && value.length > 0` → mantém o aviso âmbar atual.

### 2. `src/components/agendamento/TrocasPendentesEditor.tsx` e `BonificacoesPendentesEditor.tsx`
- Mesmo tratamento: usar `loading` do hook de produtos para não filtrar/desabilitar prematuramente, e só mostrar mensagens de "sem produtos" após o carregamento concluir.

### 3. Sem mudanças no backend/RLS
A correção é puramente de UI/estado de carregamento — os dados existem, só estão sendo lidos cedo demais.

## Validação

- Abrir o modal de edição de um agendamento de cliente com categorias habilitadas várias vezes seguidas: nunca deve aparecer a mensagem falsa; ao invés disso, deve aparecer brevemente "Carregando produtos…".
- Cliente realmente sem categorias: continua mostrando a orientação para configurar categorias.
- Trocas e Bonificações: lista de produtos enche corretamente sem mensagem incorreta.
