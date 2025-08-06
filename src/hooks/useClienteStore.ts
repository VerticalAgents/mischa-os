import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente, StatusCliente } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ClienteStore {
  clientes: Cliente[];
  clienteAtual: Cliente | null;
  loading: boolean;
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
  
  // Getters
  getClientesFiltrados: () => Cliente[];
  getClientePorId: (id: string) => Cliente | undefined;
}

// Helper para converter string de data do banco para Date local
const parseDateFromDatabase = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper para tratar erros do Supabase
const handleSupabaseError = async (error: any, operation: string, retryFunction?: () => Promise<any>) => {
  console.error(`useClienteStore: Erro em ${operation}:`, error);
  
  // Check if it's a JWT expired error
  if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
    console.log(`useClienteStore: JWT expirado em ${operation}, tentando renovar sessão...`);
    
    // Use global error handler if available
    if ((window as any).handleSupabaseError) {
      const handled = (window as any).handleSupabaseError(error);
      if (handled && retryFunction) {
        // Wait a bit for the token to refresh, then retry
        setTimeout(async () => {
          try {
            await retryFunction();
          } catch (retryError) {
            console.error(`useClienteStore: Retry failed for ${operation}:`, retryError);
          }
        }, 1000);
        return;
      }
    }
    
    toast({
      title: "Sessão Expirada",
      description: "Sua sessão expirou. Por favor, faça login novamente.",
      variant: "destructive"
    });
    return;
  }
  
  // Handle other errors
  toast({
    title: "Erro",
    description: `Erro em ${operation}: ${error.message || 'Erro desconhecido'}`,
    variant: "destructive"
  });
};

