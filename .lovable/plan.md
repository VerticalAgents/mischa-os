
# Plano: Integrar Indicadores de Frequencia nos Cards de Agendamentos

## Status: ✅ CONCLUÍDO

## Objetivo
Adicionar aos cards de pedidos previstos na aba Dashboard do menu Agendamento as informacoes de:
1. **Dias desde a ultima entrega realizada** ✅
2. **Periodicidade configurada** ✅
3. **Frequencia real de entregas** ✅ (novo - baseado no historico)

Essas informacoes sao exibidas de forma visual com indicadores coloridos, sem quebrar a logica de funcionamento existente.

---

## Implementação Realizada

### Alterações no AgendamentoDashboard.tsx

1. **Imports adicionados**:
   - `useFrequenciaRealEntregas` e `getCorDivergencia` do hook existente
   - Ícones: `TrendingUp`, `TrendingDown`, `Minus`, `Settings`
   - Componentes de Tooltip do shadcn/ui

2. **Componente IndicadoresEntrega**:
   - Exibe 3 badges visuais lado a lado
   - Badge cinza: dias desde última entrega
   - Badge azul: periodicidade configurada  
   - Badge colorido (verde/amarelo/vermelho): frequência real com indicador de divergência
   - Tooltips explicativos em cada badge

3. **Hook de frequência real**:
   - `clienteIdsDiaSelecionado`: useMemo que extrai IDs dos clientes do dia
   - `useFrequenciaRealEntregas`: busca frequência real em batch

4. **Cards atualizados**:
   - Exibe IndicadoresEntrega para agendamentos com status "Previsto"
   - Mantém toda a lógica existente intacta

---

## Indicadores Visuais

| Badge | Cor | Significado |
|-------|-----|-------------|
| Dias desde entrega | Cinza (slate) | Tempo desde última entrega |
| Periodicidade | Azul | Configuração atual do cliente |
| Frequência real (≤20% divergência) | Verde | Consistente com configuração |
| Frequência real (20-40% divergência) | Amarelo | Atenção moderada |
| Frequência real (>40% divergência) | Vermelho | Ajuste necessário |

---

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/agendamento/AgendamentoDashboard.tsx` | Integrado hook, criado IndicadoresEntrega, atualizado cards |

