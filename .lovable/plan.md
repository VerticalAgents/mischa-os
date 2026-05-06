## Objetivo

Eliminar espaço vazio nos cards "Projeção de Demanda" e "Produtos Entregues" em desktop/tablet, deixando-os mais densos visualmente, e corrigir a inconsistência de cor do indicador "Entregues".

## Mudanças

### 1. Corrigir cor do indicador "Entregues" (`AgendamentoDashboard.tsx`)

O mini-card "Entregues" (no grid de 4 indicadores no topo) está com `text-blue-600`, mas o card "Produtos Entregues" inteiro é verde. Trocar para verde:

```text
{ label: "Entregues", value: ..., color: "text-green-600", Icon: Truck }
```

### 2. Reformatar bloco "hero" dos dois cards

**Hoje:** o "hero" verde/azul/roxo é um bloco grande (`p-3 md:p-4`, `text-3xl md:text-4xl`, `flex items-baseline gap-3`) com apenas o número + 1 badge à esquerda — sobra ~70% de espaço vazio à direita.

**Novo layout proposto** — uma única linha horizontal usando todo o `CardContent`:

```text
┌────────────────────────────────────────────────────────┐
│  500 un.                              ▸ 6 produtos     │
│  ─── (linha separadora) ──────────────────────────────  │
│  Detalhes por Produto                              ⌄    │
└────────────────────────────────────────────────────────┘
```

Concretamente, no `CardContent` de **`QuantidadesProdutosSemanal.tsx`** e **`EntregasRealizadasSemanal.tsx`**:

- Substituir o bloco hero por um `flex items-baseline justify-between` com fundo colorido sutil (mantém a borda/cor de identidade):
  - **Esquerda**: número grande + sufixo "un." inline e menor.
    ```tsx
    <div className="flex items-baseline gap-1.5">
      <span className="text-3xl md:text-4xl font-bold leading-none text-green-600">{quantidadeTotal}</span>
      <span className="text-base md:text-lg font-medium text-green-600/70">un.</span>
    </div>
    ```
  - **Direita**: badge contextual deslocada para a borda direita do mesmo bloco (não mais "colada" no número).
    ```tsx
    <Badge variant="secondary" className="...">{totalEntregas} produtos</Badge>
    ```
- Manter o `Collapsible` "Detalhes por Produto" abaixo, com `mt-3` ao invés do `space-y-4` atual (reduz espaçamento).

### 3. Mover badge para o header (alternativa caso o bloco hero suma)

Se quisermos hero ainda mais minimalista, mover o `{X pedidos}` / `{X produtos}` para dentro do `CardHeader`, ao lado do título como uma `Badge` sutil — assim o "hero" passa a ser apenas: `500 un.` em destaque.

Essa opção (recomendada) deixa o card final com ~3 linhas:
1. Header: ícone + título + badge contagem (canto direito) + engrenagem (no caso do projeção)
2. Número grande inline com "un."
3. Collapsible "Detalhes por Produto"

### 4. Cor do hero do "Produtos Entregues"

Continua verde (consistente com o título e com o indicador agora corrigido). O hero do "Projeção de Demanda" continua azul ou roxo (modo provável) — sem alterações de cor nesse card.

## Arquivos afetados

- `src/components/agendamento/AgendamentoDashboard.tsx` — cor do indicador "Entregues".
- `src/components/agendamento/QuantidadesProdutosSemanal.tsx` — novo layout do hero + badge no header.
- `src/components/agendamento/EntregasRealizadasSemanal.tsx` — novo layout do hero + badge no header.

## Decisão pendente

Confirma a opção 3 (badge `54 pedidos` / `6 produtos` movida para o header, ao lado do título)? Se preferir, posso manter a badge dentro do bloco hero, alinhada à direita (opção 2 sozinha).
