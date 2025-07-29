import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente, StatusCliente } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { dataCache } from '@/utils/dataCache';

interface ClienteStore {
  clientes: Cliente[];
  clienteAtual: Cliente | null;
  loading: boolean;
  error: string | null;
  filtros: {
    termo: string;
    status: StatusCliente | 'Todos';
  };
  
  // Ações
  carregarClientes: () => Promise<void>;
  adicionarCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => Promise<Cliente>;
  atualizarCliente: (id: string, dadosCliente: Partial<Cliente>) => Promise<void>;
  removerCliente: (id: string) => Promise<void>;
  selecionarCliente: (id: string | null) => void;
  setFiltroTermo: (termo: string) => void;
  setFiltroStatus: (status: StatusCliente | 'Todos') => void;
  setMetaGiro: (idCliente: string, metaSemanal: number) => Promise<void>;
  clearError: () => void;
  
  // Getters
  getClientesFiltrados: () => Cliente[];
  getClientePorId: (id: string) => Cliente | undefined;
}

const CLIENTES_CACHE_KEY = 'clientes_data_v2';
const AGENDAMENTOS_CACHE_KEY = 'agendamentos_data_v2';
const REQUEST_TIMEOUT = 10000; // 10 segundos para clientes
const RETRY_ATTEMPTS = 2;
const CACHE_TTL = 5; // 5 minutos para clientes

// Helper para timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Helper para retry
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('All retry attempts failed');
};

// Helper para converter string de data do banco para Date local
const parseDateFromDatabase = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper para converter dados do Supabase para o tipo Cliente
function convertSupabaseToCliente(data: any, agendamento?: any): Cliente {
  return {
    id: data.id,
    nome: data.nome,
    cnpjCpf: data.cnpj_cpf,
    enderecoEntrega: data.endereco_entrega,
    contatoNome: data.contato_nome,
    contatoTelefone: data.contato_telefone,
    contatoEmail: data.contato_email,
    quantidadePadrao: data.quantidade_padrao || 0,
    periodicidadePadrao: data.periodicidade_padrao || 7,
    statusCliente: data.status_cliente || 'Ativo',
    dataCadastro: new Date(data.created_at),
    metaGiroSemanal: data.meta_giro_semanal || 0,
    ultimaDataReposicaoEfetiva: data.ultima_data_reposicao_efetiva ? new Date(data.ultima_data_reposicao_efetiva) : undefined,
    // Usar dados do agendamento se disponível, senão usar dados do cliente (fallback)
    statusAgendamento: agendamento?.status_agendamento || data.status_agendamento || 'Não Agendado',
    proximaDataReposicao: agendamento?.data_proxima_reposicao 
      ? parseDateFromDatabase(agendamento.data_proxima_reposicao) 
      : (data.proxima_data_reposicao ? new Date(data.proxima_data_reposicao) : undefined),
    ativo: data.ativo || true,
    giroMedioSemanal: data.giro_medio_semanal || calcularGiroSemanal(data.quantidade_padrao || 0, data.periodicidade_padrao || 7),
    // Garantir que os campos sejam carregados corretamente
    janelasEntrega: data.janelas_entrega || [],
    representanteId: data.representante_id,
    rotaEntregaId: data.rota_entrega_id,
    categoriaEstabelecimentoId: data.categoria_estabelecimento_id,
    instrucoesEntrega: data.instrucoes_entrega,
    contabilizarGiroMedio: data.contabilizar_giro_medio !== undefined ? data.contabilizar_giro_medio : true,
    tipoLogistica: data.tipo_logistica || 'Própria',
    emiteNotaFiscal: data.emite_nota_fiscal !== undefined ? data.emite_nota_fiscal : true,
    tipoCobranca: data.tipo_cobranca || 'À vista',
    formaPagamento: data.forma_pagamento || 'Boleto',
    observacoes: data.observacoes,
    categoriaId: 1, // Default value
    subcategoriaId: 1, // Default value
    categoriasHabilitadas: data.categorias_habilitadas || []
  };
}

