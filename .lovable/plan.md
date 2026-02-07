
# Plano: Aplicar Filtros de Representante e Rota em Todos os Indicadores do Dashboard

## Problema Atual

Os filtros de representante e rota funcionam apenas parcialmente no Dashboard de Agendamentos. Eles afetam os agendamentos, mas **nao filtram** os dados de entregas realizadas. Isso impede, por exemplo, saber quanto um representante vendeu em uma semana.

### O que ja esta filtrado
- Cards "Agendamentos Restantes", "Confirmados", "Previstos"
- Grafico de barras (parte dos agendamentos)
- Card "Produtos Necessarios"

### O que NAO esta filtrado (sera corrigido)
- Card **"Total da Semana"** (parte das entregas realizadas)
- Card **"Entregas Realizadas"**
- Card **"Produtos Entregues"** (componente separado que consulta o banco direto)
- Graficos de **Distribuicao por Status** e **Agendamentos por Dia** (parcela "Realizadas")

## Causa Raiz

Os registros de `entregasHistorico` tem apenas `cliente_id`, sem referencia direta a representante ou rota. Para filtrar, e necessario cruzar com a lista de clientes que possui `representanteId` e `rotaEntregaId`.

## Solucao

### 1. Criar lista filtrada de entregas no `AgendamentoDashboard.tsx`

Adicionar um `useMemo` que filtra `entregasHistorico` com base nos clientes que correspondem aos filtros de representante e rota ativos:

```text
entregasHistorico
  -> cruzar cliente_id com clientes[]
  -> filtrar por representanteId (se filtro ativo)
  -> filtrar por rotaEntregaId (se filtro ativo)
  = entregasHistoricoFiltradas
```

### 2. Substituir `entregasHistorico` por `entregasHistoricoFiltradas`

Nos seguintes `useMemo` dentro de `AgendamentoDashboard.tsx`:
- **`indicadoresSemana`** (linha ~228): usar lista filtrada para contar entregas realizadas
- **`totalUnidadesSemana`** (linha ~526): usar lista filtrada para somar unidades de entregas
- **`dadosGraficoStatus`** (linha ~272): usar lista filtrada para a parcela "Realizadas"
- **`dadosGraficoSemanal`** (linha ~318): usar lista filtrada para entregas realizadas por dia

### 3. Atualizar `EntregasRealizadasSemanal.tsx`

Este componente faz query direta ao Supabase sem filtros. Sera atualizado para:
- Receber `representanteFiltro` e `rotaFiltro` como props
- Receber `clientes` como prop (para cruzar cliente_id com representante/rota)
- Filtrar os resultados da query com base nos clientes que correspondem aos filtros

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/agendamento/AgendamentoDashboard.tsx` | Criar `entregasHistoricoFiltradas`, substituir em 4 useMemos, passar filtros para EntregasRealizadasSemanal |
| `src/components/agendamento/EntregasRealizadasSemanal.tsx` | Aceitar props de filtro e aplicar filtragem por representante/rota |

---

## Secao Tecnica

### Novo useMemo: `entregasHistoricoFiltradas`

```typescript
const entregasHistoricoFiltradas = useMemo(() => {
  // Se nenhum filtro ativo, retornar tudo
  if (representanteFiltro.length === 0 && rotaFiltro.length === 0) {
    return entregasHistorico;
  }
  
  // Obter IDs de clientes que correspondem aos filtros
  const clienteIdsFiltrados = new Set(
    clientes
      .filter(cliente => {
        const matchRep = representanteFiltro.length === 0 || 
          (cliente.representanteId && representanteFiltro.includes(cliente.representanteId));
        const matchRota = rotaFiltro.length === 0 || 
          (cliente.rotaEntregaId && rotaFiltro.includes(cliente.rotaEntregaId));
        return matchRep && matchRota;
      })
      .map(c => c.id)
  );
  
  return entregasHistorico.filter(e => clienteIdsFiltrados.has(e.cliente_id));
}, [entregasHistorico, clientes, representanteFiltro, rotaFiltro]);
```

### EntregasRealizadasSemanal - Novas Props

```typescript
interface EntregasRealizadasSemanelProps {
  semanaAtual: Date;
  representanteFiltro: number[];
  rotaFiltro: number[];
  clientes: Cliente[];
}
```

Apos buscar entregas do Supabase, aplicar filtro local:

```typescript
// Filtrar entregas por representante/rota usando clientes
const filtrarPorRepresentanteRota = (entregas) => {
  if (representanteFiltro.length === 0 && rotaFiltro.length === 0) return entregas;
  
  const clienteIdsFiltrados = new Set(
    clientes.filter(c => {
      const matchRep = representanteFiltro.length === 0 || 
        representanteFiltro.includes(c.representanteId);
      const matchRota = rotaFiltro.length === 0 || 
        rotaFiltro.includes(c.rotaEntregaId);
      return matchRep && matchRota;
    }).map(c => c.id)
  );
  
  return entregas.filter(e => clienteIdsFiltrados.has(e.cliente_id));
};
```

A query ao Supabase sera modificada para incluir `cliente_id` no select (necessario para filtragem).
