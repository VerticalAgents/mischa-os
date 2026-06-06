
import { useProdutoStore } from "@/hooks/useProdutoStore";

export const usePedidoConverter = () => {
  const { produtos } = useProdutoStore();

  const converterPedidoParaCard = (pedidoExpedicao: any) => {
    console.log('🔄 Convertendo pedido da expedição:', pedidoExpedicao);
    
    // Criar lista de itens do pedido com nomes corretos dos produtos
    let itens: any[] = [];
    
    if (pedidoExpedicao.itens_personalizados && pedidoExpedicao.itens_personalizados.length > 0) {
      // Pedido alterado - usar itens personalizados
      itens = pedidoExpedicao.itens_personalizados.map((item: any, index: number) => ({
        produto_id: `produto-${index}`,
        produto_nome: item.produto || item.nome || `Produto ${index}`,
        quantidade: item.quantidade
      }));
    } else {
      // Pedido padrão - usar distribuição baseada nos produtos cadastrados
      const quantidadePorProduto = Math.floor(pedidoExpedicao.quantidade_total / Math.max(1, produtos.length));
      const resto = pedidoExpedicao.quantidade_total % Math.max(1, produtos.length);
      
      itens = produtos.slice(0, Math.min(produtos.length, 5)).map((produto, index) => ({
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade: quantidadePorProduto + (index < resto ? 1 : 0)
      }));
    }

    console.log('📦 Itens do pedido convertidos:', itens);

    // Retornar objeto que corresponde à interface PedidoCardData
    // IMPORTANTE: Preservar campos do GestaoClick para exibição consistente
    return {
      id: pedidoExpedicao.id,
      cliente_id: pedidoExpedicao.cliente_id,
      cliente_nome: pedidoExpedicao.cliente_nome,
      cliente_endereco: pedidoExpedicao.cliente_endereco,
      cliente_telefone: pedidoExpedicao.cliente_telefone,
      data_prevista_entrega: new Date(pedidoExpedicao.data_prevista_entrega),
      quantidade_total: pedidoExpedicao.quantidade_total,
      tipo_pedido: pedidoExpedicao.tipo_pedido,
      substatus_pedido: pedidoExpedicao.substatus_pedido || 'Agendado',
      itens: itens,
      itens_personalizados: pedidoExpedicao.itens_personalizados,
      gestaoclick_venda_id: pedidoExpedicao.gestaoclick_venda_id,
      gestaoclick_sincronizado_em: pedidoExpedicao.gestaoclick_sincronizado_em,
      observacoes_agendamento: pedidoExpedicao.observacoes_agendamento,
      observacoes_gerais: pedidoExpedicao.observacoes_gerais,
      trocas_pendentes: pedidoExpedicao.trocas_pendentes,
      bonificacoes_pendentes: pedidoExpedicao.bonificacoes_pendentes
    };
  };

  return { converterPedidoParaCard };
};
