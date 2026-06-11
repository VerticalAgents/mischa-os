## Objetivo

Ao clicar em **"Lista de Separação"** dentro do modal `ExpedicaoListasModal`, em vez de imprimir direto a lista com todos os pedidos filtrados, abrir um novo modal de seleção (estilo o `SeparacaoEmMassaDialog` / `GerarVendasEmMassaDialog`) para o usuário escolher quais pedidos entram na impressão. O modal também terá um **toggle "Gerar vendas no GestãoClick"** que, quando ligado, dispara a criação das vendas GC antes de imprimir.

## Comportamento

1. Usuário abre **"Listas de Expedição"** → `ExpedicaoListasModal` (sem alterações no design dele).
2. Clica em **"Lista de Separação"** → fecha esse modal e abre o novo **`SelecaoPedidosParaImpressaoDialog`**.
3. Novo modal mostra:
   - Lista completa de pedidos atualmente filtrados na aba (mesmo `listaParaModal` que hoje é usado direto).
   - Checkbox por pedido (cliente, qtd, data, tipo) + "Selecionar todos" (já marcado por padrão → comportamento atual: tudo selecionado = lista igual à de hoje).
   - Badge "X de Y selecionados".
   - Toggle (`Switch`) **"Gerar vendas no GestãoClick ao imprimir"** — desligado por padrão.
     - Mostra contador auxiliar: "N pedidos sem venda GC serão gerados" (filtrando os selecionados que ainda não têm `gestaoclick_venda_id`).
     - Se todos selecionados já têm venda, o toggle aparece desabilitado com texto "Todos já têm venda gerada".
   - Botão primário: **"Imprimir lista"** (ou "Gerar vendas e imprimir" quando o toggle está ligado).
4. Ao confirmar:
   - Se toggle ligado: chama o fluxo equivalente a `handleGerarVendasEmMassa` para os IDs selecionados sem `gestaoclick_venda_id`, aguarda, depois imprime.
   - Se toggle desligado: imprime direto.
   - Em ambos os casos, a impressão usa apenas os pedidos selecionados (subset do `listaAtual` já calculado em `getListaAtual()`).

A aba **Despacho** segue chamando o mesmo fluxo (já que `PrintingActions` é compartilhado), então o comportamento se aplica nas duas abas.

## Mudanças técnicas

### Novo componente
- `src/components/expedicao/components/SelecaoPedidosImpressaoDialog.tsx`
  - Props: `open`, `onOpenChange`, `pedidos` (array já filtrado), `tipoLista` (string para título), `onConfirm(pedidosSelecionados, gerarVendasGC: boolean)`.
  - Reusa padrão visual de `SeparacaoEmMassaDialog` (header com ícone, ScrollArea, checkbox, badge de contagem).
  - Adiciona `Switch` (`@/components/ui/switch`) para "Gerar vendas no GestãoClick".
  - Estado interno: `selecionados: Set<string>`, `gerarVendasGC: boolean`, `loading`.

### `PrintingActions.tsx`
- Adicionar estado `modalSelecaoSeparacaoAberto` + render do novo dialog.
- Refatorar `imprimirListaSeparacao()` para aceitar uma lista explícita de pedidos (`imprimirListaSeparacao(pedidosCustom?: any[])`) — quando não recebe parâmetro, usa `getListaAtual()` como hoje (mantém compat com `handleSelectLista`).
- Em `handleSelectLista`, ao receber `'separacao'`, abrir o novo modal em vez de imprimir direto.
- Adicionar prop opcional `onGerarVendasGC?: (pedidoIds: string[]) => Promise<void>` em `PrintingActions` para que `SeparacaoPedidos` injete sua função `handleGerarVendasEmMassa` existente. `Despacho` pode passar o handler equivalente (ou `undefined`, escondendo o toggle se não fornecido).
- Fluxo do confirm do novo modal:
  ```
  if (gerarVendasGC && onGerarVendasGC) {
    const semVenda = selecionados.filter(p => !p.gestaoclick_venda_id).map(p => p.id);
    await onGerarVendasGC(semVenda);
  }
  imprimirListaSeparacao(selecionados);
  ```

### Pontos de uso
- `SeparacaoPedidos.tsx`: passar `onGerarVendasGC={handleGerarVendasEmMassa}` para `PrintingActions`.
- `Despacho.tsx`: se já existe handler equivalente, passar; senão deixar undefined (toggle some).

## Fora de escopo
- Nada muda em `ExpedicaoListasModal` (cards "Lista de Separação" / "Lista de Documentos" continuam iguais).
- Lista de Documentos e Etiquetas seguem como hoje.
- Sem mudanças no HTML/CSS da impressão em si.
