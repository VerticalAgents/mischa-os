import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente, StatusCliente } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SecureInputValidator } from '@/utils/secureInputValidator';

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

// Helper para converter dados do Supabase para o tipo Cliente
function convertSupabaseToCliente(data: any, agendamento?: any): Cliente {
  return {
    id: data.id,
    nome: SecureInputValidator.sanitizeInput(data.nome),
    cnpjCpf: data.cnpj_cpf,
    enderecoEntrega: SecureInputValidator.sanitizeInput(data.endereco_entrega || ''),
    contatoNome: SecureInputValidator.sanitizeInput(data.contato_nome || ''),
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
    instrucoesEntrega: SecureInputValidator.sanitizeInput(data.instrucoes_entrega || ''),
    contabilizarGiroMedio: data.contabilizar_giro_medio !== undefined ? data.contabilizar_giro_medio : true,
    tipoLogistica: data.tipo_logistica || 'Própria',
    emiteNotaFiscal: data.emite_nota_fiscal !== undefined ? data.emite_nota_fiscal : true,
    tipoCobranca: data.tipo_cobranca || 'À vista',
    formaPagamento: data.forma_pagamento || 'Boleto',
    observacoes: SecureInputValidator.sanitizeInput(data.observacoes || ''),
    categoriaId: 1, // Default value
    subcategoriaId: 1, // Default value
    categoriasHabilitadas: data.categorias_habilitadas || []
  };
}

