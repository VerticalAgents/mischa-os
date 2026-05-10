# Lista de Compras — base em entregas confirmadas

## Objetivo

Substituir a fonte de dados do cálculo (movimentações de estoque, que estão poluídas por ajustes manuais) pelas **entregas confirmadas dos últimos 28 dias**, convertendo para insumos via receitas.

## Lógica nova

1. Buscar `historico_entregas` dos últimos 28 dias com `tipo = 'entrega'` (confirmadas).
2. A partir do campo `itens` (jsonb), somar quantidade vendida por produto.
3. Para cada produto:
   - Encontrar receita via `rendimentos_receita_produto` (rendimento real por forma).
   - `formas_necessarias = unidades_vendidas / rendimento`
   - Se produto não tem receita/rendimento configurado: **ignorar e listar no aviso**.
4. Para cada receita, multiplicar quantidade dos itens (`itens_receita`) pelo nº de formas → consumo total de cada insumo nos 28 dias.
5. `consumo_semanal_medio = consumo_28d / 4`
6. `necessario = consumo_semanal_medio * (cobertura / 7)` onde cobertura ∈ {7, 14, 30}.
7. `a_comprar = max(0, necessario - estoque_atual_insumo)`
8. `custo_total = a_comprar * custo_medio`

## UI

- Mantém os 3 botões de cobertura (7/14/30 dias).
- Mantém botão "Gerar lista" e "Exportar XLSX".
- Card de total estimado.
- **Novo:** banner com lista de produtos ignorados (sem receita/rendimento), pra usuário saber o que ficou de fora.
- Tabela: insumo, consumo médio semanal, necessário no período, estoque atual, a comprar, custo.

## Arquivos

- `src/hooks/useListaComprasAutomatica.ts` — reescrita completa: trocar query de `movimentacoes_estoque_insumos` por `historico_entregas`, e usar `receitas` + `rendimentos_receita_produto` + `produtos` + `insumos` (já há hooks: `useSupabaseReceitas`, `useRendimentosReceitaProduto`, `useSupabaseProdutos`, `useSupabaseInsumos`).
- `src/components/estoque/tabs/NecessidadeInsumosTab.tsx` — adicionar exibição de produtos ignorados (array vindo do hook).

## Detalhes técnicos

```ts
// Query
.from('historico_entregas')
.select('itens, data')
.eq('tipo', 'entrega')
.gte('data', dataLimite28d)

// Agregação
itens.forEach(i => unidadesPorProduto[i.produto] += i.quantidade)

// Por produto -> receita -> formas -> insumos
formas = unidadesVendidas / rendimento
insumosConsumo[insumoId] += itemReceita.quantidade * formas

// Por insumo
medioSemanal = consumo28d / 4
necessario = medioSemanal * (coberturaDias / 7)
aComprar = max(0, necessario - estoqueAtual)
```

Sem mudanças de schema, sem migrations.