

## Plano: Bloquear ações de edição no Agendamento para usuários sem permissão

### Problema
A Beatriz (Gerente de Produção) tem `can_access: true` mas `can_edit: false` para `/agendamento`, porém consegue clicar em todos os botões de edição porque nenhum componente do Agendamento consome `useEditPermission`.

### Componentes a alterar (11 arquivos)

Cada componente receberá `useEditPermission()` e os botões de ação serão desabilitados com tooltip explicativo.

| Componente | Botões afetados |
|------------|----------------|
| `AgendamentoDashboard.tsx` | "Reagendar em Massa", botão editar (✏️), botão confirmar (✓) no calendário semanal |
| `TodosAgendamentos.tsx` | "Reagendar em Massa" |
| `NovaConfirmacaoReposicaoTab.tsx` | "Confirmar", "Reagendar" |
| `ConfirmacaoReposicaoTab.tsx` | "Confirmar" (×2 tabelas) |
| `AgendamentoRepresentantes.tsx` | "Confirmar", "Editar" |
| `AgendamentosPrevistos.tsx` | "Confirmar", "Editar" |
| `AgendamentosDespachados.tsx` | "Editar" |
| `AgendamentosAtrasados.tsx` | "Editar" |
| `AgendamentosSemData.tsx` | "Definir Data" |
| `AgendamentosPositivacao.tsx` | "Editar" |
| `AgendamentosPeriodicidade.tsx` | Botão editar periodicidade |

### Padrão aplicado

```tsx
import { useEditPermission } from "@/contexts/EditPermissionContext";

const { canEdit } = useEditPermission();

// Botões desabilitados com título explicativo:
<Button
  disabled={!canEdit}
  title={!canEdit ? "Ação não habilitada pelo administrador" : undefined}
  onClick={...}
>
  Confirmar
</Button>
```

- Botões ficam `disabled` (visíveis mas não clicáveis) com `opacity-50 cursor-not-allowed`
- Ao passar o mouse, tooltip nativo mostra "Ação não habilitada pelo administrador"
- Admin continua com `canEdit: true` — sem impacto

### Arquivos alterados
11 componentes dentro de `src/components/agendamento/`

