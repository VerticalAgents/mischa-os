
# Card de Probabilidade Geral de Confirmacao + Toggle Integrado no Dashboard

## O que sera criado

1. **Novo card no topo do dashboard** mostrando a probabilidade media de confirmacao dos previstos da semana em visualizacao
2. **Toggle "Incluir previstos"** integrado no dashboard (similar ao que existe no PCP), com um slider de percentual que, quando ativado, usa a probabilidade media calculada como valor padrao

## Detalhes da implementacao

### 1. Calcular scores de todos os previstos da semana

Atualmente, `useConfirmationScore` so roda para `agendamentosDiaSelecionado`. Precisamos de uma segunda chamada do hook para os previstos da semana inteira.

**Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`**

- Criar um `useMemo` que filtra apenas os agendamentos previstos da semana atual:
```typescript
const previstosSemanais = useMemo(() => {
  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
  return agendamentosFiltrados.filter(a => {
    const data = new Date(a.dataReposicao);
    return data >= inicioSemana && data <= fimSemana && a.statusAgendamento === "Previsto";
  });
}, [agendamentosFiltrados, semanaAtual]);
```

- Chamar `useConfirmationScore(previstosSemanais)` para obter os scores semanais
- Calcular a media ponderada dos scores

### 2. Novo card "Probabilidade de Confirmacao"

Posicionar acima dos cards de indicadores existentes (antes da grid de 5 cards). O card mostrara:

- **Probabilidade media** da semana (ex: 72%)
- **Barra de progresso** colorida (verde >85%, amarelo 50-84%, vermelho <50%)
- **Breakdown por faixa**: quantos previstos estao em cada faixa (verde/amarelo/vermelho)
- **Toggle "Incluir previstos"** com campo de percentual editavel
  - Quando desativado: percentual = 0% (so confirmados contam)
  - Quando ativado: percentual inicia com o valor da probabilidade media calculada
  - O percentual pode ser ajustado manualmente pelo usuario (input numerico de 1-100%)

### 3. Propagar o percentual para o QuantidadesProdutosSemanal

O toggle e percentual do novo card substituirao o toggle que ja existe dentro do `QuantidadesProdutosSemanal`. O componente passara a receber `incluirPrevistos` e `percentualPrevistos` como props em vez de gerenciar internamente.

**Arquivo: `src/components/agendamento/QuantidadesProdutosSemanal.tsx`**

- Adicionar props: `incluirPrevistos: boolean` e `percentualPrevistos: number`
- Remover o estado interno e o toggle de "Incluir previstos"
- Ao calcular quantidades de previstos, multiplicar por `percentualPrevistos / 100` e aplicar `Math.ceil`

**Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`**

- Gerenciar os estados `incluirPrevistos` e `percentualPrevistos` no nivel do dashboard
- Passar como props para `QuantidadesProdutosSemanal`
- Exibir no novo card

### 4. Layout do novo card

```
+------------------------------------------------------------------+
| Probabilidade de Confirmacao          [ ] Incluir previstos [72]% |
| Probabilidade media dos previstos desta semana                    |
|                                                                   |
|   72%  [=============================          ]                  |
|                                                                   |
|   Alta (>85%): 5   |   Media (50-84%): 8   |   Baixa (<50%): 3   |
+------------------------------------------------------------------+
```

- Cor da barra segue a media: verde se >85%, amarelo se 50-84%, vermelho se <50%
- Os contadores por faixa usam as mesmas cores dos badges existentes
- Quando o toggle "Incluir previstos" e ativado, o campo de percentual inicia automaticamente com o valor da probabilidade media (arredondado)

### 5. Impacto nos indicadores existentes

O card "Total da Semana" (unidades) passara a considerar o percentual dos previstos quando o toggle estiver ativado:
- Confirmados: 100% das unidades
- Previstos: `percentualPrevistos%` das unidades (com Math.ceil)
- Entregas realizadas: 100%

### Arquivos alterados

1. `src/components/agendamento/AgendamentoDashboard.tsx` - Novo card, estados do toggle, segunda chamada do hook, propagacao de props
2. `src/components/agendamento/QuantidadesProdutosSemanal.tsx` - Receber props em vez de gerenciar toggle internamente
