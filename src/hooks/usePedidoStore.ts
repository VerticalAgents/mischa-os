import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { Pedido, StatusPedido, ItemPedido, Cliente, SubstatusPedidoAgendado, AlteracaoStatusPedido } from '../types';
import { calcularDistribuicaoSabores, calcularDeltaEfetivo, deltaForaTolerancia, calcularGiroSemanalPDV, calcularNovoQp } from '../utils/calculations';
import { useClienteStore } from './useClienteStore';
import { useSaborStore } from './useSaborStore';
import { addDays, isWeekend } from 'date-fns';

interface PedidoStore {
  pedidos: Pedido[];
  pedidoAtual: Pedido | null;
  filtros: {
    dataInicio?: Date;
    dataFim?: Date;
    idCliente?: string;
    status?: StatusPedido | 'Todos';
    substatus?: SubstatusPedidoAgendado | 'Todos';
  };
  
  // Ações
  setPedidos: (pedidos: Pedido[]) => void;
  criarNovoPedido: (idCliente: string) => Pedido | null;
  adicionarPedido: (pedido: Omit<Pedido, 'id' | 'dataPedido'>) => Pedido;
  atualizarPedido: (id: number, dadosPedido: Partial<Pedido>) => void;
  atualizarItensPedido: (idPedido: number, itens: Omit<ItemPedido, 'id' | 'idPedido'>[]) => void;
  removerPedido: (id: number) => void;
  selecionarPedido: (id: number | null) => void;
  
  // Ações de workflow
  confirmarEntrega: (idPedido: number, dataEfetiva: Date, itensEntregues: {idSabor: number, quantidadeEntregue: number}[]) => void;
  despacharPedido: (idPedido: number) => void;
  cancelarPedido: (idPedido: number) => void;
  atualizarSubstatusPedido: (idPedido: number, novoSubstatus: SubstatusPedidoAgendado, observacao?: string) => void;
  
  // Ações de filtro
  setFiltroDataInicio: (data?: Date) => void;
  setFiltroDataFim: (data?: Date) => void;
  setFiltroCliente: (idCliente?: string) => void;
  setFiltroStatus: (status?: StatusPedido | 'Todos') => void;
  setFiltroSubstatus: (substatus?: SubstatusPedidoAgendado | 'Todos') => void;
  limparFiltros: () => void;
  
  // Getters
  getPedidosFiltrados: () => Pedido[];
  getPedidoPorId: (id: number) => Pedido | undefined;
  getPedidosPorCliente: (idCliente: string) => Pedido[];
  getPedidosPorStatus: (status: StatusPedido) => Pedido[];
  getPedidosPorSubstatus: (substatus: SubstatusPedidoAgendado) => Pedido[];
  getPedidosFuturos: () => Pedido[];
  getPedidosUnicos: () => Pedido[];
}

const getProximoDiaUtil = (data: Date): Date => {
  const proximaData = addDays(new Date(data), 1);
  return isWeekend(proximaData) ? getProximoDiaUtil(proximaData) : proximaData;
};

