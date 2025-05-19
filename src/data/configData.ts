
import { 
  Representante, 
  RotaEntrega, 
  CategoriaEstabelecimento, 
  TipoLogistica, 
  FormaPagamento,
  ConfiguracoesProducao,
  CategoriaInsumoParam
} from '@/types';

export const representantesMock: Representante[] = [
  {
    id: 1,
    nome: "João da Silva",
    email: "joao.silva@example.com",
    telefone: "1199999999",
    ativo: true,
    comissao: 0.05
  },
  {
    id: 2,
    nome: "Maria Souza",
    email: "maria.souza@example.com",
    telefone: "2198888888",
    ativo: false,
    comissao: 0.07
  },
  {
    id: 3,
    nome: "José Santos",
    email: "jose.santos@example.com",
    telefone: "3197777777",
    ativo: true,
    comissao: 0.06
  }
];

export const rotasEntregaMock: RotaEntrega[] = [
  {
    id: 1,
    nome: "Rota Centro",
    diasSemana: ["Segunda", "Quarta", "Sexta"],
    horarioInicio: "08:00",
    horarioFim: "12:00",
    descricao: "Rota do centro da cidade",
    ativo: true
  },
  {
    id: 2,
    nome: "Rota Norte",
    diasSemana: ["Terça", "Quinta", "Sábado"],
    horarioInicio: "13:00",
    horarioFim: "17:00",
    descricao: "Rota da zona norte",
    ativo: true
  },
  {
    id: 3,
    nome: "Rota Sul",
    diasSemana: ["Segunda", "Quarta", "Sexta"],
    horarioInicio: "14:00",
    horarioFim: "18:00",
    descricao: "Rota da zona sul",
    ativo: false
  }
];

export const categoriasEstabelecimentoMock: CategoriaEstabelecimento[] = [
  {
    id: 1,
    nome: "Restaurante",
    descricao: "Estabelecimentos que servem refeições",
    ativo: true
  },
  {
    id: 2,
    nome: "Cafeteria",
    descricao: "Estabelecimentos que servem café e lanches rápidos",
    ativo: true
  },
  {
    id: 3,
    nome: "Supermercado",
    descricao: "Estabelecimentos que vendem alimentos e produtos diversos",
    ativo: false
  }
];

export const tiposLogisticaMock: TipoLogistica[] = [
  {
    id: 1,
    nome: "Entrega Própria",
    descricao: "Entrega realizada pela própria empresa",
    percentualLogistico: 5.0,
    ativo: true
  },
  {
    id: 2,
    nome: "Transportadora",
    descricao: "Entrega realizada por uma transportadora terceirizada",
    percentualLogistico: 8.0,
    ativo: true
  },
  {
    id: 3,
    nome: "Retirada no Local",
    descricao: "Cliente retira o produto no local",
    percentualLogistico: 0.0,
    ativo: false
  }
];

export const formasPagamentoMock: FormaPagamento[] = [
  {
    id: 1,
    nome: "Dinheiro",
    descricao: "Pagamento em dinheiro",
    ativo: true
  },
  {
    id: 2,
    nome: "Cartão de Crédito",
    descricao: "Pagamento com cartão de crédito",
    ativo: true
  },
  {
    id: 3,
    nome: "Boleto Bancário",
    descricao: "Pagamento com boleto bancário",
    ativo: false
  }
];

export const configuracoesProducaoMock: ConfiguracoesProducao = {
  tempoPreparoPadrao: 30,
  custoHoraProducao: 15.00,
  margemLucroDesejada: 0.30,
  margemLucroPadrao: 0.30
};

export const categoriasInsumoMock: CategoriaInsumoParam[] = [
  {
    id: 1,
    nome: "Insumos de Produção",
    descricao: "Ingredientes utilizados no preparo de receitas",
    ativo: true,
    quantidadeItensVinculados: 15
  },
  {
    id: 2,
    nome: "Embalagens",
    descricao: "Caixas, potes, filmes e outros materiais para embalagem",
    ativo: true,
    quantidadeItensVinculados: 8
  },
  {
    id: 3,
    nome: "Outros Materiais",
    descricao: "Material de limpeza, escritório e itens diversos",
    ativo: true,
    quantidadeItensVinculados: 3
  }
];
