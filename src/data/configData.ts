
import {
  Representante,
  RotaEntrega,
  CategoriaEstabelecimento,
  TipoLogistica,
  FormaPagamento,
  ConfiguracoesProducao,
  CategoriaInsumoParam,
  Sabor
} from "@/types";

export const representantes: Representante[] = [
  {
    id: 1,
    nome: "João da Silva",
    email: "joao.silva@example.com",
    telefone: "555-1234",
    ativo: true,
    comissao: 0.05
  },
  {
    id: 2,
    nome: "Maria Souza",
    email: "maria.souza@example.com",
    telefone: "555-5678",
    ativo: true,
    comissao: 0.07
  },
  {
    id: 3,
    nome: "Carlos Pereira",
    email: "carlos.pereira@example.com",
    telefone: "555-9012",
    ativo: false,
    comissao: 0.06
  }
];

export const rotasEntrega: RotaEntrega[] = [
  {
    id: 1,
    nome: "Rota Norte",
    descricao: "Entrega na região norte da cidade",
    ativo: true,
    diasSemana: ["Seg", "Qua", "Sex"],
    horarioInicio: "08:00",
    horarioFim: "12:00"
  },
  {
    id: 2,
    nome: "Rota Sul",
    descricao: "Entrega na região sul da cidade",
    ativo: true,
    diasSemana: ["Ter", "Qui", "Sáb"],
    horarioInicio: "13:00",
    horarioFim: "17:00"
  },
  {
    id: 3,
    nome: "Rota Leste",
    descricao: "Entrega na região leste da cidade",
    ativo: false,
    diasSemana: ["Seg", "Qua", "Sex"],
    horarioInicio: "09:00",
    horarioFim: "13:00"
  }
];

export const categoriasEstabelecimento: CategoriaEstabelecimento[] = [
  {
    id: 1,
    nome: "Restaurante",
    descricao: "Estabelecimento que serve refeições",
    ativo: true
  },
  {
    id: 2,
    nome: "Cafeteria",
    descricao: "Estabelecimento especializado em cafés",
    ativo: true
  },
  {
    id: 3,
    nome: "Supermercado",
    descricao: "Estabelecimento que vende alimentos e outros produtos",
    ativo: false
  }
];

// Updated tiposLogistica with percentualLogistico
export const tiposLogistica: TipoLogistica[] = [
  {
    id: 1,
    nome: "Própria",
    descricao: "Entrega feita pela própria empresa",
    percentualLogistico: 10,
    ativo: true
  },
  {
    id: 2,
    nome: "Distribuição",
    descricao: "Entrega feita por parceiro de distribuição",
    percentualLogistico: 15,
    ativo: true
  },
  {
    id: 3,
    nome: "Retirada",
    descricao: "Cliente retira na empresa",
    percentualLogistico: 0,
    ativo: false
  }
];

export const formasPagamento: FormaPagamento[] = [
  {
    id: 1,
    nome: "Boleto",
    descricao: "Pagamento via boleto bancário",
    ativo: true
  },
  {
    id: 2,
    nome: "PIX",
    descricao: "Pagamento via PIX",
    ativo: true
  },
  {
    id: 3,
    nome: "Dinheiro",
    descricao: "Pagamento em dinheiro",
    ativo: false
  }
];

export const configuracoesProducao: ConfiguracoesProducao = {
  tempoPreparoPadrao: 30,
  custoHoraProducao: 50.00,
  margemLucroDesejada: 30,
  margemLucroPadrao: 40,
  incluirPedidosPrevistos: true,
  formasPorLote: 10,
  unidadesPorForma: 6,
  percentualPedidosPrevistos: 20,
  tempoMedioPorFornada: 60,
  unidadesBrowniePorForma: 12,
  formasPorFornada: 4
};

export const categoriasInsumoParam: CategoriaInsumoParam[] = [
  {
    id: 1,
    nome: "Ingredientes",
    descricao: "Insumos utilizados nas receitas",
    ativo: true,
    quantidadeItensVinculados: 5
  },
  {
    id: 2,
    nome: "Embalagens",
    descricao: "Embalagens para os produtos",
    ativo: true,
    quantidadeItensVinculados: 3
  },
  {
    id: 3,
    nome: "Outros",
    descricao: "Outros insumos não categorizados",
    ativo: false,
    quantidadeItensVinculados: 2
  }
];

export const saboresMock: Sabor[] = [
  {
    id: 1,
    nome: "Chocolate",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 2,
    nome: "Doce de Leite",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 3,
    nome: "Nutella",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 4,
    nome: "Coco",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 5,
    nome: "Morango",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 6,
    nome: "Limão",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 7,
    nome: "Maracujá",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 8,
    nome: "Café",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 9,
    nome: "Ovomaltine",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  },
  {
    id: 10,
    nome: "Romeu e Julieta",
    ativo: true,
    saldoAtual: 100,
    percentualPadraoDist: 10
  }
];
