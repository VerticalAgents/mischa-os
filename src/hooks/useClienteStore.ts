
import { create } from 'zustand';
import { Cliente, DiaSemana, StatusCliente, TipoLogisticaNome, TipoCobranca, FormaPagamentoNome } from '../types';
import { supabase } from '../integrations/supabase/client';
import { dataCache } from '../utils/dataCache';

interface FiltrosCliente {
  termo: string;
  status: string;
}

interface ClienteStore {
  clientes: Cliente[];
  clienteAtual: Cliente | null;
  loading: boolean;
  error: string | null;
  filtros: FiltrosCliente;
  carregarClientes: () => Promise<void>;
  adicionarCliente: (clienteData: Omit<Cliente, 'id'>) => Promise<void>;
  editarCliente: (id: string, clienteData: Partial<Cliente>) => Promise<void>;
  excluirCliente: (id: string) => Promise<void>;
  selecionarCliente: (cliente: Cliente | null) => void;
  atualizarCliente: (clienteAtualizado: Cliente) => void;
  buscarClientePorId: (id: string) => Promise<Cliente | null>;
  getClientePorId: (id: string) => Cliente | null;
  limparCache: () => void;
  setFiltroTermo: (termo: string) => void;
  setFiltroStatus: (status: string) => void;
  getClientesFiltrados: () => Cliente[];
}

