export type StatusCliente = 'Ativo' | 'Inativo' | 'Em análise' | 'A ativar' | 'Standby';

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
  tipoLogistica: 'Própria' | 'Terceirizada';
  contabilizarGiroMedio: boolean;
  emiteNotaFiscal: boolean;
  tipoCobranca: 'À vista' | 'Faturado';
  formaPagamento: 'Boleto' | 'Cartão' | 'Dinheiro' | 'PIX';
  observacoes: string;
  categoriasHabilitadas: number[];
  ativo: boolean;
  giroMedioSemanal: number;
  ultimaDataReposicaoEfetiva?: Date;
  statusAgendamento: 'Agendado' | 'Não Agendado' | 'Confirmado';
  proximaDataReposicao?: Date;
  dataCadastro: Date;
  categoriaId: number;
  subcategoriaId: number;
}

export type StatusPedido = 'Pendente' | 'Confirmado' | 'Em Produção' | 'Pronto' | 'Em Trânsito' | 'Entregue' | 'Cancelado' | 'Finalizado';

export interface ItemPedido {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  preco: number;
  subtotal: number;
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
}

export type DiaSemana = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';

export interface JanelaEntrega {
  diaSemana: DiaSemana;
  horarioInicio: string;
  horarioFim: string;
}
