/**
 * Canal de venda de cada pedido: Revenda, Food service ou Terceirização.
 *
 * A regra tem dois passos, nesta ordem:
 *  1. o CLIENTE é terceirização (tipo 'INDUSTRIAL' ou 'AMBOS' no cadastro)? O pedido
 *     inteiro é terceirização, mesmo que os produtos sejam os da revenda — é o caso
 *     do Brownie da Mica, que leva o mesmo brownie com outro rótulo;
 *  2. senão, cada ITEM vai pela categoria do produto: Food Service (em kg, pelo peso
 *     do pacote) ou revenda. Pedido sem itens ("Padrão") é todo revenda, porque a
 *     proporção padrão só tem produto de revenda.
 */

export type Canal = 'revenda' | 'food_service' | 'terceirizacao';

/** id da categoria "Food Service" em categorias_produto. */
export const CATEGORIA_FOOD_SERVICE = 2;

/** Previsto com nota acima disto conta como "provável" (mesma régua do dashboard). */
export const SCORE_PROVAVEL = 85;

export interface ClienteCanal {
  id?: string;
  nome?: string;
  tipoCliente?: string | null;
}

export interface ProdutoCanal {
  id: string;
  nome: string;
  categoria_id?: number | null;
  /** gramas por unidade vendida (pacote, no food service) */
  peso_unitario?: number | null;
}

/** Item como vem do agendamento ({produto, quantidade}) ou da entrega ({produto_id, quantidade}). */
export interface ItemCanal {
  produto_id?: string | null;
  produto?: string | null;
  nome?: string | null;
  quantidade?: number | null;
}

export interface PedidoCanal {
  cliente?: ClienteCanal | null;
  quantidadeTotal?: number | null;
  itens?: ItemCanal[] | null;
}

export interface IndiceProdutos {
  porId: Map<string, ProdutoCanal>;
  porNome: Map<string, ProdutoCanal>;
}

export interface QuebraCanal {
  revendaUn: number;
  foodServicePct: number;
  foodServiceKg: number;
  terceirizacaoUn: number;
}

export const ehTerceirizacao = (cliente?: ClienteCanal | null): boolean => {
  const tipo = cliente?.tipoCliente ?? 'PDV';
  return tipo === 'INDUSTRIAL' || tipo === 'AMBOS';
};

export const indexarProdutos = (produtos: ProdutoCanal[]): IndiceProdutos => {
  const porId = new Map<string, ProdutoCanal>();
  const porNome = new Map<string, ProdutoCanal>();
  for (const p of produtos) {
    porId.set(p.id, p);
    porNome.set(p.nome.trim().toLowerCase(), p);
  }
  return { porId, porNome };
};

export const produtoDoItem = (item: ItemCanal, indice: IndiceProdutos): ProdutoCanal | undefined => {
  if (item.produto_id) {
    const porId = indice.porId.get(item.produto_id);
    if (porId) return porId;
  }
  const nome = (item.produto ?? item.nome ?? '').trim().toLowerCase();
  return nome ? indice.porNome.get(nome) : undefined;
};

/** Canal de um item, já sabendo de quem é o pedido. */
export const canalDoItem = (cliente: ClienteCanal | null | undefined, produto?: ProdutoCanal): Canal => {
  if (ehTerceirizacao(cliente)) return 'terceirizacao';
  return produto?.categoria_id === CATEGORIA_FOOD_SERVICE ? 'food_service' : 'revenda';
};

export const kgDoItem = (quantidade: number, produto?: ProdutoCanal): number =>
  (quantidade * (produto?.peso_unitario ?? 0)) / 1000;

export const quebrarPorCanal = (pedido: PedidoCanal, indice: IndiceProdutos): QuebraCanal => {
  const quebra: QuebraCanal = { revendaUn: 0, foodServicePct: 0, foodServiceKg: 0, terceirizacaoUn: 0 };
  const itens = (Array.isArray(pedido.itens) ? pedido.itens : []).filter(i => (i?.quantidade ?? 0) > 0);
  const somaItens = itens.reduce((s, i) => s + (i.quantidade ?? 0), 0);
  const total = pedido.quantidadeTotal || somaItens;

  if (ehTerceirizacao(pedido.cliente)) {
    quebra.terceirizacaoUn = total;
    return quebra;
  }
  if (itens.length === 0) {
    quebra.revendaUn = total;
    return quebra;
  }
  for (const item of itens) {
    const quantidade = item.quantidade ?? 0;
    const produto = produtoDoItem(item, indice);
    if (canalDoItem(pedido.cliente, produto) === 'food_service') {
      quebra.foodServicePct += quantidade;
      quebra.foodServiceKg += kgDoItem(quantidade, produto);
    } else {
      quebra.revendaUn += quantidade;
    }
  }
  return quebra;
};

