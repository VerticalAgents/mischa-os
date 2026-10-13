/**
 * Quanto um pedido gera de venda, em R$.
 *
 * É a MESMA regra de preço que monta a venda no Gestão Click
 * (supabase/functions/gestaoclick-proxy): por item, preço do cliente para a categoria
 * do produto → senão o preço padrão da categoria → senão R$ 4,50; e, para quem pede
 * em displays, a faixa pela quantidade de displays da entrega. Mudou lá, mude aqui.
 *
 * É valor calculado com o preço de hoje, não o que saiu na nota: desconto dado à mão
 * numa venda não aparece.
 */
import { precoUnitarioDisplays } from './pedidoDisplays';
import { type Canal, type ClienteCanal, type IndiceProdutos, type ItemCanal, canalDoItem, produtoDoItem } from './canalVenda';

/** id da categoria "Revenda Padrão": a dos pedidos "Padrão" e a única que tem faixa de displays. */
export const CATEGORIA_REVENDA = 1;

/** Preço usado quando não há nem preço do cliente nem padrão da categoria (igual ao proxy). */
export const PRECO_SEM_TABELA = 4.5;

export interface TabelaPrecos {
  /** chave `${clienteId}_${categoriaId}` */
  doCliente: Map<string, number>;
  /** preço padrão por id de categoria (configuração "precificacao") */
  padrao: Record<string, number>;
}

export interface PedidoFaturavel {
  cliente?: (ClienteCanal & { modeloPedido?: string | null }) | null;
  quantidadeTotal?: number | null;
  itens?: ItemCanal[] | null;
}

export const precoDaCategoria = (
  clienteId: string | undefined,
  categoriaId: number | null | undefined,
  tabela: TabelaPrecos
): number => {
  if (!categoriaId) return PRECO_SEM_TABELA;
  const doCliente = clienteId ? tabela.doCliente.get(`${clienteId}_${categoriaId}`) : undefined;
  if (doCliente !== undefined && doCliente !== null) return doCliente;
  return tabela.padrao[String(categoriaId)] || PRECO_SEM_TABELA;
};

/**
 * Valor do pedido. Com `canal`, soma só os itens daquele canal — é o que deixa o
 * card de faturamento seguir o filtro dos cards de canal num pedido misto.
 */
export const valorDoPedido = (
  pedido: PedidoFaturavel,
  indice: IndiceProdutos,
  tabela: TabelaPrecos,
  canal: Canal | null = null
): number => {
  const cliente = pedido.cliente;
  const itens = (Array.isArray(pedido.itens) ? pedido.itens : []).filter(i => (i?.quantidade ?? 0) > 0);

  // Pedido "Padrão": a proporção padrão só tem produto de revenda.
  const linhas = itens.length > 0
    ? itens.map(item => {
        const produto = produtoDoItem(item, indice);
        return { quantidade: item.quantidade ?? 0, produto, categoriaId: produto?.categoria_id ?? null };
      })
    : [{ quantidade: pedido.quantidadeTotal || 0, produto: undefined, categoriaId: CATEGORIA_REVENDA as number | null }];

  const unidadesDaCategoria = linhas.reduce(
    (soma, l) => (l.categoriaId === CATEGORIA_REVENDA ? soma + l.quantidade : soma), 0
  );

  let total = 0;
  for (const linha of linhas) {
    if (canal && canalDoItem(cliente, linha.produto) !== canal) continue;
    const preco = precoUnitarioDisplays({
      modeloPedido: cliente?.modeloPedido,
      categoriaId: linha.categoriaId,
      unidadesDaCategoria,
      precoAtual: precoDaCategoria(cliente?.id, linha.categoriaId, tabela),
    });
    total += linha.quantidade * preco;
  }
  return total;
};
