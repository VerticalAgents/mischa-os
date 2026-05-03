## Objetivo

Nos modos **% da média histórica** e **Cobertura por dias** do Setup PCP, mostrar uma lista com a quantidade-alvo resultante para cada produto ativo, atualizada em tempo real conforme o usuário altera o parâmetro (percentual ou dias).

Hoje só aparece o "Alvo total" agregado — falta a quebra por produto, que é o que dá visibilidade real do impacto da configuração.

## Mudanças

Arquivo único: `src/components/pcp/SetupPCPTab.tsx`

1. **Reaproveitar a lista de produtos ativos** já carregada (`produtos` + `mediaVendasPorProduto`) para os três modos — não só para "Fixo por produto".

2. **Renderizar uma tabela/lista por produto** dentro dos painéis de `percentual` e `cobertura`, com colunas:
   - Produto
   - Média semanal (un)
   - Alvo calculado (un) — destacado

   Cálculo por linha:
   - Percentual: `round(media_produto × percentual / 100)`
   - Cobertura: `round(media_produto × dias / 7)`

3. **Layout**: manter o card de pré-visualização (média total + alvo total) no topo do painel, e abaixo a lista rolável (`max-h-[420px] overflow-y-auto`, mesmo padrão do modo "fixo"), para manter consistência visual entre os três modos.

4. **Ordenação**: por nome do produto (igual ao modo fixo). Produtos sem média aparecem com 0.

5. Sem mudanças em store, tipos ou na lógica de `SugestaoProducao` — o cálculo já está correto, só estamos expondo o resultado por produto na UI.

## Detalhe técnico

```ts
const calcAlvoProduto = (produtoId: string) => {
  const media = mediaVendasPorProduto[produtoId] ?? 0;
  if (modo === "percentual") return Math.round((media * percentual) / 100);
  if (modo === "cobertura")  return Math.round((media * coberturaDias) / 7);
  return 0;
};
```

A lista é re-renderizada automaticamente quando `percentual` ou `coberturaDias` mudam (já estão no state local).
