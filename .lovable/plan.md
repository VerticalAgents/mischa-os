
# Corrigir Logica Invertida do Baseline

## Problema

A logica atual penaliza agendamentos atrasados em relacao a cadencia, mas isso e o oposto do correto:
- **Atrasado** (cliente ja passou da cadencia) = cliente PRECISA de produto = probabilidade ALTA de confirmar
- **Antecipado** (cliente ainda nao chegou na cadencia) = cliente talvez nao precise = probabilidade MENOR

Exemplos concretos:
- Severo Garage: 30d desde ultima entrega, cadencia 17d → esta 13d atrasado → PRECISA do produto → deveria ser ~90%+
- The Best Coffee: 3d desde ultima, cadencia 23d → 20d antes do esperado → provavelmente nao precisa → deveria ser bem baixo
- Posto Caminho Verde: se tem historico, 10d desde ultima, cadencia 35d → 25d antes → deveria ser baixo

## Solucao

### Arquivo: `src/hooks/useConfirmationScore.ts`

Inverter a logica do desvio no baseline:

```typescript
const desvio = differenceInDays(dataAgendada, dataEsperada);
let penalidade = 0;

if (desvio >= -3) {
  // Agendamento no prazo ou atrasado: cliente precisa do produto
  // Bonus para atrasos (mais confianca na confirmacao)
  if (desvio > 0) {
    // Atraso moderado: bonus de +1% por dia (max +10)
    penalidade = -Math.min(desvio, 10) * 1;
  }
  // Dentro da margem de 3 dias: sem ajuste (95%)
} else {
  // Antecipacao excessiva (mais de 3 dias antes da cadencia)
  // Cliente provavelmente nao precisa ainda
  penalidade = Math.abs(desvio + 3) * 2;
}

let baseline = Math.min(99, 95 - penalidade * peso);
```

Nova logica:
- **Atrasado** (desvio > 0): BONUS de +1% por dia (max +10%), pois o cliente precisa do produto. Baseline sobe para ate 99%
- **No prazo** (desvio entre -3 e 0): baseline de 95%, margem normal
- **Antecipado excessivo** (desvio < -3): penalidade de -2% por dia alem da margem de 3 dias. Mais agressivo que antes para refletir melhor o risco

### Resultados esperados

| Cliente | Cadencia | Dias desde ultima | Desvio | Baseline novo |
|---------|----------|-------------------|--------|---------------|
| Severo Garage | 17d | 30d | +13d | 99% (bonus max) |
| The Best Coffee | 23d | 3d+4d=7d | -16d | 95 - 13*2 = 69% |
| Posto Caminho Verde | 35d | 10d+Xd | ~-20d | 95 - 17*2 = 61% |

### Atualizar motivos

```typescript
if (desvio > 0) {
  motivos.push(`${desvio} dia(s) além da cadência — alta necessidade`);
} else if (desvio < -3) {
  motivos.push(`${Math.abs(desvio)} dia(s) antes da cadência — baixa necessidade`);
}
```

### Arquivo: `src/components/reagendamentos/ExplicacaoConfirmationScore.tsx`

Atualizar a secao de Baseline para refletir a nova logica:
- Atrasado: bonus de ate +10% (cliente precisa do produto)
- No prazo (±3 dias): 95%
- Antecipado: -2% por dia alem da margem de 3 dias
