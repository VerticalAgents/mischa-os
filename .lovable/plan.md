
# Corrigir Calculo de Baseline - Penalizar Agendamentos Antecipados

## Problema

A formula atual so penaliza quando o agendamento esta **atrasado** em relacao a cadencia real do cliente. Quando o agendamento esta **adiantado demais**, o desvio e negativo e `Math.max(0, negativo) = 0`, resultando em baseline = 95% incorretamente.

Exemplo concreto ("The Best Coffee"):
- Cadencia real: 23 dias
- Agendado para 7 dias apos ultima entrega (16 dias antes do esperado)
- Score atual: 95% (errado)
- Score esperado: muito menor, pois o cliente provavelmente nao precisa de reposicao

## Solucao

Alterar o calculo do baseline no `useConfirmationScore.ts` para usar o **valor absoluto do desvio**, penalizando tanto atrasos quanto antecipacoes excessivas. Porem, antecipacoes pequenas (ate 2-3 dias) nao devem ser penalizadas, pois sao normais em logistica.

### Arquivo: `src/hooks/useConfirmationScore.ts`

Substituir:
```typescript
const desvio = differenceInDays(dataAgendada, dataEsperada);
baseline = 95 - Math.max(0, desvio) * 2 * peso;
```

Por:
```typescript
const desvio = differenceInDays(dataAgendada, dataEsperada);
let penalidade = 0;
if (desvio > 0) {
  // Atraso: penalidade de 2% por dia
  penalidade = desvio * 2;
} else if (desvio < -3) {
  // Antecipacao excessiva (mais de 3 dias antes): 
  // penalidade de 1.5% por dia alem da margem
  penalidade = Math.abs(desvio + 3) * 1.5;
}
baseline = 95 - penalidade * peso;
```

Logica:
- **Atraso** (desvio > 0): mantem penalidade atual de -2%/dia
- **Antecipacao ate 3 dias** (desvio entre -3 e 0): sem penalidade (margem normal)
- **Antecipacao excessiva** (desvio < -3): penalidade de -1.5% por dia alem da margem de 3 dias

### Resultado esperado para "The Best Coffee"

- Desvio = -16 dias
- Dias alem da margem = 16 - 3 = 13
- Penalidade = 13 * 1.5 = 19.5
- Baseline = 95 - 19.5 = ~75%
- Score final (com outros fatores): provavelmente na faixa amarela ("Atencao")

### Atualizar explicacao e motivos

No bloco de construcao do `motivo`, adicionar texto quando houver antecipacao:
```typescript
if (desvio < -3) {
  motivos.push(`${Math.abs(desvio)} dia(s) antes da cadência`);
}
```

### Atualizar o card explicativo

No arquivo `src/components/reagendamentos/ExplicacaoConfirmationScore.tsx`, atualizar a secao de Baseline para mencionar que antecipacoes excessivas tambem sao penalizadas:
- Atraso: -2% por dia alem da cadencia
- Antecipacao: -1.5% por dia alem de 3 dias de margem
