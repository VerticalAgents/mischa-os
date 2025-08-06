
export type StatusCliente = 'Ativo' | 'Inativo' | 'Prospecto' | 'Em análise' | 'A ativar' | 'Standby';

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

export interface ProdutoCategoria {
  id: number;
  nome: string;
  descricao?: string;
}

export interface ProdutoSubcategoria {
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

export type StatusAgendamentoCliente = 'Agendar' | 'Previsto' | 'Agendado';

export type TipoPedidoAgendamento = 'Padrão' | 'Alterado';

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

export interface Pedido {
  id: string;
  cliente_id: string;
  data_pedido: Date;
  quantidade_total: number;
  status: string;
  itens?: any[];
}

export type StatusPedido = 'Pendente' | 'Separado' | 'Despachado' | 'Entregue' | 'Cancelado';

export interface Alerta {
  id: string;
  tipo: 'warning' | 'error' | 'info';
  mensagem: string;
  data: Date;
}

export interface DashboardData {
  pedidos: Pedido[];
  clientes: Cliente[];
  alertas: Alerta[];
}

export interface Sabor {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Insumo {
  id: string;
  nome: string;
  categoria_id?: number;
  unidade_medida: string;
  preco_unitario?: number;
}

export interface CategoriaInsumo {
  id: number;
  nome: string;
  descricao?: string;
}

export interface UnidadeMedida {
  id: string;
  nome: string;
  simbolo: string;
}

export type DiaSemana = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';

export type TipoLogisticaNome = 'Própria' | 'Terceirizada' | 'Mista';

export type TipoCobranca = 'À vista' | 'Parcelado' | 'Boleto';

export interface Representante {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
}

export interface RotaEntrega {
  id: number;
  nome: string;
  descricao?: string;
}

export interface ConfiguracoesProducao {
  capacidade_maxima: number;
  tempo_preparacao: number;
  margem_seguranca: number;
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
