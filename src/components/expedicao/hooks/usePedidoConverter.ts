
import { useProdutoStore } from "@/hooks/useProdutoStore";

export const usePedidoConverter = () => {
  const { produtos } = useProdutoStore();

  const converterPedidoParaCard = (pedidoExpedicao: any) => {
    console.log('🔄 Convertendo pedido da expedição:', pedidoExpedicao);
    
    // Criar lista de itens do pedido com nomes corretos dos produtos
    let itensPedido: any[] = [];
    
    if (pedidoExpedicao.itens_personalizados && pedidoExpedicao.itens_personalizados.length > 0) {
      // Pedido alterado - usar itens personalizados
      itensPedido = pedidoExpedicao.itens_personalizados.map((item: any, index: number) => ({
        id: index,
        idPedido: pedidoExpedicao.id, // Manter como string (UUID)
        idSabor: index,
        nomeSabor: item.produto || item.nome || `Produto ${index}`, // Usar nome correto do produto
        quantidadeSabor: item.quantidade,
        sabor: { nome: item.produto || item.nome || `Produto ${index}` }
      }));
    } else {
      // Pedido padrão - usar distribuição baseada nos produtos cadastrados
      const quantidadePorProduto = Math.floor(pedidoExpedicao.quantidade_total / Math.max(1, produtos.length));
      const resto = pedidoExpedicao.quantidade_total % Math.max(1, produtos.length);
      
      itensPedido = produtos.slice(0, Math.min(produtos.length, 5)).map((produto, index) => ({
        id: index,
        idPedido: pedidoExpedicao.id, // Manter como string (UUID)
        idSabor: produto.id,
        nomeSabor: produto.nome, // Usar nome real do produto
        quantidadeSabor: quantidadePorProduto + (index < resto ? 1 : 0),
        sabor: { nome: produto.nome }
      }));
    }

    console.log('📦 Itens do pedido convertidos:', itensPedido);

    return {
      id: pedidoExpedicao.id, // Manter como string (UUID) - não converter para number
      idCliente: pedidoExpedicao.cliente_id,
      dataPedido: new Date(pedidoExpedicao.data_prevista_entrega),
      dataPrevistaEntrega: new Date(pedidoExpedicao.data_prevista_entrega),
      statusPedido: 'Agendado' as const,
      substatusPedido: (pedidoExpedicao.substatus_pedido || 'Agendado') as any,
      tipoPedido: pedidoExpedicao.tipo_pedido as any,
      itensPedido,
      totalPedidoUnidades: pedidoExpedicao.quantidade_total,
      cliente: {
        id: pedidoExpedicao.cliente_id,
        nome: pedidoExpedicao.cliente_nome,
        enderecoEntrega: pedidoExpedicao.cliente_endereco || '',
        quantidadePadrao: 0,
        periodicidadePadrao: 7,
        statusCliente: 'Ativo' as const,
        dataCadastro: new Date(),
        ultimaDataReposicaoEfetiva: null,
        proximaDataReposicao: null,
        observacoes: '',
        instrucoesEntrega: '',
        cnpjCpf: '',
        emiteNotaFiscal: true,
        ativo: true,
        contabilizarGiroMedio: true,
        tipoLogistica: 'Própria' as const,
        tipoCobranca: 'À vista' as const,
        formaPagamento: 'Boleto' as const,
        categoriaId: 1,
        subcategoriaId: 1
      }
    };
  };

  return { converterPedidoParaCard };
};
