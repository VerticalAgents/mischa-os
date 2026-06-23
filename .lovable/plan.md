## Sub-badge "Despachados" no Calendário Semanal

Adicionar, logo abaixo do badge "X Confirmados" de cada dia do Calendário Semanal (Dashboard de Agendamento), um sub-badge em verde mais escuro mostrando quantos desses confirmados já estão despachados.

### Onde
`src/components/agendamento/AgendamentoDashboard.tsx`

### O que mudar

1. No `useMemo` que monta `dadosGraficoSemanal` (~linha 410-462), calcular um novo campo `despachados` por dia:
   ```ts
   const despachados = agendamentosConfirmados.filter(
     a => a.substatus_pedido === "Despachado"
   ).length;
   ```
   e incluí-lo no objeto retornado por dia.

2. Na renderização do card de cada dia (~linha 1314-1332), logo após o badge `Confirmados`, renderizar condicionalmente o sub-badge quando `dia.despachados > 0`:
   ```tsx
   {dia.confirmados > 0 && (
     <>
       <Badge ...> {dia.confirmados} Confirmados </Badge>
       {dia.despachados > 0 && (
         <Badge variant="outline"
           className="text-[10px] bg-green-200 text-green-900 border-green-300 rounded-none whitespace-nowrap justify-center flex-1 md:w-full md:flex-none">
           {dia.despachados} Despachados
         </Badge>
       )}
     </>
   )}
   ```

### Observações
- Verde levemente mais escuro: `bg-green-200 text-green-900 border-green-300` (atual confirmados usa `green-100/700/200`).
- Não altera lógica de cálculo de previstos/prováveis nem nenhuma outra aba — apenas leitura de `substatus_pedido` já existente nos agendamentos.
- Nada a mexer em backend.