/**
 * Regras do pedido em displays (canal dos representantes da Imigração, 10/2026).
 *
 * Arquivo único, sem imports: a edge function `gestaoclick-proxy` e o app
 * (`src/utils/pedidoDisplays.ts`, que só reexporta) leem daqui, para a tabela de
 * faixas não existir duas vezes. A data de entrega também existe no banco
 * (`displays_data_entrega`): a que vale é a do banco, esta é a prévia da tela.
 */

export const UNIDADES_POR_DISPLAY = 18;
export const MINIMO_DISPLAYS = 2;
/** Só a categoria Revenda Padrão entra no preço por faixa. */
export const CATEGORIA_DISPLAYS = 1;
export const MODELO_DISPLAYS = 'displays';

export const SABORES = [
  'Brownie Avelã',
  'Brownie Stikadinho',
  'Brownie Choco Duo',
  'Brownie Tradicional',
  'Brownie Meio Amargo',
] as const;

/** O que vai dentro de um display sortido. Soma 18. */
export const SORTIDO: Record<string, number> = {
  'Brownie Avelã': 5,
  'Brownie Stikadinho': 5,
  'Brownie Choco Duo': 4,
  'Brownie Tradicional': 2,
  'Brownie Meio Amargo': 2,
};

/** Preço por brownie pela quantidade de displays da entrega, da maior faixa para a menor. */
export const FAIXAS = [
  { minimo: 8, preco: 4.75, rotulo: '8 ou mais' },
  { minimo: 6, preco: 4.8, rotulo: '6 a 7' },
  { minimo: 4, preco: 4.85, rotulo: '4 a 5' },
  { minimo: 2, preco: 4.95, rotulo: '2 a 3' },
];

export interface PedidoDisplays {
  sortido: number;
  /** Displays de um sabor só: nome do produto → quantos displays. */
  sabores: Record<string, number>;
}

export interface ItemPedido {
  produto: string;
  quantidade: number;
}

const inteiro = (n: unknown) => (Number.isFinite(Number(n)) ? Math.max(0, Math.trunc(Number(n))) : 0);

export function totalDisplays(pedido: PedidoDisplays): number {
  const deUmSabor = Object.values(pedido?.sabores ?? {}).reduce((s, n) => s + inteiro(n), 0);
  return inteiro(pedido?.sortido) + deUmSabor;
}

export function totalUnidades(pedido: PedidoDisplays): number {
  return totalDisplays(pedido) * UNIDADES_POR_DISPLAY;
}

/** Abre os displays em brownies por sabor, no formato de `itens_personalizados`. */
export function expandirParaItens(pedido: PedidoDisplays): ItemPedido[] {
  const sortidos = inteiro(pedido?.sortido);
  return SABORES.map((produto) => ({
    produto,
    quantidade:
      sortidos * (SORTIDO[produto] ?? 0) + inteiro(pedido?.sabores?.[produto]) * UNIDADES_POR_DISPLAY,
  })).filter((item) => item.quantidade > 0);
}

export function faixaPorDisplays(displays: number) {
  return FAIXAS.find((f) => displays >= f.minimo) ?? FAIXAS[FAIXAS.length - 1];
}

/** Abaixo do mínimo cai na primeira faixa: quem barra pedido pequeno é a validação, não o preço. */
export function precoPorDisplays(displays: number): number {
  return faixaPorDisplays(displays).preco;
}

export function validarPedido(pedido: PedidoDisplays): { ok: boolean; erro?: string } {
  const desconhecido = Object.keys(pedido?.sabores ?? {}).find(
    (nome) => inteiro(pedido.sabores[nome]) > 0 && !(SABORES as readonly string[]).includes(nome),
  );
  if (desconhecido) return { ok: false, erro: `Sabor fora do canal: ${desconhecido}` };
  const displays = totalDisplays(pedido);
  if (displays < MINIMO_DISPLAYS) {
    return {
      ok: false,
      erro: `O pedido mínimo é de ${MINIMO_DISPLAYS} displays (${MINIMO_DISPLAYS * UNIDADES_POR_DISPLAY} brownies).`,
    };
  }
  return { ok: true };
}

