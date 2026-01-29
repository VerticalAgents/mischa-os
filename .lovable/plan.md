

# Plano: Melhorar Filtros do Dashboard de Agendamentos

## Objetivo
Modernizar a interface de filtros do Dashboard de Agendamentos com:
1. Navegador de semana visual similar ao WeekNavigator usado em Entregas Pendentes
2. Filtros de Rota e Representante mais visuais usando o padrão de Popover com checkboxes

---

## Arquitetura Proposta

### Layout do Novo Header de Filtros

```
+------------------------------------------------------------------+
| ⬅️ | 📅 27/01 - 02/02/2026 | ➡️ | [Semana Atual]               |
+------------------------------------------------------------------+
| 🔍 Filtros                                           X agendamentos |
|------------------------------------------------------------------|
| 👥 Todos os representantes ▼ | 🛣️ Todas as rotas ▼ | [PDF ⬇️]   |
+------------------------------------------------------------------+
```

---

## Alterações Necessárias

### 1. Criar Componente RotasFilter

**Novo arquivo:** `src/components/agendamento/RotasFilter.tsx`

Componente similar ao `RepresentantesFilter` mas para rotas de entrega:

```tsx
interface RotasFilterProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}
```

Funcionalidades:
- Popover com lista de rotas com checkboxes
- Opção "Todas as rotas" no topo
- Opção "Sem rota" para clientes sem rota definida
- Badge mostrando quantidade selecionada

### 2. Criar Componente AgendamentoFiltersBar

**Novo arquivo:** `src/components/agendamento/AgendamentoFiltersBar.tsx`

Componente que agrupa:
- Navegador de semana (reutilizando WeekNavigator ou versão adaptada)
- Barra de filtros com Representante e Rota (estilo Popover)
- Botão de exportar PDF

```tsx
interface AgendamentoFiltersBarProps {
  semanaAtual: Date;
  onSemanaAnterior: () => void;
  onProximaSemana: () => void;
  onVoltarSemanaAtual: () => void;
  ehSemanaAtual: boolean;
  representantesFiltro: number[];
  onRepresentantesFiltroChange: (ids: number[]) => void;
  rotasFiltro: number[];
  onRotasFiltroChange: (ids: number[]) => void;
  totalAgendamentos: number;
  onExportarPDF: () => void;
}
```

### 3. Atualizar AgendamentoDashboard.tsx

**Alterações de Estado:**

```typescript
// Trocar de string para array de IDs
const [representanteFiltro, setRepresentanteFiltro] = useState<number[]>([]);
const [rotaFiltro, setRotaFiltro] = useState<number[]>([]);
```

**Atualizar agendamentosFiltrados:**

```typescript
const agendamentosFiltrados = useMemo(() => {
  let filtrados = agendamentos;
  
  // Filtro por representante (multi-select)
  if (representanteFiltro.length > 0) {
    filtrados = filtrados.filter(agendamento => 
      agendamento.cliente.representanteId && 
      representanteFiltro.includes(agendamento.cliente.representanteId)
    );
  }
  
  // Filtro por rota (multi-select)
  if (rotaFiltro.length > 0) {
    filtrados = filtrados.filter(agendamento => 
      agendamento.cliente.rotaEntregaId && 
      rotaFiltro.includes(agendamento.cliente.rotaEntregaId)
    );
  }
  
  return filtrados;
}, [agendamentos, representanteFiltro, rotaFiltro]);
```

**Substituir seção de filtros existente (linhas 590-668) por:**

```tsx
{/* Navegador de Semana */}
<div className="bg-muted/30 border rounded-lg p-3">
  <div className="flex items-center justify-center gap-4 flex-wrap">
    <Button
      variant="ghost"
      size="sm"
      onClick={navegarSemanaAnterior}
      className="h-8 w-8 p-0"
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    
    <div className="flex items-center gap-2 px-3 min-w-[180px] justify-center">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium whitespace-nowrap">
        {format(inicioSemana, 'dd/MM')} - {format(fimSemana, 'dd/MM/yyyy')}
      </span>
    </div>
    
    <Button
      variant="ghost"
      size="sm"
      onClick={navegarProximaSemana}
      className="h-8 w-8 p-0"
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
    
    {!ehSemanaAtual && (
      <Button
        variant="default"
        size="sm"
        onClick={voltarSemanaAtual}
        className="text-xs"
      >
        Semana Atual
      </Button>
    )}
  </div>
</div>

{/* Barra de Filtros */}
<div className="bg-muted/30 border rounded-lg p-4 space-y-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Filter className="h-4 w-4" />
      Filtros
      {(representanteFiltro.length > 0 || rotaFiltro.length > 0) && (
        <Badge variant="secondary" className="text-xs">
          {[representanteFiltro.length > 0, rotaFiltro.length > 0].filter(Boolean).length} ativo(s)
        </Badge>
      )}
    </div>
    <div className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{agendamentosFiltrados.length}</span> agendamentos
    </div>
  </div>
  
  <div className="flex items-center gap-3 flex-wrap">
    <RepresentantesFilter
      selectedIds={representanteFiltro}
      onSelectionChange={setRepresentanteFiltro}
    />
    
    <RotasFilter
      selectedIds={rotaFiltro}
      onSelectionChange={setRotaFiltro}
    />
    
    <Button
      variant="outline"
      size="sm"
      onClick={exportarPDFRepresentante}
      className="flex items-center gap-2 ml-auto"
    >
      <FileDown className="h-4 w-4" />
      Exportar PDF
    </Button>
  </div>
</div>
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/agendamento/RotasFilter.tsx` | Componente de filtro multi-select para rotas |

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/agendamento/AgendamentoDashboard.tsx` | Substituir filtros simples por WeekNavigator + Popovers visuais |

---

## Comparação Visual

### Antes (Atual):
```
+-------------------------------------------------------+
| [⬅ Semana Anterior]  27/01 - 02/02  [Próxima ➡]       |
|                     Voltar para semana atual           |
+-------------------------------------------------------+
| [Dropdown Representante ▼] [Dropdown Rota ▼] [PDF]    |
+-------------------------------------------------------+
```

### Depois (Proposto):
```
+-------------------------------------------------------+
| [⬅] 📅 27/01 - 02/02/2026 [➡]  [Semana Atual]       |
+-------------------------------------------------------+
| 🔍 Filtros                            25 agendamentos |
|-------------------------------------------------------|
| 👥 [Representantes ▼] 🛣️ [Rotas ▼]        [PDF ⬇]     |
+-------------------------------------------------------+
```

---

## Resultado Esperado

1. **Navegador de Semana**: Visual compacto com setas, data centralizada e botão "Semana Atual"
2. **Filtro de Representantes**: Popover com checkboxes para múltipla seleção
3. **Filtro de Rotas**: Popover similar ao de representantes
4. **Contagem de Filtros**: Badge mostrando quantos filtros estão ativos
5. **Contagem de Resultados**: Total de agendamentos filtrados visível

