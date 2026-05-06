## Objetivo

Compactar os cards "Projeção de Demanda" e "Produtos Entregues" para 2 linhas — número grande inline no header, removendo o bloco colorido grande.

## Layout final

```
📦 Projeção de Demanda   2234 un.   54 pedidos                  ⚙
─────────────────────────────────────────────────────────────────
Detalhes por Produto                                            ⌄
```

```
✓ Produtos Entregues   500 un.   6 produtos        Sem. ant.: 2005 ↗ 25%
─────────────────────────────────────────────────────────────────
Detalhes por Produto                                            ⌄
```

## Mudanças

### `QuantidadesProdutosSemanal.tsx`
- Remover o bloco hero colorido (`<div ... bg-blue-50 ...>`).
- No `CardHeader`, ao lado do título, adicionar o número grande inline:
  ```tsx
  <span className="text-2xl md:text-3xl font-bold leading-none {cor}">{quantidadeTotal}</span>
  <span className="text-sm md:text-base font-medium {cor}/70">un.</span>
  ```
  Cor segue `isProvavelMode` (purple) ou padrão (blue).
- Manter a badge `{totalPedidos} pedidos` ao lado.
- `CardContent` passa a ter só o `Collapsible` "Detalhes por Produto" (sem `space-y-3`).
- Quando `quantidadeTotal === 0`, mostrar a mensagem "Nenhum pedido..." normalmente, sem hero.

### `EntregasRealizadasSemanal.tsx`
- Mesma transformação: remover bloco hero verde grande.
- No header: título + número grande verde + "un." + badge `{totalEntregas} produtos`. À direita, manter o comparativo "Semana anterior".
- `CardContent` passa a ter só o `Collapsible` "Detalhes por Produto".

### Header responsivo
- Em mobile (`<sm`), o header empilha (já é `flex-col sm:flex-row`). O número grande + badge ficam numa linha sob o título.
- Em desktop, tudo numa linha só.

## Arquivos
- `src/components/agendamento/QuantidadesProdutosSemanal.tsx`
- `src/components/agendamento/EntregasRealizadasSemanal.tsx`
