
import { useState, useEffect } from "react";
import { useClientesSupabase, Cliente } from "@/hooks/useClientesSupabase";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useStatusAgendamentoStore } from "@/hooks/useStatusAgendamentoStore";
import { differenceInBusinessDays } from "date-fns";
import { Pedido } from "@/types";

export const useClienteStatusConfirmacao = (filtros: { rota?: string; cidade?: string }) => {
  const { clientes } = useClientesSupabase();
  const { getPedidosFuturos } = usePedidoStore();
  const { statusConfirmacao } = useStatusAgendamentoStore();
  const [clientesPorStatus, setClientesPorStatus] = useState<{[key: number]: Cliente[]}>({});
  const [pedidosCliente, setPedidosCliente] = useState<{[key: string]: Pedido}>({});

  // Simulated function to get status - in a real app, this would come from the client data
  const getClienteStatusConfirmacao = (cliente: Cliente): number => {
    if (!cliente.proxima_data_reposicao) return 0;
    
    const hoje = new Date();
    const dataReposicao = new Date(cliente.proxima_data_reposicao);
    const diferencaDias = differenceInBusinessDays(dataReposicao, hoje);
    
    // Lógica para simular status baseado na proximidade da data
    if (diferencaDias === 2) return 1; // Contato necessário hoje
    if (diferencaDias < 0) return 2; // Atrasado
    if (diferencaDias === 1) return 3; // Contatado, sem resposta
    if (diferencaDias > 5) return 7; // Confirmado
    
    // Distribuir alguns clientes pelos outros status para demonstração
    const randomStatus = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
    return Math.random() > 0.7 ? randomStatus : 7;
  };

  useEffect(() => {
    const pedidosFuturos = getPedidosFuturos();
    const clientesComPedidos: {[key: string]: Cliente} = {};
    const pedidosPorCliente: {[key: string]: Pedido} = {};
    
    // Map pedidos to clientes
    pedidosFuturos.forEach(pedido => {
      if (pedido.cliente) {
        clientesComPedidos[pedido.cliente.id] = pedido.cliente;
        pedidosPorCliente[pedido.cliente.id] = pedido;
      }
    });
    
    // Aplicar filtros de localização
    let clientesFiltrados = Object.values(clientesComPedidos);
    
    if (filtros.rota || filtros.cidade) {
      clientesFiltrados = clientesFiltrados.filter(cliente => {
        // Simulação de filtro por rota/cidade - em implementação real viria dos dados do cliente
        const rotaCliente = ["Rota Centro", "Rota Norte", "Rota Sul"][parseInt(cliente.id) % 3];
        const cidadeCliente = ["São Paulo", "Guarulhos", "Osasco"][parseInt(cliente.id) % 3];
        
        const rotaMatch = !filtros.rota || rotaCliente === filtros.rota;
        const cidadeMatch = !filtros.cidade || cidadeCliente === filtros.cidade;
        
        return rotaMatch && cidadeMatch;
      });
    }
    
    // Organize clients by status
    const clientesPorStatusTemp: {[key: number]: Cliente[]} = {};
    
    // Initialize all status arrays
    statusConfirmacao.forEach(status => {
      clientesPorStatusTemp[status.id] = [];
    });
    
    // Assign clients to status
    clientesFiltrados.forEach(cliente => {
      const statusId = getClienteStatusConfirmacao(cliente);
      if (statusId > 0 && clientesPorStatusTemp[statusId]) {
        clientesPorStatusTemp[statusId].push(cliente);
      }
    });
    
    setClientesPorStatus(clientesPorStatusTemp);
    setPedidosCliente(pedidosPorCliente);
  }, [clientes, getPedidosFuturos, statusConfirmacao, filtros]);

  return {
    clientesPorStatus,
    pedidosCliente,
    statusConfirmacao
  };
};
