

# Plano: Reagendar em Massa e Card "Total da Semana"

## Objetivo
1. Transformar o botão "Reagendar Selecionados" em "Reagendar em Massa" com funcionamento similar aos botões de ação em massa da Expedição
2. Adicionar um novo card "Total da Semana" à esquerda do card "Agendamentos Restantes"

---

## 1. Novo Dialog: ReagendarEmMassaDialog (Estilo Expedição)

### Comportamento Atual
- Botão "Reagendar Selecionados" aparece apenas quando há agendamentos selecionados
- O modal recebe os agendamentos já selecionados externamente
- Não permite selecionar/deselecionar dentro do modal

### Novo Comportamento (estilo Expedição)
- Botão "Reagendar em Massa" sempre visível (desabilitado se não houver agendamentos elegíveis)
- Ao clicar, abre modal com lista de agendamentos com checkboxes
- Checkbox "Selecionar todos" no topo
- Contador "X de Y selecionados"
- Seleção de nova data para reagendamento
- Botão "Confirmar (X)" mostrando quantidade

### Estrutura do Novo Dialog

```
+------------------------------------------+
| 📅 Reagendar em Massa                    |
| Selecione os agendamentos e a nova data  |
+------------------------------------------+
| [x] Selecionar todos   3 de 5 selecion.  |
+------------------------------------------+
| [x] Cliente A           30 un - Previsto |
| [x] Cliente B           25 un - Agendado |
| [ ] Cliente C           40 un - Previsto |
+------------------------------------------+
| Nova Data: [Calendário]                  |
+------------------------------------------+
| [Cancelar]        [Confirmar (3)]        |
+------------------------------------------+
```

### Componente a Modificar

**Arquivo:** `src/components/agendamento/ReagendamentoEmMassaDialog.tsx`

Alterações:
- Adicionar estado interno para seleção (`selecionados: Set<string>`)
- Adicionar lógica de toggle individual e "selecionar todos"
- Receber todos os agendamentos do dia, não apenas os pré-selecionados
- Inicializar com todos selecionados ao abrir
- Mostrar contador de selecionados
- Exibir status (Previsto/Agendado) de cada agendamento

---

## 2. Alterações no AgendamentoDashboard.tsx

### Mudança no Botão

**Antes:**
```tsx
<Button
  onClick={() => setModalReagendarAberto(true)}
  disabled={agendamentosSelecionados.size === 0}
>
  <Calendar className="h-4 w-4" />
  Reagendar Selecionados ({agendamentosSelecionados.size})
</Button>
```

**Depois:**
```tsx
<Button
  onClick={() => setModalReagendarAberto(true)}
  disabled={agendamentosDiaSelecionado.length === 0}
>
  <Calendar className="h-4 w-4" />
  Reagendar em Massa
</Button>
```

### Passagem de Props ao Dialog

**Antes:**
```tsx
<ReagendamentoEmMassaDialog
  agendamentosSelecionados={agendamentosDiaSelecionado.filter(a => agendamentosSelecionados.has(a.cliente.id))}
  onConfirm={handleReagendarEmMassa}
/>
```

**Depois:**
```tsx
<ReagendamentoEmMassaDialog
  agendamentosDisponiveis={agendamentosDiaSelecionado}
  onConfirm={handleReagendarEmMassa}
/>
```

### Novo Handler

O handler `handleReagendarEmMassa` será ajustado para receber os IDs selecionados do dialog:

```typescript
const handleReagendarEmMassa = async (clienteIds: string[], novaData: Date) => {
  const agendamentosParaReagendar = agendamentosDiaSelecionado.filter(
    a => clienteIds.includes(a.cliente.id)
  );
  // ... resto da lógica
};
```

---

## 3. Novo Card: "Total da Semana"

### Conceito
Card mostrando o total de unidades (produtos) da semana:
- Soma das unidades em agendamentos pendentes (ainda não entregues)
- Soma das unidades já entregues na semana

### Layout no Grid de Indicadores

