
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
    return {
      id: pedidoExpedicao.id,
      cliente: {
        nome: pedidoExpedicao.cliente_nome || 'Cliente não informado',
        endereco: pedidoExpedicao.cliente_endereco,
        telefone: pedidoExpedicao.cliente_telefone,
        linkGoogleMaps: pedidoExpedicao.link_google_maps
      },
      dataEntrega: pedidoExpedicao.data_prevista_entrega,
      quantidadeTotal: pedidoExpedicao.quantidade_total,
      tipoPedido: pedidoExpedicao.tipo_pedido,
      substatus: pedidoExpedicao.substatus_pedido || 'Agendado',
      itens: itens
    };
  };

  return { converterPedidoParaCard };
};
