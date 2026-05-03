## Mudanças no PCP — Aba Projeção de Produção

Arquivo principal: `src/components/pcp/ProjecaoProducaoTab.tsx` + `src/components/pcp/EstoqueDisponivel.tsx`.

### 1. Modo "Apenas prováveis" no card Produtos Necessários

Replicar o comportamento do card de Agendamento:

- Adicionar estado `modoPrevistos: 'provaveis' | 'percentual'` (padrão `'percentual'`).
- Quando `incluirPrevistos` ativo, exibir um RadioGroup com as opções **Apenas prováveis** e **Percentual** (igual ao componente `QuantidadesProdutosSemanal`).
- Calcular o `confirmationScore` para cada agendamento Previsto da semana usando o hook `useConfirmationScore` (mesmo usado no `AgendamentoDashboard`). Considerar "prováveis" os com score > 85.
- Separar os agendamentos previstos em três buckets ao calcular quantidades via `compute_entrega_itens_v2`:
  - confirmados (Agendado)
  - previstos prováveis (Previsto + score > 85)
  - previstos totais (Previsto)
- Combinação:
  - Modo `provaveis`: confirmados + 100% das quantidades dos previstos prováveis.
  - Modo `percentual`: confirmados + `percentualPrevistos%` dos previstos totais (comportamento atual).
- Quando estiver no modo `provaveis`, aplicar visual roxo no card (borda/fundo `purple-*` e número em `text-purple-600`), exatamente como no card de agendamento, para manter coerência visual com os gráficos do dashboard.
- Atualizar o texto do `CardDescription` de acordo com o modo.

### 2. Seletor de semana

- Adicionar estado `semanaAtual` controlado por dois botões (← Semana anterior / Próxima semana →) e um label central com o range "dd/MM – dd/MM".
- Adicionar um botão **Semana atual** para reset.
- Usar `addWeeks(semanaAtual, ±1)` e `startOfWeek/endOfWeek` com `weekStartsOn: 1` (segunda).
- A semana exibida deve ser independente da data atual — permite planejar a semana seguinte mesmo no domingo.
- Posicionar o seletor no topo da aba, acima do `ProducaoAgendadaCard`, ou no header da grid Produtos Necessários / Estoque (a definir; proposta: barra superior dedicada para ficar visível).

A `useProducaoAgendada` continua mostrando produção agendada como hoje (não filtrada por semana selecionada — mesmo comportamento atual).

### 3. Correção do header "Estoque Final" / "Estoque Disponível"

No `EstoqueDisponivel.tsx`, o `CardTitle` atualmente concatena dois títulos:

```
Estoque Final <Package /> Estoque Disponível
```

Trocar por um único título: **"Estoque Disponível"** com o ícone Package à esquerda (padrão do projeto). Remover o texto "Estoque Final".

### Detalhes técnicos

- `ProjecaoProducaoTab.tsx`:
  - Novo estado: `modoPrevistos`, `semanaAtual` (substituindo o `useState(new Date())` fixo).
  - Buscar scores: usar `useConfirmationScore` (ou função auxiliar equivalente já usada em `AgendamentoDashboard`) para os agendamentos previstos da semana selecionada.
  - Adicionar `quantidadesPrevistosProvaveis` ao lado dos `quantidadesPrevistos` existentes.
  - Ajustar `quantidadesPorProduto` para combinar conforme o modo.
  - Card visualmente roxo quando `incluirPrevistos && modoPrevistos === 'provaveis'`.
- `EstoqueDisponivel.tsx`: corrigir `CardTitle` para conter apenas "Estoque Disponível".
- Reutilizar componentes shadcn já presentes (`RadioGroup`, `Button`, `Switch`, `Input`).
