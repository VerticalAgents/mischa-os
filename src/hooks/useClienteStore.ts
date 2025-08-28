import { create } from 'zustand';
import { Cliente, StatusCliente } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calcularGiroSemanalPadrao, calcularMetaGiroSemanal } from '@/utils/giroCalculations';

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

import { sanitizeClienteData } from '@/utils/clienteDataSanitizer';

// Função simplificada - toda lógica movida para o sanitizer
export function transformClienteToDbRow(c: any) {
  const sanitizationResult = sanitizeClienteData(c);
  
  if (!sanitizationResult.isValid) {
    console.error('🚨 Dados inválidos detectados:', sanitizationResult.errors);
    throw new Error(`Dados inválidos: ${sanitizationResult.errors.join(', ')}`);
  }

  if (sanitizationResult.corrections.length > 0) {
    console.warn('🔧 Correções automáticas aplicadas:', sanitizationResult.corrections);
  }

  return sanitizationResult.data;
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

  return {
    id: row.id,
    nome: row.nome || '',
    cnpjCpf: row.cnpj_cpf || '',
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
    statusCliente: row.status_cliente || 'Ativo',
    ultimaDataReposicaoEfetiva: row.ultima_data_reposicao_efetiva ? new Date(row.ultima_data_reposicao_efetiva) : null,
    proximaDataReposicao: row.proxima_data_reposicao ? new Date(row.proxima_data_reposicao) : null,
    ativo: row.ativo !== false,
    contabilizarGiroMedio: row.contabilizar_giro_medio !== false,
    emiteNotaFiscal: row.emite_nota_fiscal !== false,
    instrucoesEntrega: row.instrucoes_entrega || '',
    observacoes: row.observacoes || '',
    tipoLogistica: row.tipo_logistica || 'Própria',
    tipoCobranca: row.tipo_cobranca || 'À vista',
    formaPagamento: row.forma_pagamento || 'Boleto',
    dataCadastro: row.created_at ? new Date(row.created_at) : new Date(),
    statusAgendamento: row.status_agendamento,
    categoriaId: row.categoria_id || 1,
    subcategoriaId: row.subcategoria_id || 1,
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

      const novoCliente = transformDbRowToCliente(data);
      console.log('✅ Cliente criado com sucesso:', novoCliente.id);

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
      console.log('🔄 Iniciando atualização de cliente:', id, cliente);
      
      const dbData = transformClienteToDbRow(cliente);
      console.log('✅ Dados sanitizados para atualização:', dbData);
      
      const { data, error } = await supabase
        .from('clientes')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase na atualização:', error);
        throw error;
      }

      const clienteAtualizado = transformDbRowToCliente(data);
      console.log('✅ Cliente atualizado com sucesso:', clienteAtualizado.id);

      set((state) => ({
        clientes: state.clientes.map((c) => (c.id === id ? clienteAtualizado : c)),
        clienteAtual: state.clienteAtual?.id === id ? clienteAtualizado : state.clienteAtual,
        loading: false,
      }));
    } catch (error: any) {
      console.error("❌ Erro ao atualizar cliente:", {
        clienteId: id,
        error: error.message,
        code: error.code,
        details: error.details
      });
      
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
        nome: '',
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
        cliente.cnpjCpf.includes(filtros.termo) ||
        cliente.enderecoEntrega.toLowerCase().includes(filtros.termo.toLowerCase());

      const matchesStatus = !filtros.status || 
        filtros.status === 'Todos' || 
        cliente.statusCliente === filtros.status;

      return matchesTermo && matchesStatus;
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
}));