// Helper para converter dados do Supabase para o tipo Cliente
function convertSupabaseToCliente(data: any, agendamento?: any): Cliente {
  return {
    id: data.id,
    nome: data.nome,
    cnpjCpf: data.cnpj_cpf,
    enderecoEntrega: data.endereco_entrega,
    linkGoogleMaps: data.link_google_maps,
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
    link_google_maps: cliente.linkGoogleMaps || null,
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
      filtros: {
        termo: '',
        status: 'Todos'
      },
      
      carregarClientes: async () => {
        const executeLoad = async () => {
          console.log('useClienteStore: Carregando clientes com dados de agendamento...');
          
          // Carregar clientes junto com seus agendamentos
          const { data: clientesData, error: clientesError } = await supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false });

          if (clientesError) {
            throw clientesError;
          }

          // Carregar todos os agendamentos
          const { data: agendamentosData, error: agendamentosError } = await supabase
            .from('agendamentos_clientes')
            .select('*');

          if (agendamentosError) {
            console.error('Erro ao carregar agendamentos:', agendamentosError);
            // Continuar mesmo se houver erro nos agendamentos
          }

          // Mapear agendamentos por cliente_id para fácil acesso
          const agendamentosPorCliente = new Map();
          if (agendamentosData) {
            agendamentosData.forEach(agendamento => {
              agendamentosPorCliente.set(agendamento.cliente_id, agendamento);
            });
          }

          // Converter clientes incluindo dados de agendamento
          const clientesConvertidos = clientesData?.map(cliente => {
            const agendamento = agendamentosPorCliente.get(cliente.id);
            console.log(`useClienteStore: Cliente ${cliente.nome} - Agendamento:`, agendamento);
            return convertSupabaseToCliente(cliente, agendamento);
          }) || [];

          console.log('useClienteStore: Total de clientes carregados:', clientesConvertidos.length);
          set({ clientes: clientesConvertidos });
        };

        set({ loading: true });
        try {
          await executeLoad();
        } catch (error) {
          await handleSupabaseError(error, 'carregarClientes', executeLoad);
        } finally {
          set({ loading: false });
        }
      },
      
      adicionarCliente: async (cliente) => {
        const executeAdd = async () => {
          console.log('useClienteStore: Dados do cliente a serem enviados:', cliente);
          
          const dadosSupabase = convertClienteToSupabase(cliente);
          console.log('useClienteStore: Dados convertidos para Supabase:', dadosSupabase);
          
          const { data, error } = await supabase
            .from('clientes')
            .insert([dadosSupabase])
            .select()
            .single();

          if (error) {
            throw error;
          }

          // Salvar as categorias na tabela de relacionamento
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
              // Não impedir o cadastro por conta das categorias
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
        };

        set({ loading: true });
        try {
          return await executeAdd();
        } catch (error) {
          await handleSupabaseError(error, 'adicionarCliente', executeAdd);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      atualizarCliente: async (id, dadosCliente) => {
        const executeUpdate = async () => {
          const clienteExistente = get().clientes.find(c => c.id === id);
          if (!clienteExistente) {
            toast({
              title: "Erro",
              description: "Cliente não encontrado",
              variant: "destructive"
            });
            return;
          }

          console.log('useClienteStore: Atualizando cliente com dados:', dadosCliente);

          // Converter dadosCliente para formato Supabase, incluindo todos os campos
          const dadosSupabase: any = {};
          
          // Dados básicos
          if (dadosCliente.nome !== undefined) dadosSupabase.nome = dadosCliente.nome;
          if (dadosCliente.cnpjCpf !== undefined) dadosSupabase.cnpj_cpf = dadosCliente.cnpjCpf;
          if (dadosCliente.enderecoEntrega !== undefined) dadosSupabase.endereco_entrega = dadosCliente.enderecoEntrega;
          if (dadosCliente.linkGoogleMaps !== undefined) dadosSupabase.link_google_maps = dadosCliente.linkGoogleMaps;
          if (dadosCliente.contatoNome !== undefined) dadosSupabase.contato_nome = dadosCliente.contatoNome;
          if (dadosCliente.contatoTelefone !== undefined) dadosSupabase.contato_telefone = dadosCliente.contatoTelefone;
          if (dadosCliente.contatoEmail !== undefined) dadosSupabase.contato_email = dadosCliente.contatoEmail;
          
          // Configurações comerciais
          if (dadosCliente.quantidadePadrao !== undefined) dadosSupabase.quantidade_padrao = dadosCliente.quantidadePadrao;
          if (dadosCliente.periodicidadePadrao !== undefined) dadosSupabase.periodicidade_padrao = dadosCliente.periodicidadePadrao;
          if (dadosCliente.statusCliente !== undefined) dadosSupabase.status_cliente = dadosCliente.statusCliente;
          if (dadosCliente.metaGiroSemanal !== undefined) dadosSupabase.meta_giro_semanal = dadosCliente.metaGiroSemanal;
          
          // Entrega e logística
          if (dadosCliente.janelasEntrega !== undefined) dadosSupabase.janelas_entrega = dadosCliente.janelasEntrega;
          if (dadosCliente.representanteId !== undefined) dadosSupabase.representante_id = dadosCliente.representanteId;
          if (dadosCliente.rotaEntregaId !== undefined) dadosSupabase.rota_entrega_id = dadosCliente.rotaEntregaId;
          if (dadosCliente.categoriaEstabelecimentoId !== undefined) dadosSupabase.categoria_estabelecimento_id = dadosCliente.categoriaEstabelecimentoId;
          if (dadosCliente.instrucoesEntrega !== undefined) dadosSupabase.instrucoes_entrega = dadosCliente.instrucoesEntrega;
          if (dadosCliente.tipoLogistica !== undefined) dadosSupabase.tipo_logistica = dadosCliente.tipoLogistica;
          
          // Configurações financeiras e fiscais
          if (dadosCliente.contabilizarGiroMedio !== undefined) dadosSupabase.contabilizar_giro_medio = dadosCliente.contabilizarGiroMedio;
          if (dadosCliente.emiteNotaFiscal !== undefined) dadosSupabase.emite_nota_fiscal = dadosCliente.emiteNotaFiscal;
          if (dadosCliente.tipoCobranca !== undefined) dadosSupabase.tipo_cobranca = dadosCliente.tipoCobranca;
          if (dadosCliente.formaPagamento !== undefined) dadosSupabase.forma_pagamento = dadosCliente.formaPagamento;
          
          // Observações e categorias
          if (dadosCliente.observacoes !== undefined) dadosSupabase.observacoes = dadosCliente.observacoes;
          if (dadosCliente.categoriasHabilitadas !== undefined) dadosSupabase.categorias_habilitadas = dadosCliente.categoriasHabilitadas;

          console.log('useClienteStore: Dados convertidos para Supabase:', dadosSupabase);

          const { error } = await supabase
            .from('clientes')
            .update(dadosSupabase)
            .eq('id', id);

          if (error) {
            throw error;
          }

          // Se as categorias foram atualizadas, salvar na tabela de relacionamento
          if (dadosCliente.categoriasHabilitadas !== undefined) {
            console.log('useClienteStore: Atualizando categorias na tabela de relacionamento:', dadosCliente.categoriasHabilitadas);
            
            // Remover categorias existentes
            const { error: deleteError } = await supabase
              .from('clientes_categorias')
              .delete()
              .eq('cliente_id', id);

            if (deleteError) {
              console.error('Erro ao remover categorias existentes:', deleteError);
            }

            // Inserir novas categorias
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
        };

        set({ loading: true });
        try {
          await executeUpdate();
        } catch (error) {
          await handleSupabaseError(error, 'atualizarCliente', executeUpdate);
        } finally {
          set({ loading: false });
        }
      },
      
      removerCliente: async (id) => {
        const cliente = get().clientes.find(c => c.id === id);
        if (!cliente) return;

        const executeRemove = async () => {
          const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            clientes: state.clientes.filter(cliente => cliente.id !== id),
            clienteAtual: state.clienteAtual?.id === id ? null : state.clienteAtual
          }));

          toast({
            title: "Cliente removido",
            description: `${cliente.nome} foi removido com sucesso`
          });
        };

        set({ loading: true });
        try {
          await executeRemove();
        } catch (error) {
          await handleSupabaseError(error, 'removerCliente', executeRemove);
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
          console.log('useClienteStore: Cliente selecionado:', cliente.nome, 'Status agendamento:', cliente.statusAgendamento, 'Próxima data:', cliente.proximaDataReposicao);
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
      
      getClientesFiltrados: () => {
        const { clientes, filtros } = get();
        
        return clientes.filter(cliente => {
          // Filtro por termo
          const termoMatch = filtros.termo === '' || 
            cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
            (cliente.cnpjCpf && cliente.cnpjCpf.includes(filtros.termo));
          
          // Filtro por status
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

// Helper para calcular giro semanal
function calcularGiroSemanal(qtdPadrao: number, periodicidadeDias: number): number {
  if (periodicidadeDias === 3) {
    return qtdPadrao * 3;
  }
  
  const periodicidadeSemanas = periodicidadeDias / 7;
  return Math.round(qtdPadrao / periodicidadeSemanas);
}
