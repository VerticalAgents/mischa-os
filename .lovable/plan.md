

## Plano: Tabs do Agendamento em grid no mobile

### Problema
No mobile (391px), até 8 abas ficam em uma fila horizontal com scroll — UX ruim, parece quebrado, o usuário não vê todas as opções.

### Solução
Substituir o `TabsList` padrão por um **grid de botões** no mobile, e manter o `TabsList` horizontal apenas no desktop.

**No mobile/tablet (`<lg`)**: Grid de 2 colunas com botões compactos, todos visíveis de uma vez — sem scroll horizontal.

**No desktop (`lg+`)**: Manter o `TabsList` horizontal atual sem alterações.

### Mudanças

**`src/pages/Agendamento.tsx`**

- Importar `useIsMobile` (ou usar breakpoint `lg`)
- Renderizar condicionalmente:
  - **Mobile**: Um `div` com `grid grid-cols-2 gap-2` contendo botões estilizados que chamam `changeTab()`. O botão ativo tem fundo destacado (bg-white shadow), os inativos ficam em bg-muted.
  - **Desktop**: O `TabsList` + `TabsTrigger` atual, sem alterações.
- `TabsContent` permanece idêntico (controlado por `activeTab` via `Tabs value=`)

### Resultado
- Mobile: todas as abas visíveis em grid 2x4, sem scroll horizontal
- Desktop: layout horizontal original intacto

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Agendamento.tsx` | Grid de tabs no mobile, TabsList no desktop |

