
# Ordenar Previstos por Faixa de Score + Alfabetico no Calendario Semanal

## O que muda

Dentro de cada agrupamento por representante no calendario semanal, os agendamentos previstos serao ordenados por dois criterios:

1. **Faixa de classificacao** (principal): Verde (>85%) primeiro, depois Amarelo (50-84%), depois Vermelho (<50%)
2. **Ordem alfabetica** (secundario): dentro de cada faixa, por nome do cliente A-Z

Agendamentos sem score calculado aparecerao ao final.

## Alteracao tecnica

### Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`

Na linha ~1288, onde hoje temos `{items.map(renderCard)}`, substituir por uma versao que ordena os items antes de renderizar:

```typescript
{items
  .slice()
  .sort((a, b) => {
    const scoreA = confirmationScores.get(a.cliente.id)?.score ?? -1;
    const scoreB = confirmationScores.get(b.cliente.id)?.score ?? -1;
    const faixaA = scoreA >= 85 ? 0 : scoreA >= 50 ? 1 : scoreA >= 0 ? 2 : 3;
    const faixaB = scoreB >= 85 ? 0 : scoreB >= 50 ? 1 : scoreB >= 0 ? 2 : 3;
    if (faixaA !== faixaB) return faixaA - faixaB;
    return a.cliente.nome.localeCompare(b.cliente.nome);
  })
  .map(renderCard)}
```

Logica:
- Faixa 0 = Verde (>= 85%) - aparece primeiro
- Faixa 1 = Amarelo (50-84%)
- Faixa 2 = Vermelho (< 50%)
- Faixa 3 = sem score (ao final)
- Dentro da mesma faixa: ordem alfabetica por nome do cliente

Nenhum outro arquivo precisa ser alterado. O `confirmationScores` Map ja esta disponivel no escopo.