// Helper para converter Cliente para dados do Supabase
function convertClienteToSupabase(cliente: Omit<Cliente, 'id' | 'dataCadastro'>) {
  const giroCalculado = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
  
  return {
    nome: cliente.nome,
    cnpj_cpf: cliente.cnpjCpf || null,
    endereco_entrega: cliente.enderecoEntrega || null,
    contato_nome: cliente.contatoNome || null,
    contato_telefone: cliente.contatoTelefone || null,
    contato_email: cliente.contatoEmail || null,
    quantidade_padrao: cliente.quantidadePadrao || 0,
    periodicidade_padrao: cliente.periodicidadePadrao || 7,
    status_cliente: cliente.statusCliente || 'Ativo',
    ativo: cliente.ativo !== undefined ? cliente.ativo : true,
    giro_medio_semanal: giroCalculado,
    meta_giro_semanal: Math.round(giroCalculado * 1.2),
    // Campos de entrega e logística
    janelas_entrega: cliente.janelasEntrega || null,
    representante_id: cliente.representanteId || null,
    rota_entrega_id: cliente.rotaEntregaId || null,
    categoria_estabelecimento_id: cliente.categoriaEstabelecimentoId || null,
    instrucoes_entrega: cliente.instrucoesEntrega || null,
    // Campos financeiros e fiscais
    contabilizar_giro_medio: cliente.contabilizarGiroMedio !== undefined ? cliente.contabilizarGiroMedio : true,
    tipo_logistica: cliente.tipoLogistica || 'Própria',
    emite_nota_fiscal: cliente.emiteNotaFiscal !== undefined ? cliente.emiteNotaFiscal : true,
    tipo_cobranca: cliente.tipoCobranca || 'À vista',
    forma_pagamento: cliente.formaPagamento || 'Boleto',
    observacoes: cliente.observacoes || null,
    // Categorias de produto habilitadas - salvar no JSONB para compatibilidade
    categorias_habilitadas: cliente.categoriasHabilitadas || []
  };
}

