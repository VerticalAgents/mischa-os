export type Representante = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
};

export type RotaEntrega = {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
};

export type CategoriaEstabelecimento = {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
};

export type TipoLogistica = {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
};

export type FormaPagamento = {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
};

export type ConfiguracoesProducao = {
  tempoPreparoPadrao: number;
  custoHoraProducao: number;
  margemLucroDesejada: number;
};

export type CategoriaInsumoParam = {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  quantidadeItensVinculados?: number;
};