/** Quanto do pedido é do canal, na unidade do canal (kg no food service, unidades nos outros). */
export const quantidadeNoCanal = (quebra: QuebraCanal, canal: Canal): number => {
  if (canal === 'food_service') return quebra.foodServiceKg;
  if (canal === 'terceirizacao') return quebra.terceirizacaoUn;
  return quebra.revendaUn;
};

export interface NumerosCanal {
  confirmadas: number;
  previstas: number;
  entregues: number;
  /** confirmadas + entregues + a parte das previstas que entra na conta */
  total: number;
}

export interface LinhaTerceirizacao extends NumerosCanal {
  id: string;
  nome: string;
}

export interface ResumoCanais {
  revenda: NumerosCanal;
  /** em kg */
  foodService: NumerosCanal;
  terceirizacao: NumerosCanal & { clientes: LinhaTerceirizacao[] };
}

export interface OpcoesPrevistos {
  incluirPrevistos: boolean;
  modo: 'provaveis' | 'percentual';
  percentual: number;
  /** nota de confirmação do cliente (0 a 100) */
  score: (clienteId: string) => number;
}

interface Acumulado {
  confirmadas: number;
  previstas: number;
  provaveis: number;
  entregues: number;
}

const zero = (): Acumulado => ({ confirmadas: 0, previstas: 0, provaveis: 0, entregues: 0 });

const fechar = (a: Acumulado, opcoes: OpcoesPrevistos): NumerosCanal => {
  let previstasNaConta = 0;
  if (opcoes.incluirPrevistos) {
    previstasNaConta = opcoes.modo === 'provaveis'
      ? a.provaveis
      : Math.ceil((a.previstas * opcoes.percentual) / 100);
  }
  return {
    confirmadas: a.confirmadas,
    previstas: a.previstas,
    entregues: a.entregues,
    total: a.confirmadas + a.entregues + previstasNaConta,
  };
};

/**
 * Números da semana por canal. O total de cada canal segue a regra que o dashboard
 * já usava no total geral: confirmadas + entregues + previstas prováveis (ou o
 * percentual simulado das previstas).
 */
export const resumoPorCanal = (
  dados: {
    confirmados: PedidoCanal[];
    previstos: PedidoCanal[];
    entregas: PedidoCanal[];
    /** clientes de terceirização que aparecem no card mesmo sem pedido na semana */
    clientesTerceirizacao?: ClienteCanal[];
  },
  indice: IndiceProdutos,
  opcoes: OpcoesPrevistos
): ResumoCanais => {
  const revenda = zero();
  const foodService = zero();
  const terceirizacao = zero();
  const porCliente = new Map<string, { nome: string; acumulado: Acumulado }>();

  const linhaDe = (cliente?: ClienteCanal | null) => {
    const id = cliente?.id ?? '';
    if (!porCliente.has(id)) porCliente.set(id, { nome: cliente?.nome ?? 'Cliente', acumulado: zero() });
    return porCliente.get(id)!.acumulado;
  };

  for (const c of dados.clientesTerceirizacao ?? []) linhaDe(c);

  const somar = (pedido: PedidoCanal, campo: keyof Acumulado) => {
    const q = quebrarPorCanal(pedido, indice);
    revenda[campo] += q.revendaUn;
    foodService[campo] += q.foodServiceKg;
    terceirizacao[campo] += q.terceirizacaoUn;
    if (q.terceirizacaoUn > 0) linhaDe(pedido.cliente)[campo] += q.terceirizacaoUn;
  };

  for (const p of dados.confirmados) somar(p, 'confirmadas');
  for (const p of dados.entregas) somar(p, 'entregues');
  for (const p of dados.previstos) {
    somar(p, 'previstas');
    if (opcoes.score(p.cliente?.id ?? '') > SCORE_PROVAVEL) somar(p, 'provaveis');
  }

  const clientes = Array.from(porCliente.entries())
    .map(([id, { nome, acumulado }]) => ({ id, nome, ...fechar(acumulado, opcoes), bruto: acumulado }))
    .sort((a, b) =>
      (b.bruto.confirmadas + b.bruto.previstas + b.bruto.entregues) -
      (a.bruto.confirmadas + a.bruto.previstas + a.bruto.entregues) ||
      a.nome.localeCompare(b.nome)
    )
    .map(({ bruto, ...linha }) => linha);

  return {
    revenda: fechar(revenda, opcoes),
    foodService: fechar(foodService, opcoes),
    terceirizacao: { ...fechar(terceirizacao, opcoes), clientes },
  };
};
