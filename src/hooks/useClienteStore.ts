import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente, StatusCliente } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ClienteStore {
  clientes: Cliente[];
  clienteAtual: Cliente | null;
  loading: boolean;
  error: string | null;
  isLoadingClientes: boolean;
  lastLoadTime: number | null;
  retryCount: number;
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

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const REQUEST_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos

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
    statusAgendamento: agendamento?.status_agendamento || data.status_agendamento || 'Não Agendado',
    proximaDataReposicao: agendamento?.data_proxima_reposicao 
      ? parseDateFromDatabase(agendamento.data_proxima_reposicao) 
      : (data.proxima_data_reposicao ? new Date(data.proxima_data_reposicao) : undefined),
    ativo: data.ativo || true,
    giroMedioSemanal: data.giro_medio_semanal || calcularGiroSemanal(data.quantidade_padrao || 0, data.periodicidade_padrao || 7),
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
    categoriaId: 1,
    subcategoriaId: 1,
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
    janelas_entrega: cliente.janelasEntrega || null,
    representante_id: cliente.representanteId || null,
    rota_entrega_id: cliente.rotaEntregaId || null,
    categoria_estabelecimento_id: cliente.categoriaEstabelecimentoId || null,
    instrucoes_entrega: cliente.instrucoesEntrega || null,
    contabilizar_giro_medio: cliente.contabilizarGiroMedio !== undefined ? cliente.contabilizarGiroMedio : true,
    tipo_logistica: cliente.tipoLogistica || 'Própria',
    emite_nota_fiscal: cliente.emiteNotaFiscal !== undefined ? cliente.emiteNotaFiscal : true,
    tipo_cobranca: cliente.tipoCobranca || 'À vista',
    forma_pagamento: cliente.formaPagamento || 'Boleto',
    observacoes: cliente.observacoes || null,
    categorias_habilitadas: cliente.categoriasHabilitadas || []
  };
}

// Função para delay com promise
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para timeout de promessa - corrigida
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: Operação demorou mais que o esperado')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

