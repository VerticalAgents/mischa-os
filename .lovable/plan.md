
# Plano: Corrigir Inconsistência nos Indicadores de Entrega

## Problema Identificado

Existe uma inconsistência entre duas fontes de dados diferentes:

| Dado | Fonte Atual | Problema |
|------|-------------|----------|
| Dias desde última entrega | `cliente.ultimaDataReposicaoEfetiva` (cadastro) | Pode estar desatualizado |
| Frequência real e nº entregas | `historico_entregas` (tabela real) | Dados atualizados |

**Resultado**: O cliente Luzardo aparece com "8 entregas nos últimos 84 dias" (dados reais da tabela), mas ao mesmo tempo mostra "--d" e "Primeira entrega (sem histórico)" porque o campo `ultimaDataReposicaoEfetiva` do cadastro está vazio.

---

## Solução

Usar a **mesma fonte de dados** para todos os indicadores. O hook `useFrequenciaRealEntregas` já retorna a `ultimaEntrega` do cliente, então devemos usar esse valor em vez do campo do cadastro.

### Mudanças no Componente IndicadoresEntrega

Adicionar `ultimaEntrega` como propriedade e usá-la para calcular os dias:

```typescript
const IndicadoresEntrega = ({ 
  diasDesdeUltimaEntrega, 
  periodicidade, 
  frequenciaReal,
  numeroEntregas,
  ultimaEntregaReal  // NOVO: data da última entrega do histórico real
}: { 
  diasDesdeUltimaEntrega: number | null; 
  periodicidade: number; 
  frequenciaReal: number | null;
  numeroEntregas: number;
  ultimaEntregaReal: Date | null;  // NOVO
}) => {
  // Usar a última entrega real como prioridade
  const diasReais = ultimaEntregaReal 
    ? differenceInDays(new Date(), ultimaEntregaReal)
    : diasDesdeUltimaEntrega;
  
  // ... resto do código usando diasReais
};
```

### Lógica de Prioridade

1. Se `ultimaEntregaReal` existe (vem do histórico) → usar essa data
2. Se não existe → usar `diasDesdeUltimaEntrega` do cadastro (fallback)
3. Se ambos são null → mostrar "--" e "Primeira entrega"

### Tooltip Atualizado

O tooltip também precisa refletir a consistência:
- Se tem entregas no histórico → "X dias desde última entrega"
- Se não tem entregas no histórico → "Primeira entrega (sem histórico)"

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/agendamento/AgendamentoDashboard.tsx` | Passar `ultimaEntrega` do hook para o componente e usar como fonte primária |

---

## Fluxo de Dados Corrigido

```
useFrequenciaRealEntregas (fonte única de verdade)
    │
    ├── frequenciaReal
    ├── numeroEntregas  
    ├── primeiraEntrega
    └── ultimaEntrega ────────┐
                              │
                              ▼
              IndicadoresEntrega
                      │
                      ├── diasDesdeUltimaEntrega ← calculado de ultimaEntrega
                      ├── frequenciaReal
                      └── numeroEntregas
```

---

## Resultado Esperado

**Antes (inconsistente):**
- Tooltip: "8 entregas nos últimos 84 dias"
- Badge: "--d" (dias desde última)
- Tooltip 2: "Primeira entrega (sem histórico)"

**Depois (consistente):**
- Se tem 8 entregas → Mostra "X dias" desde a última entrega real
- Se não tem entregas → Mostra "--d" e "Primeira entrega"
- Dados sempre vindos da mesma fonte (historico_entregas)

---

## Benefícios

1. **Consistência**: Todos os indicadores usam a mesma fonte de dados
2. **Precisão**: Dados baseados no histórico real, não em campos que podem estar desatualizados
3. **Confiabilidade**: Usuário pode confiar que os números fazem sentido juntos
