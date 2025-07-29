import { create } from 'zustand';
import { Cliente } from '../types';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface ClienteStore {
  clientes: Cliente[];
  cache: Cliente[] | null;
  loading: boolean;
  error: string | null;
  carregarClientes: () => Promise<void>;
  adicionarCliente: (cliente: Omit<Cliente, 'id'>) => Promise<void>;
  editarCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  excluirCliente: (id: string) => Promise<void>;
  buscarClientes: (filtros: { termo: string; status: string }) => Cliente[];
  getClientePorId: (id: string) => Cliente | undefined;
  clearCache: () => void;
}

export const useClienteStore = create<ClienteStore>((set, get) => ({
  clientes: [],
  cache: null,
  loading: false,
  error: null,

  carregarClientes: async () => {
    try {
      set({ loading: true, error: null });

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
        statusCliente: cliente.status_cliente as any || 'Ativo',
        metaGiroSemanal: cliente.meta_giro_semanal || 0,
        categoriaEstabelecimentoId: cliente.categoria_estabelecimento_id,
        janelasEntrega: cliente.janelas_entrega || [],
        instrucoesEntrega: cliente.instrucoes_entrega || '',
        tipoLogistica: cliente.tipo_logistica as any || 'Própria',
        contabilizarGiroMedio: cliente.contabilizar_giro_medio ?? true,
        emiteNotaFiscal: cliente.emite_nota_fiscal ?? true,
        tipoCobranca: cliente.tipo_cobranca as any || 'À vista',
        formaPagamento: cliente.forma_pagamento as any || 'Boleto',
        observacoes: cliente.observacoes || '',
        categoriasHabilitadas: cliente.categorias_habilitadas || [],
        ativo: cliente.ativo ?? true,
        giroMedioSemanal: cliente.giro_medio_semanal || 0,
        ultimaDataReposicaoEfetiva: cliente.ultima_data_reposicao_efetiva ? new Date(cliente.ultima_data_reposicao_efetiva) : undefined,
        statusAgendamento: cliente.status_agendamento || 'Não Agendado',
        proximaDataReposicao: cliente.proxima_data_reposicao ? new Date(cliente.proxima_data_reposicao) : undefined,
        dataCadastro: new Date(cliente.created_at),
        categoriaId: 1,
        subcategoriaId: 1
      }));

      set({ clientes: clientesFormatados, cache: clientesFormatados, loading: false });
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
        .insert([
          {
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
            ultima_data_reposicao_efetiva: clienteData.ultimaDataReposicaoEfetiva?.toISOString(),
            status_agendamento: clienteData.statusAgendamento,
            proxima_data_reposicao: clienteData.proximaDataReposicao?.toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

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
        statusCliente: data.status_cliente as any || 'Ativo',
        metaGiroSemanal: data.meta_giro_semanal || 0,
        categoriaEstabelecimentoId: data.categoria_estabelecimento_id,
        janelasEntrega: data.janelas_entrega || [],
        instrucoesEntrega: data.instrucoes_entrega || '',
        tipoLogistica: data.tipo_logistica as any || 'Própria',
        contabilizarGiroMedio: data.contabilizar_giro_medio ?? true,
        emiteNotaFiscal: data.emite_nota_fiscal ?? true,
        tipoCobranca: data.tipo_cobranca as any || 'À vista',
        formaPagamento: data.forma_pagamento as any || 'Boleto',
        observacoes: data.observacoes || '',
        categoriasHabilitadas: data.categorias_habilitadas || [],
        ativo: data.ativo ?? true,
        giroMedioSemanal: data.giro_medio_semanal || 0,
        ultimaDataReposicaoEfetiva: data.ultima_data_reposicao_efetiva ? new Date(data.ultima_data_reposicao_efetiva) : undefined,
        statusAgendamento: data.status_agendamento || 'Não Agendado',
        proximaDataReposicao: data.proxima_data_reposicao ? new Date(data.proxima_data_reposicao) : undefined,
        dataCadastro: new Date(data.created_at),
        categoriaId: 1,
        subcategoriaId: 1
      };

      set(state => ({
        clientes: [...state.clientes, novoCliente],
        cache: null,
        loading: false
      }));

      toast.success('Cliente adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar cliente:', error);
      set({ error: error.message, loading: false });
      toast.error('Erro ao adicionar cliente');
      throw error;
    }
  },

  editarCliente: async (id: string, clienteData: Partial<Cliente>) => {
    try {
      set({ loading: true, error: null });

      const updateData: any = {};
      
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
      if (clienteData.giroMedioSemanal !== undefined) updateData.giro_medio_semanal = clienteData.giroMedioSemanal;
      if (clienteData.ultimaDataReposicaoEfetiva !== undefined) updateData.ultima_data_reposicao_efetiva = clienteData.ultimaDataReposicaoEfetiva?.toISOString();
      if (clienteData.statusAgendamento !== undefined) updateData.status_agendamento = clienteData.statusAgendamento;
      if (clienteData.proximaDataReposicao !== undefined) updateData.proxima_data_reposicao = clienteData.proximaDataReposicao?.toISOString();

      const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

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
        statusCliente: data.status_cliente as any || 'Ativo',
        metaGiroSemanal: data.meta_giro_semanal || 0,
        categoriaEstabelecimentoId: data.categoria_estabelecimento_id,
        janelasEntrega: data.janelas_entrega || [],
        instrucoesEntrega: data.instrucoes_entrega || '',
        tipoLogistica: data.tipo_logistica as any || 'Própria',
        contabilizarGiroMedio: data.contabilizar_giro_medio ?? true,
        emiteNotaFiscal: data.emite_nota_fiscal ?? true,
        tipoCobranca: data.tipo_cobranca as any || 'À vista',
        formaPagamento: data.forma_pagamento as any || 'Boleto',
        observacoes: data.observacoes || '',
        categoriasHabilitadas: data.categorias_habilitadas || [],
        ativo: data.ativo ?? true,
        giroMedioSemanal: data.giro_medio_semanal || 0,
        ultimaDataReposicaoEfetiva: data.ultima_data_reposicao_efetiva ? new Date(data.ultima_data_reposicao_efetiva) : undefined,
        statusAgendamento: data.status_agendamento || 'Não Agendado',
        proximaDataReposicao: data.proxima_data_reposicao ? new Date(data.proxima_data_reposicao) : undefined,
        dataCadastro: new Date(data.created_at),
        categoriaId: 1,
        subcategoriaId: 1
      };

      set(state => ({
        clientes: state.clientes.map(cliente =>
          cliente.id === id ? clienteAtualizado : cliente
        ),
        cache: null,
        loading: false
      }));

      toast.success('Cliente atualizado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao editar cliente:', error);
      set({ error: error.message, loading: false });
      toast.error('Erro ao editar cliente');
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

      set(state => ({
        clientes: state.clientes.filter(cliente => cliente.id !== id),
        cache: null,
        loading: false
      }));

      toast.success('Cliente excluído com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao excluir cliente:', error);
      set({ error: error.message, loading: false });
      toast.error('Erro ao excluir cliente');
      throw error;
    }
  },

  buscarClientes: (filtros: { termo: string; status: string }) => {
    const { clientes } = get();
    
    return clientes.filter(cliente => {
      const matchTermo = !filtros.termo || 
        cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        cliente.cnpjCpf.includes(filtros.termo) ||
        cliente.contatoTelefone.includes(filtros.termo);
      
      const matchStatus = filtros.status === 'Todos' || cliente.statusCliente === filtros.status;
      
      return matchTermo && matchStatus;
    });
  },

  getClientePorId: (id: string) => {
    return get().clientes.find(cliente => cliente.id === id);
  },

  clearCache: () => {
    set({ cache: null });
  },
}));
