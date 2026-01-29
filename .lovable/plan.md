
# Plano: Adicionar Filtro por Status no Dialog "Reagendar em Massa"

## Objetivo
Permitir que o usuário filtre a lista de agendamentos por status ("Agendado" e/ou "Previsto") dentro do modal de reagendamento em massa.

---

## Implementação

### Localização
**Arquivo:** `src/components/agendamento/ReagendamentoEmMassaDialog.tsx`

### Novo Estado para Filtros de Status

```typescript
const [filtroStatus, setFiltroStatus] = useState<Set<string>>(
  new Set(["Agendado", "Previsto"])
);
```

### Lista Filtrada de Agendamentos

```typescript
const agendamentosFiltrados = useMemo(() => {
  return agendamentosDisponiveis.filter(a => 
    filtroStatus.has(a.statusAgendamento)
  );
}, [agendamentosDisponiveis, filtroStatus]);
```

### Novo Componente de Filtro (após o DialogDescription)

Layout visual:
```
+------------------------------------------+
| 📅 Reagendar em Massa                    |
| Selecione os agendamentos...             |
+------------------------------------------+
| Filtrar por status:                      |
| [x] Agendado   [x] Previsto              |
+------------------------------------------+
| [x] Selecionar todos   3 de 5 selecion.  |
+------------------------------------------+
| ... lista de agendamentos ...            |
```

### Código do Filtro

```tsx
{/* Filtro por Status */}
<div className="flex items-center gap-4 pb-2">
  <span className="text-sm text-muted-foreground">Filtrar por status:</span>
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <Checkbox
        id="filtro-agendado"
        checked={filtroStatus.has("Agendado")}
        onCheckedChange={(checked) => {
          setFiltroStatus(prev => {
            const next = new Set(prev);
            if (checked) {
              next.add("Agendado");
            } else {
              next.delete("Agendado");
            }
            return next;
          });
        }}
      />
      <label htmlFor="filtro-agendado" className="text-sm cursor-pointer">
        Agendado
      </label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox
        id="filtro-previsto"
        checked={filtroStatus.has("Previsto")}
        onCheckedChange={(checked) => {
          setFiltroStatus(prev => {
            const next = new Set(prev);
            if (checked) {
              next.add("Previsto");
            } else {
              next.delete("Previsto");
            }
            return next;
          });
        }}
      />
      <label htmlFor="filtro-previsto" className="text-sm cursor-pointer">
        Previsto
      </label>
    </div>
  </div>
</div>
```

---

## Ajustes Necessários

### 1. Atualizar Lógica de "Selecionar Todos"

O "Selecionar todos" deve considerar apenas os agendamentos filtrados:

```typescript
const toggleAll = () => {
  const idsFiltrados = agendamentosFiltrados.map((a) => a.cliente.id);
  if (selecionados.size === idsFiltrados.length) {
    setSelecionados(new Set());
  } else {
    setSelecionados(new Set(idsFiltrados));
  }
};
```

### 2. Atualizar Contador e Estado

```typescript
const todosSelecionados = 
  agendamentosFiltrados.length > 0 && 
  selecionados.size === agendamentosFiltrados.length;

const algumSelecionado = 
  selecionados.size > 0 && 
  selecionados.size < agendamentosFiltrados.length;
```

### 3. Atualizar Badge de Contagem

```tsx
<Badge variant="secondary">
  {selecionados.size} de {agendamentosFiltrados.length} selecionados
</Badge>
```

### 4. Resetar ao Abrir Modal

```typescript
useEffect(() => {
  if (open) {
    setFiltroStatus(new Set(["Agendado", "Previsto"])); // Ambos ativos
    setSelecionados(new Set(agendamentosDisponiveis.map((a) => a.cliente.id)));
    setDataSelecionada(undefined);
  }
}, [open, agendamentosDisponiveis]);
```

### 5. Atualizar Seleção ao Mudar Filtro

Quando o filtro muda, selecionar automaticamente os itens visíveis:

```typescript
useEffect(() => {
  // Quando o filtro de status muda, atualizar a seleção para os itens filtrados
  const idsFiltrados = agendamentosFiltrados.map((a) => a.cliente.id);
  setSelecionados(new Set(idsFiltrados));
}, [filtroStatus]);
```

### 6. Renderizar Lista Filtrada

```tsx
{agendamentosFiltrados.map((agendamento) => (
  // ... item da lista
))}
```

---

## Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/agendamento/ReagendamentoEmMassaDialog.tsx` | Adicionar filtro por status (Agendado/Previsto) |

---

## Resultado Visual Esperado

```
+------------------------------------------+
| 📅 Reagendar em Massa                    |
| Selecione os agendamentos e a nova data  |
+------------------------------------------+
| Filtrar por status:                      |
| [x] Agendado   [x] Previsto              |
+------------------------------------------+
| [x] Selecionar todos    15 de 15 selecion.|
+------------------------------------------+
| [x] Cliente A           30 un   Agendado |
| [x] Cliente B           25 un   Previsto |
| [x] Cliente C           40 un   Previsto |
+------------------------------------------+
| Nova Data: [Calendário]                  |
+------------------------------------------+
| [Cancelar]        [Confirmar (15)]       |
+------------------------------------------+
```

---

## Fluxo de Usuário

1. Usuário clica em "Reagendar em Massa"
2. Modal abre com **ambos os filtros ativos** por padrão
3. Usuário pode desmarcar "Agendado" para ver apenas "Previsto" (ou vice-versa)
4. A lista atualiza mostrando apenas os agendamentos do(s) status selecionado(s)
5. "Selecionar todos" seleciona apenas os itens visíveis (filtrados)
6. Usuário escolhe a nova data e confirma
