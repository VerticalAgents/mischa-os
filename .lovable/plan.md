## Mudanças solicitadas

### 1. Folha de auditoria: embalagens em UN (não kg)

Atualmente a coluna "Sistema / Contagem" da seção **Insumos** força conversão para kg. Para insumos da categoria **Embalagem** (e outros não-massa), a contagem deve ser em **unidades**.

**Regra nova por insumo:**
- Categoria `Embalagem` → mostrar e contar em `un` (mesmo que a unidade cadastrada seja kg/g, exibir o valor cru com a unidade original).
- Categoria `Matéria Prima` → continuar em `kg` (converter g→kg quando necessário).
- Categoria `Outros` → usar a unidade cadastrada do insumo (un, l, ml, pct, kg…).

**Implementação:**
- Em `AuditoriaEstoqueTab.tsx`: enriquecer cada linha de insumo com um campo `unidadeContagem` ("kg" | "un" | unidade original) decidido pela categoria.
- Em `auditoriaEstoquePrint.ts`:
  - Tabela de Insumos passa a ter cabeçalho dinâmico **"Contagem"** (sem fixar "kg").
  - Cada linha imprime "Sistema" formatado na unidade correta e mostra a unidade junto à coluna Contagem (ex: "Contagem (un)" via sub-rótulo na linha, ou exibindo a unidade ao lado do campo em branco).
  - Ordenação dentro do grupo: agrupar por categoria continua igual.

### 2. Refatorar "Necessidade de Insumos" → "Lista de Compras"

Simplificar a aba `NecessidadeInsumosTab.tsx` removendo todo o fluxo baseado em agendamentos/receitas/rendimentos. Substituir por uma ferramenta enxuta baseada em **consumo histórico real** das últimas 4 semanas.

**Nova UX (minimalista):**

```text
┌──────────────────────────────────────────────────────────────┐
│ Lista de Compras                                             │
│ Baseada no consumo médio dos últimos 28 dias.                │
│                                                              │
│ Cobertura desejada:  [ 7 dias ] [ 14 dias ] [ 30 dias ]      │
│                                                              │
│                              [ Gerar lista ]   [ Exportar ]  │
└──────────────────────────────────────────────────────────────┘

Tabela:
Insumo | Consumo médio/dia | Estoque atual | Necessário (Xd) | A comprar | Custo estimado
```

- Apenas 3 botões de cobertura (toggle group: 7 / 14 / 30 dias).
- Sem date pickers, sem etapas, sem debug, sem cards de resumo cheios. Um único KPI: **Total estimado da compra**.
- Linhas com `A comprar = 0` ficam ocultas por padrão (toggle "mostrar todos").

**Lógica do cálculo (frontend, sem nova tabela):**
1. Buscar `movimentacoes_estoque_insumos` com `tipo = 'saida'` dos últimos 28 dias agrupado por `insumo_id`.
2. `consumoDiarioMedio = soma(quantidade_saidas) / 28`.
3. `necessario = consumoDiarioMedio * coberturaDias`.
4. `aComprar = max(0, necessario - estoqueAtual)` (estoque vem do `saldo_insumo` RPC já existente).
5. `custo = aComprar * custo_medio` do insumo.
6. Insumos sem saídas no período aparecem com consumo 0 (não vão para a lista por padrão).

**Arquivos:**
- Novo hook `src/hooks/useListaComprasAutomatica.ts` — encapsula a query de saídas + cálculo + retorna `{ linhas, totalCompra, loading, gerar(coberturaDias) }`.
- Reescrever `src/components/estoque/tabs/NecessidadeInsumosTab.tsx` (manter o nome do arquivo p/ não mexer no roteamento das tabs) com a nova UI.
- Atualizar o label da tab pai em `PedidosTab.tsx` (ou onde a tab é renderizada) de **"Necessidade de Insumos"** para **"Lista de Compras"**.
- Remover dependência de `useNecessidadeInsumos` na nova UI (o hook antigo permanece no repo por enquanto, não-utilizado, para evitar quebrar nada que ainda referencie).
- Excluir `DebugReceitasNecessarias.tsx` da renderização (não importar mais).

### Detalhes técnicos

- Janela de 28 dias: usar `data_movimentacao >= today - 28d`.
- Para cobertura "30 dias", continuar dividindo por 28 e multiplicando por 30 (não há viés relevante).
- Exportação Excel: manter via `xlsx` com colunas Insumo, Unidade, Consumo médio/dia, Estoque, A comprar, Custo unitário, Custo total.
- Sem migrations. Sem mudança de schema.

### Fora do escopo
- Histórico de listas geradas.
- Sazonalidade / pesos por semana.
- Integração com pedido de compra automático.