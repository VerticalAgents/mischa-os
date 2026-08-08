# Filtro de categorias na Projeção de Produção

Adicionar no **Setup do PCP** uma configuração que define quais categorias de produto entram na projeção da semana. Assim a produção massiva da Odara (Private Label) pode ser excluída, deixando o planejamento da Revenda Padrão legível.

## Como vai funcionar

1. Novo card no Setup: **"Categorias na Projeção de Produção"**
   - Lista todas as categorias de produto com um toggle/checkbox por categoria (mesma paleta de cor já usada nos filtros do dashboard).
   - Padrão: todas incluídas. Atalhos "Selecionar todas" / "Limpar".
   - Texto de apoio explicando que categorias desmarcadas ficam fora da projeção semanal.
   - Salva junto com o botão "Salvar Setup" existente.

2. Aba **Projeção de Produção** passa a respeitar a configuração:
   - Produtos de categorias desmarcadas são removidos do card **Produtos Necessários** (total, contagem de unidades e detalhes por produto).
   - O mesmo conjunto filtrado alimenta **Estoque Disponível** e **Sugestão de Produção**, para os números ficarem coerentes.
   - Um aviso discreto no topo do card (ex.: "1 categoria fora da projeção") indica que há filtro ativo, com link mental para o Setup.
   - Se todas as categorias estiverem incluídas, nada muda em relação a hoje.

## Detalhes técnicos

- `ConfiguracoesProducao` (`src/types/index.ts`): novo campo opcional `projecaoCategoriasExcluidas?: number[]` (lista vazia = tudo incluído). Persistido pelo `useConfigStore` (zustand persist) como as outras configs de produção.
- `SetupPCPTab.tsx`: usar `useSupabaseCategoriasProduto()` para listar categorias; estado local `categoriasExcluidas`; incluir o campo no objeto passado a `atualizarConfiguracoesProducao`.
- `ProjecaoProducaoTab.tsx`:
  - carregar mapa `produto_id → categoria_id` (select `id, categoria_id` em `produtos_finais`, produtos ativos);
  - aplicar o filtro no `useMemo` de `quantidadesPorProduto`, antes de derivar `produtosOrdenados`, `quantidadeTotal`, `quantidadesNecessarias` e `ordemProdutosNecessarios` — assim `EstoqueDisponivel` e `SugestaoProducao` herdam o filtro automaticamente.
  - produtos sem `categoria_id` continuam sempre incluídos (não são excluíveis).
- Nenhuma mudança de banco de dados e nenhuma alteração na aba Dashboard (que já tem seu próprio filtro de categorias).
