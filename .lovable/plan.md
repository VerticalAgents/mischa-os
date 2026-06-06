## Objetivo
Transformar a aba **Resumo da Expedição** em um painel de visão geral que o operador bate o olho e entende, no DIA ou na SEMANA selecionada, o status completo da expedição.

---

## 1. Filtro de período (novo)
Mesma UX da aba Separação:
- Toggle **Dia / Semana** (reaproveitar estado `modoDataSeparacao` e `semanaSeparacao` do `useExpedicaoUiStore` ou criar par próprio `modoDataResumo` / `dataResumo` para não interferir com a Separação).
- Date picker do dia OU navegador de semana (◀ Semana de DD/MM a DD/MM ▶).
- Botão "Hoje" / "Semana atual".

Decisão: **criar estado próprio** (`modoDataResumo`, `dataResumo`) para o usuário poder olhar um período no Resumo sem mexer no filtro da Separação.

---

## 2. Layout novo

```text
┌──────────────────────────────────────────────────────────────┐
│ Header: título + filtro Dia/Semana + botão Atualizar        │
├──────────────────────────────────────────────────────────────┤
│ FUNIL DE STATUS (card largo, 4 colunas)                     │
│  Pendente │ Separado │ Despachado │ Entregue                │
│   12      │    5     │     3      │    20                   │
│  + barra de progresso visual do funil                       │
├──────────────────────────────────────────────────────────────┤
│ PRODUTOS A SEPARAR  │  ALERTAS & DESTAQUES                 │
│ (lista de sabores   │  - X pedidos atrasados                │
│  com qtd agregada   │  - Y pedidos sem rota                 │
│  do que falta       │  - Z pedidos grandes (>N un)          │
│  separar no período)│  - Próxima janela de entrega          │
├──────────────────────────────────────────────────────────────┤
│ DISTRIBUIÇÃO POR DIA (só no modo Semana)                    │
│  Mini-barras Seg-Dom com qtd pedidos/unidades por dia       │
├──────────────────────────────────────────────────────────────┤
│ DISTRIBUIÇÃO POR ROTA / LOGÍSTICA                           │
│  Lista compacta: Rota A — 5 pedidos / 120 un                │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Cards detalhados

### 3.1 Funil de Status (substitui "Produto em Expedição")
4 mini-cards lado a lado, cada um com ícone, nº de pedidos e total de unidades:
- **Pendente separação** (status do dia/semana sem `substatus_pedido` ou `Pendente`)
- **Separado**
- **Despachado**
- **Entregue** (vem do `historico_entregas` ou pedidos finalizados no período)

Cada card é clicável → leva à aba correspondente já filtrada pelo mesmo período.

### 3.2 Produtos a Separar (refatorar `ProdutosNecessarios`)
- Mesma lógica de agregação atual, **mas só considera pedidos do período filtrado e que ainda não estão Separado/Despachado**.
- Lista por sabor com quantidade: "Brownie Meio Amargo — 48 un", ordenada decrescente.
- Total geral em destaque no topo.
- Se vazio: "Tudo separado! ✓"

### 3.3 Alertas & Destaques (novo — sugestões minhas)
Pequenos badges acionáveis:
- **Atrasados**: pedidos com `data_prevista_entrega` < hoje e ainda não despachados.
- **Sem rota**: pedidos sem `rota_id` / logística no período.
- **Grandes**: pedidos acima de X unidades (destaque para o separador priorizar).
- **NF/Boleto pendente**: pedidos despachados sem documento emitido (se aplicável).

### 3.4 Distribuição por Dia (só modo Semana)
Mini gráfico de barras Seg→Dom mostrando qtd de pedidos e unidades por dia → ajuda o operador a antecipar picos de trabalho.

### 3.5 Distribuição por Rota/Logística
Lista compacta: para cada rota/tipo de logística do período, mostrar nº de pedidos e unidades. Ajuda a planejar carregamento.

---

## 4. Remoções
- Cards "Pedidos Separados" e "Pedidos Despachados" (com lista detalhada) → removidos. Acesso já existe nas abas dedicadas.
- Modal `DetalheProdutosModal` deixa de ser usado aqui (continua em outras abas).

---

## 5. Sugestões extras pro operador (a confirmar)
1. **Próxima entrega prevista** — hora/janela do próximo despacho (se houver campo).
2. **Resumo de embalagens** — total de caixas/sacolas estimadas com base nos sabores.
3. **Botão "Imprimir resumo do dia"** — PDF com lista de produtos a separar + pedidos.
4. **Comparativo vs semana anterior** — mini delta "+15% vs semana passada" nas unidades totais.
5. **Tempo médio de separação** — quanto tempo um pedido fica em "Pendente" até "Separado" (a partir do histórico).

---

## Arquivos a alterar
- `src/components/expedicao/ResumoExpedicao.tsx` — reescrita do layout.
- `src/components/expedicao/components/ProdutosNecessarios.tsx` — aceitar lista de pedidos pendentes filtrados e agrupar por sabor (não mais total único).
- **Novos** componentes em `src/components/expedicao/components/`:
  - `ResumoPeriodoFilter.tsx` (toggle dia/semana + navegação)
  - `FunilStatusCards.tsx` (4 cards de status)
  - `AlertasExpedicao.tsx` (badges acionáveis)
  - `DistribuicaoPorDia.tsx` (mini-bars semanais)
  - `DistribuicaoPorRota.tsx` (lista de rotas)
- `src/hooks/useExpedicaoUiStore.ts` — adicionar `modoDataResumo` e `dataResumo`.

---

## Perguntas antes de implementar
1. Confirma os 4 status do funil: **Pendente / Separado / Despachado / Entregue**? Ou usa só 3 (sem Entregue)?
2. Quais dos 5 widgets extras (seção 5) quer já no primeiro corte? Sugiro: **Próxima entrega**, **Imprimir resumo do dia** e **Comparativo vs semana anterior**.
3. O filtro do Resumo deve ser **independente** da Separação (minha sugestão) ou **compartilhado** (mexer num muda o outro)?
