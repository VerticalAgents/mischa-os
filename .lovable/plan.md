
# Plano: Adicionar Frequencia Real de Entrega na Aba Periodicidade

## Objetivo
Exibir a **frequencia real de entregas** (intervalo medio em dias entre entregas) ao lado da periodicidade configurada na aba Periodicidade. Isso permite comparar a periodicidade configurada com o comportamento real de cada cliente, facilitando a tomada de decisao sobre ajustes.

---

## Metodologia de Calculo

### Formula da Frequencia Real
```
frequencia_real = (dias entre primeira e ultima entrega) / (numero de entregas - 1)
```

**Exemplo:**
- Cliente com 14 entregas em 74 dias
- Frequencia real = 74 / (14-1) = 74 / 13 ≈ **5.7 dias**

### Periodo de Analise
- Ultimas 12 semanas (84 dias) - consistente com outros calculos do sistema
- Minimo de 2 entregas necessarias para calcular intervalo
- Para clientes com apenas 1 entrega: exibir "N/A" ou "Dados insuficientes"

---

## Interface Visual

### Tabela Atualizada
A coluna "Periodicidade" sera expandida para mostrar ambos os valores:

```
| PDV           | Periodicidade           | Qtd Padrao | ...
|---------------|-------------------------|------------|
| Cafe Central  | 7 dias | Real: 5 dias    | 20 un      |
| Padaria Sol   | 14 dias | Real: 16 dias  | 15 un      |
| Loja Centro   | 7 dias | Real: N/A       | 10 un      |
```

### Indicador Visual de Divergencia
Adicionar um indicador colorido para facilitar identificacao:
- **Verde**: Frequencia real esta dentro de ±20% da periodicidade configurada
- **Amarelo**: Divergencia moderada (20-40%)
- **Vermelho**: Grande divergencia (>40%) - sugere revisar periodicidade

### Exemplo Visual na Celula
```tsx
<div className="flex flex-col items-center gap-1">
  <span className="font-semibold">7 dias</span>
  <Badge variant="outline" className="text-xs">Semanal</Badge>
  <div className="flex items-center gap-1 text-xs">
    <span className="text-muted-foreground">Real:</span>
    <span className="text-green-600 font-medium">5 dias</span>
    <TrendingDown className="h-3 w-3 text-green-600" />
  </div>
</div>
```

---

## Arquitetura Tecnica

### 1. Novo Hook: `useFrequenciaRealEntregas`
**Arquivo:** `src/hooks/useFrequenciaRealEntregas.ts`

Hook para buscar e calcular a frequencia real de entregas em batch para multiplos clientes.

```typescript
interface FrequenciaRealInfo {
  frequenciaReal: number | null;  // null se dados insuficientes
  numeroEntregas: number;
  diasAnalisados: number;
  origem: 'calculado' | 'insuficiente';
}

export function useFrequenciaRealEntregas(clienteIds: string[]) {
  return useQuery({
    queryKey: ['frequencia-real-entregas', clienteIds.sort().join(',')],
    queryFn: async () => {
      // Query SQL para buscar dados agregados:
      // - cliente_id
      // - COUNT(*) as num_entregas
      // - MIN(data) as primeira_entrega
      // - MAX(data) as ultima_entrega
      
      // Calcular: (ultima - primeira) / (num_entregas - 1)
      
      return Map<string, FrequenciaRealInfo>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: clienteIds.length > 0,
  });
}
```

### 2. Atualizar Componente AgendamentosPeriodicidade
**Arquivo:** `src/components/agendamento/AgendamentosPeriodicidade.tsx`

Alteracoes:
1. Importar e usar o novo hook `useFrequenciaRealEntregas`
2. Expandir interface `ClientePeriodicidade` para incluir `frequenciaReal`
3. Atualizar a celula de Periodicidade para exibir ambos os valores
4. Adicionar funcao auxiliar para determinar cor do indicador de divergencia

---

## Detalhes de Implementacao

### Hook useFrequenciaRealEntregas

