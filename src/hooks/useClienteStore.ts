
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
  adicionarCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => Promise<void>;
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

// Helper para converter dados do Supabase para o tipo Cliente
function convertSupabaseToCliente(data: any): Cliente {
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
    statusAgendamento: data.status_agendamento,
    proximaDataReposicao: data.proxima_data_reposicao ? new Date(data.proxima_data_reposicao) : undefined,
    ativo: data.ativo || true,
    giroMedioSemanal: data.giro_medio_semanal || calcularGiroSemanal(data.quantidade_padrao || 0, data.periodicidade_padrao || 7),
    janelasEntrega: data.janelas_entrega,
    representanteId: data.representante_id,
    rotaEntregaId: data.rota_entrega_id,
    categoriaEstabelecimentoId: data.categoria_estabelecimento_id,
    instrucoesEntrega: data.instrucoes_entrega,
    contabilizarGiroMedio: data.contabilizar_giro_medio || true,
    tipoLogistica: data.tipo_logistica || 'Própria',
    emiteNotaFiscal: data.emite_nota_fiscal || true,
    tipoCobranca: data.tipo_cobranca || 'À vista',
    formaPagamento: data.forma_pagamento || 'Boleto',
    observacoes: data.observacoes,
    categoriaId: data.categoria_id || 1,
    subcategoriaId: data.subcategoria_id || 1
  };
}

// Helper para converter Cliente para dados do Supabase
function convertClienteToSupabase(cliente: Omit<Cliente, 'id' | 'dataCadastro'>) {
  return {
    nome: cliente.nome,
    cnpj_cpf: cliente.cnpjCpf,
    endereco_entrega: cliente.enderecoEntrega,
    contato_nome: cliente.contatoNome,
    contato_telefone: cliente.contatoTelefone,
    contato_email: cliente.contatoEmail,
    quantidade_padrao: cliente.quantidadePadrao,
    periodicidade_padrao: cliente.periodicidadePadrao,
    status_cliente: cliente.statusCliente,
    ativo: cliente.ativo,
    giro_medio_semanal: cliente.giroMedioSemanal || calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao),
    meta_giro_semanal: Math.round(calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao) * 1.2),
    ultima_data_reposicao_efetiva: cliente.ultimaDataReposicaoEfetiva?.toISOString().split('T')[0],
    proxima_data_reposicao: cliente.proximaDataReposicao?.toISOString().split('T')[0],
    status_agendamento: cliente.statusAgendamento,
    janelas_entrega: cliente.janelasEntrega,
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
    categoria_id: cliente.categoriaId,
    subcategoria_id: cliente.subcategoriaId
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
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Erro ao carregar clientes:', error);
            toast({
              title: "Erro",
              description: "Não foi possível carregar os clientes",
              variant: "destructive"
            });
            return;
          }

          const clientesConvertidos = data?.map(convertSupabaseToCliente) || [];
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
          const dadosSupabase = convertClienteToSupabase(cliente);
          
          const { data, error } = await supabase
            .from('clientes')
            .insert([dadosSupabase])
            .select()
            .single();

          if (error) {
            console.error('Erro ao adicionar cliente:', error);
            toast({
              title: "Erro",
              description: "Não foi possível cadastrar o cliente",
              variant: "destructive"
            });
            return;
          }

          const novoCliente = convertSupabaseToCliente(data);
          set(state => ({
            clientes: [novoCliente, ...state.clientes]
          }));

          toast({
            title: "Cliente cadastrado",
            description: `${cliente.nome} foi cadastrado com sucesso`
          });
        } catch (error) {
          console.error('Erro ao adicionar cliente:', error);
          toast({
            title: "Erro",
            description: "Erro inesperado ao cadastrar cliente",
            variant: "destructive"
          });
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