export const useClienteStore = create<ClienteStore>((set, get) => ({
  clientes: [],
  clienteAtual: null,
  loading: false,
  error: null,
  filtros: {
    termo: '',
    status: 'todos'
  },

  carregarClientes: async () => {
    try {
      set({ loading: true, error: null });
      
      // Verificar cache primeiro
      const cacheKey = 'clientes_lista';
      const cachedData = dataCache.get(cacheKey);
      
      if (cachedData) {
        console.log('📦 Cache hit - carregando clientes do cache');
        set({ clientes: cachedData as Cliente[], loading: false });
        return;
      }

      console.log('🔄 Cache miss - carregando clientes do Supabase');
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (error) throw error;

      const clientesFormatados: Cliente[] = (data || []).map(cliente => ({
        id: cliente.id,
        nome: cliente.nome || '',
        cnpjCpf: cliente.cnpj_cpf || '',
        enderecoEntrega: cliente.endereco_entrega || '',
        contatoNome: cliente.contato_nome || '',
        contatoTelefone: cliente.contato_telefone || '',
        contatoEmail: cliente.contato_email || '',
        quantidadePadrao: cliente.quantidade_padrao || 0,
        periodicidadePadrao: cliente.periodicidade_padrao || 7,
        statusCliente: (cliente.status_cliente as StatusCliente) || 'Ativo',
        metaGiroSemanal: cliente.meta_giro_semanal || 0,
        categoriaEstabelecimentoId: cliente.categoria_estabelecimento_id,
        janelasEntrega: Array.isArray(cliente.janelas_entrega) 
          ? cliente.janelas_entrega as DiaSemana[] 
          : [],
        instrucoesEntrega: cliente.instrucoes_entrega || '',
        tipoLogistica: (cliente.tipo_logistica as TipoLogisticaNome) || 'Própria',
        contabilizarGiroMedio: cliente.contabilizar_giro_medio ?? true,
        emiteNotaFiscal: cliente.emite_nota_fiscal ?? true,
        tipoCobranca: (cliente.tipo_cobranca as TipoCobranca) || 'À vista',
        formaPagamento: (cliente.forma_pagamento as FormaPagamentoNome) || 'Boleto',
        observacoes: cliente.observacoes || '',
        categoriasHabilitadas: Array.isArray(cliente.categorias_habilitadas) 
          ? cliente.categorias_habilitadas as number[] 
          : [],
        ativo: cliente.ativo ?? true,
        giroMedioSemanal: cliente.giro_medio_semanal || 0,
        ultimaDataReposicaoEfetiva: cliente.ultima_data_reposicao_efetiva 
          ? new Date(cliente.ultima_data_reposicao_efetiva) 
          : undefined,
        statusAgendamento: cliente.status_agendamento || 'Não Agendado',
        proximaDataReposicao: cliente.proxima_data_reposicao 
          ? new Date(cliente.proxima_data_reposicao) 
          : undefined,
        dataCadastro: new Date(cliente.created_at),
        categoriaId: 1, // Default fallback since this field doesn't exist in DB
        subcategoriaId: 1 // Default fallback since this field doesn't exist in DB
      }));

      // Salvar no cache com TTL de 5 minutos
      dataCache.set(cacheKey, clientesFormatados, 5 * 60 * 1000);

      set({ clientes: clientesFormatados, loading: false });
    } catch (error: any) {
      console.error('❌ Erro ao carregar clientes:', error);
      set({ error: error.message, loading: false });
    }
  },

  adicionarCliente: async (clienteData) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: clienteData.nome,
          cnpj_cpf: clienteData.cnpjCpf,
          endereco_entrega: clienteData.enderecoEntrega,
          contato_nome: clienteData.contatoNome,
          contato_telefone: clienteData.contatoTelefone,
          contato_email: clienteData.contatoEmail,
          quantidade_padrao: clienteData.quantidadePadrao,
          periodicidade_padrao: clienteData.periodicidadePadrao,
          status_cliente: clienteData.statusCliente,
          meta_giro_semanal: clienteData.metaGiroSemanal,
          categoria_estabelecimento_id: clienteData.categoriaEstabelecimentoId,
          janelas_entrega: clienteData.janelasEntrega,
          instrucoes_entrega: clienteData.instrucoesEntrega,
          tipo_logistica: clienteData.tipoLogistica,
          contabilizar_giro_medio: clienteData.contabilizarGiroMedio,
          emite_nota_fiscal: clienteData.emiteNotaFiscal,
          tipo_cobranca: clienteData.tipoCobranca,
          forma_pagamento: clienteData.formaPagamento,
          observacoes: clienteData.observacoes,
          categorias_habilitadas: clienteData.categoriasHabilitadas,
          ativo: clienteData.ativo,
          giro_medio_semanal: clienteData.giroMedioSemanal,
          ultima_data_reposicao_efetiva: clienteData.ultimaDataReposicaoEfetiva,
          status_agendamento: clienteData.statusAgendamento,
          proxima_data_reposicao: clienteData.proximaDataReposicao
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidar cache após inserção
      dataCache.remove('clientes_lista');

      const novoCliente: Cliente = {
        id: data.id,
        nome: data.nome || '',
        cnpjCpf: data.cnpj_cpf || '',
        enderecoEntrega: data.endereco_entrega || '',
        contatoNome: data.contato_nome || '',
        contatoTelefone: data.contato_telefone || '',
        contatoEmail: data.contato_email || '',
        quantidadePadrao: data.quantidade_padrao || 0,
        periodicidadePadrao: data.periodicidade_padrao || 7,
        statusCliente: (data.status_cliente as StatusCliente) || 'Ativo',
        metaGiroSemanal: data.meta_giro_semanal || 0,
        categoriaEstabelecimentoId: data.categoria_estabelecimento_id,
        janelasEntrega: Array.isArray(data.janelas_entrega) 
          ? data.janelas_entrega as DiaSemana[] 
          : [],
        instrucoesEntrega: data.instrucoes_entrega || '',
        tipoLogistica: (data.tipo_logistica as TipoLogisticaNome) || 'Própria',
        contabilizarGiroMedio: data.contabilizar_giro_medio ?? true,
        emiteNotaFiscal: data.emite_nota_fiscal ?? true,
        tipoCobranca: (data.tipo_cobranca as TipoCobranca) || 'À vista',
        formaPagamento: (data.forma_pagamento as FormaPagamentoNome) || 'Boleto',
        observacoes: data.observacoes || '',
        categoriasHabilitadas: Array.isArray(data.categorias_habilitadas) 
          ? data.categorias_habilitadas as number[] 
          : [],
        ativo: data.ativo ?? true,
        giroMedioSemanal: data.giro_medio_semanal || 0,
        ultimaDataReposicaoEfetiva: data.ultima_data_reposicao_efetiva 
          ? new Date(data.ultima_data_reposicao_efetiva) 
          : undefined,
        statusAgendamento: data.status_agendamento || 'Não Agendado',
        proximaDataReposicao: data.proxima_data_reposicao 
          ? new Date(data.proxima_data_reposicao) 
          : undefined,
        dataCadastro: new Date(data.created_at),
        categoriaId: 1,
        subcategoriaId: 1
      };

      set(state => ({
        clientes: [...state.clientes, novoCliente],
        loading: false
      }));

    } catch (error: any) {
      console.error('❌ Erro ao adicionar cliente:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  editarCliente: async (id: string, clienteData: Partial<Cliente>) => {
    try {
      set({ loading: true, error: null });

      const updateData: any = {};
      
      // Map fields to database columns
      if (clienteData.nome !== undefined) updateData.nome = clienteData.nome;
      if (clienteData.cnpjCpf !== undefined) updateData.cnpj_cpf = clienteData.cnpjCpf;
      if (clienteData.enderecoEntrega !== undefined) updateData.endereco_entrega = clienteData.enderecoEntrega;
      if (clienteData.contatoNome !== undefined) updateData.contato_nome = clienteData.contatoNome;
      if (clienteData.contatoTelefone !== undefined) updateData.contato_telefone = clienteData.contatoTelefone;
      if (clienteData.contatoEmail !== undefined) updateData.contato_email = clienteData.contatoEmail;
      if (clienteData.quantidadePadrao !== undefined) updateData.quantidade_padrao = clienteData.quantidadePadrao;
      if (clienteData.periodicidadePadrao !== undefined) updateData.periodicidade_padrao = clienteData.periodicidadePadrao;
      if (clienteData.statusCliente !== undefined) updateData.status_cliente = clienteData.statusCliente;
      if (clienteData.metaGiroSemanal !== undefined) updateData.meta_giro_semanal = clienteData.metaGiroSemanal;
      if (clienteData.categoriaEstabelecimentoId !== undefined) updateData.categoria_estabelecimento_id = clienteData.categoriaEstabelecimentoId;
      if (clienteData.janelasEntrega !== undefined) updateData.janelas_entrega = clienteData.janelasEntrega;
      if (clienteData.instrucoesEntrega !== undefined) updateData.instrucoes_entrega = clienteData.instrucoesEntrega;
      if (clienteData.tipoLogistica !== undefined) updateData.tipo_logistica = clienteData.tipoLogistica;
      if (clienteData.contabilizarGiroMedio !== undefined) updateData.contabilizar_giro_medio = clienteData.contabilizarGiroMedio;
      if (clienteData.emiteNotaFiscal !== undefined) updateData.emite_nota_fiscal = clienteData.emiteNotaFiscal;
      if (clienteData.tipoCobranca !== undefined) updateData.tipo_cobranca = clienteData.tipoCobranca;
      if (clienteData.formaPagamento !== undefined) updateData.forma_pagamento = clienteData.formaPagamento;
      if (clienteData.observacoes !== undefined) updateData.observacoes = clienteData.observacoes;
      if (clienteData.categoriasHabilitadas !== undefined) updateData.categorias_habilitadas = clienteData.categoriasHabilitadas;
      if (clienteData.ativo !== undefined) updateData.ativo = clienteData.ativo;

      const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Invalidar cache após atualização
      dataCache.remove('clientes_lista');

      const clienteAtualizado: Cliente = {
        id: data.id,
        nome: data.nome || '',
        cnpjCpf: data.cnpj_cpf || '',
        enderecoEntrega: data.endereco_entrega || '',
        contatoNome: data.contato_nome || '',
        contatoTelefone: data.contato_telefone || '',
        contatoEmail: data.contato_email || '',
        quantidadePadrao: data.quantidade_padrao || 0,
        periodicidadePadrao: data.periodicidade_padrao || 7,
        statusCliente: (data.status_cliente as StatusCliente) || 'Ativo',
        metaGiroSemanal: data.meta_giro_semanal || 0,
        categoriaEstabelecimentoId: data.categoria_estabelecimento_id,
        janelasEntrega: Array.isArray(data.janelas_entrega) 
          ? data.janelas_entrega as DiaSemana[] 
          : [],
        instrucoesEntrega: data.instrucoes_entrega || '',
        tipoLogistica: (data.tipo_logistica as TipoLogisticaNome) || 'Própria',
        contabilizarGiroMedio: data.contabilizar_giro_medio ?? true,
        emiteNotaFiscal: data.emite_nota_fiscal ?? true,
        tipoCobranca: (data.tipo_cobranca as TipoCobranca) || 'À vista',
        formaPagamento: (data.forma_pagamento as FormaPagamentoNome) || 'Boleto',
        observacoes: data.observacoes || '',
        categoriasHabilitadas: Array.isArray(data.categorias_habilitadas) 
          ? data.categorias_habilitadas as number[] 
          : [],
        ativo: data.ativo ?? true,
        giroMedioSemanal: data.giro_medio_semanal || 0,
        ultimaDataReposicaoEfetiva: data.ultima_data_reposicao_efetiva 
          ? new Date(data.ultima_data_reposicao_efetiva) 
          : undefined,
        statusAgendamento: data.status_agendamento || 'Não Agendado',
        proximaDataReposicao: data.proxima_data_reposicao 
          ? new Date(data.proxima_data_reposicao) 
          : undefined,
        dataCadastro: new Date(data.created_at),
        categoriaId: 1,
        subcategoriaId: 1
      };

      set(state => ({
        clientes: state.clientes.map(cliente => 
          cliente.id === id ? clienteAtualizado : cliente
        ),
        clienteAtual: state.clienteAtual?.id === id ? clienteAtualizado : state.clienteAtual,
        loading: false
      }));

    } catch (error: any) {
      console.error('❌ Erro ao editar cliente:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  excluirCliente: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidar cache após exclusão
      dataCache.remove('clientes_lista');

      set(state => ({
        clientes: state.clientes.filter(cliente => cliente.id !== id),
        clienteAtual: state.clienteAtual?.id === id ? null : state.clienteAtual,
        loading: false
      }));

    } catch (error: any) {
      console.error('❌ Erro ao excluir cliente:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  selecionarCliente: (cliente: Cliente | null) => {
    set({ clienteAtual: cliente });
  },

  atualizarCliente: (clienteAtualizado: Cliente) => {
    set(state => ({
      clientes: state.clientes.map(cliente =>
        cliente.id === clienteAtualizado.id ? clienteAtualizado : cliente
      ),
      clienteAtual: state.clienteAtual?.id === clienteAtualizado.id 
        ? clienteAtualizado 
        : state.clienteAtual
    }));
  },

  buscarClientePorId: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const cliente: Cliente = {
        id: data.id,
        nome: data.nome || '',
        cnpjCpf: data.cnpj_cpf || '',
        enderecoEntrega: data.endereco_entrega || '',
        contatoNome: data.contato_nome || '',
        contatoTelefone: data.contato_telefone || '',
        contatoEmail: data.contato_email || '',
        quantidadePadrao: data.quantidade_padrao || 0,
        periodicidadePadrao: data.periodicidade_padrao || 7,
        statusCliente: (data.status_cliente as StatusCliente) || 'Ativo',
        metaGiroSemanal: data.meta_giro_semanal || 0,
        categoriaEstabelecimentoId: data.categoria_estabelecimento_id,
        janelasEntrega: Array.isArray(data.janelas_entrega) 
          ? data.janelas_entrega as DiaSemana[] 
          : [],
        instrucoesEntrega: data.instrucoes_entrega || '',
        tipoLogistica: (data.tipo_logistica as TipoLogisticaNome) || 'Própria',
        contabilizarGiroMedio: data.contabilizar_giro_medio ?? true,
        emiteNotaFiscal: data.emite_nota_fiscal ?? true,
        tipoCobranca: (data.tipo_cobranca as TipoCobranca) || 'À vista',
        formaPagamento: (data.forma_pagamento as FormaPagamentoNome) || 'Boleto',
        observacoes: data.observacoes || '',
        categoriasHabilitadas: Array.isArray(data.categorias_habilitadas) 
          ? data.categorias_habilitadas as number[] 
          : [],
        ativo: data.ativo ?? true,
        giroMedioSemanal: data.giro_medio_semanal || 0,
        ultimaDataReposicaoEfetiva: data.ultima_data_reposicao_efetiva 
          ? new Date(data.ultima_data_reposicao_efetiva) 
          : undefined,
        statusAgendamento: data.status_agendamento || 'Não Agendado',
        proximaDataReposicao: data.proxima_data_reposicao 
          ? new Date(data.proxima_data_reposicao) 
          : undefined,
        dataCadastro: new Date(data.created_at),
        categoriaId: 1,
        subcategoriaId: 1
      };

      return cliente;

    } catch (error: any) {
      console.error('❌ Erro ao buscar cliente:', error);
      return null;
    }
  },

  getClientePorId: (id: string) => {
    const clientes = get().clientes;
    return clientes.find(cliente => cliente.id === id) || null;
  },

  limparCache: () => {
    dataCache.remove('clientes_lista');
  },

  setFiltroTermo: (termo: string) => {
    set(state => ({
      filtros: { ...state.filtros, termo }
    }));
  },

  setFiltroStatus: (status: string) => {
    set(state => ({
      filtros: { ...state.filtros, status }
    }));
  },

  getClientesFiltrados: () => {
    const { clientes, filtros } = get();
    
    return clientes.filter(cliente => {
      // Filtro por termo
      if (filtros.termo) {
        const termo = filtros.termo.toLowerCase();
        const matchNome = cliente.nome.toLowerCase().includes(termo);
        const matchCnpj = cliente.cnpjCpf?.toLowerCase().includes(termo);
        const matchEndereco = cliente.enderecoEntrega?.toLowerCase().includes(termo);
        
        if (!matchNome && !matchCnpj && !matchEndereco) {
          return false;
        }
      }
      
      // Filtro por status
      if (filtros.status && filtros.status !== 'todos') {
        if (cliente.statusCliente !== filtros.status) {
          return false;
        }
      }
      
      return true;
    });
  }
}));