```typescript
// src/hooks/useFrequenciaRealEntregas.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface FrequenciaRealInfo {
  frequenciaReal: number | null;
  numeroEntregas: number;
  primeiraEntrega: Date | null;
  ultimaEntrega: Date | null;
}

export function useFrequenciaRealEntregas(clienteIds: string[]) {
  return useQuery({
    queryKey: ['frequencia-real-entregas', clienteIds.sort().join(',')],
    queryFn: async () => {
      if (clienteIds.length === 0) {
        return new Map<string, FrequenciaRealInfo>();
      }

      // Buscar entregas dos ultimos 84 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 84);

      const { data, error } = await supabase
        .from('historico_entregas')
        .select('cliente_id, data')
        .in('cliente_id', clienteIds)
        .eq('tipo', 'entrega')
        .gte('data', dataLimite.toISOString())
        .order('data', { ascending: true });

      if (error) throw error;

      // Agrupar por cliente e calcular frequencia
      const frequenciasMap = new Map<string, FrequenciaRealInfo>();
      const entregasPorCliente = new Map<string, Date[]>();

      data?.forEach(registro => {
        if (!entregasPorCliente.has(registro.cliente_id)) {
          entregasPorCliente.set(registro.cliente_id, []);
        }
        entregasPorCliente.get(registro.cliente_id)!.push(new Date(registro.data));
      });

      entregasPorCliente.forEach((datas, clienteId) => {
        if (datas.length < 2) {
          frequenciasMap.set(clienteId, {
            frequenciaReal: null,
            numeroEntregas: datas.length,
            primeiraEntrega: datas[0] || null,
            ultimaEntrega: datas[datas.length - 1] || null,
          });
        } else {
          const primeira = datas[0];
          const ultima = datas[datas.length - 1];
          const diasTotal = differenceInDays(ultima, primeira);
          const frequencia = Math.round(diasTotal / (datas.length - 1));
          
          frequenciasMap.set(clienteId, {
            frequenciaReal: frequencia,
            numeroEntregas: datas.length,
            primeiraEntrega: primeira,
            ultimaEntrega: ultima,
          });
        }
      });

      return frequenciasMap;
    },
    staleTime: 5 * 60 * 1000,
    enabled: clienteIds.length > 0,
  });
}
```

### Funcao Auxiliar para Cor do Indicador

```typescript
function getCorDivergencia(periodicidadeConfig: number, frequenciaReal: number | null): {
  cor: string;
  icone: 'up' | 'down' | 'equal';
  classe: string;
} {
  if (frequenciaReal === null) {
    return { cor: 'gray', icone: 'equal', classe: 'text-muted-foreground' };
  }
  
  const divergencia = Math.abs(frequenciaReal - periodicidadeConfig) / periodicidadeConfig;
  
  if (divergencia <= 0.2) {
    return { cor: 'green', icone: 'equal', classe: 'text-green-600' };
  } else if (divergencia <= 0.4) {
    return { cor: 'yellow', icone: frequenciaReal > periodicidadeConfig ? 'up' : 'down', classe: 'text-yellow-600' };
  } else {
    return { cor: 'red', icone: frequenciaReal > periodicidadeConfig ? 'up' : 'down', classe: 'text-red-600' };
  }
}
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useFrequenciaRealEntregas.ts` | Hook para calcular frequencia real de entregas em batch |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/agendamento/AgendamentosPeriodicidade.tsx` | Integrar hook, atualizar tabela com coluna de frequencia real |

---

## Fluxo de Dados

```text
AgendamentosPeriodicidade
    |
    +-- useAgendamentoClienteStore
    |       |
    |       +-- Lista de agendamentos ativos
    |
    +-- useFrequenciaRealEntregas(clienteIds)
            |
            +-- Query historico_entregas (84 dias)
            |
            +-- Agrupa por cliente
            |
            +-- Calcula: (dias total) / (entregas - 1)
            |
            +-- Retorna Map<clienteId, FrequenciaRealInfo>
```

---

## Resultado Esperado

1. **Nova coluna visual** mostrando a frequencia real ao lado da periodicidade configurada
2. **Indicadores coloridos** para rapida identificacao de divergencias
3. **Dados baseados em historico real** dos ultimos 84 dias
4. **Performance otimizada** com query em batch para todos os clientes
5. **Tratamento de casos especiais** (clientes novos, dados insuficientes)

---

## Beneficios para o Usuario

- **Tomada de decisao informada**: Ver se a periodicidade configurada condiz com a realidade
- **Identificacao rapida**: Cores indicam clientes que precisam de ajuste
- **Dados concretos**: Baseado em entregas reais, nao em projecoes
- **Acao direta**: Editar periodicidade na mesma tela ao identificar divergencia
