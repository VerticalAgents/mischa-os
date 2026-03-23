

## Plano: Toggle para inativar/ativar produtos na página de Estoque

### O que será feito
Adicionar um toggle (Switch) em cada linha de produto na tabela de estoque, permitindo ativar/desativar produtos. Produtos inativos ficam ocultos em agendamento, produção, e seleções — mas continuam visíveis na página de estoque (com visual esmaecido).

### Como funciona hoje
- A tabela `produtos_finais` já tem o campo `ativo` (boolean, default true)
- Muitas queries do sistema já filtram `.eq('ativo', true)` (agendamento, PCP, proporções, etc.)
- O hook `useSupabaseProdutos` já tem `atualizarProduto()` que faz update no Supabase
- O `useSupabaseProdutos` carrega TODOS os produtos (sem filtro de ativo), o que é correto para a página de estoque

### Alterações

**1. `CategoriaEstoqueGroup.tsx`** — Adicionar coluna "Ativo" na tabela com um Switch por produto
- Nova coluna entre "Produto" e "Saldo"
- Switch que chama callback `onToggleAtivo(produtoId, novoValor)`
- Linha do produto inativo com `opacity-50` para feedback visual

**2. `EstoqueProdutosTab.tsx`** — Adicionar handler e prop de toggle
- Importar `useSupabaseProdutos` para acessar `atualizarProduto`
- Criar função `handleToggleAtivo` que faz update de `ativo` e recarrega saldos
- Passar callback para `CategoriaEstoqueGroup`
- Adicionar switch "Mostrar inativos" nos filtros (por padrão oculta inativos)

**3. Nenhuma migração necessária** — O campo `ativo` já existe na tabela e já é respeitado pelas queries de agendamento, PCP, etc.

### Detalhes técnicos
- O toggle chama `atualizarProduto(produtoId, { ativo: false })` via Supabase
- Filtro "Mostrar inativos" no topo (desligado por padrão) — quando ligado, mostra todos
- Produtos inativos já são filtrados automaticamente nas outras partes do sistema

