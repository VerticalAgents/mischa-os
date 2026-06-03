# Melhorias na aba Separação de Pedidos

Três entregas independentes na aba **Expedição → Separação**.

---

## 1. Filtro por produto nos agendamentos

Novo filtro multi-seleção em `SeparacaoFilters` (junto da linha de Busca/Tipo/Representante) para mostrar só pedidos que contêm determinado(s) produto(s).

Regras de matching:
- **Pedido Alterado**: bate se `itens_personalizados` contém o produto selecionado com `quantidade > 0`.
- **Pedido Padrão**: bate se o produto selecionado tem percentual > 0 nas **proporções padrão** atuais (porque pedido padrão recebe esse produto automaticamente).
- Multi-seleção em modo OR (mostra pedido que contém **qualquer** dos produtos marcados).

Estado persistido em `useExpedicaoUiStore` como `filtroProdutos: string[]` (ids de `produtos_finais`).

---

## 2. Botão de ação em massa: "Aplicar proporção padrão"

Novo botão no `SeparacaoActionsCard` (abaixo de "Separar em Massa"/"Gerar Vendas"), abre um dialog no mesmo padrão dos outros em-massa.

Comportamento:
- Lista somente pedidos **Alterado** dentro dos filtros atuais (elegíveis).
- Checkbox por pedido + "selecionar todos".
- Ao confirmar: para cada pedido selecionado, atualiza no Supabase `tipo_pedido = 'Padrão'` e limpa `itens_personalizados` (null). `quantidade_total` permanece.
- Se o pedido já tem `gestaoclick_venda_id`, dispara `atualizarVendaGC` para reenviar a composição (igual ao fluxo de salvar agendamento editado).
- Recarrega pedidos ao final.

Reutiliza `useAcaoEmMassaDialog` + componente novo `AplicarPadraoEmMassaDialog` espelhando os dialogs existentes.

---

## 3. Quantidades reais por produto em pedidos Padrão

Hoje pedidos Padrão mostram "Produtos padrão conforme configuração" / "Distribuição Padrão". Trocar pela quebra real calculada a partir das proporções vigentes × `quantidade_total`.

Locais a alterar:
- **Accordion "Ver produtos"** (`ProdutosList.tsx`): quando `tipo_pedido === 'Padrão'`, calcular via `obterProporcoesParaPedido(quantidade_total)` e listar `produto_nome × quantidade` igual aos Alterados.
- **Lista de impressão** (`PrintingActions.tsx`, tanto a versão tabela quanto a versão etiquetas): substituir o fallback `{ nome: "Distribuição Padrão", quantidade: pedido.quantidade_total }` pela mesma quebra calculada.

Implementação:
- Criar hook `useProporcoesAtuais()` (ou reusar `useSupabaseProporoesPadrao`) para carregar `proporcoes` uma única vez no nível do `SeparacaoPedidos` e passar adiante.
- Função utilitária `calcularQuantidadesPadrao(quantidadeTotal, proporcoes)` síncrona (já temos lógica análoga em `obterProporcoesParaPedido`; extrair para `src/utils/proporcoesPadrao.ts` para uso síncrono no print e no accordion).
- Se proporções não somam 100% ou não estão configuradas: manter o fallback atual ("Distribuição Padrão") para não quebrar.

---

## Arquivos afetados

```text
src/components/expedicao/SeparacaoPedidos.tsx          (filtro produto + handler em massa)
src/components/expedicao/components/SeparacaoFilters.tsx (novo seletor de produto)
src/components/expedicao/components/SeparacaoActionsCard.tsx (novo botão)
src/components/expedicao/components/AplicarPadraoEmMassaDialog.tsx (novo)
src/components/expedicao/components/PrintingActions.tsx (usar quebra real)
src/components/expedicao/ProdutosList.tsx              (usar quebra real)
src/hooks/useExpedicaoUiStore.ts                       (filtroProdutos)
src/hooks/useExpedicaoStore.ts                         (action: converterParaPadrao(pedidoIds))
src/utils/proporcoesPadrao.ts                          (novo: cálculo síncrono)
```

Sem mudanças de schema — apenas UPDATE em `pedidos_expedicao` (campos já existentes `tipo_pedido` e `itens_personalizados`).
