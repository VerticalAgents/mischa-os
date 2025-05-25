
import { Icons } from "@/components/icons"

export interface NavItem {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
  icon?: keyof typeof Icons
  label?: string
}

export interface NavLink extends Omit<NavItem, "icon"> {
  icon?: string
}

export interface SidebarNavItem extends NavItem {
  initialOpen?: boolean
  items: SidebarNavItem[]
}

export type DiaSemana = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';

export type StatusPedido = "Agendado" | "Em Separação" | "Reagendar" | "Previsto" | "Separado";

export type SubstatusPedidoAgendado = "Agendado" | "Separado" | "Despachado" | "Entregue" | "Retorno";

export type TipoPedido = "Normal" | "Reposição" | "Especial" | "Padrão" | "Alterado";

export type StatusCliente = "Ativo" | "Inativo" | "A ativar" | "Em análise" | "Standby";

export type TipoCobranca = "À vista" | "A prazo" | "Consignado";

export type TipoLogisticaNome = "Própria" | "Terceirizada" | "Distribuição";

export type FormaPagamentoNome = "Dinheiro" | "Cartão" | "Pix" | "Boleto";

export interface ItemPedido {
  id: number;
  idPedido: number;
  idSabor: number;
  nomeSabor: string;
  quantidadeSabor: number;
}

export interface AlteracaoStatusPedido {
  dataAlteracao: string | Date;
  statusAnterior: StatusPedido;
  statusNovo: StatusPedido;
  substatusAnterior?: SubstatusPedidoAgendado;
  substatusNovo?: SubstatusPedidoAgendado;
  observacao?: string;
}

export interface ConfiguracoesProducao {
  capacidadeForma: number;
  incluirPedidosPrevistos: boolean;
  percentualPrevistos: number;
}

export interface FormaPagamento {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface TipoLogistica {
  id: number;
  nome: string;
  percentualLogistico: number;
  ativo: boolean;
}

export interface Representante {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

export interface RotaEntrega {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export interface CategoriaEstabelecimento {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export type CategoriaInsumo = "Embalagem" | "Ingrediente" | "Outros";

export interface DashboardData {
  vendasTotais: number;
  pedidosAtivos: number;
  produtosEmEstoque: number;
  clientesAtivos: number;
  contadoresStatus: {
    agendados: number;
    separados: number;
    despachados: number;
    entregues: number;
    reagendar: number;
  };
  giroMedioSemanalPorPDV: Array<{
    nomeCliente: string;
    giroSemanal: number;
  }>;
}

export interface ProdutoCategoria {
  id: number;
  nome: string;
  descricao?: string;
  subcategorias: ProdutoSubcategoria[];
  quantidadeProdutos: number;
}

export interface ProdutoSubcategoria {
  id: number;
  nome: string;
  categoriaId: number;
  quantidadeProdutos: number;
}

export type TipoComponente = "Receita" | "Insumo";

export interface ComponenteProduto {
  id: number;
  idProduto: number;
  idReceita: number;
  nomeReceita: string;
  quantidade: number;
  custoParcial: number;
  tipo: TipoComponente;
  idItem: number;
  nome: string;
  custo: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  precoVenda: number;
  custoTotal: number;
  margemLucro: number;
  componentes: ComponenteProduto[];
  ativo: boolean;
  pesoUnitario: number;
  custoUnitario: number;
  unidadesProducao: number;
  categoria: string;
  estoqueMinimo: number;
  categoriaId: number;
  subcategoriaId: number;
}

export interface Insumo {
  id: number;
  nome: string;
  categoria: CategoriaInsumo;
  marca?: string;
  unidadeMedida: string;
  quantidadeEstoque: number;
  custoUnitario: number;
  dataUltimaCompra?: string;
  fornecedor?: string;
  observacoes?: string;
}

export interface Receita {
  id: number;
  nome: string;
  ingredientes: Ingrediente[];
  pesoTotal: number;
  custoTotal: number;
  rendimento: number;
  instrucoesPreparo?: string;
}

export interface Ingrediente {
  id: number;
  idReceita: number;
  nome: string;
  quantidade: number;
  unidadeMedida: string;
  custoUnitario: number;
}

export interface Pedido {
  id: number;
  idCliente: number;
  cliente?: Cliente;
  itensPedido: ItemPedido[];
  totalPedidoUnidades: number;
  dataCriacao: string;
  dataPedido?: string;
  dataPrevistaEntrega: string;
  dataEfetivaEntrega?: string;
  statusPedido: StatusPedido;
  substatusPedido?: SubstatusPedidoAgendado;
  observacoes?: string;
  tipoPedido?: TipoPedido;
  historicoAlteracoesStatus?: AlteracaoStatusPedido[];
}

export interface Cliente {
  id: number;
  nome: string;
  cnpjCpf: string;
  endereco?: string;
  enderecoEntrega?: string;
  telefone?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  email?: string;
  statusCliente: StatusCliente;
  statusAgendamento?: "Ativo" | "Pausado";
  dataCadastro: Date;
  proximaDataReposicao?: string;
  ultimaDataReposicaoEfetiva?: Date;
  quantidadePadrao: number;
  periodicidadePadrao: number;
  diasEntrega?: DiaSemana[];
  janelasEntrega?: DiaSemana[];
  contabilizarGiroMedio: boolean;
  giroMedioSemanal: number;
  metaGiroSemanal?: number;
  representante?: string;
  representanteId?: number;
  categoriaEstabelecimento?: string;
  categoriaEstabelecimentoId?: number;
  rotaEntregaId?: number;
  tipoLogistica: TipoLogisticaNome;
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;
  instrucoesEntrega?: string;
  observacoes?: string;
  ativo: boolean;
}