export const useClienteStore = create<ClienteStore>()(
  devtools(
    (set, get) => ({
      clientes: [],
      clienteAtual: null,
      loading: false,
      error: null,
      isLoadingClientes: false,
      lastLoadTime: null,
      retryCount: 0,
      filtros: {
        termo: '',
        status: 'Todos'
      },
      
      carregarClientes: async () => {
        const state = get();
        
        // Prevenir múltiplas chamadas simultâneas
        if (state.isLoadingClientes) {
          console.log('useClienteStore: Carregamento já em andamento, ignorando nova chamada');
          return;
        }

        // Verificar cache válido
        const now = Date.now();
        if (state.lastLoadTime && (now - state.lastLoadTime) < CACHE_TTL && state.clientes.length > 0) {
          console.log('useClienteStore: Usando dados do cache');
          return;
        }

        const startTime = Date.now();
        console.log('useClienteStore: Iniciando carregamento de clientes...');
        
        set({ 
          isLoadingClientes: true, 
          loading: true, 
          error: null,
          retryCount: 0
        });

        const executeLoad = async (attemptNumber: number = 1): Promise<void> => {
          try {
            console.log(`useClienteStore: Tentativa ${attemptNumber} de carregamento`);
            
            // Query otimizada com LEFT JOIN - executando com timeout
            const queryPromise = supabase
              .from('clientes')
              .select(`
                *,
                agendamentos:agendamentos_clientes(
                  status_agendamento,
                  data_proxima_reposicao
                )
              `)
              .order('created_at', { ascending: false });

            const result = await withTimeout(queryPromise, REQUEST_TIMEOUT);
            const { data: clientesData, error: clientesError } = result;

            if (clientesError) {
              throw new Error(`Erro ao carregar clientes: ${clientesError.message}`);
            }

            if (!clientesData) {
              throw new Error('Nenhum dado retornado do servidor');
            }

            // Converter dados incluindo agendamentos
            const clientesConvertidos = clientesData.map(cliente => {
              const agendamento = cliente.agendamentos?.[0];
              return convertSupabaseToCliente(cliente, agendamento);
            });

            const loadTime = Date.now() - startTime;
            console.log(`useClienteStore: Carregamento concluído em ${loadTime}ms - ${clientesConvertidos.length} clientes`);

            set({ 
              clientes: clientesConvertidos,
              lastLoadTime: Date.now(),
              loading: false,
              isLoadingClientes: false,
              error: null,
              retryCount: 0
            });

          } catch (error) {
            console.error(`useClienteStore: Erro na tentativa ${attemptNumber}:`, error);
            
            if (attemptNumber < MAX_RETRIES) {
              set({ retryCount: attemptNumber });
              
              console.log(`useClienteStore: Aguardando ${RETRY_DELAY}ms antes da próxima tentativa...`);
              await delay(RETRY_DELAY);
              
              return executeLoad(attemptNumber + 1);
            } else {
              // Falha definitiva após todas as tentativas
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              
              set({ 
                loading: false,
                isLoadingClientes: false,
                error: errorMessage,
                retryCount: attemptNumber
              });

              toast({
                title: "Erro ao carregar clientes",
                description: `Falha após ${MAX_RETRIES} tentativas: ${errorMessage}`,
                variant: "destructive"
              });
            }
          }
        };

        await executeLoad();
      },
      
      adicionarCliente: async (cliente) => {
        set({ loading: true });
        try {
          console.log('useClienteStore: Adicionando cliente:', cliente.nome);
          
          const dadosSupabase = convertClienteToSupabase(cliente);
          
          const { data, error } = await supabase
            .from('clientes')
            .insert([dadosSupabase])
            .select()
            .single();

          if (error) {
            throw new Error(`Erro ao adicionar cliente: ${error.message}`);
          }

          if (cliente.categoriasHabilitadas && cliente.categoriasHabilitadas.length > 0) {
            const categoriasRelacao = cliente.categoriasHabilitadas.map(categoriaId => ({
              cliente_id: data.id,
              categoria_id: categoriaId
            }));

            const { error: categoriaError } = await supabase
              .from('clientes_categorias')
              .insert(categoriasRelacao);

            if (categoriaError) {
              console.error('Erro ao salvar categorias do cliente:', categoriaError);
            }
          }

          const novoCliente = convertSupabaseToCliente(data);
          set(state => ({
            clientes: [novoCliente, ...state.clientes]
          }));

          toast({
            title: "Cliente cadastrado",
            description: `${cliente.nome} foi cadastrado com sucesso`
          });

          return novoCliente;
        } catch (error) {
          console.error('Erro ao adicionar cliente:', error);
          toast({
            title: "Erro",
            description: "Erro inesperado ao cadastrar cliente",
            variant: "destructive"
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      atualizarCliente: async (id, dadosCliente) => {
        set({ loading: true });
        try {
          const clienteExistente = get().clientes.find(c => c.id === id);
          if (!clienteExistente) {
            throw new Error("Cliente não encontrado");
          }

          console.log('useClienteStore: Atualizando cliente:', id);

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

          if (error) {
            throw new Error(`Erro ao atualizar cliente: ${error.message}`);
          }

          if (dadosCliente.categoriasHabilitadas !== undefined) {
            const { error: deleteError } = await supabase
              .from('clientes_categorias')
              .delete()
              .eq('cliente_id', id);

            if (deleteError) {
              console.error('Erro ao remover categorias existentes:', deleteError);
            }

            if (dadosCliente.categoriasHabilitadas.length > 0) {
              const novasRelacoes = dadosCliente.categoriasHabilitadas.map(categoriaId => ({
                cliente_id: id,
                categoria_id: categoriaId
              }));

              const { error: insertError } = await supabase
                .from('clientes_categorias')
                .insert(novasRelacoes);

              if (insertError) {
                console.error('Erro ao inserir novas categorias:', insertError);
              }
            }
          }

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
        } catch (error) {
          console.error('Erro ao atualizar cliente:', error);
          toast({
            title: "Erro",
            description: "Erro inesperado ao atualizar cliente",
            variant: "destructive"
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      removerCliente: async (id) => {
        const cliente = get().clientes.find(c => c.id === id);
        if (!cliente) return;

        set({ loading: true });
        try {
          const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);

          if (error) {
            throw new Error(`Erro ao remover cliente: ${error.message}`);
          }

          set(state => ({
            clientes: state.clientes.filter(cliente => cliente.id !== id),
            clienteAtual: state.clienteAtual?.id === id ? null : state.clienteAtual
          }));

          toast({
            title: "Cliente removido",
            description: `${cliente.nome} foi removido com sucesso`
          });
        } catch (error) {
          console.error('Erro ao remover cliente:', error);
          toast({
            title: "Erro",
            description: "Erro inesperado ao remover cliente",
            variant: "destructive"
          });
          throw error;
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
          console.log('useClienteStore: Cliente selecionado:', cliente.nome);
        }
        set({ clienteAtual: cliente || null });
      },
      
      setFiltroTermo: (termo) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            termo
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
      
      setMetaGiro: async (idCliente, metaSemanal) => {
        await get().atualizarCliente(idCliente, { metaGiroSemanal: metaSemanal });
      },

      clearError: () => {
        set({ error: null });
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
    { name: 'cliente-store' }
  )
);

function calcularGiroSemanal(qtdPadrao: number, periodicidadeDias: number): number {
  if (periodicidadeDias === 3) {
    return qtdPadrao * 3;
  }
  
  const periodicidadeSemanas = periodicidadeDias / 7;
  return Math.round(qtdPadrao / periodicidadeSemanas);
}
