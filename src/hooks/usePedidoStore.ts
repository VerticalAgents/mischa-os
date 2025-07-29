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
        clienteId: pedido.cliente_id || '',
        dataPedido: new Date(pedido.data_pedido),
        status: (pedido.status as StatusPedido) || 'Pendente',
        valorTotal: pedido.valor_total || 0,
        observacoes: pedido.observacoes || '',
        itens: pedido.itens || [],
        dataEntrega: pedido.data_entrega ? new Date(pedido.data_entrega) : undefined,
        enderecoEntrega: pedido.endereco_entrega || '',
        contatoEntrega: pedido.contato_entrega || '',
        numeroPedidoCliente: pedido.numero_pedido_cliente || '',
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
            cliente_id: pedidoData.clienteId,
            data_pedido: pedidoData.dataPedido.toISOString(),
            status: pedidoData.status,
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
        clienteId: data.cliente_id || '',
        dataPedido: new Date(data.data_pedido),
        status: (data.status as StatusPedido) || 'Pendente',
        valorTotal: data.valor_total || 0,
        observacoes: data.observacoes || '',
        itens: data.itens || [],
        dataEntrega: data.data_entrega ? new Date(data.data_entrega) : undefined,
        enderecoEntrega: data.endereco_entrega || '',
        contatoEntrega: data.contato_entrega || '',
        numeroPedidoCliente: data.numero_pedido_cliente || '',
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

      if (pedidoData.clienteId !== undefined) updateData.cliente_id = pedidoData.clienteId;
      if (pedidoData.dataPedido !== undefined) updateData.data_pedido = pedidoData.dataPedido.toISOString();
      if (pedidoData.status !== undefined) updateData.status = pedidoData.status;
      if (pedidoData.valorTotal !== undefined) updateData.valor_total = pedidoData.valorTotal;
      if (pedidoData.observacoes !== undefined) updateData.observacoes = pedidoData.observacoes;
      if (pedidoData.itens !== undefined) updateData.itens = pedidoData.itens;
      if (pedidoData.dataEntrega !== undefined) updateData.data_entrega = pedidoData.dataEntrega.toISOString();
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
        clienteId: data.cliente_id || '',
        dataPedido: new Date(data.data_pedido),
        status: (data.status as StatusPedido) || 'Pendente',
        valorTotal: data.valor_total || 0,
        observacoes: data.observacoes || '',
        itens: data.itens || [],
        dataEntrega: data.data_entrega ? new Date(data.data_entrega) : undefined,
        enderecoEntrega: data.endereco_entrega || '',
        contatoEntrega: data.contato_entrega || '',
        numeroPedidoCliente: data.numero_pedido_cliente || '',
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
        clienteId: data.cliente_id || '',
        dataPedido: new Date(data.data_pedido),
        status: (data.status as StatusPedido) || 'Pendente',
        valorTotal: data.valor_total || 0,
        observacoes: data.observacoes || '',
        itens: data.itens || [],
        dataEntrega: data.data_entrega ? new Date(data.data_entrega) : undefined,
        enderecoEntrega: data.endereco_entrega || '',
        contatoEntrega: data.contato_entrega || '',
        numeroPedidoCliente: data.numero_pedido_cliente || '',
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
      const { clientes, getClientePorId } = useClienteStore.getState();
      
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      const pedido = {
        id: pedidoData.id,
        clienteId: pedidoData.cliente_id || '',
        dataPedido: new Date(pedidoData.data_pedido),
        status: (pedidoData.status as StatusPedido) || 'Pendente',
        valorTotal: pedidoData.valor_total || 0,
        observacoes: pedidoData.observacoes || '',
        itens: pedidoData.itens || [],
        dataEntrega: pedidoData.data_entrega ? new Date(pedidoData.data_entrega) : undefined,
        enderecoEntrega: pedidoData.endereco_entrega || '',
        contatoEntrega: pedidoData.contato_entrega || '',
        numeroPedidoCliente: pedidoData.numero_pedido_cliente || '',
        createdAt: new Date(pedidoData.created_at),
        updatedAt: pedidoData.updated_at ? new Date(pedidoData.updated_at) : undefined
      };

      // Update client's last delivery date
      if (pedido.clienteId) {
        const cliente = getClientePorId(pedido.clienteId);
        if (cliente) {
          await useClienteStore.getState().editarCliente(pedido.clienteId, {
            ultimaDataReposicaoEfetiva: new Date()
          });
        }
      }

      // Update order status to 'Finalizado'
      await supabase
        .from('pedidos')
        .update({ status: 'Finalizado' })
        .eq('id', pedidoId);

      // Update state
      set(state => ({
        pedidos: state.pedidos.map(p =>
          p.id === pedidoId ? { ...p, status: 'Finalizado' } : p
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
    
      const pedido = {
        id: pedidoData.id,
        clienteId: pedidoData.cliente_id || '',
        dataPedido: new Date(pedidoData.data_pedido),
        status: (pedidoData.status as StatusPedido) || 'Pendente',
        valorTotal: pedidoData.valor_total || 0,
        observacoes: pedidoData.observacoes || '',
        itens: pedidoData.itens || [],
        dataEntrega: pedidoData.data_entrega ? new Date(pedidoData.data_entrega) : undefined,
        enderecoEntrega: pedidoData.endereco_entrega || '',
        contatoEntrega: pedidoData.contato_entrega || '',
        numeroPedidoCliente: pedidoData.numero_pedido_cliente || '',
        createdAt: new Date(pedidoData.created_at),
        updatedAt: pedidoData.updated_at ? new Date(pedidoData.updated_at) : undefined
      };

      // Update client's next delivery date if status is 'Entregue'
      if (novoStatus === 'Entregue' && pedido.clienteId) {
        const cliente = useClienteStore.getState().getClientePorId(pedido.clienteId);
        if (cliente) {
          const proximaData = new Date();
          proximaData.setDate(proximaData.getDate() + cliente.periodicidadePadrao);
          
          await useClienteStore.getState().editarCliente(pedido.clienteId, {
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
          p.id === pedidoId ? { ...p, status: novoStatus } : p
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
    
      const pedido = {
        id: pedidoData.id,
        clienteId: pedidoData.cliente_id || '',
        dataPedido: new Date(pedidoData.data_pedido),
        status: (pedidoData.status as StatusPedido) || 'Pendente',
        valorTotal: pedidoData.valor_total || 0,
        observacoes: pedidoData.observacoes || '',
        itens: pedidoData.itens || [],
        dataEntrega: pedidoData.data_entrega ? new Date(pedidoData.data_entrega) : undefined,
        enderecoEntrega: pedidoData.endereco_entrega || '',
        contatoEntrega: pedidoData.contato_entrega || '',
        numeroPedidoCliente: pedidoData.numero_pedido_cliente || '',
        createdAt: new Date(pedidoData.created_at),
        updatedAt: pedidoData.updated_at ? new Date(pedidoData.updated_at) : undefined
      };

      // Update client's next delivery date
      if (pedido.clienteId) {
        await useClienteStore.getState().editarCliente(pedido.clienteId, {
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
          p.id === pedidoId ? { ...p, dataEntrega: novaData } : p
        )
      }));
    } catch (error: any) {
      console.error('❌ Erro ao reagendar pedido:', error);
      throw error;
    }
  },
}));
