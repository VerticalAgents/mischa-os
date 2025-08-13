
import { useState } from 'react';
import { confirmarEntregaSimples } from './useConfirmacaoEntrega/entregaSimples';
import { confirmarEntregaEmMassa } from './useConfirmacaoEntrega/entregaEmMassa';

export interface ProdutoInsuficiente {
  nome: string;
  necessario: number;
  disponivel: number;
  faltante: number;
}

export interface PedidoEntrega {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  quantidade_total: number;
  tipo_pedido: string;
  itens_personalizados?: any;
}

export const useConfirmacaoEntrega = () => {
  const [loading, setLoading] = useState(false);

  const confirmarEntrega = async (pedido: PedidoEntrega, observacao?: string): Promise<boolean> => {
    setLoading(true);
    try {
      return await confirmarEntregaSimples(pedido, observacao);
    } finally {
      setLoading(false);
    }
  };

  const confirmarEntregaEmMassaWrapper = async (pedidos: PedidoEntrega[]): Promise<boolean> => {
    setLoading(true);
    try {
      return await confirmarEntregaEmMassa(pedidos);
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmarEntrega,
    confirmarEntregaEmMassa: confirmarEntregaEmMassaWrapper,
    loading
  };
};
