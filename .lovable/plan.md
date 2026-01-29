
# Plano: Remover Abas e Corrigir Cálculo do Total da Semana

## Objetivo
1. Remover as abas "Representantes" e "Confirmação de Reposição" do menu Agendamentos
2. Filtrar a aba "Sem Agendamento" para mostrar apenas clientes com status "Ativo"
3. Corrigir o cálculo do card "Total da Semana" para somar apenas unidades de agendamentos **AGENDADOS** (não Previstos) + entregas realizadas

---

## 1. Remover Abas em Agendamento.tsx

### Remover do TabsList:
```tsx
// REMOVER estas linhas:
<TabsTrigger value="representantes">Representantes</TabsTrigger>
<TabsTrigger value="confirmacao">Confirmação de Reposição</TabsTrigger>
```

### Remover do TabsContent:
```tsx
// REMOVER estas linhas:
<TabsContent value="representantes" className="space-y-4">
  <AgendamentoRepresentantes />
</TabsContent>

<TabsContent value="confirmacao" className="space-y-4">
  <NovaConfirmacaoReposicaoTab />
</TabsContent>
```

### Remover imports não utilizados:
```tsx
// REMOVER:
import AgendamentoRepresentantes from "@/components/agendamento/AgendamentoRepresentantes";
import NovaConfirmacaoReposicaoTab from "@/components/agendamento/NovaConfirmacaoReposicaoTab";
```

### Atualizar validação de tabs na URL:
```typescript
// DE:
if (tab && ["dashboard", "agendamentos", "positivacao", "despachados", "representantes", "confirmacao", "pendentes", "atrasados", "sem-data"].includes(tab))

// PARA:
if (tab && ["dashboard", "agendamentos", "positivacao", "despachados", "pendentes", "atrasados", "sem-data"].includes(tab))
```

---

## 2. Filtrar Clientes Ativos em AgendamentosSemData.tsx

### Lógica Atual:
```typescript
const agendamentosSemData = useMemo(() => {
  return agendamentos.filter(agendamento => 
    agendamento.statusAgendamento === "Agendar"
  );
}, [agendamentos]);
```

### Nova Lógica:
```typescript
const agendamentosSemData = useMemo(() => {
  return agendamentos.filter(agendamento => 
    agendamento.statusAgendamento === "Agendar" &&
    agendamento.cliente.ativo === true  // Apenas clientes ativos
  );
}, [agendamentos]);
```

---

## 3. Corrigir Cálculo do Total da Semana

### Localização:
`AgendamentoDashboard.tsx` - função `totalUnidadesSemana`

### Lógica Atual (INCORRETA):
```typescript
// Considera TODOS os agendamentos (Previstos + Agendados)
const agendamentosSemana = agendamentosFiltrados.filter(agendamento => {
  const dataAgendamento = new Date(agendamento.dataReposicao);
  return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
});
```

### Nova Lógica (CORRETA):
```typescript
// Considera apenas agendamentos com status "Agendado"
const agendamentosSemana = agendamentosFiltrados.filter(agendamento => {
  const dataAgendamento = new Date(agendamento.dataReposicao);
  return dataAgendamento >= inicioSemana && 
         dataAgendamento <= fimSemana &&
         agendamento.statusAgendamento === "Agendado";  // Apenas confirmados
});
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Agendamento.tsx` | Remover abas "Representantes" e "Confirmação de Reposição" |
| `src/components/agendamento/AgendamentosSemData.tsx` | Filtrar apenas clientes com `ativo === true` |
| `src/components/agendamento/AgendamentoDashboard.tsx` | Corrigir cálculo para considerar apenas status "Agendado" |

---

## Resultado Final

### Abas do Menu Agendamentos:
- Dashboard
- Agendamentos
- Positivação
- Despachado (condicional)
- Pendente (condicional)
- Atrasado (condicional)
- Sem Agendamento (condicional)

### Card "Total da Semana":
- Soma de unidades de agendamentos **confirmados** (status "Agendado")
- Soma de unidades de entregas **já realizadas** na semana
- **Não inclui** unidades de agendamentos "Previstos"

### Aba "Sem Agendamento":
- Mostra apenas clientes com status "Agendar" **E** com `ativo === true`
- Clientes inativos não aparecerão na lista
