import { create } from 'zustand';
import { Cliente, StatusCliente } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calcularGiroSemanalPadrao, calcularMetaGiroSemanal } from '@/utils/giroCalculations';
import { 
  validateJanelasEntrega, 
  validateCategoriasHabilitadas, 
  safeStringifyJSON, 
  validateClienteData 
} from '@/utils/jsonValidation';

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
  try {
    // Validate and parse JSON fields with robust error handling
    const janelasResult = validateJanelasEntrega(row.janelas_entrega);
    const categoriasResult = validateCategoriasHabilitadas(row.categorias_habilitadas);

    if (!janelasResult.isValid) {
      console.warn(`Cliente ${row.id}: janelas_entrega validation failed:`, janelasResult.error);
    }
    
    if (!categoriasResult.isValid) {
      console.warn(`Cliente ${row.id}: categorias_habilitadas validation failed:`, categoriasResult.error);
    }

    return {
      id: row.id,
      nome: row.nome || '',
      cnpjCpf: row.cnpj_cpf || '',
      enderecoEntrega: row.endereco_entrega || '',
      linkGoogleMaps: row.link_google_maps || '',
      contatoNome: row.contato_nome || '',
      contatoTelefone: row.contato_telefone || '',
      contatoEmail: row.contato_email || '',
      quantidadePadrao: row.quantidade_padrao || 0,
      periodicidadePadrao: row.periodicidade_padrao || 7,
      statusCliente: row.status_cliente || 'Ativo',
      dataCadastro: new Date(row.created_at),
      metaGiroSemanal: row.meta_giro_semanal || 0,
      ultimaDataReposicaoEfetiva: row.ultima_data_reposicao_efetiva ? new Date(row.ultima_data_reposicao_efetiva) : undefined,
      statusAgendamento: row.status_agendamento,
      proximaDataReposicao: row.proxima_data_reposicao ? new Date(row.proxima_data_reposicao) : undefined,
      ativo: row.ativo ?? true,
      giroMedioSemanal: row.giro_medio_semanal || 0,
      janelasEntrega: janelasResult.data,
      representanteId: row.representante_id,
      rotaEntregaId: row.rota_entrega_id,
      categoriaEstabelecimentoId: row.categoria_estabelecimento_id,
      instrucoesEntrega: row.instrucoes_entrega || '',
      contabilizarGiroMedio: row.contabilizar_giro_medio ?? true,
      tipoLogistica: row.tipo_logistica || 'Própria',
      emiteNotaFiscal: row.emite_nota_fiscal ?? true,
      tipoCobranca: row.tipo_cobranca || 'À vista',
      formaPagamento: row.forma_pagamento || 'Boleto',
      observacoes: row.observacoes || '',
      categoriaId: row.categoria_id || 1,
      subcategoriaId: row.subcategoria_id || 1,
      categoriasHabilitadas: categoriasResult.data
    };
  } catch (error) {
    console.error(`Error transforming database row for cliente ${row.id}:`, error);
    // Return a safe fallback version with empty arrays for JSON fields
    return {
      id: row.id,
      nome: row.nome || '',
      cnpjCpf: row.cnpj_cpf || '',
      enderecoEntrega: row.endereco_entrega || '',
      linkGoogleMaps: row.link_google_maps || '',
      contatoNome: row.contato_nome || '',
      contatoTelefone: row.contato_telefone || '',
      contatoEmail: row.contato_email || '',
      quantidadePadrao: row.quantidade_padrao || 0,
      periodicidadePadrao: row.periodicidade_padrao || 7,
      statusCliente: row.status_cliente || 'Ativo',
      dataCadastro: new Date(row.created_at),
      metaGiroSemanal: row.meta_giro_semanal || 0,
      ultimaDataReposicaoEfetiva: row.ultima_data_reposicao_efetiva ? new Date(row.ultima_data_reposicao_efetiva) : undefined,
      statusAgendamento: row.status_agendamento,
      proximaDataReposicao: row.proxima_data_reposicao ? new Date(row.proxima_data_reposicao) : undefined,
      ativo: row.ativo ?? true,
      giroMedioSemanal: row.giro_medio_semanal || 0,
      janelasEntrega: [], // Safe fallback
      representanteId: row.representante_id,
      rotaEntregaId: row.rota_entrega_id,
      categoriaEstabelecimentoId: row.categoria_estabelecimento_id,
      instrucoesEntrega: row.instrucoes_entrega || '',
      contabilizarGiroMedio: row.contabilizar_giro_medio ?? true,
      tipoLogistica: row.tipo_logistica || 'Própria',
      emiteNotaFiscal: row.emite_nota_fiscal ?? true,
      tipoCobranca: row.tipo_cobranca || 'À vista',
      formaPagamento: row.forma_pagamento || 'Boleto',
      observacoes: row.observacoes || '',
      categoriaId: row.categoria_id || 1,
      subcategoriaId: row.subcategoria_id || 1,
      categoriasHabilitadas: [] // Safe fallback
    };
  }
};

