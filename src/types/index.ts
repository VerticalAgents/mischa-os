export type StatusCliente = 'Ativo' | 'Inativo' | 'Prospecto';

export interface CategoriaProduto {
  id: number;
  nome: string;
  descricao?: string;
}

export interface SubcategoriaProduto {
  id: number;
  nome: string;
  categoria_id: number;
}

export interface AgendamentoCliente {
  id: string;
  cliente_id: string;
  data_proxima_reposicao: Date;
  status_agendamento: string;
  tipo_pedido: string;
  itens_personalizados?: any;
}

export type SubstatusPedidoAgendado = 'Agendado' | 'Separado' | 'Despachado' | 'Entregue' | 'Retorno';

export interface HistoricoEntrega {
  id?: string;
  cliente_id: string;
  cliente_nome: string;
  data: Date;
  tipo: 'entrega' | 'retorno';
  quantidade: number;
  itens: any[];
  status_anterior: string;
  observacao?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  linkGoogleMaps?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  quantidadePadrao: number;
  periodicidadePadrao: number;
  statusCliente: StatusCliente;
  dataCadastro: Date;
  metaGiroSemanal: number;
  ultimaDataReposicaoEfetiva?: Date;
  statusAgendamento?: string;
  proximaDataReposicao?: Date;
  ativo: boolean;
  giroMedioSemanal: number;
  
  // Campos de entrega e logística
  janelasEntrega?: string[];
  representanteId?: number;
  rotaEntregaId?: number;
  categoriaEstabelecimentoId?: number;
  instrucoesEntrega?: string;
  contabilizarGiroMedio: boolean;
  tipoLogistica: string;
  
  // Campos financeiros e fiscais
  emiteNotaFiscal: boolean;
  tipoCobranca: string;
  formaPagamento: string;
  
  // Observações e categorias
  observacoes?: string;
  categoriaId: number;
  subcategoriaId: number;
  categoriasHabilitadas: number[];
}
