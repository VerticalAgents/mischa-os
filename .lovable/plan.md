

# Incluir clientes Standby no Dashboard de Agendamento

## Problema
Clientes com status "Standby" não aparecem no dashboard de agendamento porque diversos componentes filtram apenas por `cliente.ativo === true` ou `statusCliente === 'Ativo'`, excluindo Standby. Clientes "Inativo" devem continuar excluídos.

## Locais que precisam de alteração

### 1. `src/pages/Agendamento.tsx` (linha 55)
A verificação de clientes pendentes (sem agendamento) filtra por `cliente.ativo`. Precisa incluir também clientes Standby:
```
// De:
clientes.filter(cliente => cliente.ativo && ...)
// Para:
clientes.filter(cliente => cliente.ativo && cliente.statusCliente !== 'Inativo' && ...)
```
Na verdade, `ativo` no banco é um booleano separado de `statusCliente`. Clientes Standby podem ter `ativo = false`. Precisamos mudar a lógica para:
```
clientes.filter(cliente => 
  (cliente.ativo || cliente.statusCliente === 'Standby') && 
  cliente.statusCliente !== 'Inativo' && 
  !clientesComAgendamento.has(cliente.id)
)
```

### 2. `src/components/agendamento/AgendamentosPendentes.tsx` (linha 38-40)
Mesmo filtro de clientes sem agendamento:
```
clientes.filter(cliente => 
  (cliente.ativo || cliente.statusCliente === 'Standby') && 
  cliente.statusCliente !== 'Inativo' && 
  !clientesComAgendamento.has(cliente.id)
)
```

### 3. `src/components/agendamento/AgendamentosSemData.tsx` (linha 46)
Filtro por `cliente.ativo === true` nos agendamentos sem data:
```
agendamento.cliente.ativo === true || agendamento.cliente.statusCliente === 'Standby'
```

### 4. `src/components/agendamento/AgendamentosPeriodicidade.tsx` (linhas 62, 75)
Filtros por `cliente.ativo === true`:
```
a.cliente.ativo === true || a.cliente.statusCliente === 'Standby'
```

### 5. `src/components/agendamento/ConfirmacaoReposicaoFuncional.tsx` (linhas 36, 47)
Filtro por `statusCliente !== "Ativo"` exclui Standby:
```
// De:
if (cliente.statusCliente !== "Ativo" || ...) return false;
// Para:
if (cliente.statusCliente !== "Ativo" && cliente.statusCliente !== "Standby" || ...) return false;
```

### 6. `src/components/agendamento/ConfirmacaoReposicaoTab.tsx` (linhas 25, 36)
Mesmo ajuste que o item 5.

### Abordagem: Helper reutilizável
Para evitar duplicação, criar um helper:
```ts
// Em src/components/agendamento/utils ou similar
export const isClienteVisivelAgendamento = (cliente: { ativo: boolean; statusCliente: string }) => 
  (cliente.ativo || cliente.statusCliente === 'Standby') && cliente.statusCliente !== 'Inativo';
```

Usar esse helper em todos os 6 pontos listados acima.

