## Problema

Na aba **Projeção de Produção** (PCP), o card "Produtos Necessários" mostra **1803 (41 pedidos)**, contando todos os agendamentos confirmados da semana — inclusive os que já foram **Separados** e **Despachados**.

O card correto está na aba **Separação** da Expedição, que mostra **922 (19 pedidos)** — apenas os confirmados que ainda **não** foram separados/despachados (usa o filtro em `ResumoQuantidadeProdutos.tsx`: `pedido.substatus_pedido === 'Separado' || 'Despachado'` → exclui).

## Correção

Em `src/components/pcp/ProjecaoProducaoTab.tsx`, no memo `agendamentosConfirmadosSemana` (linha ~54), adicionar filtro para excluir agendamentos cujo `substatus_pedido` seja `"Separado"` ou `"Despachado"`:

```ts
const agendamentosConfirmadosSemana = useMemo(() => {
  return agendamentos.filter(a => {
    const d = new Date(a.dataReposicao);
    return d >= inicioSemana
      && d <= fimSemana
      && a.statusAgendamento === "Agendado"
      && a.substatus_pedido !== "Separado"
      && a.substatus_pedido !== "Despachado";
  });
}, [agendamentos, inicioSemana, fimSemana]);
```

Isso alinha o cálculo de produtos necessários do PCP com o card da aba Separação: apenas pedidos confirmados que ainda precisam ser separados entram na conta de produção. Os agendamentos `Previstos` (quando o toggle "Incluir previstos" está ativo) não são afetados, pois substatus é exclusivo de pedidos confirmados.

## Escopo

- 1 arquivo alterado: `src/components/pcp/ProjecaoProducaoTab.tsx`
- Sem mudanças em hooks, RPCs ou banco de dados.