
# Busca por CNPJ sem pontuacao

## Alteracao

No filtro de busca em `TodosAgendamentos.tsx`, normalizar tanto o termo digitado quanto o CNPJ do cliente removendo caracteres de pontuacao (`.`, `/`, `-`) antes de comparar.

## Detalhe tecnico

**Arquivo: `src/components/agendamento/TodosAgendamentos.tsx`**

Na linha onde o CNPJ e comparado, trocar:
```typescript
(agendamento.cliente.cnpjCpf || '').toLowerCase().includes(term)
```
por:
```typescript
(agendamento.cliente.cnpjCpf || '').replace(/[.\-\/]/g, '').toLowerCase().includes(term.replace(/[.\-\/]/g, ''))
```

Isso permite buscar `12345678000190` e encontrar `12.345.678/0001-90`, e vice-versa. Apenas 1 linha alterada.
