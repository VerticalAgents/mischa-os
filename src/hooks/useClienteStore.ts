import { create } from 'zustand';
import { Cliente, StatusCliente } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calcularGiroSemanalPadrao, calcularMetaGiroSemanal } from '@/utils/giroCalculations';
import { useErrorDetail } from '@/hooks/useErrorDetail';
import { toast } from 'sonner';

interface ClienteState {
  clientes: Cliente[];
  loading: boolean;
  clienteAtual: Cliente | null;
  filtros: {
    termo: string;
    status: StatusCliente | 'Todos' | '';
    representanteId: number | 'Todos' | null;
    rotaEntregaId: number | 'Todas' | null;
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
  setFiltroRepresentante: (representanteId: number | 'Todos' | null) => void;
  setFiltroRotaEntrega: (rotaEntregaId: number | 'Todas' | null) => void;
}

import { sanitizeClienteData, createSafeClienteDefaults } from '@/utils/clienteDataSanitizer';

// FUNÇÃO ENHANCED - Debug em tempo real + Proteção de último recurso
export function transformClienteToDbRow(c: any) {
  console.log('🔧 transformClienteToDbRow recebido:', c);
  console.log('🔍 RAW INPUT PAYLOAD:', JSON.stringify(c, null, 2));
  
  const sanitizationResult = sanitizeClienteData(c);
  
  console.log('📊 RESULTADO COMPLETO DA SANITIZAÇÃO:', {
    isValid: sanitizationResult.isValid,
    corrections: sanitizationResult.corrections.length,
    errors: sanitizationResult.errors.length,
    detectedTokens: sanitizationResult.detectedTokens?.length || 0
  });

  // Debug detalhado dos tokens problemáticos detectados
  if (sanitizationResult.detectedTokens && sanitizationResult.detectedTokens.length > 0) {
    console.error('🚨 ALERTA: TOKENS PROBLEMÁTICOS DETECTADOS E REMOVIDOS:');
    sanitizationResult.detectedTokens.forEach(({ field, tokens }) => {
      console.error(`   - Campo "${field}": [${tokens.join(', ')}]`);
    });
  }

  // PROTEÇÃO DE ÚLTIMO RECURSO - Se dados ainda inválidos, usar defaults seguros
  if (!sanitizationResult.isValid) {
    console.error('🛡️ ATIVANDO PROTEÇÃO DE ÚLTIMO RECURSO');
    console.error('🚨 Erros detectados:', sanitizationResult.errors);
    
    // Tentar criar payload com defaults seguros mantendo dados essenciais
    const safeDefaults = createSafeClienteDefaults();
    const lastResortData = {
      ...sanitizationResult.data,
      ...safeDefaults,
      // Manter apenas campos essenciais do input original se válidos
      nome: c.nome || '',
      endereco_entrega: c.enderecoEntrega || c.endereco_entrega || '',
      link_google_maps: c.linkGoogleMaps || c.link_google_maps || ''
    };
    
    console.warn('🔧 PAYLOAD DE ÚLTIMO RECURSO CRIADO:', lastResortData);
    
    // Re-validar com dados seguros
    const finalSanitization = sanitizeClienteData(lastResortData);
    if (finalSanitization.isValid) {
      console.log('✅ ÚLTIMO RECURSO FUNCIONOU - Dados agora válidos');
      return finalSanitization.data;
    } else {
      console.error('❌ ÚLTIMO RECURSO FALHOU - Erro crítico');
      throw new Error(`Erro crítico: Não foi possível criar dados válidos. Erros: ${finalSanitization.errors.join(', ')}`);
    }
  }

  if (sanitizationResult.corrections.length > 0) {
    console.warn('🔧 Correções automáticas aplicadas:', sanitizationResult.corrections);
  }

  // VALIDAÇÃO FINAL DO PAYLOAD antes do envio
  console.log('🔍 VALIDAÇÃO FINAL PRÉ-ENVIO:');
  console.log('✅ Dados sanitizados finais para Supabase:', JSON.stringify(sanitizationResult.data, null, 2));
  
  // Verificação adicional de segurança
  const finalPayload = sanitizationResult.data;
  if (!finalPayload.nome) {
    throw new Error('Nome é obrigatório e não pode estar vazio');
  }
  
  return finalPayload;
}

const transformDbRowToCliente = (row: any): Cliente => {
  const safeParseJsonb = (value: any) => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Mapeamentos reversos: Canônico → UI
  const canonicalToUiStatus = {
    'ATIVO': 'Ativo',
    'INATIVO': 'Inativo', 
    'EM_ANALISE': 'Em análise',
    'A_ATIVAR': 'A ativar',
    'STANDBY': 'Standby'
  };

  const canonicalToUiLogistica = {
    'PROPRIA': 'Própria',
    'TERCEIRIZADA': 'Terceirizada'
  };

  const canonicalToUiCobranca = {
    'A_VISTA': 'À vista',
    'PARCELADO': 'Parcelado',
    'A_PRAZO': 'A prazo',
    'CONSIGNADO': 'Consignado'
  };

  const canonicalToUiPagamento = {
    'BOLETO': 'Boleto',
    'PIX': 'PIX',
    'DINHEIRO': 'Dinheiro',
    'CARTAO_CREDITO': 'Cartão de crédito',
    'CARTAO_DEBITO': 'Cartão de débito'
  };

  return {
    id: row.id,
    nome: row.nome || '',
    tipoPessoa: row.tipo_pessoa || 'PJ',
    cnpjCpf: row.cnpj_cpf || '',
    inscricaoEstadual: row.inscricao_estadual || '',
    enderecoEntrega: row.endereco_entrega || '',
    linkGoogleMaps: row.link_google_maps || '',
    contatoNome: row.contato_nome || '',
    contatoTelefone: row.contato_telefone || '',
    contatoEmail: row.contato_email || '',
    representanteId: row.representante_id || null,
    rotaEntregaId: row.rota_entrega_id || null,
    categoriaEstabelecimentoId: row.categoria_estabelecimento_id || null,
    quantidadePadrao: row.quantidade_padrao || 0,
    periodicidadePadrao: row.periodicidade_padrao || 7,
    metaGiroSemanal: row.meta_giro_semanal || 0,
    giroMedioSemanal: row.giro_medio_semanal || 0,
    janelasEntrega: safeParseJsonb(row.janelas_entrega),
    categoriasHabilitadas: safeParseJsonb(row.categorias_habilitadas),
    statusCliente: canonicalToUiStatus[row.status_cliente] || row.status_cliente || 'Ativo',
    ultimaDataReposicaoEfetiva: row.ultima_data_reposicao_efetiva ? new Date(row.ultima_data_reposicao_efetiva) : null,
    proximaDataReposicao: row.proxima_data_reposicao ? new Date(row.proxima_data_reposicao) : null,
    ativo: row.ativo !== false,
    contabilizarGiroMedio: row.contabilizar_giro_medio !== false,
    emiteNotaFiscal: row.emite_nota_fiscal !== false,
    instrucoesEntrega: row.instrucoes_entrega || '',
    observacoes: row.observacoes || '',
    tipoLogistica: canonicalToUiLogistica[row.tipo_logistica] || row.tipo_logistica || 'Própria',
    tipoCobranca: canonicalToUiCobranca[row.tipo_cobranca] || row.tipo_cobranca || 'À vista',
    formaPagamento: canonicalToUiPagamento[row.forma_pagamento] || row.forma_pagamento || 'Boleto',
    prazoPagamentoDias: row.prazo_pagamento_dias || 7,
    dataCadastro: row.created_at ? new Date(row.created_at) : new Date(),
    statusAgendamento: row.status_agendamento,
    categoriaId: row.categoria_id || 1,
    subcategoriaId: row.subcategoria_id || 1,
    gestaoClickClienteId: row.gestaoclick_cliente_id || null,
    desabilitarReagendamento: row.desabilitar_reagendamento === true,
  };
};

export const useClienteStore = create<ClienteState>((set, get) => ({
  clientes: [],
  loading: false,
  clienteAtual: null,
  filtros: {
    termo: '',
    status: '',
    representanteId: null,
    rotaEntregaId: null,
  },
  adicionarCliente: async (cliente) => {
    set({ loading: true });
    try {
      console.log('🚀 Iniciando adição de cliente:', cliente);
      
      const dbData = transformClienteToDbRow(cliente);
      console.log('✅ Dados sanitizados para inserção:', dbData);

      const { data, error } = await supabase
        .from('clientes')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      let novoCliente = transformDbRowToCliente(data);
      console.log('✅ Cliente criado com sucesso:', novoCliente.id);

      // NOVO: Tentar sincronizar com GestaoClick automaticamente
      try {
        // Verificar se GestaoClick está configurado
        const { data: configData } = await supabase
          .from('integracoes_config')
          .select('config')
          .eq('integracao', 'gestaoclick')
          .maybeSingle();

        const gcConfig = configData?.config as { access_token?: string } | null;
        if (gcConfig?.access_token) {
          console.log('🔄 GestaoClick configurado - iniciando sincronização...');
          
          const { data: gcResult, error: gcError } = await supabase.functions.invoke('gestaoclick-proxy', {
            body: {
              action: 'criar_cliente_gc',
              nome: cliente.nome,
              tipo_pessoa: cliente.tipoPessoa || 'PJ',
              cnpj_cpf: cliente.cnpjCpf,
              inscricao_estadual: cliente.tipoPessoa === 'PJ' ? cliente.inscricaoEstadual : undefined,
              endereco: cliente.enderecoEntrega,
              contato_nome: cliente.contatoNome,
              contato_telefone: cliente.contatoTelefone,
              contato_email: cliente.contatoEmail,
              observacoes: cliente.observacoes
            }
          });

          if (gcError) {
            console.warn('⚠️ Erro ao chamar edge function do GestaoClick:', gcError);
            toast.warning('Cliente criado, mas não foi possível sincronizar com GestaoClick');
          } else if (gcResult?.success && gcResult?.gestaoclick_cliente_id) {
            // Atualizar cliente local com ID do GestaoClick
            const gcClienteId = gcResult.gestaoclick_cliente_id;
            console.log('✅ Cliente sincronizado com GestaoClick, ID:', gcClienteId);

            await supabase
              .from('clientes')
              .update({ gestaoclick_cliente_id: gcClienteId })
              .eq('id', novoCliente.id);

            novoCliente.gestaoClickClienteId = gcClienteId;
            
            toast.success(`Cliente sincronizado com GestaoClick (ID: ${gcClienteId})`);
          } else if (gcResult?.error) {
            console.warn('⚠️ GestaoClick retornou erro:', gcResult.error);
            toast.warning(`Cliente criado localmente. GestaoClick: ${gcResult.error}`);
          }
        } else {
          console.log('ℹ️ GestaoClick não configurado - cliente criado apenas localmente');
        }
      } catch (gcSyncError: any) {
        console.warn('⚠️ Falha na sincronização com GestaoClick (não bloqueante):', gcSyncError);
        toast.warning('Cliente criado, mas houve erro na sincronização com GestaoClick');
      }

      set((state) => ({
        clientes: [...state.clientes, novoCliente],
        loading: false,
      }));

      return novoCliente;
    } catch (error: any) {
      console.error("❌ Erro ao adicionar cliente:", {
        error: error.message,
        code: error.code,
        details: error.details
      });
      
      set({ loading: false });
      throw error;
    }
  },
  atualizarCliente: async (id, cliente) => {
    set({ loading: true });
    try {
      console.log('🔄 INICIANDO ATUALIZAÇÃO DE CLIENTE:', id);
      console.log('📥 DADOS RECEBIDOS:', JSON.stringify(cliente, null, 2));
      
      // DEBUG: Capturar payload exato PRÉ-SANITIZAÇÃO
      console.log('🔍 PAYLOAD PRÉ-SANITIZAÇÃO:', {
        id,
        clienteInput: cliente,
        timestamp: new Date().toISOString()
      });
      
      const dbData = transformClienteToDbRow(cliente);
      console.log('📤 PAYLOAD FINAL PARA SUPABASE:', JSON.stringify(dbData, null, 2));
      
      // VALIDAÇÃO FINAL - última verificação antes do envio
      const forbiddenTokens = ['customer_deleted', 'client_deleted', 'user_deleted'];
      const payloadString = JSON.stringify(dbData);
      const foundTokens = forbiddenTokens.filter(token => payloadString.includes(token));
      
      if (foundTokens.length > 0) {
        console.error('🚨 TOKENS PROIBIDOS DETECTADOS NO PAYLOAD FINAL:', foundTokens);
        throw new Error(`Payload ainda contém tokens problemáticos: ${foundTokens.join(', ')}`);
      }
      
      console.log('✅ Payload passou na validação final - enviando para Supabase...');
      
      const { data, error } = await supabase
        .from('clientes')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ ERRO DO SUPABASE NA ATUALIZAÇÃO:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          payloadUsed: dbData
        });
        
        // Criar erro expandível com informações detalhadas
        const enhancedError = {
          ...error,
          context: 'Atualização de Cliente',
          clienteId: id,
          payloadUsed: dbData,
          originalInput: cliente
        };
        
        const { showErrorDetail } = useErrorDetail.getState();
        showErrorDetail(enhancedError, 'Atualização de Cliente - Erro no Banco');
        
        toast.error('Erro ao atualizar cliente - Clique para ver diagnóstico', {
          description: 'Análise técnica detalhada disponível',
          action: {
            label: 'Diagnóstico',
            onClick: () => showErrorDetail(enhancedError, 'Atualização de Cliente - Erro no Banco')
          }
        });
        throw error;
      }

      const clienteAtualizado = transformDbRowToCliente(data);
      console.log('✅ CLIENTE ATUALIZADO COM SUCESSO:', clienteAtualizado.id);

      // Sincronizar: buscar dados do GestaoClick e atualizar Lovable (GC é fonte da verdade)
      if (clienteAtualizado.gestaoClickClienteId) {
        try {
          console.log('🔄 Buscando dados atualizados do GestaoClick...');
          const { data: gcResult, error: gcError } = await supabase.functions.invoke('gestaoclick-proxy', {
            body: {
              action: 'buscar_cliente_gc',
              gestaoclick_cliente_id: clienteAtualizado.gestaoClickClienteId
            }
          });

          if (gcError) {
            console.warn('⚠️ Erro ao buscar dados do GestaoClick:', gcError);
          } else if (gcResult?.success && gcResult?.cliente) {
            const gcCliente = gcResult.cliente;
            console.log('✅ Dados recebidos do GestaoClick:', gcCliente);

            // Determinar cnpj_cpf baseado no tipo_pessoa do GC
            const cnpjCpfGc = gcCliente.tipo_pessoa === 'PJ' ? gcCliente.cnpj : gcCliente.cpf;

            // Atualizar campos no Supabase com dados do GC
            const camposGc: any = {
              nome: gcCliente.nome || clienteAtualizado.nome,
              tipo_pessoa: gcCliente.tipo_pessoa || 'PJ',
              inscricao_estadual: gcCliente.inscricao_estadual || ''
            };
            if (cnpjCpfGc) {
              camposGc.cnpj_cpf = cnpjCpfGc;
            }

            const { error: updateError } = await supabase
              .from('clientes')
              .update(camposGc)
              .eq('id', id);

            if (updateError) {
              console.warn('⚠️ Erro ao atualizar Lovable com dados do GC:', updateError);
            } else {
              console.log('✅ Lovable atualizado com dados do GestaoClick');
              // Atualizar estado local
              clienteAtualizado.nome = camposGc.nome;
              clienteAtualizado.tipoPessoa = camposGc.tipo_pessoa;
              clienteAtualizado.inscricaoEstadual = camposGc.inscricao_estadual;
              if (cnpjCpfGc) clienteAtualizado.cnpjCpf = cnpjCpfGc;
            }
          } else if (gcResult?.error) {
            console.warn('⚠️ GestaoClick retornou erro:', gcResult.error);
          }
        } catch (gcSyncError: any) {
          console.warn('⚠️ Falha na sincronização com GestaoClick (não bloqueante):', gcSyncError);
        }
      }

      set((state) => ({
        clientes: state.clientes.map((c) => (c.id === id ? clienteAtualizado : c)),
        clienteAtual: state.clienteAtual?.id === id ? clienteAtualizado : state.clienteAtual,
        loading: false,
      }));
    } catch (error: any) {
      console.error("❌ ERRO CRÍTICO NO CATCH:", {
        clienteId: id,
        error: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      
      // Garantir que o erro expandível seja mostrado mesmo em catch
      const enhancedError = {
        ...error,
        context: 'Atualização de Cliente - Erro Crítico',
        clienteId: id,
        originalInput: cliente,
        timestamp: new Date().toISOString()
      };
      
      const { showErrorDetail } = useErrorDetail.getState();
      showErrorDetail(enhancedError, 'Atualização de Cliente - Erro Crítico');
      
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
    return get().excluirCliente(id);
  },
  carregarClientes: async () => {
    set({ loading: true });
    try {
      // Auto-atualizar status antes de buscar: Standby (60+ dias) e A ativar (sem entregas)
      try {
        await supabase.rpc('auto_standby_clientes_inativos_60dias');
      } catch (rpcError) {
        console.warn('Erro ao executar auto_standby_clientes_inativos_60dias:', rpcError);
      }

      const { data, error } = await supabase
        .from('clientes')
        .select('*');

      if (error) {
        throw error;
      }

      const clientesTransformados = data.map(transformDbRowToCliente);

      set((state) => {
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

      const novoClienteData: Omit<Cliente, 'id' | 'dataCadastro'> = {
        nome: `${clienteOriginal.nome} (Cópia)`,
        cnpjCpf: '',
        enderecoEntrega: '',
        linkGoogleMaps: '',
        contatoNome: '',
        contatoTelefone: '',
        contatoEmail: '',
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
      
      return novoCliente;
    } catch (error) {
      console.error('Erro ao duplicar cliente:', error);
      throw error;
    }
  },
  selecionarCliente: (id: string | null) => {
    set((state) => ({
      clienteAtual: id ? state.clientes.find((c) => c.id === id) || null : null,
    }));
  },
  getClientePorId: (id: string) => {
    return get().clientes.find((cliente) => cliente.id === id);
  },
  getClientesFiltrados: () => {
    const { clientes, filtros } = get();
    return clientes.filter((cliente) => {
      const matchesTermo = !filtros.termo || 
        cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        (cliente.cnpjCpf || '').replace(/[.\-\/]/g, '').toLowerCase().includes(filtros.termo.replace(/[.\-\/]/g, '').toLowerCase()) ||
        cliente.enderecoEntrega.toLowerCase().includes(filtros.termo.toLowerCase());

      const matchesStatus = !filtros.status || 
        filtros.status === 'Todos' || 
        cliente.statusCliente === filtros.status;

      const matchesRepresentante = !filtros.representanteId || 
        filtros.representanteId === 'Todos' || 
        cliente.representanteId === filtros.representanteId;

      const matchesRotaEntrega = !filtros.rotaEntregaId || 
        filtros.rotaEntregaId === 'Todas' || 
        cliente.rotaEntregaId === filtros.rotaEntregaId;

      return matchesTermo && matchesStatus && matchesRepresentante && matchesRotaEntrega;
    });
  },
  setFiltroTermo: (termo: string) => {
    set((state) => ({
      filtros: { ...state.filtros, termo },
    }));
  },
  setFiltroStatus: (status: StatusCliente | 'Todos' | '') => {
    set((state) => ({
      filtros: { ...state.filtros, status },
    }));
  },
  setFiltroRepresentante: (representanteId: number | 'Todos' | null) => {
    set((state) => ({
      filtros: { ...state.filtros, representanteId },
    }));
  },
  setFiltroRotaEntrega: (rotaEntregaId: number | 'Todas' | null) => {
    set((state) => ({
      filtros: { ...state.filtros, rotaEntregaId },
    }));
  },
}));