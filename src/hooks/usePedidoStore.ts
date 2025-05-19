
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { Pedido, StatusPedido, ItemPedido, Cliente, SubstatusPedidoAgendado, AlteracaoStatusPedido } from '../types';
import { pedidosMock, relacionarItensPedidos, relacionarClientesPedidos } from '../data/mockData';
import { calcularDistribuicaoSabores, calcularDeltaEfetivo, deltaForaTolerancia, calcularGiroSemanalPDV, calcularNovoQp } from '../utils/calculations';
import { useClienteStore } from './cliente';
import { useSaborStore } from './useSaborStore';
import { addDays, isWeekend } from 'date-fns';

interface PedidoStore {
  pedidos: Pedido[];
  pedidoAtual: Pedido | null;
  filtros: {
    dataInicio?: Date;
    dataFim?: Date;
    idCliente?: number;
    status?: StatusPedido | 'Todos';
    substatus?: SubstatusPedidoAgendado | 'Todos';
  };
  
  // Ações
  setPedidos: (pedidos: Pedido[]) => void;
  criarNovoPedido: (idCliente: number) => Pedido | null;
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
  setFiltroCliente: (idCliente?: number) => void;
  setFiltroStatus: (status?: StatusPedido | 'Todos') => void;
  setFiltroSubstatus: (substatus?: SubstatusPedidoAgendado | 'Todos') => void;
  limparFiltros: () => void;
  
  // Getters
  getPedidosFiltrados: () => Pedido[];
  getPedidoPorId: (id: number) => Pedido | undefined;
  getPedidosPorCliente: (idCliente: number) => Pedido[];
  getPedidosPorStatus: (status: StatusPedido) => Pedido[];
  getPedidosPorSubstatus: (substatus: SubstatusPedidoAgendado) => Pedido[];
  getPedidosFuturos: () => Pedido[];
  getPedidosUnicos: () => Pedido[];
}

// Helper to calculate next working day
const getProximoDiaUtil = (data: Date): Date => {
  const proximaData = addDays(new Date(data), 1);
  return isWeekend(proximaData) ? getProximoDiaUtil(proximaData) : proximaData;
};

