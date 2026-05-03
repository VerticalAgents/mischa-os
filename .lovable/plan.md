## Problema

Na aba **Projeção de Produção**, os cards das linhas 1 e 2 ficam desalinhados porque:

1. O `CardHeader` do **Produtos Necessários** carrega controles extras (switch "Incluir previstos", radio "Apenas prováveis / Percentual", input %), o que faz o header crescer e empurrar todo o conteúdo para baixo. O **Estoque Disponível** ao lado tem header curto, então o bloco de "Estoque Total" e "Detalhes por Produto" ficam em alturas diferentes.
2. Na linha 1, **Estoque de Produtos** e **Produção Agendada** têm headers com alturas levemente diferentes (descrição com 1 vs 2 linhas em alguns viewports e botão "Nova Produção"), o que desalinha o destaque do total e o "Detalhes por Produto".
3. Os `<Card>` não têm `h-full`, então no grid `lg:grid-cols-2` cada card pega só sua altura natural.

## Solução

Padronizar a estrutura dos 4 cards pareados para que tenham:
- Mesma altura no grid (`h-full flex flex-col`, com `CardContent` em `flex-1`).
- Header com altura consistente (apenas título + descrição); controles vão para uma toolbar dentro do `CardContent`.
- Bloco de destaque (total) sempre com a mesma estrutura: label, número grande, linha de badges.

### Mudanças

**`src/components/pcp/ProjecaoProducaoTab.tsx`** — cartão "Produtos Necessários":
- Manter no `CardHeader` apenas `CardTitle` + `CardDescription`.
- Mover o bloco de controles (Switch "Incluir previstos", RadioGroup, Input %) para uma toolbar no topo do `CardContent`, dentro de uma `div` com borda inferior leve (`pb-3 mb-3 border-b`), garantindo alinhamento horizontal com o ícone de "Atualizar" do card vizinho.
- Adicionar `className="h-full flex flex-col"` ao `Card` e `flex-1` ao `CardContent`.

**`src/components/pcp/EstoqueDisponivel.tsx`**:
- Adicionar `h-full flex flex-col` ao `Card` e `flex-1` ao `CardContent`.
- Header só com título + descrição. O switch "Incluir prod. agendada" e o botão Atualizar podem permanecer no header (são compactos) — mas, para casar 100% com o card da esquerda, mover esses controles para a mesma toolbar dentro do `CardContent` (mantendo o botão refresh visível).

**`src/components/pcp/EstoqueProdutosSaldoRealCard.tsx`** e **`src/components/pcp/ProducaoAgendadaCard.tsx`**:
- Adicionar `h-full flex flex-col` ao `Card` e `flex-1` ao `CardContent`.
- Padronizar `CardDescription` para 1 linha (texto curto).
- Padronizar o bloco de destaque (Total) para a mesma altura: label + número 3xl + badges em linha (já é o padrão; só conferir paddings iguais — `p-4`).
- No `ProducaoAgendadaCard`, manter o botão "Nova Produção" no header alinhado à direita; alinhar verticalmente com `items-center` (ao invés de `items-start`) para evitar deslocamento.

**`ProjecaoProducaoTab.tsx`** — grids:
- Trocar `grid grid-cols-1 lg:grid-cols-2 gap-6` por `grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch` (explícito) nas duas linhas.

## Resultado esperado

```text
Linha 1
┌─────────────────────────┬─────────────────────────┐
│ Header (título+desc)    │ Header (título+desc) [+]│
├─────────────────────────┼─────────────────────────┤
│ [Total destacado]       │ [Total destacado]       │
│ Detalhes por Produto ▾  │ Detalhes por Produto ▾  │
└─────────────────────────┴─────────────────────────┘

Linha 2  (Produtos Necessários × Estoque Disponível)
┌─────────────────────────┬─────────────────────────┐
│ Header (título+desc)    │ Header (título+desc)    │
│ [toolbar de controles]  │ [toolbar de controles]🔄│
├─────────────────────────┼─────────────────────────┤
│ [Total destacado]       │ [Total destacado]       │
│ Detalhes por Produto ▾  │ Detalhes por Produto ▾  │
└─────────────────────────┴─────────────────────────┘
```

Cards passam a ter altura igual e os blocos de destaque + "Detalhes por Produto" ficam na mesma linha horizontal entre vizinhos.

## Arquivos

- `src/components/pcp/ProjecaoProducaoTab.tsx`
- `src/components/pcp/EstoqueDisponivel.tsx`
- `src/components/pcp/EstoqueProdutosSaldoRealCard.tsx`
- `src/components/pcp/ProducaoAgendadaCard.tsx`
