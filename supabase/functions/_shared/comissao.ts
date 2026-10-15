/**
 * Comissão dos representantes (Tiago e Luis, canal da Imigração, 10/2026).
 *
 * Regra do Lucca (15/10/2026, em mischas/contexto/comercial.md):
 * - conta a DATA DE EMISSÃO da nota fiscal no Gestão Click;
 * - nota emitida do dia 1 ao 15 paga no dia 16; do 16 ao fim do mês, no dia 1º
 *   do mês seguinte. Fim de semana não muda a data;
 * - paga pelo faturado, sem esperar o ponto de venda pagar. O boleto vencido há
 *   2 dias ou mais e não pago vira desconto na quinzena que fecha; se o ponto de
 *   venda pagar depois, o valor volta como crédito;
 * - bonificação e troca não vão para a nota de venda, então não entram. Só conta
 *   nota Aprovada ou Corrigida de CFOP 5102 (contexto/erp-gestaoclick.md).
 *
 * Arquivo único, sem imports: a edge function `gestaoclick-proxy` e o app
 * (`src/utils/comissao.ts`, que só reexporta) leem daqui. Dinheiro em centavos,
 * datas em texto AAAA-MM-DD (sem fuso).
 */

export const CFOP_VENDA = '5102';
export const SITUACOES_FATURADAS = ['Aprovada', 'Corrigida'];
/** Mesma régua do bloqueio por atraso do pedido do representante. */
export const DIAS_ATRASO_PARA_DESCONTO = 2;
/** Plano de contas "Comissão de vendedores" no Gestão Click. */
export const PLANO_CONTAS_COMISSAO = '29194743';

