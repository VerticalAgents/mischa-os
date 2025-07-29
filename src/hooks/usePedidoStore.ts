
import { create } from 'zustand';
import { Pedido, StatusPedido } from '../types';
import { supabase } from '../integrations/supabase/client';
import { useClienteStore } from './useClienteStore';

interface PedidoStore {
  pedidos: Pedido[];
  loading: boolean;
  error: string | null;
  carregarPedidos: () => Promise<void>;
  adicionarPedido: (pedidoData: Omit<Pedido, 'id'>) => Promise<void>;
  editarPedido: (id: string, pedidoData: Partial<Pedido>) => Promise<void>;
  excluirPedido: (id: string) => Promise<void>;
  buscarPedidoPorId: (id: string) => Promise<Pedido | null>;
  finalizarPedido: (pedidoId: string) => Promise<void>;
  atualizarStatusPedido: (pedidoId: string, novoStatus: StatusPedido) => Promise<void>;
  reagendarPedido: (pedidoId: string, novaData: Date) => Promise<void>;
  criarNovoPedido: (clienteId: string) => Pedido | null;
  getPedidosFuturos: () => Pedido[];
}

export const usePedidoStore = create<PedidoStore>((set, get) => ({
  pedidos: [],
  loading: false,
  error: null,

  carregarPedidos: async () => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('data_pedido', { ascending: false });

      if (error) throw error;

      const pedidosFormatados: Pedido[] = (data || []).map(pedido => ({
        id: pedido.id,
        idCliente: pedido.cliente_id,
        clienteId: pedido.cliente_id,
        dataPedido: new Date(pedido.data_pedido),
        dataPrevistaEntrega: pedido.data_entrega ? new Date(pedido.data_entrega) : new Date(pedido.data_pedido),
        status: (pedido.status as StatusPedido),
        statusPedido: (pedido.status as StatusPedido),
        valorTotal: pedido.valor_total || 0,
        observacoes: pedido.observacoes || '',
        itensPedido: Array.isArray(pedido.itens) ? pedido.itens as any[] : [],
        itens: Array.isArray(pedido.itens) ? pedido.itens as any[] : [],
        dataEntrega: pedido.data_entrega ? new Date(pedido.data_entrega) : undefined,
        enderecoEntrega: pedido.endereco_entrega || '',
        contatoEntrega: pedido.contato_entrega || '',
        numeroPedidoCliente: pedido.numero_pedido_cliente || '',
        totalPedidoUnidades: Array.isArray(pedido.itens) 
          ? pedido.itens.reduce((total: number, item: any) => total + (item.quantidade || 0), 0)
          : 0,
        createdAt: new Date(pedido.created_at),
        updatedAt: pedido.updated_at ? new Date(pedido.updated_at) : undefined
      }));

      set({ pedidos: pedidosFormatados, loading: false });
    } catch (error: any) {
      console.error('❌ Erro ao carregar pedidos:', error);
      set({ error: error.message, loading: false });
    }
  },

  adicionarPedido: async (pedidoData) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_id: pedidoData.idCliente,
            data_pedido: pedidoData.dataPedido.toISOString(),
            status: pedidoData.statusPedido,
            valor_total: pedidoData.valorTotal,
            observacoes: pedidoData.observacoes,
            itens: pedidoData.itens,
            data_entrega: pedidoData.dataEntrega ? pedidoData.dataEntrega.toISOString() : null,
            endereco_entrega: pedidoData.enderecoEntrega,
            contato_entrega: pedidoData.contatoEntrega,
            numero_pedido_cliente: pedidoData.numeroPedidoCliente
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const novoPedido: Pedido = {
        id: data.id,
        idCliente: data.cliente_id,
        clienteId: data.cliente_id || '',
        dataPedido: new Date(data.data_pedido),
        dataPrevistaEntrega: data.data_entrega ? new Date(data.data_entrega) : new Date(data.data_pedido),
        status: (data.status as StatusPedido),
        statusPedido: (data.status as StatusPedido),
        valorTotal: data.valor_total || 0,
        observacoes: data.observacoes || '',
        itensPedido: Array.isArray(data.itens) ? data.itens as any[] : [],
        itens: Array.isArray(data.itens) ? data.itens as any[] : [],
        dataEntrega: data.data_entrega ? new Date(data.data_entrega) : undefined,
        enderecoEntrega: data.endereco_entrega || '',
        contatoEntrega: data.contato_entrega || '',
        numeroPedidoCliente: data.numero_pedido_cliente || '',
        totalPedidoUnidades: Array.isArray(data.itens) 
          ? data.itens.reduce((total: number, item: any) => total + (item.quantidade || 0), 0)
          : 0,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      };

      set(state => ({
        pedidos: [...state.pedidos, novoPedido],
        loading: false
      }));

    } catch (error: any) {
      console.error('❌ Erro ao adicionar pedido:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  editarPedido: async (id: string, pedidoData: Partial<Pedido>) => {
    try {
      set({ loading: true, error: null });

      const updateData: any = {};

      if (pedidoData.idCliente !== undefined) updateData.cliente_id = pedidoData.idCliente;
      if (pedidoData.dataPedido !== undefined) updateData.data_pedido = pedidoData.dataPedido.toISOString();
      if (pedidoData.statusPedido !== undefined) updateData.status = pedidoData.statusPedido;
      if (pedidoData.valorTotal !== undefined) updateData.valor_total = pedidoData.valorTotal;
      if (pedidoData.observacoes !== undefined) updateData.observacoes = pedidoData.observacoes;
      if (pedidoData.itens !== undefined) updateData.itens = pedidoData.itens;
      if (pedidoData.dataEntrega !== undefined) updateData.data_entrega = pedidoData.dataEntrega?.toISOString();
      if (pedidoData.enderecoEntrega !== undefined) updateData.endereco_entrega = pedidoData.enderecoEntrega;
      if (pedidoData.contatoEntrega !== undefined) updateData.contato_entrega = pedidoData.contatoEntrega;
      if (pedidoData.numeroPedidoCliente !== undefined) updateData.numero_pedido_cliente = pedidoData.numeroPedidoCliente;

      const { data, error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const pedidoAtualizado: Pedido = {
        id: data.id,
        idCliente: data.cliente_id,
        clienteId: data.cliente_id || '',
        dataPedido: new Date(data.data_pedido),
        dataPrevistaEntrega: data.data_entrega ? new Date(data.data_entrega) : new Date(data.data_pedido),
        status: (data.status as StatusPedido),
        statusPedido: (data.status as StatusPedido),
        valorTotal: data.valor_total || 0,
        observacoes: data.observacoes || '',
        itensPedido: Array.isArray(data.itens) ? data.itens as any[] : [],
        itens: Array.isArray(data.itens) ? data.itens as any[] : [],
        dataEntrega: data.data_entrega ? new Date(data.data_entrega) : undefined,
        enderecoEntrega: data.endereco_entrega || '',
        contatoEntrega: data.contato_entrega || '',
        numeroPedidoCliente: data.numero_pedido_cliente || '',
        totalPedidoUnidades: Array.isArray(data.itens) 
          ? data.itens.reduce((total: number, item: any) => total + (item.quantidade || 0), 0)
          : 0,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      };

      set(state => ({
        pedidos: state.pedidos.map(pedido =>
          pedido.id === id ? pedidoAtualizado : pedido
        ),
        loading: false
      }));

    } catch (error: any) {
      console.error('❌ Erro ao editar pedido:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  excluirPedido: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        pedidos: state.pedidos.filter(pedido => pedido.id !== id),
        loading: false
      }));

    } catch (error: any) {
      console.error('❌ Erro ao excluir pedido:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  buscarPedidoPorId: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return null;
      }

      const pedido: Pedido = {
        id: data.id,
        idCliente: data.cliente_id,
        clienteId: data.cliente_id || '',
        dataPedido: new Date(data.data_pedido),
        dataPrevistaEntrega: data.data_entrega ? new Date(data.data_entrega) : new Date(data.data_pedido),
        status: (data.status as StatusPedido),
        statusPedido: (data.status as StatusPedido),
        valorTotal: data.valor_total || 0,
        observacoes: data.observacoes || '',
        itensPedido: Array.isArray(data.itens) ? data.itens as any[] : [],
        itens: Array.isArray(data.itens) ? data.itens as any[] : [],
        dataEntrega: data.data_entrega ? new Date(data.data_entrega) : undefined,
        enderecoEntrega: data.endereco_entrega || '',
        contatoEntrega: data.contato_entrega || '',
        numeroPedidoCliente: data.numero_pedido_cliente || '',
        totalPedidoUnidades: Array.isArray(data.itens) 
          ? data.itens.reduce((total: number, item: any) => total + (item.quantidade || 0), 0)
          : 0,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      };

      set({ loading: false });
      return pedido;

    } catch (error: any) {
      console.error('❌ Erro ao buscar pedido:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  finalizarPedido: async (pedidoId: string) => {
    try {
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      // Update client's last delivery date
      if (pedidoData.cliente_id) {
        await useClienteStore.getState().editarCliente(pedidoData.cliente_id, {
          ultimaDataReposicaoEfetiva: new Date()
        });
      }

      // Update order status to 'Finalizado'
      await supabase
        .from('pedidos')
        .update({ status: 'Finalizado' })
        .eq('id', pedidoId);

      // Update state
      set(state => ({
        pedidos: state.pedidos.map(p =>
          p.id === pedidoId ? { ...p, status: 'Finalizado', statusPedido: 'Finalizado' } : p
        )
      }));
    } catch (error: any) {
      console.error('❌ Erro ao finalizar pedido:', error);
      throw error;
    }
  },

  atualizarStatusPedido: async (pedidoId: string, novoStatus: StatusPedido) => {
    try {
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
    
      if (pedidoError) throw pedidoError;

      // Update client's next delivery date if status is 'Entregue'
      if (novoStatus === 'Entregue' && pedidoData.cliente_id) {
        const cliente = useClienteStore.getState().getClientePorId(pedidoData.cliente_id);
        if (cliente) {
          const proximaData = new Date();
          proximaData.setDate(proximaData.getDate() + cliente.periodicidadePadrao);
          
          await useClienteStore.getState().editarCliente(pedidoData.cliente_id, {
            proximaDataReposicao: proximaData
          });
        }
      }

      // Update order status in Supabase
      await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId);

      // Update state
      set(state => ({
        pedidos: state.pedidos.map(p =>
          p.id === pedidoId ? { ...p, status: novoStatus, statusPedido: novoStatus } : p
        )
      }));
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status do pedido:', error);
      throw error;
    }
  },

  reagendarPedido: async (pedidoId: string, novaData: Date) => {
    try {
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
    
      if (pedidoError) throw pedidoError;

      // Update client's next delivery date
      if (pedidoData.cliente_id) {
        await useClienteStore.getState().editarCliente(pedidoData.cliente_id, {
          proximaDataReposicao: novaData
        });
      }

      // Update order's delivery date in Supabase
      await supabase
        .from('pedidos')
        .update({ data_entrega: novaData.toISOString() })
        .eq('id', pedidoId);

      // Update state
      set(state => ({
        pedidos: state.pedidos.map(p =>
          p.id === pedidoId ? { ...p, dataEntrega: novaData, dataPrevistaEntrega: novaData } : p
        )
      }));
    } catch (error: any) {
      console.error('❌ Erro ao reagendar pedido:', error);
      throw error;
    }
  },

  criarNovoPedido: (clienteId: string) => {
    const cliente = useClienteStore.getState().getClientePorId(clienteId);
    if (!cliente) return null;

    const novoPedido: Pedido = {
      id: crypto.randomUUID(),
      idCliente: clienteId,
      clienteId,
      dataPedido: new Date(),
      dataPrevistaEntrega: new Date(),
      status: 'Pendente',
      statusPedido: 'Pendente',
      valorTotal: 0,
      observacoes: '',
      itensPedido: [],
      itens: [],
      enderecoEntrega: cliente.enderecoEntrega || '',
      contatoEntrega: cliente.contatoNome || '',
      numeroPedidoCliente: '',
      totalPedidoUnidades: cliente.quantidadePadrao || 0,
      createdAt: new Date(),
      cliente: cliente
    };

    return novoPedido;
  },

  getPedidosFuturos: () => {
    const hoje = new Date();
    return get().pedidos.filter(pedido => 
      pedido.dataPrevistaEntrega > hoje
    );
  },
}));
