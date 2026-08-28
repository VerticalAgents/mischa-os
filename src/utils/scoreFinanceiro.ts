/**
 * Score de comportamento de pagamento de um cliente.
 *
 * A ideia: cruzar, título a título, a data de vencimento com a data em que
 * foi efetivamente pago. Quem paga no prazo tem nota alta; quem atrasa, nota
 * baixa — e o quanto isso pesa depende do VALOR que atrasou, não da contagem
 * de títulos. Atrasar R$ 3.000 por vinte dias machuca o caixa muito mais do
 * que atrasar R$ 80 pelo mesmo período, e a nota precisa dizer isso.
 *
 * As três regras de negócio abaixo foram decididas com o dono; estão como
 * constantes nomeadas para poderem ser revistas sem caçar número solto.
 */

/** Folga em dias corridos. Boleto pago na sexta costuma compensar na segunda. */
export const TOLERANCIA_DIAS = 2;

/** Atraso médio ponderado que zera a nota de pagamento. */
export const ATRASO_QUE_ZERA = 30;

/** Desconto máximo por ter título vencido em aberto agora. */
export const PENALIDADE_MAXIMA_ABERTO = 30;

/** Mínimo de títulos pagos para a nota significar alguma coisa. */
export const MINIMO_DE_HISTORICO = 2;

export interface TituloFinanceiro {
  id: string;
  descricao?: string;
  valor: number;
  /** `yyyy-mm-dd` */
  dataVencimento: string;
  /** `yyyy-mm-dd`, ou nulo se ainda não foi pago. */
  dataLiquidacao: string | null;
  pago: boolean;
  formaPagamento?: string;
}

export type Classificacao = "excelente" | "bom" | "atencao" | "risco" | "sem-historico";

export interface ScoreFinanceiro {
  score: number | null;
  classificacao: Classificacao;
  /** Quantos títulos pagos sustentam a nota. */
  titulosPagos: number;
  /** Fatia do VALOR pago dentro do prazo (0–100). */
  percentualValorEmDia: number;
  /** Atraso médio em dias, ponderado por valor. */
  atrasoMedioPonderado: number;
  /** Pior atraso já registrado num pagamento. */
  maiorAtraso: number;
  valorPago: number;
  valorEmAberto: number;
  valorVencido: number;
  /** Dias de atraso do título vencido mais antigo ainda em aberto. */
  maiorAtrasoEmAberto: number;
  /** Títulos pagos, do mais recente para o mais antigo, com o atraso de cada. */
  pagamentos: { titulo: TituloFinanceiro; atraso: number }[];
  /** Faturamento real do período, sem projeção nenhuma. */
  faturamento: FaturamentoReal;
}

/**
 * O que o cliente realmente faturou, contado pelos títulos emitidos.
 *
 * Substitui a projeção que existia antes (média das últimas 12 semanas
 * multiplicada por 4,33): agora que existe histórico, o número medido vale
 * mais do que o número estimado.
 */
export interface FaturamentoReal {
  total: number;
  /** Total dividido pelos meses em que houve movimento — não pelos 12. */
  mediaMensal: number;
  ticketMedio: number;
  titulos: number;
  mesesComMovimento: number;
  /** `yyyy-mm` -> valor, do mais antigo para o mais recente. */
  porMes: { mes: string; valor: number }[];
}

/**
 * Agrupa por mês de vencimento (competência), não de pagamento: é quando a
 * venda aconteceu. Pagar em atraso não muda o mês em que se faturou.
 */
export function calcularFaturamentoReal(titulos: TituloFinanceiro[]): FaturamentoReal {
  const porMes = new Map<string, number>();
  let total = 0;

  titulos.forEach((t) => {
    const mes = t.dataVencimento.slice(0, 7);
    porMes.set(mes, (porMes.get(mes) || 0) + t.valor);
    total += t.valor;
  });

  const comVenda = [...porMes.keys()].sort();

  // Mês sem venda entra com zero, do primeiro ao último mês com movimento.
  // Pular o mês vazio faria a série parecer contínua e esconderia justamente o
  // que importa: o cliente que ficou um tempo sem comprar.
  const meses: { mes: string; valor: number }[] = [];
  if (comVenda.length > 0) {
    const [aI, mI] = comVenda[0].split("-").map(Number);
    const [aF, mF] = comVenda[comVenda.length - 1].split("-").map(Number);
    let ano = aI;
    let mes = mI;
    while (ano < aF || (ano === aF && mes <= mF)) {
      const chave = `${ano}-${String(mes).padStart(2, "0")}`;
      meses.push({ mes: chave, valor: porMes.get(chave) || 0 });
      mes += 1;
      if (mes > 12) {
        mes = 1;
        ano += 1;
      }
    }
  }

  return {
    total,
    // Média sobre os meses em que houve venda, não sobre os meses vazios: um
    // cliente que vendeu bem em 3 meses não tem média de 12.
    mediaMensal: comVenda.length > 0 ? total / comVenda.length : 0,
    ticketMedio: titulos.length > 0 ? total / titulos.length : 0,
    titulos: titulos.length,
    mesesComMovimento: comVenda.length,
    porMes: meses,
  };
}

const DIA = 86400000;

/** Diferença em dias entre duas datas `yyyy-mm-dd`, lidas como hora local. */
export const diasEntre = (deISO: string, ateISO: string): number =>
  Math.round(
    (new Date(`${ateISO}T00:00:00`).getTime() - new Date(`${deISO}T00:00:00`).getTime()) / DIA
  );

