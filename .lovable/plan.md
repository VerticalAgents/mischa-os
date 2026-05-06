## Objetivo
Reduzir a barra de filtros do Dashboard de Agendamento (`AgendamentoDashboard.tsx`) para caber tudo em **uma única linha** no desktop, mantendo a responsividade no mobile.

## Mudanças em `src/components/agendamento/AgendamentoDashboard.tsx`

Substituir o bloco "Barra de Filtros Unificada" (linhas ~928–1026) por um layout único `flex items-center gap-2`:

1. **Remover** o ícone `Filter` e o texto "Filtros" + badge de "ativos".
2. **Busca** (1º item): `Input` compacto `h-9 w-44` com ícone search interno e placeholder "Buscar cliente…".
3. **Navegador de semana** (2º item): manter o grupo `‹ dd/MM - dd/MM ›` com `min-w-0` reduzido (`min-w-[140px]`).
4. **Botão "Voltar semana atual"**: virar **icon-only** usando `RotateCcw` da lucide (ícone circular com seta, mesmo padrão usado para resetar preço padrão), com `tooltip` "Voltar para semana atual". Tamanho `h-9 w-9 p-0`, variant `ghost`. Continuar condicional em `!ehSemanaAtual`.
5. **RepresentantesFilter** e **RotasFilter**: passar nova prop `compact` para reduzir botão a **icon-only com badge numérico** quando houver seleção. Layout: `<Button variant="outline" size="icon" className="h-9 w-9 relative">` mostrando apenas o ícone (`Users` / `Map`); se `selectedIds.length > 0 && !allSelected`, mostrar `<Badge>` no canto superior direito com a contagem. Tooltip com texto atual ("Todos os representantes" / "N representantes"). Comportamento do popover inalterado.
6. **Botão Exportar PDF**: virar icon-only `h-9 w-9` com ícone `FileDown` + tooltip "Exportar PDF".
7. **Contador "N agendamentos"**: mover para a direita da linha com `ml-auto` em texto pequeno (`text-xs text-muted-foreground whitespace-nowrap`), ex.: `123 agend.`.

Layout final desktop:
```text
[🔍 Buscar...] [‹ 03/11 - 09/11 ›] [⟲] [👥•] [🗺•] [⬇] ........... 123 agend.
```

No mobile (`< sm`): o container vira `flex-wrap gap-2`; cada item mantém tamanho compacto (já são pequenos), assim cabem em 2 linhas no máximo. Remover `w-full sm:w-auto` dos elementos para que fiquem inline.

## Mudanças em `RepresentantesFilter.tsx` e `RotasFilter.tsx`
- Adicionar prop opcional `compact?: boolean`.
- Quando `compact`: renderizar apenas botão icon-only (`h-9 w-9`) com ícone + badge da contagem; envolver em `Tooltip` mostrando o texto longo. Conteúdo do popover permanece igual.

## Tooltips
Usar o componente `Tooltip` já existente em `@/components/ui/tooltip` (`TooltipProvider`, `TooltipTrigger`, `TooltipContent`).

## Fora de escopo
- Nenhuma alteração no PCP, nas tabs, nos cards de indicadores ou nos gráficos abaixo.