export interface Quinzena {
  inicio: string;
  fim: string;
  /** Dia em que a comissão da quinzena é paga. */
  pagamento: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (a: number, m: number, d: number) => `${a}-${pad(m)}-${pad(d)}`;

function partes(data: string): [number, number, number] {
  const [a, m, d] = data.slice(0, 10).split('-').map(Number);
  return [a, m, d];
}

export function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function quinzenaDe(data: string): Quinzena {
  const [a, m, d] = partes(data);
  if (d <= 15) {
    return { inicio: iso(a, m, 1), fim: iso(a, m, 15), pagamento: iso(a, m, 16) };
  }
  const [pa, pm] = m === 12 ? [a + 1, 1] : [a, m + 1];
  return { inicio: iso(a, m, 16), fim: iso(a, m, ultimoDiaDoMes(a, m)), pagamento: iso(pa, pm, 1) };
}

export function quinzenaAnterior(q: Quinzena): Quinzena {
  const [a, m, d] = partes(q.inicio);
  if (d === 16) return quinzenaDe(iso(a, m, 15));
  const [pa, pm] = m === 1 ? [a - 1, 12] : [a, m - 1];
  return quinzenaDe(iso(pa, pm, 16));
}

/** A quinzena só pode ser lançada depois do último dia dela. */
export function quinzenaFechada(q: Quinzena, hoje: string): boolean {
  return hoje.slice(0, 10) > q.fim;
}

/** As últimas `n` quinzenas até a de hoje, da mais nova para a mais velha. */
export function quinzenasAte(hoje: string, n: number): Quinzena[] {
  const lista = [quinzenaDe(hoje)];
  while (lista.length < n) lista.push(quinzenaAnterior(lista[lista.length - 1]));
  return lista;
}

export function diasEntre(de: string, ate: string): number {
  const [a1, m1, d1] = partes(de);
  const [a2, m2, d2] = partes(ate);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

export interface NotaGC {
  situacao_nf?: string;
  codigo_cfop?: string;
  data_emissao?: string;
  produtos?: Array<{ cfop?: string; quantidade?: string | number }>;
}

/** Nota de venda faturada: Aprovada ou Corrigida, CFOP 5102. Cancelada fica fora. */
export function notaConta(nota: NotaGC): boolean {
  return SITUACOES_FATURADAS.includes(nota.situacao_nf ?? '') && nota.codigo_cfop === CFOP_VENDA;
}

/** Brownies vendidos na nota: soma dos itens de CFOP 5102. */
export function unidadesDaNota(nota: NotaGC): number {
  return (nota.produtos ?? [])
    .filter((p) => (p.cfop ?? CFOP_VENDA) === CFOP_VENDA)
    .reduce((s, p) => s + Math.round(Number(p.quantidade) || 0), 0);
}

export function centavos(valor: number | string): number {
  return Math.round((Number(valor) || 0) * 100);
}

export function comissaoEmCentavos(unidades: number, valorPorUnidade: number | string): number {
  return unidades * centavos(valorPorUnidade);
}

export type SituacaoBoleto = 'pago' | 'em_dia' | 'atrasado' | 'sem_boleto';

export interface Boleto {
  data_vencimento: string;
  liquidado: string | boolean;
}

/** Um boleto só é "atrasado" (vira desconto) depois de 2 dias vencido. */
export function situacaoDoBoleto(boletos: Boleto[], hoje: string): SituacaoBoleto {
  if (!boletos.length) return 'sem_boleto';
  const pago = (b: Boleto) => b.liquidado === true || b.liquidado === '1';
  if (boletos.every(pago)) return 'pago';
  const atrasado = boletos.some(
    (b) => !pago(b) && diasEntre(b.data_vencimento, hoje) >= DIAS_ATRASO_PARA_DESCONTO,
  );
  return atrasado ? 'atrasado' : 'em_dia';
}

/**
 * Boleto vencido que ainda não virou desconto: quantos dias faltam para virar.
 * null quando não há boleto vencido em aberto (ou quando já passou dos 2 dias).
 */
export function diasParaVirarDesconto(boletos: Boleto[], hoje: string): number | null {
  const pago = (b: Boleto) => b.liquidado === true || b.liquidado === '1';
  const vencidos = boletos
    .filter((b) => !pago(b))
    .map((b) => diasEntre(b.data_vencimento, hoje))
    .filter((d) => d >= 1 && d < DIAS_ATRASO_PARA_DESCONTO);
  if (!vencidos.length) return null;
  return DIAS_ATRASO_PARA_DESCONTO - Math.max(...vencidos);
}

export type SituacaoDaConta = 'recebida' | 'a_receber' | 'atrasada';

/** A conta a pagar da comissão, vista pelo representante. */
export function situacaoDaConta(conta: { liquidado: string | boolean; data_vencimento: string }, hoje: string): SituacaoDaConta {
  if (conta.liquidado === true || conta.liquidado === '1') return 'recebida';
  return hoje.slice(0, 10) > conta.data_vencimento ? 'atrasada' : 'a_receber';
}

export interface NotaComissionada {
  /** Já foi descontada num fechamento anterior e ainda não voltou. */
  descontada: boolean;
  situacao: SituacaoBoleto;
}

/** O que fazer com uma nota já paga ao representante, no fechamento de hoje. */
export function acertoDaNota(n: NotaComissionada): 'descontar' | 'devolver' | null {
  if (!n.descontada && n.situacao === 'atrasado') return 'descontar';
  if (n.descontada && n.situacao === 'pago') return 'devolver';
  return null;
}

export interface Fechamento {
  bruto: number;
  descontos: number;
  creditos: number;
  /** Desconto que sobrou de uma quinzena que deu negativo. */
  saldoAnterior: number;
  liquido: number;
  /** O que passa para a próxima quinzena se o líquido daria negativo. */
  saldoProximo: number;
}

/** Tudo em centavos. O líquido nunca fica negativo: o resto passa adiante. */
export function fecharQuinzena(p: {
  bruto: number;
  descontos: number;
  creditos: number;
  saldoAnterior?: number;
}): Fechamento {
  const saldoAnterior = p.saldoAnterior ?? 0;
  const conta = p.bruto - p.descontos + p.creditos - saldoAnterior;
  return {
    bruto: p.bruto,
    descontos: p.descontos,
    creditos: p.creditos,
    saldoAnterior,
    liquido: Math.max(conta, 0),
    saldoProximo: Math.max(-conta, 0),
  };
}

const dm = (data: string) => {
  const [, m, d] = partes(data);
  return `${pad(d)}/${pad(m)}`;
};

/** Descrição da conta a pagar no Gestão Click. */
export function descricaoDaConta(
  nomeRepresentante: string,
  q: Quinzena,
  notas: number,
  unidades: number,
  parcial = false,
): string {
  const ano = q.fim.slice(0, 4);
  const base = `Comissão ${nomeRepresentante} ${dm(q.inicio)} a ${dm(q.fim)}/${ano} (${notas} ${notas === 1 ? 'nota' : 'notas'}, ${unidades} brownies)`;
  return parcial ? `${base}, parcial` : base;
}
