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

// Helpers para transformação segura de dados
const intOrNull = (v: any) => v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : parseInt(String(v), 10);
const numOrNull = (v: any) => v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v);
const boolOr = (v: any, fallback = false) => typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : fallback;
const arrJson = (v: any) => Array.isArray(v) ? v : [];
const arrNum = (v: any) => Array.isArray(v) ? v.map((x) => Number(x)).filter(Number.isFinite) : [];

const STATUS_DB = { 
  'Ativo': 'Ativo', 
  'Inativo': 'Inativo', 
  'Em análise': 'Em análise', 
  'A ativar': 'A ativar', 
  'Standby': 'Standby' 
};

export function transformClienteToDbRow(c: any) {
  const valid = {
    nome: c?.nome?.trim() || '',
    cnpj_cpf: c?.cnpjCpf?.trim() || null,
    endereco_entrega: c?.enderecoEntrega?.trim() || null,
    link_google_maps: c?.linkGoogleMaps?.trim() || null,
    contato_nome: c?.contatoNome?.trim() || null,
    contato_telefone: c?.contatoTelefone?.trim() || null,
    contato_email: c?.contatoEmail?.trim() || null,
    representante_id: intOrNull(c?.representanteId),
    rota_entrega_id: intOrNull(c?.rotaEntregaId),
    categoria_estabelecimento_id: intOrNull(c?.categoriaEstabelecimentoId),
    quantidade_padrao: intOrNull(c?.quantidadePadrao) ?? 0,
    periodicidade_padrao: intOrNull(c?.periodicidadePadrao) ?? 7,
    meta_giro_semanal: numOrNull(c?.metaGiroSemanal) ?? 0,
    giro_medio_semanal: numOrNull(c?.giroMedioSemanal) ?? 0,
    janelas_entrega: arrJson(c?.janelasEntrega),
    categorias_habilitadas: arrNum(c?.categoriasHabilitadas),
    status_cliente: STATUS_DB[c?.statusCliente ?? 'Ativo'] ?? 'Ativo',
    ultima_data_reposicao_efetiva: c?.ultimaDataReposicaoEfetiva?.toISOString?.() || null,
    proxima_data_reposicao: c?.proximaDataReposicao?.toISOString?.() || null,
    ativo: boolOr(c?.ativo, true),
    contabilizar_giro_medio: boolOr(c?.contabilizarGiroMedio, true),
    emite_nota_fiscal: boolOr(c?.emiteNotaFiscal, true),
    instrucoes_entrega: c?.instrucoesEntrega?.trim() || null,
    observacoes: c?.observacoes?.trim() || null,
    tipo_logistica: c?.tipoLogistica?.trim() || 'Própria',
    tipo_cobranca: c?.tipoCobranca?.trim() || 'À vista',
    forma_pagamento: c?.formaPagamento?.trim() || 'Boleto',
    updated_at: new Date().toISOString(),
  };
  
  return valid;
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
    let dbData: any = {};
    try {
      dbData = transformClienteToDbRow(cliente);
      
      console.log('useClienteStore: Payload sanitizado para adição:', dbData);

      const { data, error } = await supabase
        .from('clientes')
        .insert(dbData as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const novoCliente = transformDbRowToCliente(data);

      set((state) => ({
        clientes: [...state.clientes, novoCliente],
        loading: false,
      }));

      return novoCliente;
    } catch (error: any) {
      console.error("Erro detalhado ao adicionar cliente:", {
        payloadSanitizado: dbData,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      
      set({ loading: false });
      
      if (error.code === '22P02') {
        throw new Error(`Erro de formato de dados: ${error.details || error.message}`);
      }
      
      if (error.code === '42883') {
        throw new Error('Erro na configuração do banco de dados. Contate o administrador.');
      }
      
      throw error;
    }
  },
  atualizarCliente: async (id, cliente) => {
    set({ loading: true });
    let dbData: any = {};
    try {
      dbData = transformClienteToDbRow(cliente);
      
      console.log('useClienteStore: Payload sanitizado para atualização:', dbData);
      
      const { data, error } = await supabase
        .from('clientes')
        .update(dbData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const clienteAtualizado = transformDbRowToCliente(data);

      set((state) => ({
        clientes: state.clientes.map((c) => (c.id === id ? clienteAtualizado : c)),
        clienteAtual: state.clienteAtual?.id === id ? clienteAtualizado : state.clienteAtual,
        loading: false,
      }));
    } catch (error: any) {
      console.error("Erro detalhado ao atualizar cliente:", {
        clienteId: id,
        payloadSanitizado: dbData,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      
      set({ loading: false });
      
      if (error.code === '22P02') {
        throw new Error(`Erro de formato de dados: ${error.details || error.message}`);
      }
      
      if (error.code === '42883') {
        throw new Error('Erro na configuração do banco de dados. Contate o administrador.');
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