
# Busca por CNPJ na aba Agendamentos

## O que muda

O campo de busca na aba "Agendamentos" passara a buscar tambem pelo CNPJ/CPF do cliente, alem do nome, status e tipo que ja funcionam hoje.

## Alteracao tecnica

### Arquivo: `src/components/agendamento/TodosAgendamentos.tsx`

Na linha 75-79, adicionar `agendamento.cliente.cnpjCpf` ao filtro de busca:

```typescript
return agendamentosFiltradosPorStatus.filter(agendamento => 
  agendamento.cliente.nome.toLowerCase().includes(term) ||
  agendamento.statusAgendamento.toLowerCase().includes(term) ||
  (agendamento.pedido?.tipoPedido || 'Padrão').toLowerCase().includes(term) ||
  (agendamento.cliente.cnpjCpf || '').toLowerCase().includes(term)
);
```

O placeholder do input tambem sera atualizado para indicar que CNPJ e aceito:
```
"Pesquisar por cliente, CNPJ, status ou tipo..."
```

Apenas 1 arquivo alterado, alteracao minima.
