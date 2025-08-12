import { create } from 'zustand';
import { Cliente } from '@/types';
import { supabase } from '@/lib/supabase';

interface ClienteState {
  clientes: Cliente[];
  loading: boolean;
  adicionarCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => Promise<Cliente>;
  atualizarCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  excluirCliente: (id: string) => Promise<void>;
  carregarClientes: () => Promise<void>;
}

export const useClienteStore = create<ClienteState>((set, get) => ({
  clientes: [],
  loading: false,
  adicionarCliente: async (cliente) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([
          {
            ...cliente,
            dataCadastro: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const novoCliente: Cliente = {
        ...data,
        dataCadastro: new Date(data.dataCadastro),
      };

      set((state) => ({
        clientes: [...state.clientes, novoCliente],
        loading: false,
      }));

      return novoCliente;
    } catch (error: any) {
      console.error("Erro ao adicionar cliente:", error);
      set({ loading: false });
      throw error;
    }
  },
  atualizarCliente: async (id, cliente) => {
    set({ loading: true });
    try {
      const { error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', id);

      if (error) {
        throw error;
      }

      set((state) => ({
        clientes: state.clientes.map((c) => (c.id === id ? { ...c, ...cliente } : c)),
        loading: false,
      }));
    } catch (error: any) {
      console.error("Erro ao atualizar cliente:", error);
      set({ loading: false });
      throw error;
    }
  },
  excluirCliente: async (id) => {
    set({ loading: true });
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);

      if (error) {
        throw error;
      }

      set((state) => ({
        clientes: state.clientes.filter((cliente) => cliente.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error("Erro ao excluir cliente:", error);
      set({ loading: false });
      throw error;
    }
  },
  carregarClientes: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from<Cliente>('clientes')
        .select('*');

      if (error) {
        throw error;
      }

      const clientesComDataCorrigida = data.map(cliente => ({
        ...cliente,
        dataCadastro: new Date(cliente.dataCadastro),
      }));

      set({ clientes: clientesComDataCorrigida, loading: false });
    } catch (error: any) {
      console.error("Erro ao carregar clientes:", error);
      set({ loading: false });
    }
  },
  duplicarCliente: async (clienteId: string): Promise<Cliente> => {
    try {
      const clienteOriginal = get().clientes.find(c => c.id === clienteId);
      if (!clienteOriginal) {
        throw new Error('Cliente não encontrado');
      }

      // Criar novo cliente com as mesmas configurações, mas dados básicos em branco
      const novoClienteData: Omit<Cliente, 'id' | 'dataCadastro'> = {
        nome: '', // Em branco
        cnpjCpf: '', // Em branco
        enderecoEntrega: '', // Em branco
        linkGoogleMaps: '', // Em branco
        contatoNome: '', // Em branco
        contatoTelefone: '', // Em branco
        contatoEmail: '', // Em branco
        // Manter todas as outras configurações
        quantidadePadrao: clienteOriginal.quantidadePadrao,
        periodicidadePadrao: clienteOriginal.periodicidadePadrao,
        statusCliente: clienteOriginal.statusCliente,
        tipoLogistica: clienteOriginal.tipoLogistica,
        tipoCobranca: clienteOriginal.tipoCobranca,
        formaPagamento: clienteOriginal.formaPagamento,
        emiteNotaFiscal: clienteOriginal.emiteNotaFiscal,
        contabilizarGiroMedio: clienteOriginal.contabilizarGiroMedio,
        observacoes: clienteOriginal.observacoes,
        categoriasHabilitadas: clienteOriginal.categoriasHabilitadas,
        janelasEntrega: clienteOriginal.janelasEntrega,
        representanteId: clienteOriginal.representanteId,
        rotaEntregaId: clienteOriginal.rotaEntregaId,
        categoriaEstabelecimentoId: clienteOriginal.categoriaEstabelecimentoId,
        instrucoesEntrega: clienteOriginal.instrucoesEntrega,
        ativo: clienteOriginal.ativo,
        categoriaId: clienteOriginal.categoriaId,
        subcategoriaId: clienteOriginal.subcategoriaId,
        giroMedioSemanal: clienteOriginal.giroMedioSemanal,
        metaGiroSemanal: clienteOriginal.metaGiroSemanal,
        statusAgendamento: clienteOriginal.statusAgendamento,
        proximaDataReposicao: clienteOriginal.proximaDataReposicao
      };

      const novoCliente = await get().adicionarCliente(novoClienteData);
      
      console.log('Cliente duplicado com sucesso:', novoCliente);
      return novoCliente;
    } catch (error) {
      console.error('Erro ao duplicar cliente:', error);
      throw error;
    }
  },
  return {
    clientes: get().clientes,
    loading: get().loading,
    adicionarCliente: get().adicionarCliente,
    atualizarCliente: get().atualizarCliente,
    excluirCliente: get().excluirCliente,
    carregarClientes: get().carregarClientes,
    duplicarCliente: get().duplicarCliente
  };
}));