export const usePedidoStore = create<PedidoStore>()(
  devtools(
    (set, get) => ({
      pedidos: [], // Iniciando vazio
      pedidoAtual: null,
      filtros: {
        status: 'Todos',
        substatus: 'Todos'
      },
      
      setPedidos: (pedidos) => set({ pedidos }),
      
      criarNovoPedido: (idCliente: string) => {
        const cliente = useClienteStore.getState().getClientePorId(idCliente);
        
        if (!cliente) {
          toast({
            title: "Erro",
            description: "Cliente não encontrado",
            variant: "destructive"
          });
          return null;
        }
        
        let dataPrevistaEntrega = new Date();
        if (cliente.ultimaDataReposicaoEfetiva) {
          dataPrevistaEntrega = new Date(cliente.ultimaDataReposicaoEfetiva);
          dataPrevistaEntrega.setDate(dataPrevistaEntrega.getDate() + cliente.periodicidadePadrao);
        } else {
          dataPrevistaEntrega.setDate(dataPrevistaEntrega.getDate() + 1);
        }
        
        const novoPedido: Omit<Pedido, 'id'> = {
          idCliente: idCliente, // Changed to use string idCliente directly
          cliente,
          dataPedido: new Date(),
          dataPrevistaEntrega,
          totalPedidoUnidades: cliente.quantidadePadrao,
          tipoPedido: "Padrão",
          statusPedido: "Agendado",
          substatusPedido: "Agendado",
          itensPedido: [],
          historicoAlteracoesStatus: [{
            dataAlteracao: new Date(),
            statusAnterior: "Agendado",
            statusNovo: "Agendado",
            substatusNovo: "Agendado",
            observacao: "Pedido criado"
          }]
        };
        
        const saboresAtivos = useSaborStore.getState().getSaboresAtivos();
        const itensPedido = calcularDistribuicaoSabores(saboresAtivos, cliente.quantidadePadrao);
        
        const novoId = Math.max(0, ...get().pedidos.map(p => p.id)) + 1;
        const pedidoCompleto = {
          ...novoPedido,
          id: novoId,
          itensPedido: itensPedido.map((item, idx) => ({
            ...item,
            id: idx + 1,
            idPedido: novoId
          }))
        };
        
        set(state => ({
          pedidos: [...state.pedidos, pedidoCompleto],
          pedidoAtual: pedidoCompleto
        }));
        
        toast({
          title: "Pedido criado",
          description: `Pedido padrão criado para ${cliente.nome}`
        });
        
        useClienteStore.getState().atualizarCliente(cliente.id, {
          statusAgendamento: "Agendado",
          proximaDataReposicao: dataPrevistaEntrega
        });
        
        return pedidoCompleto;
      },
      
      adicionarPedido: (pedido) => {
        const novoId = Math.max(0, ...get().pedidos.map(p => p.id)) + 1;
        
        let cliente = undefined;
        if (pedido.idCliente && pedido.idCliente !== '') { // Changed condition to check for non-empty string
          cliente = useClienteStore.getState().getClientePorId(pedido.idCliente);
        }
        
        const novoPedido = {
          ...pedido,
          id: novoId,
          dataPedido: new Date(),
          cliente,
          itensPedido: []
        };
        
        set(state => ({
          pedidos: [...state.pedidos, novoPedido]
        }));
        
        toast({
          title: cliente ? "Pedido criado" : "Pedido único criado",
          description: cliente 
            ? `Pedido criado para ${cliente.nome}` 
            : "Pedido único criado com sucesso"
        });
        
        return novoPedido;
      },
      
      atualizarPedido: (id, dadosPedido) => {
        set(state => ({
          pedidos: state.pedidos.map(pedido => 
            pedido.id === id ? { ...pedido, ...dadosPedido } : pedido
          ),
          pedidoAtual: state.pedidoAtual?.id === id 
            ? { ...state.pedidoAtual, ...dadosPedido } 
            : state.pedidoAtual
        }));
      },
      
      atualizarItensPedido: (idPedido, itens) => {
        const pedido = get().pedidos.find(p => p.id === idPedido);
        
        if (!pedido) return;
        
        const totalUnidades = itens.reduce((sum, item) => sum + item.quantidadeSabor, 0);
        
        const tipoPedido = pedido.tipoPedido === "Padrão" && itens.length > 0 
          ? "Alterado" 
          : pedido.tipoPedido;
        
        const novosItens = itens.map((item, idx) => ({
          ...item,
          id: pedido.itensPedido[idx]?.id || (idx + 1),
          idPedido
        }));
        
        set(state => ({
          pedidos: state.pedidos.map(p => {
            if (p.id === idPedido) {
              return {
                ...p,
                totalPedidoUnidades: totalUnidades,
                tipoPedido,
                itensPedido: novosItens
              };
            }
            return p;
          }),
          pedidoAtual: state.pedidoAtual?.id === idPedido 
            ? {
                ...state.pedidoAtual,
                totalPedidoUnidades: totalUnidades,
                tipoPedido,
                itensPedido: novosItens
              } 
            : state.pedidoAtual
        }));
      },
      
      removerPedido: (id) => {
        set(state => ({
          pedidos: state.pedidos.filter(pedido => pedido.id !== id),
          pedidoAtual: state.pedidoAtual?.id === id ? null : state.pedidoAtual
        }));
      },
      
      selecionarPedido: (id) => {
        if (id === null) {
          set({ pedidoAtual: null });
          return;
        }
        
        const pedido = get().pedidos.find(p => p.id === id);
        set({ pedidoAtual: pedido || null });
      },
      
      confirmarEntrega: (idPedido, dataEfetiva, itensEntregues) => {
        const pedido = get().pedidos.find(p => p.id === idPedido);
        if (!pedido) return;
        
        set(state => ({
          pedidos: state.pedidos.map(p => {
            if (p.id === idPedido) {
              const itensAtualizados = p.itensPedido.map(item => {
                const itemEntregue = itensEntregues.find(i => i.idSabor === item.idSabor);
                return itemEntregue 
                  ? { ...item, quantidadeEntregue: itemEntregue.quantidadeEntregue }
                  : item;
              });
              
              return {
                ...p,
                statusPedido: "Entregue",
                dataEfetivaEntrega: dataEfetiva,
                itensPedido: itensAtualizados
              };
            }
            return p;
          })
        }));
        
        const totalEntregue = itensEntregues.reduce((sum, item) => sum + item.quantidadeEntregue, 0);
        
        if (pedido.cliente) {
          const clienteState = useClienteStore.getState();
          const ultimaDataReposicao = pedido.cliente.ultimaDataReposicaoEfetiva;
          
          clienteState.atualizarCliente(pedido.cliente.id, {
            ultimaDataReposicaoEfetiva: dataEfetiva
          });
          
          if (ultimaDataReposicao) {
            const deltaEfetivo = calcularDeltaEfetivo(dataEfetiva, ultimaDataReposicao);
            
            if (deltaForaTolerancia(deltaEfetivo, pedido.cliente.periodicidadePadrao)) {
              const giroSemanal = calcularGiroSemanalPDV(totalEntregue, deltaEfetivo);
              const novoQp = calcularNovoQp(giroSemanal, pedido.cliente.periodicidadePadrao);
              
              clienteState.atualizarCliente(pedido.cliente.id, {
                quantidadePadrao: novoQp
              });
              
              toast({
                title: "Qp recalculado",
                description: `Qp de ${pedido.cliente.nome} atualizado de ${pedido.cliente.quantidadePadrao} para ${novoQp} (Δ=${deltaEfetivo})`,
                variant: "default"
              });
            }
          }
        }
        
        const saborState = useSaborStore.getState();
        
        itensEntregues.forEach(item => {
          saborState.atualizarSaldoEstoque(item.idSabor, item.quantidadeEntregue, false);
        });
        
        const clienteNome = pedido.cliente?.nome || 
          (pedido.observacoes?.includes("PEDIDO ÚNICO") 
            ? pedido.observacoes?.match(/Nome: (.*?)(?:\n|$)/)?.[1] 
            : `Pedido #${pedido.id}`);
        
        toast({
          title: "Entrega confirmada",
          description: `Pedido para ${clienteNome} entregue com sucesso.`
        });
      },
      
      despacharPedido: (idPedido) => {
        const pedido = get().pedidos.find(p => p.id === idPedido);
        if (!pedido) return;
        
        const saborState = useSaborStore.getState();
        const sabores = saborState.sabores;
        
        const itensComSaldoInsuficiente = pedido.itensPedido.filter(item => {
          const sabor = sabores.find(s => s.id === item.idSabor);
          return sabor && sabor.saldoAtual < item.quantidadeSabor;
        });
        
        if (itensComSaldoInsuficiente.length > 0) {
          const mensagens = itensComSaldoInsuficiente.map(item => {
            const sabor = sabores.find(s => s.id === item.idSabor);
            return `${sabor?.nome}: ${sabor?.saldoAtual}/${item.quantidadeSabor}`;
          });
          
          toast({
            title: "Estoque insuficiente",
            description: `Não há estoque suficiente para: ${mensagens.join(', ')}`,
            variant: "destructive"
          });
          return;
        }
        
        set(state => ({
          pedidos: state.pedidos.map(p => 
            p.id === idPedido ? { ...p, statusPedido: "Despachado" } : p
          ),
          pedidoAtual: state.pedidoAtual?.id === idPedido 
            ? { ...state.pedidoAtual, statusPedido: "Despachado" } 
            : state.pedidoAtual
        }));
        
        pedido.itensPedido.forEach(item => {
          saborState.atualizarSaldoEstoque(item.idSabor, item.quantidadeSabor, false);
        });
        
        toast({
          title: "Pedido despachado",
          description: `Pedido #${idPedido} despachado com sucesso.`
        });
      },
      
      cancelarPedido: (idPedido) => {
        set(state => ({
          pedidos: state.pedidos.map(p => 
            p.id === idPedido ? { ...p, statusPedido: "Cancelado" } : p
          ),
          pedidoAtual: state.pedidoAtual?.id === idPedido 
            ? { ...state.pedidoAtual, statusPedido: "Cancelado" } 
            : state.pedidoAtual
        }));
        
        toast({
          title: "Pedido cancelado",
          description: `Pedido #${idPedido} cancelado com sucesso.`
        });
      },
      
      atualizarSubstatusPedido: (idPedido, novoSubstatus, observacao) => {
        const pedido = get().pedidos.find(p => p.id === idPedido);
        if (!pedido) return;
    
        const alteracaoStatus: AlteracaoStatusPedido = {
          dataAlteracao: new Date(),
          statusAnterior: pedido.statusPedido,
          statusNovo: pedido.statusPedido,
          substatusAnterior: pedido.substatusPedido,
          substatusNovo: novoSubstatus,
          observacao: observacao || `Substatus alterado para ${novoSubstatus}`
        };
    
        set(state => ({
          pedidos: state.pedidos.map(p =>
            p.id === idPedido ? {
              ...p,
              substatusPedido: novoSubstatus,
              historicoAlteracoesStatus: [
                ...(p.historicoAlteracoesStatus || []),
                alteracaoStatus
              ]
            } : p
          ),
          pedidoAtual: state.pedidoAtual?.id === idPedido
            ? {
              ...state.pedidoAtual,
              substatusPedido: novoSubstatus,
              historicoAlteracoesStatus: [
                ...(state.pedidoAtual.historicoAlteracoesStatus || []),
                alteracaoStatus
              ]
            }
            : state.pedidoAtual
        }));
    
        toast({
          title: "Substatus atualizado",
          description: `Substatus do pedido #${idPedido} alterado para ${novoSubstatus}.`
        });
      },
      
      setFiltroSubstatus: (substatus) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            substatus
          }
        }));
      },
      
      setFiltroDataInicio: (dataInicio) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            dataInicio
          }
        }));
      },
      
      setFiltroDataFim: (dataFim) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            dataFim
          }
        }));
      },
      
      setFiltroCliente: (idCliente) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            idCliente
          }
        }));
      },
      
      setFiltroStatus: (status) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            status
          }
        }));
      },
      
      limparFiltros: () => {
        set({
          filtros: {
            status: 'Todos',
            substatus: 'Todos'
          }
        });
      },
      
      getPedidosFiltrados: () => {
        const { pedidos, filtros } = get();
        
        return pedidos.filter(pedido => {
          const dataMatch = 
            (!filtros.dataInicio || new Date(pedido.dataPrevistaEntrega) >= new Date(filtros.dataInicio)) &&
            (!filtros.dataFim || new Date(pedido.dataPrevistaEntrega) <= new Date(filtros.dataFim));
          
          const clienteMatch = !filtros.idCliente || pedido.cliente?.id === filtros.idCliente;
          
          const statusMatch = !filtros.status || filtros.status === 'Todos' || pedido.statusPedido === filtros.status;
          
          const substatusMatch = !filtros.substatus || filtros.substatus === 'Todos' || pedido.substatusPedido === filtros.substatus;
          
          return dataMatch && clienteMatch && statusMatch && substatusMatch;
        });
      },
      
      getPedidoPorId: (id) => {
        return get().pedidos.find(p => p.id === id);
      },
      
      getPedidosPorCliente: (idCliente) => {
        return get().pedidos.filter(p => p.cliente?.id === idCliente);
      },
      
      getPedidosPorStatus: (status) => {
        return get().pedidos.filter(p => p.statusPedido === status);
      },
      
      getPedidosPorSubstatus: (substatus) => {
        return get().pedidos.filter(p => p.substatusPedido === substatus);
      },
      
      getPedidosFuturos: () => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        return get().pedidos.filter(p => 
          (p.statusPedido === "Agendado" || p.statusPedido === "Em Separação") && 
          new Date(p.dataPrevistaEntrega) >= hoje
        ).sort((a, b) => 
          new Date(a.dataPrevistaEntrega).getTime() - new Date(b.dataPrevistaEntrega).getTime()
        );
      },
      
      getPedidosUnicos: () => {
        return get().pedidos.filter(p => 
          !p.idCliente || // Changed condition - if idCliente is empty/null
          !p.cliente
        );
      }
    }),
    { name: 'pedido-store' }
  )
);
