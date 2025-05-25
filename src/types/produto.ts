
export type CategoriaInsumo = 'Matéria Prima' | 'Embalagem' | 'Outros';
export type UnidadeMedida = 'g' | 'kg' | 'ml' | 'l' | 'un' | 'pct';

export interface Insumo {
  id: number;
  nome: string;
  categoria: CategoriaInsumo;
  volumeBruto: number;
  unidadeMedida: UnidadeMedida;
  custoMedio: number;
  custoUnitario: number;
}

export interface ItemReceita {
  id: number;
  idReceita: number;
  idInsumo: number;
  nomeInsumo: string;
  quantidade: number;
  unidadeMedida: UnidadeMedida;
  custoParcial: number;
  custo?: number;
  insumo?: Insumo;
}

export interface ReceitaBase {
  id: number;
  nome: string;
  descricao?: string;
  rendimento: number;
  unidadeRendimento: string;
  itensReceita: ItemReceita[];
  custoTotal: number;
  custoUnitario: number;
  pesoTotal?: number;
}

export type TipoComponente = 'Receita' | 'Insumo';

export interface ComponenteProduto {
  id: number;
  idProduto: number;
  idReceita: number;
  nomeReceita: string;
  quantidade: number;
  custoParcial: number;
  tipo?: TipoComponente;
  idItem?: number;
  nome?: string;
  custo?: number;
}

// Product category types
export interface ProdutoSubcategoria {
  id: number;
  nome: string;
  categoriaId: number;
  quantidadeProdutos: number;
}

export interface ProdutoCategoria {
  id: number;
  nome: string;
  descricao?: string;
  subcategorias: ProdutoSubcategoria[];
  quantidadeProdutos: number;
}

// Update Produto interface to include category and subcategory
export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  precoVenda: number;
  custoTotal: number;
  margemLucro: number; // em porcentagem
  componentes: ComponenteProduto[];
  ativo: boolean;
  pesoUnitario?: number;
  custoUnitario?: number;
  unidadesProducao?: number;
  categoria?: string; // Added category field
  estoqueMinimo?: number; // Added estoqueMinimo field
  categoriaId: number;
  subcategoriaId: number;
}

export interface Sabor {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  custoUnitario: number;
  precoVenda: number;
  estoqueMinimo: number;
  estoqueIdeal: number;
  saldoAtual: number;
  emProducao: number;
  idReceitaBase?: number;
  nomeReceitaBase?: string;
  percentualPadraoDist?: number;
}
