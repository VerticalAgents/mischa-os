
export type StatusCliente = 'Ativo' | 'Inativo' | 'Em análise' | 'A ativar' | 'Standby';

export type StatusAgendamentoCliente = 'Agendado' | 'Não Agendado' | 'Confirmado' | 'Agendar' | 'Previsto';

export type TipoPedidoAgendamento = 'Padrão' | 'Alterado' | 'Único';

export type TipoLogisticaNome = 'Própria' | 'Terceirizada';

export type TipoCobranca = 'À vista' | 'Faturado';

export type FormaPagamentoNome = 'Boleto' | 'Cartão' | 'Dinheiro' | 'PIX';

export type SubstatusPedidoAgendado = 'Agendado' | 'Confirmado' | 'Produzindo' | 'Pronto';

export type ProdutoCategoria = {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
};

export type ProdutoSubcategoria = {
  id: number;
  nome: string;
  descricao?: string;
  categoria_id: number;
  ativo: boolean;
};

export interface Cliente {
  id: string;
  nome: string;
  cnpjCpf: string;
  enderecoEntrega: string;
  contatoNome: string;
  contatoTelefone: string;
  contatoEmail: string;
  quantidadePadrao: number;
  periodicidadePadrao: number;
  statusCliente: StatusCliente;
  metaGiroSemanal: number;
  categoriaEstabelecimentoId: number | null;
  janelasEntrega: string[];
  instrucoesEntrega: string;
  tipoLogistica: TipoLogisticaNome;
  contabilizarGiroMedio: boolean;
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;
  observacoes: string;
  categoriasHabilitadas: number[];
  ativo: boolean;
  giroMedioSemanal: number;
  ultimaDataReposicaoEfetiva?: Date;
  statusAgendamento: StatusAgendamentoCliente;
  proximaDataReposicao?: Date;
  dataCadastro: Date;
  categoriaId: number;
  subcategoriaId: number;
  representanteId?: number;
}

export type StatusPedido = 'Pendente' | 'Confirmado' | 'Em Produção' | 'Pronto' | 'Em Trânsito' | 'Entregue' | 'Cancelado' | 'Finalizado' | 'Agendado';

export interface ItemPedido {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  // Legacy properties for backward compatibility
  nomeSabor?: string;
  idSabor?: string;
  quantidadeSabor?: number;
  sabor?: {
    nome: string;
  };
}

export interface Pedido {
  id: string;
  idCliente: string;
  clienteId: string;
  cliente?: Cliente;
  dataPedido: Date;
  dataPrevistaEntrega: Date;
  status: StatusPedido;
  statusPedido: StatusPedido;
  valorTotal: number;
  observacoes: string;
  itensPedido: ItemPedido[];
  itens: ItemPedido[];
  dataEntrega?: Date;
  enderecoEntrega: string;
  contatoEntrega: string;
  numeroPedidoCliente: string;
  totalPedidoUnidades: number;
  createdAt: Date;
  updatedAt?: Date;
  tipoPedido?: TipoPedidoAgendamento;
}

export type DiaSemana = 'Domingo' | 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado';

export interface JanelaEntrega {
  diaSemana: DiaSemana;
  horarioInicio: string;
  horarioFim: string;
}
