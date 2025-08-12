
import { create } from 'zustand';
import { Cliente, StatusCliente } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ClienteState {
  clientes: Cliente[];
  loading: boolean;
  clienteAtual: Cliente | null;
  filtros: {
    termo: string;
    status: StatusCliente | 'Todos' | '';
  };
  adicionarCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => Promise<Cliente>;
  atualizarCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  excluirCliente: (id: string) => Promise<void>;
  removerCliente: (id: string) => Promise<void>;
  carregarClientes: () => Promise<void>;
  duplicarCliente: (clienteId: string) => Promise<Cliente>;
  selecionarCliente: (id: string | null) => void;
  getClientePorId: (id: string) => Cliente | undefined;
  getClientesFiltrados: () => Cliente[];
  setFiltroTermo: (termo: string) => void;
  setFiltroStatus: (status: StatusCliente | 'Todos' | '') => void;
}

// Helper function to transform database row to Cliente interface
const transformDbRowToCliente = (row: any): Cliente => {
  return {
    id: row.id,
    nome: row.nome || '',
    cnpjCpf: row.cnpj_cpf,
    enderecoEntrega: row.endereco_entrega,
    linkGoogleMaps: row.link_google_maps,
    contatoNome: row.contato_nome,
    contatoTelefone: row.contato_telefone,
    contatoEmail: row.contato_email,
    quantidadePadrao: row.quantidade_padrao || 0,
    periodicidadePadrao: row.periodicidade_padrao || 7,
    statusCliente: row.status_cliente || 'Ativo',
    dataCadastro: new Date(row.created_at),
    metaGiroSemanal: row.meta_giro_semanal,
    ultimaDataReposicaoEfetiva: row.ultima_data_reposicao_efetiva ? new Date(row.ultima_data_reposicao_efetiva) : undefined,
    statusAgendamento: row.status_agendamento,
    proximaDataReposicao: row.proxima_data_reposicao ? new Date(row.proxima_data_reposicao) : undefined,
    ativo: row.ativo || true,
    giroMedioSemanal: row.giro_medio_semanal,
    janelasEntrega: row.janelas_entrega,
    representanteId: row.representante_id,
    rotaEntregaId: row.rota_entrega_id,
    categoriaEstabelecimentoId: row.categoria_estabelecimento_id,
    instrucoesEntrega: row.instrucoes_entrega,
    contabilizarGiroMedio: row.contabilizar_giro_medio || true,
    tipoLogistica: row.tipo_logistica || 'Própria',
    emiteNotaFiscal: row.emite_nota_fiscal || true,
    tipoCobranca: row.tipo_cobranca || 'À vista',
    formaPagamento: row.forma_pagamento || 'Boleto',
    observacoes: row.observacoes,
    categoriaId: row.categoria_id || 1,
    subcategoriaId: row.subcategoria_id || 1,
    categoriasHabilitadas: row.categorias_habilitadas || []
  };
};

export const useClienteStore = create<ClienteState>((set, get) => ({
  clientes: [],
  loading: false,
  clienteAtual: null,
  filtros: {
    termo: '',
    status: '',
  },
  adicionarCliente: async (cliente) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([
          {
            ...cliente,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const novoCliente = transformDbRowToCliente(data);

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
  removerCliente: async (id) => {
    // Alias for excluirCliente to maintain compatibility
    return get().excluirCliente(id);
  },
  carregarClientes: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*');

      if (error) {
        throw error;
      }

      const clientesTransformados = data.map(transformDbRowToCliente);

      set({ clientes: clientesTransformados, loading: false });
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
  selecionarCliente: (id: string | null) => {
    const cliente = id ? get().clientes.find(c => c.id === id) : null;
    set({ clienteAtual: cliente || null });
  },
  getClientePorId: (id: string) => {
    return get().clientes.find(c => c.id === id);
  },
  getClientesFiltrados: () => {
    const { clientes, filtros } = get();
    return clientes.filter(cliente => {
      const matchTermo = !filtros.termo || 
        cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        (cliente.cnpjCpf && cliente.cnpjCpf.toLowerCase().includes(filtros.termo.toLowerCase()));
      
      const matchStatus = !filtros.status || filtros.status === 'Todos' || cliente.statusCliente === filtros.status;
      
      return matchTermo && matchStatus;
    });
  },
  setFiltroTermo: (termo: string) => {
    set((state) => ({
      filtros: { ...state.filtros, termo }
    }));
  },
  setFiltroStatus: (status: StatusCliente | 'Todos' | '') => {
    set((state) => ({
      filtros: { ...state.filtros, status }
    }));
  },
}));