/**
 * Preço unitário de um item na hora de montar a venda. Devolve `precoAtual` sem
 * mexer quando o cliente não é de displays ou a categoria não é a Revenda Padrão.
 */
export function precoUnitarioDisplays(args: {
  modeloPedido?: string | null;
  categoriaId?: number | null;
  /** Brownies da categoria Revenda Padrão nesta entrega. */
  unidadesDaCategoria: number;
  precoAtual: number;
}): number {
  if (args.modeloPedido !== MODELO_DISPLAYS) return args.precoAtual;
  if (Number(args.categoriaId) !== CATEGORIA_DISPLAYS) return args.precoAtual;
  return precoPorDisplays(Math.floor(inteiro(args.unidadesDaCategoria) / UNIDADES_POR_DISPLAY));
}

export const PRAZO_BOLETO_PADRAO = 7;
export const PRAZO_BOLETO_MAIOR = 14;
/** Pedido de 4 displays ou mais (o dobro do mínimo) pode ter o prazo maior. */
export const DISPLAYS_PARA_PRAZO_MAIOR = 4;
export const PEDIDOS_QUITADOS_PARA_PRAZO_MAIOR = 3;
/** Boleto vencido há este tanto de dias, ou mais, segura pedido novo do cliente. */
export const DIAS_DE_ATRASO_QUE_BLOQUEIAM = 2;

/**
 * Prazo do boleto, em dias. 14 só para pedido de 4 displays ou mais de cliente que já
 * teve 3 pedidos entregues e pagos; no resto, 7. Pedido quitado = entregue e sem título
 * em aberto: quem deve um boleto de pedido já entregue ainda não tem esse pedido quitado.
 */
export function prazoDoBoleto(args: { displays: number; entregasFeitas: number; titulosEmAberto: number }): number {
  const quitados = inteiro(args.entregasFeitas) - inteiro(args.titulosEmAberto);
  return inteiro(args.displays) >= DISPLAYS_PARA_PRAZO_MAIOR && quitados >= PEDIDOS_QUITADOS_PARA_PRAZO_MAIOR
    ? PRAZO_BOLETO_MAIOR
    : PRAZO_BOLETO_PADRAO;
}

export function atrasoBloqueiaPedido(diasDeAtraso: number): boolean {
  return inteiro(diasDeAtraso) >= DIAS_DE_ATRASO_QUE_BLOQUEIAM;
}

/** Data, hora e dia da semana (0 = domingo) em São Paulo, sem depender do fuso de quem roda. */
export function agoraEmSaoPaulo(agora: Date = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(agora);
  const p = (tipo: string) => Number(partes.find((x) => x.type === tipo)?.value);
  const ano = p('year');
  const mes = p('month');
  const dia = p('day');
  return { ano, mes, dia, hora: p('hour'), diaSemana: new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay() };
}

export const HORA_DE_CORTE = 14;

/**
 * Dia da entrega (AAAA-MM-DD) de um pedido lançado em `agora`.
 * Pedido depois das 14h conta como do dia seguinte. Daí: de sexta a terça
 * entra na quarta; de quarta e quinta, na sexta.
 */
export function dataEntrega(agora: Date = new Date()): string {
  const sp = agoraEmSaoPaulo(agora);
  const base = new Date(Date.UTC(sp.ano, sp.mes - 1, sp.dia));
  if (sp.hora >= HORA_DE_CORTE) base.setUTCDate(base.getUTCDate() + 1);
  const dia = base.getUTCDay();
  const QUARTA = 3;
  const SEXTA = 5;
  const alvo = dia === 3 || dia === 4 ? SEXTA : QUARTA;
  let faltam = (alvo - dia + 7) % 7;
  if (faltam === 0) faltam = 7;
  base.setUTCDate(base.getUTCDate() + faltam);
  return base.toISOString().slice(0, 10);
}