export const useClienteStore = create<ClienteStore>()(
  devtools(
    (set, get) => ({
      clientes: [],
      clienteAtual: null,
      loading: false,
      error: null,
      filtros: {
        termo: '',
        status: 'Todos'
      },
      
      clearError: () => set({ error: null }),
      
      carregarClientes: async () => {
        // Verificar se já está carregando para evitar duplicação
        if (get().loading) {
          console.log('⏳ Carregamento de clientes já em andamento...');
          return;
        }

        // Verificar cache primeiro
        const cachedClientes = dataCache.get<Cliente[]>(CLIENTES_CACHE_KEY);
        if (cachedClientes && cachedClientes.length > 0) {
          console.log('📦 Clientes carregados do cache:', cachedClientes.length);
          set({ clientes: cachedClientes, loading: false, error: null });
          return;
        }

        set({ loading: true, error: null });
        
        try {
          console.log('🔄 Iniciando carregamento otimizado de clientes...');
          
          // Funções para carregar dados com timeout e retry
          const carregarClientesData = async () => {
            const { data, error } = await supabase
              .from('clientes')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
          };

          const carregarAgendamentosData = async () => {
            const { data, error } = await supabase
              .from('agendamentos_clientes')
              .select('*');
            
            if (error) {
              console.warn('⚠️ Falha ao carregar agendamentos:', error);
              return [];
            }
            return data || [];
          };
          
          // Carregar clientes e agendamentos em paralelo com timeout
          const [clientesData, agendamentosData] = await Promise.all([
            retryWithBackoff(() => withTimeout(carregarClientesData(), REQUEST_TIMEOUT)),
            
            // Agendamentos são opcionais - se falhar, continua sem eles
            retryWithBackoff(() => withTimeout(carregarAgendamentosData(), REQUEST_TIMEOUT))
              .catch(error => {
                console.warn('⚠️ Agendamentos não puderam ser carregados:', error);
                return [];
              })
          ]);

          // Mapear agendamentos por cliente_id
          const agendamentosPorCliente = new Map();
          agendamentosData.forEach(agendamento => {
            agendamentosPorCliente.set(agendamento.cliente_id, agendamento);
          });

          // Converter clientes
          const clientesConvertidos = clientesData.map(cliente => {
            const agendamento = agendamentosPorCliente.get(cliente.id);
            return convertSupabaseToCliente(cliente, agendamento);
          });

          console.log(`✅ Clientes carregados com sucesso: ${clientesConvertidos.length} itens`);
          
          // Cachear os dados
          dataCache.set(CLIENTES_CACHE_KEY, clientesConvertidos, CACHE_TTL);
          
          set({ clientes: clientesConvertidos });
          
        } catch (error: any) {
          console.error('❌ Erro ao carregar clientes:', error);
          
          // Tentar usar cache como fallback mesmo que expirado
          const cachedClientes = dataCache.get<Cliente[]>(CLIENTES_CACHE_KEY);
          if (cachedClientes) {
            console.log('📦 Usando clientes do cache como fallback');
            set({ clientes: cachedClientes });
            
            toast({
              title: "Aviso",
              description: "Carregando dados do cache devido a problemas de conexão",
              variant: "default"
            });
          } else {
            const errorMessage = error.message || 'Erro inesperado ao carregar clientes';
            set({ error: errorMessage, clientes: [] });
            
            // Não mostrar toast para timeouts ou problemas de autenticação
            if (!error.message?.includes('timeout') && 
                !error.message?.includes('JWT expired') &&
                !error.message?.includes('Authentication failed')) {
              toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive"
              });
            }
          }
        } finally {
          set({ loading: false });
        }
      },
      
      adicionarCliente: async (cliente) => {
        set({ loading: true, error: null });
        try {
          console.log('➕ Adicionando cliente:', cliente.nome);
          
          const dadosSupabase = convertClienteToSupabase(cliente);
          
          const { data, error } = await supabase
            .from('clientes')
            .insert([dadosSupabase])
            .select()
            .single();

          if (error) throw error;

          // Salvar categorias se especificadas
          if (cliente.categoriasHabilitadas && cliente.categoriasHabilitadas.length > 0) {
            try {
              const categoriasRelacao = cliente.categoriasHabilitadas.map(categoriaId => ({
                cliente_id: data.id,
                categoria_id: categoriaId
              }));

              await supabase
                .from('clientes_categorias')
                .insert(categoriasRelacao);
            } catch (error) {
              console.warn('⚠️ Erro ao salvar categorias do cliente:', error);
            }
          }

          const clienteConvertido = convertSupabaseToCliente(data);
          
          // Invalidar cache e atualizar estado
          dataCache.clear(CLIENTES_CACHE_KEY);
          set(state => ({
            clientes: [clienteConvertido, ...state.clientes]
          }));

          toast({
            title: "Cliente cadastrado",
            description: `${cliente.nome} foi cadastrado com sucesso`
          });

          return clienteConvertido;
        } catch (error: any) {
          console.error('❌ Erro ao adicionar cliente:', error);
          const errorMessage = error.message || 'Erro inesperado ao cadastrar cliente';
          set({ error: errorMessage });
          
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive"
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      atualizarCliente: async (id, dadosCliente) => {
        set({ loading: true, error: null });
        try {
          const clienteExistente = get().clientes.find(c => c.id === id);
          if (!clienteExistente) {
            throw new Error('Cliente não encontrado');
          }

          console.log('✏️ Atualizando cliente:', dadosCliente);

          // Converter dadosCliente para formato Supabase
          const dadosSupabase: any = {};
          
          if (dadosCliente.nome !== undefined) dadosSupabase.nome = dadosCliente.nome;
          if (dadosCliente.cnpjCpf !== undefined) dadosSupabase.cnpj_cpf = dadosCliente.cnpjCpf;
          if (dadosCliente.enderecoEntrega !== undefined) dadosSupabase.endereco_entrega = dadosCliente.enderecoEntrega;
          if (dadosCliente.contatoNome !== undefined) dadosSupabase.contato_nome = dadosCliente.contatoNome;
          if (dadosCliente.contatoTelefone !== undefined) dadosSupabase.contato_telefone = dadosCliente.contatoTelefone;
          if (dadosCliente.contatoEmail !== undefined) dadosSupabase.contato_email = dadosCliente.contatoEmail;
          if (dadosCliente.quantidadePadrao !== undefined) dadosSupabase.quantidade_padrao = dadosCliente.quantidadePadrao;
          if (dadosCliente.periodicidadePadrao !== undefined) dadosSupabase.periodicidade_padrao = dadosCliente.periodicidadePadrao;
          if (dadosCliente.statusCliente !== undefined) dadosSupabase.status_cliente = dadosCliente.statusCliente;
          if (dadosCliente.metaGiroSemanal !== undefined) dadosSupabase.meta_giro_semanal = dadosCliente.metaGiroSemanal;
          if (dadosCliente.janelasEntrega !== undefined) dadosSupabase.janelas_entrega = dadosCliente.janelasEntrega;
          if (dadosCliente.representanteId !== undefined) dadosSupabase.representante_id = dadosCliente.representanteId;
          if (dadosCliente.rotaEntregaId !== undefined) dadosSupabase.rota_entrega_id = dadosCliente.rotaEntregaId;
          if (dadosCliente.categoriaEstabelecimentoId !== undefined) dadosSupabase.categoria_estabelecimento_id = dadosCliente.categoriaEstabelecimentoId;
          if (dadosCliente.instrucoesEntrega !== undefined) dadosSupabase.instrucoes_entrega = dadosCliente.instrucoesEntrega;
          if (dadosCliente.tipoLogistica !== undefined) dadosSupabase.tipo_logistica = dadosCliente.tipoLogistica;
          if (dadosCliente.contabilizarGiroMedio !== undefined) dadosSupabase.contabilizar_giro_medio = dadosCliente.contabilizarGiroMedio;
          if (dadosCliente.emiteNotaFiscal !== undefined) dadosSupabase.emite_nota_fiscal = dadosCliente.emiteNotaFiscal;
          if (dadosCliente.tipoCobranca !== undefined) dadosSupabase.tipo_cobranca = dadosCliente.tipoCobranca;
          if (dadosCliente.formaPagamento !== undefined) dadosSupabase.forma_pagamento = dadosCliente.formaPagamento;
          if (dadosCliente.observacoes !== undefined) dadosSupabase.observacoes = dadosCliente.observacoes;
          if (dadosCliente.categoriasHabilitadas !== undefined) dadosSupabase.categorias_habilitadas = dadosCliente.categoriasHabilitadas;

          const { error } = await supabase
            .from('clientes')
            .update(dadosSupabase)
            .eq('id', id);

          if (error) throw error;

          // Atualizar categorias se necessário
          if (dadosCliente.categoriasHabilitadas !== undefined) {
            try {
              await supabase
                .from('clientes_categorias')
                .delete()
                .eq('cliente_id', id);

              if (dadosCliente.categoriasHabilitadas.length > 0) {
                const novasRelacoes = dadosCliente.categoriasHabilitadas.map(categoriaId => ({
                  cliente_id: id,
                  categoria_id: categoriaId
                }));

                await supabase
                  .from('clientes_categorias')
                  .insert(novasRelacoes);
              }
            } catch (error) {
              console.warn('⚠️ Erro ao atualizar categorias:', error);
            }
          }

          // Invalidar cache e atualizar estado
          dataCache.clear(CLIENTES_CACHE_KEY);
          set(state => ({
            clientes: state.clientes.map(cliente => 
              cliente.id === id ? { ...cliente, ...dadosCliente } : cliente
            ),
            clienteAtual: state.clienteAtual?.id === id ? { ...state.clienteAtual, ...dadosCliente } : state.clienteAtual
          }));

          toast({
            title: "Cliente atualizado",
            description: "Dados do cliente foram atualizados com sucesso"
          });
        } catch (error: any) {
          console.error('❌ Erro ao atualizar cliente:', error);
          const errorMessage = error.message || 'Erro inesperado ao atualizar cliente';
          set({ error: errorMessage });
          
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive"
          });
        } finally {
          set({ loading: false });
        }
      },
      
      removerCliente: async (id) => {
        const cliente = get().clientes.find(c => c.id === id);
        if (!cliente) return;

        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Invalidar cache e atualizar estado
          dataCache.clear(CLIENTES_CACHE_KEY);
          set(state => ({
            clientes: state.clientes.filter(cliente => cliente.id !== id),
            clienteAtual: state.clienteAtual?.id === id ? null : state.clienteAtual
          }));

          toast({
            title: "Cliente removido",
            description: `${cliente.nome} foi removido com sucesso`
          });
        } catch (error: any) {
          console.error('❌ Erro ao remover cliente:', error);
          const errorMessage = error.message || 'Erro inesperado ao remover cliente';
          set({ error: errorMessage });
          
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive"
          });
        } finally {
          set({ loading: false });
        }
      },
      
      selecionarCliente: (id) => {
        if (id === null) {
          set({ clienteAtual: null });
          return;
        }
        
        const cliente = get().clientes.find(c => c.id === id);
        if (cliente) {
          console.log('👤 Cliente selecionado:', cliente.nome);
        }
        set({ clienteAtual: cliente || null });
      },
      
      setFiltroTermo: (termo) => {
        set(state => ({
          filtros: { ...state.filtros, termo }
        }));
      },
      
      setFiltroStatus: (status) => {
        set(state => ({
          filtros: { ...state.filtros, status }
        }));
      },
      
      setMetaGiro: async (idCliente, metaSemanal) => {
        await get().atualizarCliente(idCliente, { metaGiroSemanal: metaSemanal });
      },
      
      getClientesFiltrados: () => {
        const { clientes, filtros } = get();
        
        return clientes.filter(cliente => {
          const termoMatch = filtros.termo === '' || 
            cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
            (cliente.cnpjCpf && cliente.cnpjCpf.includes(filtros.termo));
          
          const statusMatch = filtros.status === 'Todos' || cliente.statusCliente === filtros.status;
          
          return termoMatch && statusMatch;
        });
      },
      
      getClientePorId: (id) => {
        return get().clientes.find(c => c.id === id);
      }
    }),
    { name: 'cliente-store-optimized-v2' }
  )
);

// Helper para calcular giro semanal
function calcularGiroSemanal(qtdPadrao: number, periodicidadeDias: number): number {
  if (periodicidadeDias === 3) {
    return qtdPadrao * 3;
  }
  
  const periodicidadeSemanas = periodicidadeDias / 7;
  return Math.round(qtdPadrao / periodicidadeSemanas);
}
