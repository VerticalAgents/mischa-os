

## Plano: Calendário Semanal responsivo + esconder scrollbars no mobile/tablet

### Problemas identificados
1. **Calendário Semanal**: `grid-cols-7` fixo (linha 1260) — impossível de ler no mobile 391px
2. **Scrollbar vertical visível** no mobile/tablet ocupando espaço
3. **Conteúdo não cabe** na largura — gera scroll horizontal indesejado

### Mudanças

**1. `src/components/agendamento/AgendamentoDashboard.tsx` — Calendário responsivo**

O calendário de 7 colunas será substituído por um layout responsivo:
- **Mobile** (`<md`): layout vertical, lista de cards empilhados (1 coluna), cada dia mostrando nome abreviado + data + badges lado a lado
- **Tablet** (`md`): `grid-cols-4` (4 dias na primeira fila, 3 na segunda)
- **Desktop** (`lg+`): mantém `grid-cols-7` atual

Além disso, no card de "Agendamentos do Dia Selecionado" (linhas 1377-1415), os badges e botões ficam empilhados no mobile em vez de lado a lado:
- `flex-col sm:flex-row` no container do card
- Botões de ação abaixo do conteúdo no mobile

**2. `src/index.css` — Esconder scrollbar vertical no mobile/tablet**

Adicionar regra CSS que esconde a scrollbar do `<main>` em viewports `<1024px`:
```css
@media (max-width: 1023px) {
  main { scrollbar-width: none; }
  main::-webkit-scrollbar { display: none; }
}
```

Isso remove AMBAS as scrollbars (vertical e horizontal) no mobile/tablet sem afetar desktop.

**3. `src/components/agendamento/AgendamentoDashboard.tsx` — Filtros e navegador de semana**

- O navegador de semana (linha 849-885) já tem `min-w-[160px]` e flex-wrap — ok
- O botão "Exportar PDF" com `ml-auto` pode empurrar conteúdo — adicionar `w-full sm:w-auto` para empilhar no mobile

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `AgendamentoDashboard.tsx` | Calendário responsivo (lista no mobile, grid-cols-4 tablet, grid-cols-7 desktop) + cards do dia empilhados no mobile |
| `src/index.css` | Esconder scrollbar no mobile/tablet |

### Desktop preservado
Todas as mudanças usam breakpoints `md:` e `lg:` — desktop inalterado.

