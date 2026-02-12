
# Log de Reagendamentos (Adiamento / Adiantamento)

## Conceito

Transformar o registro de reagendamentos em um sistema de log semelhante ao que ja existe para movimentacoes de estoque (insumos e produtos). Cada reagendamento entre semanas sera classificado como:

- **Adiamento**: quando o pedido e movido para uma semana posterior (data nova > data original)
- **Adiantamento**: quando o pedido e movido para uma semana anterior (data nova < data original)

## O que muda

### 1. Tabela existente - adicionar coluna `tipo`

Adicionar uma coluna `tipo` (text) na tabela `reagendamentos_entre_semanas` com valores `'adiamento'` ou `'adiantamento'`. Isso segue o mesmo padrao da coluna `tipo` nas tabelas de movimentacoes de estoque (`entrada`, `saida`, `ajuste`).

### 2. Tipo TypeScript - `src/types/estoque.ts` (ou novo arquivo de tipos)

Criar o tipo `ReagendamentoTipo = 'adiamento' | 'adiantamento'` e uma funcao auxiliar `asReagendamentoTipo`, seguindo o padrao de `MovTipo` e `asMovTipo`.

### 3. Utilitario - `src/utils/reagendamentoUtils.ts`

Atualizar `registrarReagendamentoEntreSemanas` para:
- Determinar o tipo comparando `semanaNova` com `semanaOriginal` (posterior = adiamento, anterior = adiantamento)
- Incluir o campo `tipo` no insert

### 4. Hook - `src/hooks/useReagendamentosEntreSemanas.ts`

- Adicionar o campo `tipo` na interface `ReagendamentoEntreSemanas`
- Mapear o campo no carregamento dos dados
- Atualizar o resumo para incluir contagem separada de adiamentos e adiantamentos

### 5. Pagina - `src/pages/Reagendamentos.tsx`

Atualizar titulo e descricao para refletir o conceito de "Log de Reagendamentos".

### 6. Resumo - `src/components/reagendamentos/ReagendamentosResumo.tsx`

Adicionar cards ou indicadores separados para adiamentos e adiantamentos (ex: "X adiamentos" e "Y adiantamentos"), alem do total.

### 7. Tabela - `src/components/reagendamentos/ReagendamentosTable.tsx`

- Adicionar coluna "Tipo" com badge colorido (similar ao historico de movimentacoes de estoque):
  - Adiamento: badge vermelho/destrutivo (pedido empurrado para frente)
  - Adiantamento: badge verde/default (pedido puxado para antes)
- Ajustar o texto da coluna "Semanas Adiadas" para "Semanas" (ja que pode ser adiamento ou adiantamento)

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | Adicionar coluna `tipo` (text) a `reagendamentos_entre_semanas` |
| `src/types/estoque.ts` | Adicionar `ReagendamentoTipo` e `asReagendamentoTipo` |
| `src/utils/reagendamentoUtils.ts` | Calcular e inserir `tipo` (adiamento/adiantamento) |
| `src/hooks/useReagendamentosEntreSemanas.ts` | Incluir `tipo` na interface e no resumo |
| `src/pages/Reagendamentos.tsx` | Atualizar titulo para "Log de Reagendamentos" |
| `src/components/reagendamentos/ReagendamentosResumo.tsx` | Separar contadores de adiamento e adiantamento |
| `src/components/reagendamentos/ReagendamentosTable.tsx` | Adicionar coluna Tipo com badges coloridos |