export const usePedidoStore = create<PedidoStore>()(
  devtools(
    (set, get) => ({
      pedidos: relacionarClientesPedidos(),
      pedidoAtual: null,
      filtros: {
        status: 'Todos',
        substatus: 'Todos'
      },
      
      setPedidos: (pedidos) => set({ pedidos }),
      
      criarNovoPedido: (idCliente) => {
        const cliente = useClienteStore.getState().getClientePorId(idCliente);
        
        if (!cliente) {
          toast({
            title: "Erro",
            description: "Cliente não encontrado",
            variant: "destructive"
          });
          return null;
        }
        
        // Calcular a data prevista de entrega
        let dataPrevistaEntrega = new Date();
        if (cliente.ultimaDataReposicaoEfetiva) {
          dataPrevistaEntrega = new Date(cliente.ultimaDataReposicaoEfetiva);
          dataPrevistaEntrega.setDate(dataPrevistaEntrega.getDate() + cliente.periodicidadePadrao);
        } else {
          dataPrevistaEntrega.setDate(dataPrevistaEntrega.getDate() + 1); // Mínimo 1 dia se não houver histórico
        }
        
        // Criar o novo pedido
        const novoPedido: Omit<Pedido, 'id'> = {
          idCliente,
          cliente,
          dataPedido: new Date(),
          dataPrevistaEntrega,
          totalPedidoUnidades: cliente.quantidadePadrao,
          tipoPedido: "Padrão",
          statusPedido: "Agendado",
          substatusPedido: "Agendado", // Substatus inicial para pedidos agendados
          itensPedido: [],
          historicoAlteracoesStatus: [{
            dataAlteracao: new Date(),
            statusAnterior: "Agendado",
            statusNovo: "Agendado",
            substatusNovo: "Agendado",
            observacao: "Pedido criado"
          }]
        };
        
        // Calcular a distribuição de sabores
        const saboresAtivos = useSaborStore.getState().getSaboresAtivos();
        const itensPedido = calcularDistribuicaoSabores(saboresAtivos, cliente.quantidadePadrao);
        
        // Salvar o pedido
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
        
        // Atualizar o status de agendamento do cliente
        useClienteStore.getState().atualizarCliente(cliente.id, {
          statusAgendamento: "Agendado",
          proximaDataReposicao: dataPrevistaEntrega
        });
        
        return pedidoCompleto;
      },
      
      adicionarPedido: (pedido) => {
        const novoId = Math.max(0, ...get().pedidos.map(p => p.id)) + 1;
        
        // Buscar cliente para relacionamento (se idCliente > 0)
        let cliente = undefined;
        if (pedido.idCliente > 0) {
          cliente = useClienteStore.getState().getClientePorId(pedido.idCliente);
        }
        
        const novoPedido = {
          ...pedido,
          id: novoId,
          dataPedido: new Date(),
          cliente,
          itensPedido: [] // Inicializa o array vazio para ser preenchido depois
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
        
        // Calcular o total de unidades
        const totalUnidades = itens.reduce((sum, item) => sum + item.quantidadeSabor, 0);
        
        // Determinar se é um pedido alterado (quando não segue a distribuição padrão)
        const tipoPedido = pedido.tipoPedido === "Padrão" && itens.length > 0 
          ? "Alterado" 
          : pedido.tipoPedido;
        
        // Criar novos itens com IDs
        const novosItens = itens.map((item, idx) => ({
          ...item,
          id: pedido.itensPedido[idx]?.id || (idx + 1),
          idPedido
        }));
        
        // Atualizar o pedido
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
        
        // Atualizar o status do pedido
        set(state => ({
          pedidos: state.pedidos.map(p => {
            if (p.id === idPedido) {
              // Atualizar as quantidades entregues
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
        
        // Calcular o total entregue
        const totalEntregue = itensEntregues.reduce((sum, item) => sum + item.quantidadeEntregue, 0);
        
        // Só atualiza cliente se for um pedido de PDV (não for pedido único)
        if (pedido.cliente) {
          // 1. Atualizar a última data de reposição do cliente
          const clienteState = useClienteStore.getState();
          const ultimaDataReposicao = pedido.cliente.ultimaDataReposicaoEfetiva;
          
          clienteState.atualizarCliente(pedido.cliente.id, {
            ultimaDataReposicaoEfetiva: dataEfetiva
          });
          
          // 2. Verificar Delta e recalcular Qp se necessário
          if (ultimaDataReposicao) {
            const deltaEfetivo = calcularDeltaEfetivo(dataEfetiva, ultimaDataReposicao);
            
            if (deltaForaTolerancia(deltaEfetivo, pedido.cliente.periodicidadePadrao)) {
              // Calcular o giro semanal e o novo Qp
              const giroSemanal = calcularGiroSemanalPDV(totalEntregue, deltaEfetivo);
              const novoQp = calcularNovoQp(giroSemanal, pedido.cliente.periodicidadePadrao);
              
              // Atualizar o Qp do cliente
              clienteState.atualizarCliente(pedido.cliente.id, {
                quantidadePadrao: novoQp
              });
              
              // Notificar o usuário
              toast({
                title: "Qp recalculado",
                description: `Qp de ${pedido.cliente.nome} atualizado de ${pedido.cliente.quantidadePadrao} para ${novoQp} (Δ=${deltaEfetivo})`,
                variant: "default"
              });
            }
          }
        }
        
        // 3. Atualizar estoques (dando baixa)
        const saborState = useSaborStore.getState();
        
        itensEntregues.forEach(item => {
          saborState.atualizarSaldoEstoque(item.idSabor, item.quantidadeEntregue, false);
        });
        
        // Mensagem personalizada baseada no tipo de pedido
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
        
        // Verificar se há estoque suficiente
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
        
        // Atualizar o status do pedido
        set(state => ({
          pedidos: state.pedidos.map(p => 
            p.id === idPedido ? { ...p, statusPedido: "Despachado" } : p
          ),
          pedidoAtual: state.pedidoAtual?.id === idPedido 
            ? { ...state.pedidoAtual, statusPedido: "Despachado" } 
            : state.pedidoAtual
        }));
        
        // Dar baixa no estoque
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
    
        // Criar a alteração de status
        const alteracaoStatus: AlteracaoStatusPedido = {
          dataAlteracao: new Date(),
          statusAnterior: pedido.statusPedido,
          statusNovo: pedido.statusPedido, // Status permanece o mesmo
          substatusAnterior: pedido.substatusPedido,
          substatusNovo: novoSubstatus,
          observacao: observacao || `Substatus alterado para ${novoSubstatus}`
        };
    
        // Atualizar o pedido
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
          // Filtro por data
          const dataMatch = 
            (!filtros.dataInicio || new Date(pedido.dataPrevistaEntrega) >= new Date(filtros.dataInicio)) &&
            (!filtros.dataFim || new Date(pedido.dataPrevistaEntrega) <= new Date(filtros.dataFim));
          
          // Filtro por cliente
          const clienteMatch = !filtros.idCliente || pedido.idCliente === filtros.idCliente;
          
          // Filtro por status
          const statusMatch = !filtros.status || filtros.status === 'Todos' || pedido.statusPedido === filtros.status;
          
          // Filtro por substatus
          const substatusMatch = !filtros.substatus || filtros.substatus === 'Todos' || pedido.substatusPedido === filtros.substatus;
          
          return dataMatch && clienteMatch && statusMatch && substatusMatch;
        });
      },
      
      getPedidoPorId: (id) => {
        return get().pedidos.find(p => p.id === id);
      },
      
      getPedidosPorCliente: (idCliente) => {
        return get().pedidos.filter(p => p.idCliente === idCliente);
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
          p.idCliente === 0 || // Cliente ID = 0 para pedidos únicos
          !p.cliente // Sem relação com cliente
        );
      }
    }),
    { name: 'pedido-store' }
  )
);