// Helper function to transform Cliente to database row format (sanitized)
const transformClienteToDbRow = (cliente: Partial<Cliente>) => {
  try {
    // Validate all cliente data before transformation
    const validation = validateClienteData({
      janelas_entrega: cliente.janelasEntrega,
      categorias_habilitadas: cliente.categoriasHabilitadas
    });

    if (!validation.isValid) {
      console.warn('Cliente data validation warnings:', validation.errors);
    }

    // Calcular giroMedioSemanal e metaGiroSemanal automaticamente se não foram fornecidos
    const quantidadePadrao = cliente.quantidadePadrao || 0;
    const periodicidadePadrao = cliente.periodicidadePadrao || 7;
    
    // Calcular giro médio semanal se não foi fornecido ou é zero
    let giroMedioSemanalCalculado = cliente.giroMedioSemanal;
    if (!giroMedioSemanalCalculado || giroMedioSemanalCalculado === 0) {
      giroMedioSemanalCalculado = calcularGiroSemanalPadrao(quantidadePadrao, periodicidadePadrao);
    }
    
    // Calcular meta de giro semanal se não foi fornecida ou é zero
    let metaGiroSemanalCalculada = cliente.metaGiroSemanal;
    if (!metaGiroSemanalCalculada || metaGiroSemanalCalculada === 0) {
      metaGiroSemanalCalculada = calcularMetaGiroSemanal(quantidadePadrao, periodicidadePadrao);
    }

    // Safely stringify JSON fields
    const janelasEntregaString = safeStringifyJSON(validation.sanitizedData.janelas_entrega);
    const categoriasHabilitadasString = safeStringifyJSON(validation.sanitizedData.categorias_habilitadas);

    // Lista de campos válidos na tabela clientes do Supabase
    const validFields = {
      nome: cliente.nome,
      cnpj_cpf: cliente.cnpjCpf,
      endereco_entrega: cliente.enderecoEntrega,
      link_google_maps: cliente.linkGoogleMaps,
      contato_nome: cliente.contatoNome,
      contato_telefone: cliente.contatoTelefone,
      contato_email: cliente.contatoEmail,
      quantidade_padrao: cliente.quantidadePadrao,
      periodicidade_padrao: cliente.periodicidadePadrao,
      status_cliente: cliente.statusCliente,
      meta_giro_semanal: metaGiroSemanalCalculada,
      ultima_data_reposicao_efetiva: cliente.ultimaDataReposicaoEfetiva?.toISOString(),
      status_agendamento: cliente.statusAgendamento,
      proxima_data_reposicao: cliente.proximaDataReposicao?.toISOString(),
      ativo: cliente.ativo,
      giro_medio_semanal: giroMedioSemanalCalculado,
      janelas_entrega: janelasEntregaString,
      representante_id: cliente.representanteId,
      rota_entrega_id: cliente.rotaEntregaId,
      categoria_estabelecimento_id: cliente.categoriaEstabelecimentoId,
      instrucoes_entrega: cliente.instrucoesEntrega,
      contabilizar_giro_medio: cliente.contabilizarGiroMedio,
      tipo_logistica: cliente.tipoLogistica,
      emite_nota_fiscal: cliente.emiteNotaFiscal,
      tipo_cobranca: cliente.tipoCobranca,
      forma_pagamento: cliente.formaPagamento,
      observacoes: cliente.observacoes,
      categorias_habilitadas: categoriasHabilitadasString,
      updated_at: new Date().toISOString()
    };

    // Remove campos undefined/null para evitar problemas no Supabase
    const sanitizedFields: any = {};
    Object.entries(validFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sanitizedFields[key] = value;
      }
    });

    console.log('Campos sanitizados para banco:', {
      janelas_entrega: sanitizedFields.janelas_entrega,
      categorias_habilitadas: sanitizedFields.categorias_habilitadas
    });

    return sanitizedFields;
  } catch (error) {
    console.error('Error in transformClienteToDbRow:', error);
    throw new Error(`Falha na preparação dos dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
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
      const dbData = transformClienteToDbRow(cliente);
      
      console.log('useClienteStore: Payload sanitizado para inserção (com cálculos automáticos):', dbData);

      const { data, error } = await supabase
        .from('clientes')
        .insert([
          {
            ...dbData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('useClienteStore: Erro do Supabase ao inserir cliente:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        });
        throw error;
      }

      console.log('useClienteStore: Cliente inserido com sucesso:', data);

      const novoCliente = transformDbRowToCliente(data);

      set((state) => ({
        clientes: [...state.clientes, novoCliente],
        loading: false,
      }));

      return novoCliente;
    } catch (error: any) {
      console.error("useClienteStore: Erro ao adicionar cliente:", error);
      set({ loading: false });
      throw error;
    }
  },
  atualizarCliente: async (id, cliente) => {
    set({ loading: true });
    try {
      console.log('useClienteStore: Iniciando atualização do cliente:', id);
      console.log('useClienteStore: Dados originais do cliente:', cliente);

      // Pre-validate data before transformation
      const preValidation = validateClienteData({
        janelas_entrega: cliente.janelasEntrega,
        categorias_habilitadas: cliente.categoriasHabilitadas
      });

      if (!preValidation.isValid) {
        console.warn('useClienteStore: Avisos de validação:', preValidation.errors);
      }

      const dbData = transformClienteToDbRow(cliente);
      
      console.log('useClienteStore: Payload sanitizado para atualização:', dbData);
      
      const { data, error } = await supabase
        .from('clientes')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('useClienteStore: Erro do Supabase ao atualizar cliente:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
          clienteId: id,
          payloadUsado: dbData
        });
        
        // Provide user-friendly error message
        if (error.code === '22P02') {
          throw new Error('Erro de formatação de dados. Os dados foram corrigidos automaticamente. Tente novamente.');
        }
        
        throw error;
      }

      console.log('useClienteStore: Cliente atualizado com sucesso:', data);

      const clienteAtualizado = transformDbRowToCliente(data);

      set((state) => ({
        clientes: state.clientes.map((c) => (c.id === id ? clienteAtualizado : c)),
        clienteAtual: state.clienteAtual?.id === id ? clienteAtualizado : state.clienteAtual,
        loading: false,
      }));
    } catch (error: any) {
      console.error("useClienteStore: Erro ao atualizar cliente:", error);
      set({ loading: false });
      
      // Enhanced error handling with recovery suggestion
      if (error.message?.includes('22P02') || error.message?.includes('invalid input syntax for type json')) {
        throw new Error('Erro nos dados do cliente. Verifique os campos de janelas de entrega e categorias habilitadas.');
      }
      
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
        clienteAtual: state.clienteAtual?.id === id ? null : state.clienteAtual,
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

      set((state) => {
        // Sync clienteAtual if it exists
        const clienteAtualAtualizado = state.clienteAtual 
          ? clientesTransformados.find(c => c.id === state.clienteAtual?.id) || state.clienteAtual
          : null;
          
        return {
          clientes: clientesTransformados,
          clienteAtual: clienteAtualAtualizado,
          loading: false
        };
      });
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