**Antes (4 cards):**
```
+-------------------+-------------------+-------------------+-------------------+
| Agendamentos      | Confirmados       | Previstos         | Entregas          |
| Restantes         |                   |                   | Realizadas        |
+-------------------+-------------------+-------------------+-------------------+
```

**Depois (5 cards - grid 5 colunas):**
```
+----------------+----------------+----------------+----------------+----------------+
| Total da       | Agendamentos   | Confirmados    | Previstos      | Entregas       |
| Semana         | Restantes      |                |                | Realizadas     |
| 2.450 un       | 42             | 28             | 14             | 12             |
+----------------+----------------+----------------+----------------+----------------+
```

### Cálculo do Total da Semana

```typescript
const totalUnidadesSemana = useMemo(() => {
  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
  
  // Unidades de agendamentos pendentes (Previstos + Agendados)
  const agendamentosSemana = agendamentosFiltrados.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.dataReposicao);
    return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
  });
  
  const unidadesAgendadas = agendamentosSemana.reduce((sum, a) => 
    sum + (a.pedido?.totalPedidoUnidades || a.cliente.quantidadePadrao || 0), 0
  );
  
  // Unidades de entregas realizadas na semana
  const entregasRealizadasSemana = entregasHistorico.filter(entrega => {
    const dataEntrega = new Date(entrega.data);
    return dataEntrega >= inicioSemana && dataEntrega <= fimSemana && entrega.tipo === 'entrega';
  });
  
  const unidadesEntregues = entregasRealizadasSemana.reduce((sum, e) => 
    sum + (e.quantidade || 0), 0
  );
  
  return unidadesAgendadas + unidadesEntregues;
}, [agendamentosFiltrados, semanaAtual, entregasHistorico]);
```

### Novo Card JSX

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Total da Semana</CardTitle>
    <Package className="h-4 w-4 text-purple-500" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-purple-600">{totalUnidadesSemana}</div>
    <p className="text-xs text-muted-foreground">Unidades agendadas + entregues</p>
  </CardContent>
</Card>
```

---

## 4. Ajustes no TodosAgendamentos.tsx

Mesma lógica aplicada ao botão na aba "Todos Agendamentos":

**Antes:**
```tsx
<Button
  onClick={() => setModalReagendarAberto(true)}
  disabled={agendamentosSelecionados.size === 0}
>
  Reagendar Selecionados ({agendamentosSelecionados.size})
</Button>
```

**Depois:**
```tsx
<Button
  onClick={() => setModalReagendarAberto(true)}
  disabled={sortedAgendamentos.length === 0}
>
  Reagendar em Massa
</Button>
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/agendamento/ReagendamentoEmMassaDialog.tsx` | Refatorar para incluir seleção interna estilo Expedição |
| `src/components/agendamento/AgendamentoDashboard.tsx` | Adicionar card "Total da Semana" + ajustar botão e handler |
| `src/components/agendamento/TodosAgendamentos.tsx` | Ajustar botão e integração com novo dialog |

---

## Comparação Visual do Botão

### Antes
```
+------------------------------------------+
| Reagendar Selecionados (3)      [cinza quando 0]
+------------------------------------------+
```

### Depois
```
+------------------------------------------+
| 📅 Reagendar em Massa           [sempre visível, estilo expedição]
+------------------------------------------+
```

---

## Fluxo de Usuário

### Reagendar em Massa
1. Usuário clica em um dia no calendário semanal
2. Lista de agendamentos do dia aparece
3. Usuário clica em "Reagendar em Massa"
4. Modal abre com todos os agendamentos do dia listados
5. Todos vêm selecionados por padrão
6. Usuário pode desmarcar os que não quer reagendar
7. Usuário seleciona nova data no calendário
8. Clica em "Confirmar (X)"
9. Agendamentos selecionados são reagendados

### Card Total da Semana
1. Usuário visualiza o Dashboard de Agendamentos
2. Primeiro card mostra o total de unidades da semana
3. Valor = soma de unidades em agendamentos pendentes + unidades já entregues