/**
 * Atraso que conta para a nota: o que passa da tolerância.
 *
 * Pagar antes do vencimento não gera crédito — não existe nota acima de 100.
 * O que se mede é o quanto se passou do combinado.
 */
export const atrasoEfetivo = (dias: number): number => Math.max(0, dias - TOLERANCIA_DIAS);

const classificar = (score: number): Classificacao => {
  if (score >= 85) return "excelente";
  if (score >= 70) return "bom";
  if (score >= 50) return "atencao";
  return "risco";
};

const ORDEM: Classificacao[] = ["risco", "atencao", "bom", "excelente"];

/**
 * Teto de classificação para quem está devendo AGORA.
 *
 * Só descontar pontos não bastava: um cliente com histórico impecável e um
 * título vencido há dois meses ainda terminava rotulado como "Bom" — e o
 * rótulo é o que se lê primeiro, antes do número. Dívida em aberto limita o
 * quanto o passado pode abonar o presente.
 */
const limitarPorVencido = (
  classificacao: Classificacao,
  diasVencidoEmAberto: number
): Classificacao => {
  const atraso = atrasoEfetivo(diasVencidoEmAberto);
  if (atraso <= 0) return classificacao;

  const teto: Classificacao = atraso > 30 ? "risco" : atraso > 15 ? "atencao" : "bom";
  return ORDEM.indexOf(classificacao) > ORDEM.indexOf(teto) ? teto : classificacao;
};

export const ROTULO_CLASSIFICACAO: Record<Classificacao, string> = {
  excelente: "Excelente",
  bom: "Bom",
  atencao: "Atenção",
  risco: "Risco",
  "sem-historico": "Sem histórico",
};

/**
 * Calcula o score a partir dos títulos do cliente.
 *
 * `hojeISO` entra por parâmetro em vez de ser lido do relógio aqui dentro:
 * é o que torna a função testável e o que evita a armadilha de fuso que já
 * apareceu neste app (ver `utils/dataLocal`).
 */
export function calcularScoreFinanceiro(
  titulos: TituloFinanceiro[],
  hojeISO: string
): ScoreFinanceiro {
  const pagos = titulos.filter((t) => t.pago && t.dataLiquidacao);
  const abertos = titulos.filter((t) => !t.pago);

  const pagamentos = pagos
    .map((titulo) => ({
      titulo,
      atraso: diasEntre(titulo.dataVencimento, titulo.dataLiquidacao as string),
    }))
    .sort((a, b) =>
      (b.titulo.dataLiquidacao as string).localeCompare(a.titulo.dataLiquidacao as string)
    );

  const valorPago = pagos.reduce((s, t) => s + t.valor, 0);

  // Média do atraso ponderada pelo valor: cada real atrasado pesa igual, então
  // um título grande domina o resultado — que é justamente a intenção.
  const somaPonderada = pagamentos.reduce(
    (s, p) => s + p.titulo.valor * atrasoEfetivo(p.atraso),
    0
  );
  const atrasoMedioPonderado = valorPago > 0 ? somaPonderada / valorPago : 0;

  const valorEmDia = pagamentos
    .filter((p) => atrasoEfetivo(p.atraso) === 0)
    .reduce((s, p) => s + p.titulo.valor, 0);
  const percentualValorEmDia = valorPago > 0 ? (valorEmDia / valorPago) * 100 : 0;

  const maiorAtraso = pagamentos.reduce((m, p) => Math.max(m, p.atraso), 0);

  const valorEmAberto = abertos.reduce((s, t) => s + t.valor, 0);
  const vencidos = abertos.filter(
    (t) => atrasoEfetivo(diasEntre(t.dataVencimento, hojeISO)) > 0
  );
  const valorVencido = vencidos.reduce((s, t) => s + t.valor, 0);
  const maiorAtrasoEmAberto = vencidos.reduce(
    (m, t) => Math.max(m, diasEntre(t.dataVencimento, hojeISO)),
    0
  );

  const base = {
    titulosPagos: pagamentos.length,
    percentualValorEmDia,
    atrasoMedioPonderado,
    maiorAtraso,
    valorPago,
    valorEmAberto,
    valorVencido,
    maiorAtrasoEmAberto,
    pagamentos,
    faturamento: calcularFaturamentoReal(titulos),
  };

  // Sem histórico não se inventa nota: dois pagamentos não dizem nada sobre
  // um cliente, e uma nota fraca por falta de dado seria pior que nota nenhuma.
  if (pagamentos.length < MINIMO_DE_HISTORICO) {
    return { ...base, score: null, classificacao: "sem-historico" };
  }

  const notaPagamento = Math.max(
    0,
    100 - (atrasoMedioPonderado * 100) / ATRASO_QUE_ZERA
  );

  // O que está vencido AGORA pesa por fora: o histórico pode ser ótimo e o
  // cliente estar em atraso hoje — é isso que precisa saltar aos olhos.
  const penalidade = Math.min(PENALIDADE_MAXIMA_ABERTO, maiorAtrasoEmAberto);

  const score = Math.round(Math.max(0, Math.min(100, notaPagamento - penalidade)));

  return {
    ...base,
    score,
    classificacao: limitarPorVencido(classificar(score), maiorAtrasoEmAberto),
  };
}
