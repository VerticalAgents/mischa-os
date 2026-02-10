

# Sistema de Registro de Reagendamentos Entre Semanas

## O que sera feito

Criar um sistema que registra automaticamente quando um agendamento e movido de uma semana para outra (ou mais adiante). Reagendamentos dentro da mesma semana (ex: quarta para quinta) serao ignorados, pois sao ajustes operacionais de rota. Apenas mudancas entre semanas serao registradas, pois indicam que o cliente ainda nao precisava do pedido.

Os dados ficarao em uma nova tabela e terao uma pagina dedicada para consulta. No futuro, esses registros poderao alimentar um indicador de probabilidade de confirmacao.

## Nova tabela: `reagendamentos_entre_semanas`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador |
| cliente_id | uuid (FK -> clientes) | Cliente reagendado |
| data_original | date | Data em que estava agendado |
| data_nova | date | Nova data apos reagendamento |
| semana_original | date | Inicio da semana original (segunda-feira) |
| semana_nova | date | Inicio da semana nova (segunda-feira) |
| semanas_adiadas | integer | Quantas semanas foi adiado (1, 2, 3...) |
| created_at | timestamptz | Momento do registro |

Sera criada com RLS habilitado (mesma politica dos demais: `auth.uid() IS NOT NULL`).

## Logica de captura automatica

Nos 3 pontos do codigo onde reagendamentos acontecem, sera adicionada uma verificacao: se a data antiga e a nova estao em semanas diferentes (usando `startOfWeek` com `weekStartsOn: 1`), registrar na tabela.

### Pontos de interceptacao

1. **`ReagendamentoDialog.tsx`** - Reagendamento individual (dialog com opcao automatica/manual)
2. **`ReagendamentoEmMassaDialog.tsx`** - Reagendamento em massa (via `onConfirm` callback)
3. **`AgendamentosAtrasados.tsx`** - Botao "Reagendar Todos" dos atrasados

Em cada ponto, antes de salvar a nova data, comparar `startOfWeek(dataOriginal)` com `startOfWeek(dataNova)`. Se forem diferentes, inserir registro na tabela.

### Utilitario compartilhado

Criar `src/utils/reagendamentoUtils.ts` com funcao:

```typescript
registrarReagendamentoEntreSemanas(
  clienteId: string,
  dataOriginal: Date,
  dataNova: Date
): Promise<void>
```

Essa funcao faz a verificacao de semana e o insert. Sera chamada nos 3 pontos acima.

## Nova pagina: Reagendamentos

### Rota: `/reagendamentos`

Pagina simples com:

- **Tabela** listando todos os reagendamentos entre semanas, ordenados por data (mais recente primeiro)
- Colunas: Cliente, Data Original, Data Nova, Semanas Adiadas, Data do Registro
- **Filtros**: por cliente (busca), por periodo
- **Card resumo** no topo: total de reagendamentos, media de semanas adiadas, clientes que mais reagendam (top 3)

### Navegacao

Adicionar link na sidebar/menu existente para a nova pagina.

## Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/migrations/xxx_reagendamentos_entre_semanas.sql` | Tabela + RLS |
| `src/utils/reagendamentoUtils.ts` | Funcao utilitaria de registro |
| `src/hooks/useReagendamentosEntreSemanas.ts` | Hook para buscar dados |
| `src/pages/Reagendamentos.tsx` | Pagina dedicada |
| `src/components/reagendamentos/ReagendamentosTable.tsx` | Tabela com filtros |
| `src/components/reagendamentos/ReagendamentosResumo.tsx` | Cards resumo |

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/agendamento/ReagendamentoDialog.tsx` | Chamar `registrarReagendamentoEntreSemanas` antes de salvar |
| `src/components/agendamento/ReagendamentoEmMassaDialog.tsx` | Idem, para cada cliente no lote |
| `src/components/agendamento/AgendamentosAtrasados.tsx` | Idem, no `handleReagendamentoEmMassa` |
| `src/App.tsx` | Adicionar rota `/reagendamentos` |
| Sidebar/Menu | Adicionar link de navegacao |

## Detalhes tecnicos

### Verificacao de semana diferente

```typescript
import { startOfWeek, differenceInWeeks } from 'date-fns';

function isSemanasDiferentes(dataOriginal: Date, dataNova: Date): boolean {
  const semanaOriginal = startOfWeek(dataOriginal, { weekStartsOn: 1 });
  const semanaNova = startOfWeek(dataNova, { weekStartsOn: 1 });
  return semanaOriginal.getTime() !== semanaNova.getTime();
}
```

### Calculo de semanas adiadas

```typescript
const semanasAdiadas = Math.abs(
  differenceInWeeks(dataNova, dataOriginal, { weekStartsOn: 1 })
);
```

Se `semanasAdiadas === 0`, nao registrar (mesma semana).

### No ReagendamentoDialog

A data original sera obtida do agendamento atual do cliente (`agendamentoAtual.data_proxima_reposicao`). A data nova ja e conhecida (`dataFormatada`).

### No ReagendamentoEmMassaDialog

Para cada cliente no lote, buscar a data atual antes de reagendar e comparar com a nova data selecionada.

### Tipos Supabase

A tabela sera automaticamente refletida nos tipos apos a migracao.

