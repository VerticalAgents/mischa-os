
# Plano: Integrar Indicadores de Frequencia nos Cards de Agendamentos

## Objetivo
Adicionar aos cards de pedidos previstos na aba Dashboard do menu Agendamento as informacoes de:
1. **Dias desde a ultima entrega realizada** (ja existe parcialmente)
2. **Periodicidade configurada** (ja existe parcialmente)
3. **Frequencia real de entregas** (novo - baseado no historico)

Essas informacoes serao exibidas de forma visual com indicadores coloridos, sem quebrar a logica de funcionamento existente.

---

## Situacao Atual

O componente `AgendamentoDashboard.tsx` ja exibe nos cards:
- Nome do cliente
- Quantidade de unidades
- Tipo de pedido (Padrao/Alterado)
- Status do agendamento
- **Somente para status "Previsto"**: dias desde ultima entrega e periodicidade

### Codigo Atual (linhas 1032-1039)
```tsx
{agendamento.statusAgendamento === "Previsto" && (
  <div className="text-xs text-muted-foreground text-left mt-1">
    {diasDesdeUltimaEntrega !== null 
      ? `${diasDesdeUltimaEntrega} dias desde última entrega` 
      : 'Primeira entrega'
    } • Periodicidade: {periodicidade} dias
  </div>
)}
```

---

## Alteracoes Propostas

### 1. Integrar Hook useFrequenciaRealEntregas

Adicionar o hook ja existente `useFrequenciaRealEntregas` ao componente para buscar a frequencia real de entregas dos clientes exibidos no dia selecionado.

### 2. Novo Layout Visual dos Cards

Expandir a area de informacoes de cada card para exibir visualmente:

```
+-----------------------------------------------------------------------+
| [✓] REDEVIP24H (Alicar)                                               |
|     Quantidade: 40 unidades                                           |
|                                                                       |
|     +---------------+  +---------------+  +------------------+        |
|     | 📅 12 dias    |  | ⚙️ 7 dias     |  | 📊 8 dias        |        |
|     | desde entrega |  | periodicidade |  | freq. real       |        |
|     +---------------+  +---------------+  +------------------+        |
|                                           [Alterado] [Agendado] [✏️]  |
+-----------------------------------------------------------------------+
```

### 3. Indicador de Divergencia

Usar cores para indicar divergencia entre periodicidade configurada e frequencia real:
- **Verde**: Divergencia <= 20% (consistente)
- **Amarelo**: Divergencia 20-40% (atencao)
- **Vermelho**: Divergencia > 40% (ajuste necessario)

### 4. Detalhes da Implementacao

#### Buscar IDs dos clientes do dia selecionado
```typescript
const clienteIdsDiaSelecionado = useMemo(() => {
  return agendamentosDiaSelecionado.map(a => a.cliente.id);
}, [agendamentosDiaSelecionado]);
```

#### Usar hook de frequencia real
```typescript
const { data: frequenciasReais, isLoading: loadingFrequencias } = 
  useFrequenciaRealEntregas(clienteIdsDiaSelecionado);
```

#### Componente de Indicador Visual
Criar pequeno componente interno para exibir os 3 indicadores:

```tsx
const IndicadoresEntrega = ({ 
  diasDesdeUltimaEntrega, 
  periodicidade, 
  frequenciaReal 
}: { 
  diasDesdeUltimaEntrega: number | null; 
  periodicidade: number; 
  frequenciaReal: number | null;
}) => {
  const divergencia = getCorDivergencia(periodicidade, frequenciaReal);
  
  return (
    <div className="flex items-center gap-2 mt-2 text-xs">
      {/* Dias desde ultima entrega */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded">
        <Clock className="h-3 w-3" />
        <span>{diasDesdeUltimaEntrega ?? '--'} dias</span>
      </div>
      
      {/* Periodicidade configurada */}
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded">
        <Calendar className="h-3 w-3" />
        <span>{periodicidade}d</span>
      </div>
      
      {/* Frequencia real */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded ${divergencia.classe}`}>
        <TrendingUp className="h-3 w-3" />
        <span>{frequenciaReal ?? '--'}d real</span>
      </div>
    </div>
  );
};
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/agendamento/AgendamentoDashboard.tsx` | Integrar hook, adicionar indicadores visuais aos cards |

---

## Fluxo de Dados

```text
AgendamentoDashboard
    |
    +-- agendamentosDiaSelecionado (lista de agendamentos do dia)
    |       |
    |       +-- Extrai clienteIds
    |
    +-- useFrequenciaRealEntregas(clienteIds)
    |       |
    |       +-- Retorna Map<clienteId, FrequenciaRealInfo>
    |
    +-- Para cada card:
            |
            +-- diasDesdeUltimaEntrega (calculado de cliente.ultimaDataReposicaoEfetiva)
            +-- periodicidade (cliente.periodicidadePadrao)
            +-- frequenciaReal (do Map retornado pelo hook)
            +-- getCorDivergencia() para cor do indicador
```

---

## Visual Final Proposto

Cada card de agendamento tera:

1. **Linha 1**: Nome do cliente
2. **Linha 2**: Quantidade de unidades
3. **Linha 3**: Tres indicadores visuais lado a lado:
   - Badge cinza: "X dias" (dias desde ultima entrega)
   - Badge azul: "Xd config" (periodicidade configurada)
   - Badge colorido: "Xd real" (frequencia real com cor indicando divergencia)
4. **Lado direito**: Badges de status e botoes de acao

---

## Beneficios

1. **Visao rapida**: Usuario ve imediatamente a situacao de cada cliente
2. **Tomada de decisao**: Cores indicam quais clientes precisam de ajuste
3. **Sem quebra de logica**: Apenas adiciona informacao visual, nao altera funcionamento
4. **Reutiliza codigo existente**: Usa o hook `useFrequenciaRealEntregas` ja implementado
5. **Consistencia**: Mesma logica de cores usada na aba Periodicidade
