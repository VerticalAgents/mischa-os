## Objetivo

Otimizar o card de agendamento (versão mobile) renderizado dentro do `AgendamentoDashboard` — usado tanto no admin quanto na aba Dashboard do representante (`/rep/agendamentos`). Os botões de **Confirmar** (✓✓ verde) e **Editar** (lápis) ficam pequenos demais no mobile; precisam virar áreas de toque grandes e o conteúdo do card precisa respirar melhor.

## Onde

Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`
Função interna: `renderCard` / componente `QuantidadeAtualizada` (linhas ~1331-1410).

## Mudanças

### Layout do card no mobile (`< sm`)
Reestruturar em 3 blocos verticais com hierarquia clara:

```text
┌────────────────────────────────────────┐
│ Nome do cliente          [Padrão][Prev]│  ← linha 1: nome + badges status
│ Quantidade: 24 unidades                │  ← linha 2: qtd
│ [21d] [14d] [--d]                      │  ← linha 3: indicadores entrega
│ [80% — Atenção]                        │  ← linha 4: score
│ ─────────────────────────────────────  │
│ [   ✓ Confirmar    ] [  ✏ Editar  ]    │  ← linha 5: botões grandes
└────────────────────────────────────────┘
```

- Container principal: `flex flex-col gap-2 p-3` no mobile; mantém `sm:flex-row sm:items-start sm:gap-3` no desktop (preserva layout atual em telas maiores).
- Bloco de badges (Padrão/Previsto) sobe para cima, ao lado do nome no mobile (linha 1) — não mais no rodapé do card.
- Bloco de botões vira uma linha própria no mobile, separada por uma borda sutil superior (`border-t pt-2`), com:
  - **Confirmar** (visível só se `status === "Previsto"`): `flex-1 h-11`, ícone `CheckCheck` + texto **"Confirmar"** (oculta texto em telas xs muito estreitas via `hidden xs:inline` se necessário, mas geralmente cabe).
  - **Editar**: `flex-1 h-11`, ícone `Edit` + texto **"Editar"**.
  - Ícones aumentam para `h-4 w-4`.
- No desktop (`sm:`): botões voltam ao tamanho compacto atual (`h-8 px-2`, só ícone) usando classes responsivas (`sm:flex-none sm:h-8 sm:px-2` e `sm:hidden` no texto).

### Ajustes de espaçamento
- Padding do card: `p-3 sm:p-3` (mantém).
- Gap interno mobile: `gap-2`.
- Score badge mantém `mt-1.5`.

## Notas técnicas
- Tudo via classes Tailwind responsivas — sem novo componente, sem mudança de lógica.
- Não altera comportamento dos handlers `handleConfirmarAgendamento` / `handleEditarAgendamento` nem o `disabled` por `canEdit`.
- Não altera o desktop visualmente.
- Esse card também aparece para o representante na aba Dashboard de `/rep/agendamentos` (via `AgendamentoDashboard`), então a melhoria atinge ambos os contextos.
