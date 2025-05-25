
import { 
  Cliente, 
  Sabor, 
  Pedido, 
  ItemPedido,
  Alerta
} from '../types';

// Dados mock iniciais vazios
export const clientesMock: Cliente[] = [];

export const saboresMock: Sabor[] = [];

export const pedidosMock: Pedido[] = [];

export const itensPedidoMock: ItemPedido[] = [];

export const alertasMock: Alerta[] = [];

// Funções de relacionamento (mantidas para compatibilidade)
export function relacionarItensPedidos() {
  pedidosMock.forEach(pedido => {
    pedido.itensPedido = itensPedidoMock.filter(item => item.idPedido === pedido.id);
  });
  
  return pedidosMock;
}

export function relacionarClientesPedidos() {
  const pedidosComClientes = pedidosMock.map(pedido => {
    const cliente = clientesMock.find(c => c.id === pedido.idCliente.toString());
    return { ...pedido, cliente };
  });
  
  return pedidosComClientes;
}

export function relacionarSaboresItensPedido() {
  const itensComSabores = itensPedidoMock.map(item => {
    const sabor = saboresMock.find(s => s.id === item.idSabor);
    return { ...item, sabor };
  });
  
  return itensComSabores;
}

export function dadosCompletos() {
  const pedidosComItens = relacionarItensPedidos();
  const pedidosComClientes = relacionarClientesPedidos();
  const itensComSabores = relacionarSaboresItensPedido();
  
  pedidosComClientes.forEach(pedido => {
    pedido.itensPedido = itensComSabores.filter(item => item.idPedido === pedido.id);
  });
  
  return {
    clientes: clientesMock,
    sabores: saboresMock,
    pedidos: pedidosComClientes,
    alertas: alertasMock
  };
}