// Helper para converter Cliente para dados do Supabase com validação
function convertClienteToSupabase(cliente: Omit<Cliente, 'id' | 'dataCadastro'>) {
  // Validate input data
  if (!SecureInputValidator.validateLength(cliente.nome, 1, 255)) {
    throw new Error('Nome do cliente deve ter entre 1 e 255 caracteres');
  }

  if (cliente.cnpjCpf && !SecureInputValidator.validateCnpjCpf(cliente.cnpjCpf)) {
    throw new Error('CNPJ/CPF inválido');
  }

  if (cliente.contatoEmail && !SecureInputValidator.validateEmail(cliente.contatoEmail)) {
    throw new Error('Email inválido');
  }

  if (cliente.contatoTelefone && !SecureInputValidator.validatePhoneNumber(cliente.contatoTelefone)) {
    throw new Error('Telefone inválido');
  }

  const giroCalculado = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
  
  return {
    nome: SecureInputValidator.sanitizeInput(cliente.nome),
    cnpj_cpf: cliente.cnpjCpf || null,
    endereco_entrega: SecureInputValidator.sanitizeInput(cliente.enderecoEntrega || '') || null,
    contato_nome: SecureInputValidator.sanitizeInput(cliente.contatoNome || '') || null,
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
    instrucoes_entrega: SecureInputValidator.sanitizeInput(cliente.instrucoesEntrega || '') || null,
    contabilizar_giro_medio: cliente.contabilizarGiroMedio !== undefined ? cliente.contabilizarGiroMedio : true,
    tipo_logistica: cliente.tipoLogistica || 'Própria',
    emite_nota_fiscal: cliente.emiteNotaFiscal !== undefined ? cliente.emiteNotaFiscal : true,
    tipo_cobranca: cliente.tipoCobranca || 'À vista',
    forma_pagamento: cliente.formaPagamento || 'Boleto',
    observacoes: SecureInputValidator.sanitizeInput(cliente.observacoes || '') || null,
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
        set({ loading: true });
        try {
          console.log('useClienteStore: Carregando clientes otimizado...');
          
          const { data: clientesData, error: clientesError } = await supabase
            .from('clientes')
            .select(`
              id,
              nome,
              cnpj_cpf,
              endereco_entrega,
              contato_nome,
              contato_telefone,
              contato_email,
              quantidade_padrao,
              periodicidade_padrao,
              status_cliente,
              meta_giro_semanal,
              giro_medio_semanal,
              representante_id,
              rota_entrega_id,
              categoria_estabelecimento_id,
              tipo_logistica,
              tipo_cobranca,
              forma_pagamento,
              ativo,
              created_at,
              categorias_habilitadas
            `)
            .eq('ativo', true)
            .order('created_at', { ascending: false });

          if (clientesError) {
            console.error('Erro ao carregar clientes:', clientesError);
            toast({
              title: "Erro",
              description: "Não foi possível carregar os clientes",
              variant: "destructive"
            });
            return;
          }

          const clienteIds = clientesData?.map(c => c.id) || [];
          let agendamentosPorCliente = new Map();
          
          if (clienteIds.length > 0) {
            const { data: agendamentosData, error: agendamentosError } = await supabase
              .from('agendamentos_clientes')
              .select('cliente_id, status_agendamento, data_proxima_reposicao')
              .in('cliente_id', clienteIds);

            if (!agendamentosError && agendamentosData) {
              agendamentosData.forEach(agendamento => {
                agendamentosPorCliente.set(agendamento.cliente_id, agendamento);
              });
            }
          }

          const clientesConvertidos = clientesData?.map(cliente => {
            const agendamento = agendamentosPorCliente.get(cliente.id);
            return convertSupabaseToCliente(cliente, agendamento);
          }) || [];

          console.log('useClienteStore: Clientes carregados com sucesso:', clientesConvertidos.length);
          set({ clientes: clientesConvertidos });
        } catch (error) {
          console.error('Erro ao carregar clientes:', error);
          toast({
            title: "Erro",
            description: "Erro inesperado ao carregar clientes",
            variant: "destructive"
          });
        } finally {
          set({ loading: false });
        }
      },
      
      adicionarCliente: async (cliente) => {
        set({ loading: true });
        try {
          console.log('useClienteStore: Dados do cliente a serem enviados:', cliente);
          
          const dadosSupabase = convertClienteToSupabase(cliente);
          console.log('useClienteStore: Dados convertidos para Supabase:', dadosSupabase);
          
          const { data, error } = await supabase
            .from('clientes')
            .insert([dadosSupabase])
            .select()
            .single();

          if (error) {
            console.error('Erro ao adicionar cliente:', error);
            toast({
              title: "Erro ao cadastrar cliente",
              description: `Erro: ${error.message}`,
              variant: "destructive"
            });
            throw error;
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
            toast({
              title: "Erro",
              description: "Cliente não encontrado",
              variant: "destructive"
            });
            return;
          }

          // Validate updated data
          if (dadosCliente.nome && !SecureInputValidator.validateLength(dadosCliente.nome, 1, 255)) {
            throw new Error('Nome do cliente deve ter entre 1 e 255 caracteres');
          }

          if (dadosCliente.cnpjCpf && !SecureInputValidator.validateCnpjCpf(dadosCliente.cnpjCpf)) {
            throw new Error('CNPJ/CPF inválido');
          }

          if (dadosCliente.contatoEmail && !SecureInputValidator.validateEmail(dadosCliente.contatoEmail)) {
            throw new Error('Email inválido');
          }

          console.log('useClienteStore: Atualizando cliente com dados:', dadosCliente);

          const dadosSupabase: any = {};
          
          // Sanitize and validate all text fields
          if (dadosCliente.nome !== undefined) dadosSupabase.nome = SecureInputValidator.sanitizeInput(dadosCliente.nome);
          if (dadosCliente.cnpjCpf !== undefined) dadosSupabase.cnpj_cpf = dadosCliente.cnpjCpf;
          if (dadosCliente.enderecoEntrega !== undefined) dadosSupabase.endereco_entrega = SecureInputValidator.sanitizeInput(dadosCliente.enderecoEntrega);
          if (dadosCliente.contatoNome !== undefined) dadosSupabase.contato_nome = SecureInputValidator.sanitizeInput(dadosCliente.contatoNome);
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
          if (dadosCliente.instrucoesEntrega !== undefined) dadosSupabase.instrucoes_entrega = SecureInputValidator.sanitizeInput(dadosCliente.instrucoesEntrega);
          if (dadosCliente.tipoLogistica !== undefined) dadosSupabase.tipo_logistica = dadosCliente.tipoLogistica;
          if (dadosCliente.contabilizarGiroMedio !== undefined) dadosSupabase.contabilizar_giro_medio = dadosCliente.contabilizarGiroMedio;
          if (dadosCliente.emiteNotaFiscal !== undefined) dadosSupabase.emite_nota_fiscal = dadosCliente.emiteNotaFiscal;
          if (dadosCliente.tipoCobranca !== undefined) dadosSupabase.tipo_cobranca = dadosCliente.tipoCobranca;
          if (dadosCliente.formaPagamento !== undefined) dadosSupabase.forma_pagamento = dadosCliente.formaPagamento;
          if (dadosCliente.observacoes !== undefined) dadosSupabase.observacoes = SecureInputValidator.sanitizeInput(dadosCliente.observacoes);
          if (dadosCliente.categoriasHabilitadas !== undefined) dadosSupabase.categorias_habilitadas = dadosCliente.categoriasHabilitadas;

          console.log('useClienteStore: Dados convertidos para Supabase:', dadosSupabase);

          const { error } = await supabase
            .from('clientes')
            .update(dadosSupabase)
            .eq('id', id);

          if (error) {
            console.error('Erro ao atualizar cliente:', error);
            toast({
              title: "Erro",
              description: "Não foi possível atualizar o cliente",
              variant: "destructive"
            });
            return;
          }

          // Update categories if needed
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
            console.error('Erro ao remover cliente:', error);
            toast({
              title: "Erro",
              description: "Não foi possível remover o cliente",
              variant: "destructive"
            });
            return;
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
        const sanitizedTermo = SecureInputValidator.sanitizeInput(termo);
        set(state => ({
          filtros: {
            ...state.filtros,
            termo: sanitizedTermo
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
        if (!SecureInputValidator.validateNumeric(metaSemanal)) {
          throw new Error('Meta semanal deve ser um número válido');
        }
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
