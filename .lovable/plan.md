

# Motor de Probabilidade de Confirmacao - V1

## Resumo

Implementar um sistema que calcula a probabilidade (0-100%) de um pedido agendado ser confirmado, baseado na cadencia historica de entregas e no comportamento de reagendamentos do cliente. Exibir como badge colorida nas tabelas de agendamentos.

## Etapa 1 - Migracao de Banco de Dados

Adicionar coluna `agendamento_id` na tabela `reagendamentos_entre_semanas` para vincular cada reagendamento ao agendamento especifico.

```sql
ALTER TABLE public.reagendamentos_entre_semanas
  ADD COLUMN agendamento_id uuid REFERENCES agendamentos_clientes(id);
```

Tambem criar politica RLS de UPDATE (caso necessaria para futuras correcoes).

## Etapa 2 - Atualizar Registro de Reagendamentos

**Arquivo:** `src/utils/reagendamentoUtils.ts`

Alterar a funcao `registrarReagendamentoEntreSemanas` para aceitar um parametro opcional `agendamentoId` e inclui-lo no insert.

**Arquivos chamadores** (passar o `agendamentoId` quando disponivel):
- `src/components/agendamento/AgendamentoDashboard.tsx`
- `src/components/agendamento/AgendamentosAtrasados.tsx`
- `src/components/agendamento/TodosAgendamentos.tsx`
- `src/components/agendamento/ReagendamentoDialog.tsx`
- `src/components/agendamento/AgendamentoEditModal.tsx`

## Etapa 3 - Hook de Calculo: `useConfirmationScore`

**Novo arquivo:** `src/hooks/useConfirmationScore.ts`

Hook que recebe uma lista de `AgendamentoItem[]` e retorna um `Map<string, ConfirmationScore>` indexado por `cliente_id`.

### Logica de calculo

```text
Para cada agendamento:

1. BASELINE DE CADENCIA (score inicial)
   - Buscar entregas do cliente nos ultimos 84 dias (historico_entregas)
   - Calcular Intervalo Medio (Im) entre entregas
   - Se data agendada == ultima_entrega + Im => score = 95%
   - Penalidade: -2% por dia de desvio alem do Im

2. PENALIDADE POR VOLATILIDADE
   - Contar reagendamentos vinculados a este agendamento (via agendamento_id)
   - Cada reagendamento: -15%
   - Se created_at do reagendamento < 24h antes da data_original: -10% extra

3. VETOR DE TENDENCIA
   - Historico de reagendamentos do cliente (ultimos 90 dias)
   - Se maioria sao adiantamentos: bonus +5%
   - Se pedido atual tem 2+ adiamentos: penalidade extra -20%

4. COLD START
   - 0 entregas: retornar 70% fixo
   - 1 entrega: retornar 80% (usa periodicidade_padrao como Im)
   - 2 entregas: calculo com peso reduzido (50%)
   - 3+ entregas: calculo completo

5. CLAMP final entre 5% e 99%
```

### Dados buscados (uma unica query batch)

- `historico_entregas` filtrado por lista de cliente_ids, ultimos 84 dias
- `reagendamentos_entre_semanas` filtrado por lista de cliente_ids, ultimos 90 dias

O hook usa `useMemo` para recalcular somente quando os dados mudam.

## Etapa 4 - Componente de Badge

**Novo arquivo:** `src/components/agendamento/ConfirmationScoreBadge.tsx`

| Score | Cor | Label |
|-------|-----|-------|
| > 85% | Verde | Confirmado Provavel |
| 50-84% | Amarelo | Atencao |
| < 50% | Vermelho | Alto Risco |

Com Tooltip ao passar o mouse mostrando:
- Score exato (ex: "72%")
- Motivo resumido (ex: "Cadencia de 14 dias; 1 adiamento registrado")

## Etapa 5 - Integrar nas Tabelas de Agendamento

Adicionar a coluna "Prob." nas seguintes tabelas:

| Arquivo | Descricao |
|---------|-----------|
| `AgendamentosPrevistos.tsx` | Adicionar coluna com badge |
| `AgendamentosAgendados.tsx` | Adicionar coluna com badge |
| `AgendamentoTable.tsx` | Adicionar coluna com badge |
| `TodosAgendamentos.tsx` | Se exibe tabela inline, adicionar tambem |

O hook `useConfirmationScore` sera chamado uma vez no componente pai, passando a lista de agendamentos. O `Map` resultante e usado para renderizar o badge em cada linha.

## Etapa 6 - Types

**Arquivo:** `src/types/confirmationScore.ts` (novo)

```typescript
interface ConfirmationScore {
  score: number;           // 0-100
  nivel: 'alto' | 'medio' | 'baixo';
  motivo: string;          // texto explicativo para tooltip
  fatores: {
    baseline: number;
    penalidade_volatilidade: number;
    vetor_tendencia: number;
  };
}
```

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| Nova migracao SQL | Adicionar `agendamento_id` a `reagendamentos_entre_semanas` |
| `src/utils/reagendamentoUtils.ts` | Adicionar param `agendamentoId` |
| `src/components/agendamento/AgendamentoDashboard.tsx` | Passar `agendamentoId` |
| `src/components/agendamento/AgendamentosAtrasados.tsx` | Passar `agendamentoId` |
| `src/components/agendamento/TodosAgendamentos.tsx` | Passar `agendamentoId` |
| `src/components/agendamento/ReagendamentoDialog.tsx` | Passar `agendamentoId` |
| `src/components/agendamento/AgendamentoEditModal.tsx` | Passar `agendamentoId` |
| `src/hooks/useConfirmationScore.ts` | **Novo** - hook de calculo |
| `src/types/confirmationScore.ts` | **Novo** - tipos |
| `src/components/agendamento/ConfirmationScoreBadge.tsx` | **Novo** - badge visual |
| `src/components/agendamento/AgendamentosPrevistos.tsx` | Adicionar coluna Prob. |
| `src/components/agendamento/AgendamentosAgendados.tsx` | Adicionar coluna Prob. |
| `src/components/agendamento/AgendamentoTable.tsx` | Adicionar coluna Prob. |
| `src/integrations/supabase/types.ts` | Auto-atualizado pela migracao |

