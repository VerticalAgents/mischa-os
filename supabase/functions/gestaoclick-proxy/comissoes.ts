/**
 * Aba Comissões: a conta de cada quinzena e o lançamento da conta a pagar no Gestão Click.
 * A regra pura está em ../_shared/comissao.ts; aqui só se lê o Gestão Click e o banco.
 *
 * - As notas vêm de GET /notas_fiscais_produtos (a API não filtra: lê-se a lista, que vem
 *   do id mais novo para o mais velho, até passar da quinzena mais antiga pedida).
 * - Entrega sem nota fiscal (cliente que paga em dinheiro na entrega, 15/10/2026) entra pelo
 *   historico_entregas do Mischa OS, na quinzena da DATA DA ENTREGA. A entrega cuja venda tem
 *   nota fica só com a nota, para não contar duas vezes.
 * - O boleto de cada nota é achado pela venda: nota.pedido_id -> /vendas/{id}.codigo ->
 *   recebimento com descrição "Venda de nº {codigo}".
 * - Pedido lançado e ainda sem nota (Lucca, 15/10/2026) é só previsão: aparece em `a_faturar`,
 *   na quinzena de hoje, e nunca entra no lançamento. Sai da lista quando a venda ganha nota ou a
 *   entrega é marcada como feita.
 * - Pode-se lançar parte das notas, a qualquer momento (Lucca, 15/10/2026); cada lançamento é
 *   uma conta a pagar. Lançar recalcula tudo aqui, não confia no que a tela mandou.
 */
import {
  PLANO_CONTAS_COMISSAO,
  type Quinzena,
  acertoDaNota,
  comissaoEmCentavos,
  descricaoDaConta,
  diasParaVirarDesconto,
  fecharQuinzena,
  notaConta,
  quinzenaDe,
  quinzenaFechada,
  quinzenasAte,
  situacaoDaConta,
  situacaoDoBoleto,
  unidadesDaNota,
} from '../_shared/comissao.ts';

const BASE = 'https://api.gestaoclick.com';
/** Antes disso não havia representante no canal: nada a pagar nem a mostrar. */
const INICIO_DO_CANAL = '2026-10-01';
/** Forma e conta copiadas do "Freela Fernando", que já sai em Comissão de vendedores. */
const FORMA_PIX = '5259708';
const CONTA_CAIXA = '604303';

export interface Tokens {
  access_token: string;
  secret_token: string;
}

async function gc(tokens: Tokens, path: string, init: RequestInit = {}): Promise<any> {
  const resp = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'access-token': tokens.access_token,
      'secret-access-token': tokens.secret_token,
    },
  });
  const texto = await resp.text();
  if (!resp.ok) throw new Error(`Gestão Click ${path}: ${resp.status} ${texto.slice(0, 200)}`);
  return texto ? JSON.parse(texto) : {};
}

async function paginado(tokens: Tokens, path: string, parar?: (pagina: any[]) => boolean): Promise<any[]> {
  const todos: any[] = [];
  for (let pagina = 1; pagina <= 60; pagina++) {
    const sep = path.includes('?') ? '&' : '?';
    const json = await gc(tokens, `${path}${sep}pagina=${pagina}`);
    const lista = json?.data || [];
    todos.push(...lista);
    if (!lista.length || !json?.meta?.proxima_pagina) break;
    if (parar?.(lista)) break;
  }
  return todos;
}

const hojeBR = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

interface Rep {
  id: number;
  nome: string;
  razao_social: string | null;
  gestaoclick_fornecedor_id: string | null;
  comissao_por_unidade: number;
}

export interface NotaDaQuinzena {
  nf_id: string;
  numero: string;
  cliente: string;
  gc_cliente_id: string;
  data_emissao: string;
  pedido_id: string;
  unidades: number;
  comissao: number;
  sem_nota: boolean;
  /** Já foi para uma conta a pagar: o código dela no Gestão Click ("" se fechou sem conta). */
  lancada_em: string | null;
}

export interface Acerto {
  nf_id: string;
  numero: string;
  cliente: string;
  data_emissao: string;
  vencimento: string | null;
  unidades: number;
  valor: number;
  tipo: 'descontar' | 'devolver';
}

export interface Lancamento {
  codigo: string | null;
  id: string | null;
  lancado_em: string;
  vencimento: string;
  liquido: number;
  notas: number;
  /** Lida no Gestão Click; null quando a conta não existe lá (lançamento sem valor). */
  situacao: 'recebida' | 'a_receber' | 'atrasada' | null;
  pago_em: string | null;
}

/** Boleto vencido há menos de 2 dias numa nota já paga ao representante: ainda dá para cobrar. */
export interface Risco {
  nf_id: string;
  numero: string;
  cliente: string;
  vencimento: string | null;
  valor: number;
  dias_para_desconto: number;
}

/** Pedido lançado que ainda não tem nota: comissão prevista, não entra no lançamento. */
export interface PedidoAFaturar {
  cliente: string;
  data_entrega: string | null;
  unidades: number;
  comissao: number;
  /** Quinzena em que deve entrar, pela data de entrega prevista. */
  quinzena: Quinzena | null;
  etapa: 'lancado' | 'separado' | 'venda_gerada';
  sem_nota: boolean;
}

export interface QuinzenaDoRep {
  representante_id: number;
  representante: string;
  razao_social: string | null;
  fornecedor_ok: boolean;
  quinzena: Quinzena;
  fechada: boolean;
  situacao: 'em_andamento' | 'pronta' | 'parcial' | 'lancada' | 'vazia';
  notas: NotaDaQuinzena[];
  unidades: number;
  /** Desconto e devolução de quinzenas anteriores; aparecem na quinzena mais antiga com algo a lançar. */
  acertos: Acerto[];
  /** Desconto que sobrou de um lançamento que daria negativo: entra no próximo lançamento. */
  saldo_pendente: number;
  bruto: number;
  lancado: number;
  lancamentos: Lancamento[];
  em_risco: Risco[];
  /** Só na quinzena de hoje. */
  a_faturar: PedidoAFaturar[];
}

async function carregarBase(supabase: any, representanteId?: number) {
  let consulta = supabase
    .from('representantes')
    .select('id, nome, razao_social, gestaoclick_fornecedor_id, comissao_por_unidade')
    .not('comissao_por_unidade', 'is', null);
  if (representanteId) consulta = consulta.eq('id', representanteId);
  const { data: reps, error } = await consulta;
  if (error) throw error;
  const ids = (reps || []).map((r: Rep) => r.id);
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, gestaoclick_cliente_id, representante_id, emite_nota_fiscal')
    .in('representante_id', ids.length ? ids : [-1]);
  const repDoCliente = new Map<string, number>();
  (clientes || []).forEach((c: any) => {
    if (c.gestaoclick_cliente_id) repDoCliente.set(String(c.gestaoclick_cliente_id), c.representante_id);
  });
  const { data: fechamentos } = await supabase
    .from('comissoes_fechamentos')
    .select('*')
    .in('representante_id', ids.length ? ids : [-1]);
  const { data: lancadas } = await supabase
    .from('comissoes_notas')
    .select('*')
    .in('representante_id', ids.length ? ids : [-1]);
  return { reps: (reps || []) as Rep[], repDoCliente, clientes: clientes || [], fechamentos: fechamentos || [], lancadas: lancadas || [] };
}

async function lerNotas(tokens: Tokens, desde: string) {
  return paginado(tokens, '/notas_fiscais_produtos', (pagina) =>
    pagina.every((n: any) => (n.data_emissao || '9999') < desde),
  );
}

/** Boletos em aberto e pagos, indexados pelo código da venda. */
async function lerBoletos(tokens: Tokens, desde: string, hoje: string) {
  const ate = new Date(Date.parse(hoje) + 90 * 86400000).toISOString().slice(0, 10);
  const lista = await paginado(tokens, `/recebimentos?data_inicio=${desde}&data_fim=${ate}`);
  const porVenda = new Map<string, Array<{ data_vencimento: string; liquidado: string }>>();
  for (const r of lista) {
    const m = String(r.descricao || '').match(/Venda de n[ºo°]\s*(\d+)/i);
    if (!m) continue;
    const arr = porVenda.get(m[1]) || [];
    arr.push({ data_vencimento: r.data_vencimento, liquidado: String(r.liquidado) });
    porVenda.set(m[1], arr);
  }
  return porVenda;
}

/**
 * Monta as quinzenas de cada representante. `quantas` conta da de hoje para trás.
 * Uma quinzena pode ter vários lançamentos: cada nota mostra se já foi lançada, e o resto
 * pode ser lançado depois.
 */
export async function montarQuinzenas(
  supabase: any,
  tokens: Tokens,
  opcoes: { hoje?: string; quantas?: number; representanteId?: number } = {},
): Promise<QuinzenaDoRep[]> {
  const hoje = opcoes.hoje || hojeBR();
  const quinzenas = quinzenasAte(hoje, opcoes.quantas ?? 4).filter((q) => q.fim >= INICIO_DO_CANAL);
  if (!quinzenas.length) return [];
  const maisAntiga = quinzenas[quinzenas.length - 1].inicio;
  const { reps, repDoCliente, clientes, fechamentos, lancadas } = await carregarBase(supabase, opcoes.representanteId);

  // Boletos só das notas já pagas ao representante que ainda podem virar desconto ou devolução.
  // Notas e boletos são lidos ao mesmo tempo: cada página do Gestão Click demora.
  const aConferir = lancadas.filter((n: any) => n.venda_codigo && !n.devolvida_em);
  const desdeBoletos = aConferir.reduce((m: string, n: any) => (n.data_emissao < m ? n.data_emissao : m), hoje);
  const [todasNotas, boletos] = await Promise.all([
    lerNotas(tokens, maisAntiga),
    aConferir.length ? lerBoletos(tokens, desdeBoletos, hoje) : Promise.resolve(new Map()),
  ]);
  const vendasComNota = new Set(todasNotas.map((n: any) => String(n.pedido_id || '')).filter(Boolean));
  const notasGC = todasNotas.filter((n: any) => notaConta(n) && repDoCliente.has(String(n.destinatario_id)));
  type Venda = Omit<NotaDaQuinzena, 'lancada_em'> & { representante_id: number };
  const vendas: Venda[] = notasGC.map((n: any) => {
    const rep = reps.find((r) => r.id === repDoCliente.get(String(n.destinatario_id)))!;
    const unidades = unidadesDaNota(n);
    return {
      representante_id: rep.id,
      nf_id: String(n.id),
      numero: String(n.numero_nf || ''),
      cliente: n.destinatario_nome || '',
      gc_cliente_id: String(n.destinatario_id),
      data_emissao: n.data_emissao,
      pedido_id: String(n.pedido_id || ''),
      unidades,
      comissao: comissaoEmCentavos(unidades, rep.comissao_por_unidade),
      sem_nota: false,
    };
  });

  // Entregas sem nota: o histórico do Mischa OS já traz só o vendido (sem bonificação e troca),
  // e só existe depois que a entrega foi marcada como feita.
  const clientePorId = new Map(clientes.map((c: any) => [c.id, c]));
  const vendasEntregues = new Set<string>();
  if (clientes.length) {
    const { data: entregas, error } = await supabase
      .from('historico_entregas')
      .select('id, cliente_id, data, quantidade, gestaoclick_venda_id, tipo, tipo_movimento')
      .in('cliente_id', clientes.map((c: any) => c.id))
      .gte('data', `${maisAntiga}T03:00:00Z`);
    if (error) throw error;
    for (const e of entregas || []) {
      if (e.gestaoclick_venda_id) vendasEntregues.add(String(e.gestaoclick_venda_id));
      if (e.tipo !== 'entrega' || (e.tipo_movimento ?? 'venda') !== 'venda') continue;
      if (e.gestaoclick_venda_id && vendasComNota.has(String(e.gestaoclick_venda_id))) continue;
      const c: any = clientePorId.get(e.cliente_id);
      const rep = reps.find((r) => r.id === c?.representante_id);
      if (!rep || !e.quantidade) continue;
      vendas.push({
        representante_id: rep.id,
        nf_id: `entrega:${e.id}`,
        numero: 'sem nota',
        cliente: c.nome || '',
        gc_cliente_id: String(c.gestaoclick_cliente_id || ''),
        data_emissao: new Date(Date.parse(e.data) - 3 * 3600 * 1000).toISOString().slice(0, 10),
        pedido_id: String(e.gestaoclick_venda_id || ''),
        unidades: e.quantidade,
        comissao: comissaoEmCentavos(e.quantidade, rep.comissao_por_unidade),
        sem_nota: true,
      });
    }
  }

  // Pedidos lançados e ainda sem nota nem entrega feita.
  const aFaturar = new Map<number, PedidoAFaturar[]>();
  if (clientes.length) {
    const { data: pedidos, error } = await supabase
      .from('agendamentos_clientes')
      .select('cliente_id, status_agendamento, separado_em, gestaoclick_venda_id, data_proxima_reposicao, quantidade_total')
      .in('cliente_id', clientes.map((c: any) => c.id))
      .eq('status_agendamento', 'Agendado');
    if (error) throw error;
    for (const a of pedidos || []) {
      const venda = String(a.gestaoclick_venda_id || '');
      if (venda && (vendasComNota.has(venda) || vendasEntregues.has(venda))) continue;
      const c: any = clientePorId.get(a.cliente_id);
      const rep = reps.find((r) => r.id === c?.representante_id);
      const unidades = Number(a.quantidade_total) || 0;
      if (!rep || !unidades) continue;
      const lista = aFaturar.get(rep.id) || [];
      lista.push({
        cliente: c.nome || '',
        data_entrega: a.data_proxima_reposicao || null,
        unidades,
        comissao: comissaoEmCentavos(unidades, rep.comissao_por_unidade),
        quinzena: a.data_proxima_reposicao ? quinzenaDe(a.data_proxima_reposicao) : null,
        etapa: venda ? 'venda_gerada' : a.separado_em ? 'separado' : 'lancado',
        sem_nota: c.emite_nota_fiscal === false,
      });
      aFaturar.set(rep.id, lista);
    }
  }

  const jaPagas = new Set(lancadas.map((n: any) => String(n.gestaoclick_nf_id)));
  const vendasPagas = new Set(lancadas.map((n: any) => String(n.gestaoclick_venda_id || '')).filter(Boolean));
  const fechPorId = new Map<number, any>(fechamentos.map((f: any) => [f.id, f]));

  // Situação de cada conta lançada, lida no Gestão Click (são poucas).
  const quinzenaMaisAntiga = quinzenas[quinzenas.length - 1].inicio;
  const contas = new Map<string, any>();
  await Promise.all(
    fechamentos
      .filter((f: any) => f.gestaoclick_pagamento_id && f.inicio >= quinzenaMaisAntiga)
      .map(async (f: any) => {
        try {
          const c = (await gc(tokens, `/pagamentos/${f.gestaoclick_pagamento_id}`))?.data;
          if (c) contas.set(String(f.gestaoclick_pagamento_id), c);
        } catch (_) {
          /* conta apagada ou API fora: fica sem situação */
        }
      }),
  );

  const saida: QuinzenaDoRep[] = [];
  for (const rep of reps) {
    const fechDoRep = fechamentos.filter((f: any) => f.representante_id === rep.id);
    const lancadasDoRep = lancadas.filter((n: any) => n.representante_id === rep.id);
    const saldoPendente = Math.max(
      fechDoRep.reduce((s: number, f: any) => s + f.saldo_proximo_centavos - f.saldo_anterior_centavos, 0),
      0,
    );

    const acertos: Acerto[] = [];
    for (const n of lancadasDoRep.filter((x: any) => !x.devolvida_em)) {
      const bs = n.venda_codigo ? boletos.get(String(n.venda_codigo)) || [] : [];
      const tipo = acertoDaNota({ descontada: !!n.descontada_em, situacao: situacaoDoBoleto(bs, hoje) });
      if (!tipo) continue;
      const aberto = bs.find((b: any) => b.liquidado !== '1');
      acertos.push({
        nf_id: n.gestaoclick_nf_id,
        numero: n.numero_nf,
        cliente: n.cliente_nome,
        data_emissao: n.data_emissao,
        vencimento: aberto?.data_vencimento || bs[0]?.data_vencimento || null,
        unidades: n.unidades,
        valor: n.comissao_centavos,
        tipo,
      });
    }

    const emRisco: Risco[] = [];
    for (const n of lancadasDoRep.filter((x: any) => !x.descontada_em && x.venda_codigo)) {
      const bs = boletos.get(String(n.venda_codigo)) || [];
      const dias = diasParaVirarDesconto(bs, hoje);
      if (dias === null) continue;
      emRisco.push({
        nf_id: n.gestaoclick_nf_id,
        numero: n.numero_nf,
        cliente: n.cliente_nome,
        vencimento: bs.find((b: any) => b.liquidado !== '1')?.data_vencimento || null,
        valor: n.comissao_centavos,
        dias_para_desconto: dias,
      });
    }

    const montadas = quinzenas.map((q) => {
      const daQuinzena = (d: string) => d >= q.inicio && d <= q.fim;
      const pendentes: NotaDaQuinzena[] = vendas
        .filter((n) => n.representante_id === rep.id && daQuinzena(n.data_emissao))
        .filter((n) => !jaPagas.has(n.nf_id) && !(n.pedido_id && vendasPagas.has(n.pedido_id)))
        .map(({ representante_id: _r, ...n }) => ({ ...n, lancada_em: null }));
      const jaLancadas: NotaDaQuinzena[] = lancadasDoRep
        .filter((n: any) => daQuinzena(n.data_emissao))
        .map((n: any) => ({
          nf_id: n.gestaoclick_nf_id,
          numero: n.numero_nf,
          cliente: n.cliente_nome,
          gc_cliente_id: n.gestaoclick_cliente_id,
          data_emissao: n.data_emissao,
          pedido_id: n.gestaoclick_venda_id || '',
          unidades: n.unidades,
          comissao: n.comissao_centavos,
          sem_nota: String(n.gestaoclick_nf_id).startsWith('entrega:') || n.numero_nf === 'sem nota',
          lancada_em: fechPorId.get(n.fechamento_id)?.gestaoclick_pagamento_codigo ?? '',
        }));
      const notas = [...jaLancadas, ...pendentes].sort(
        (a, b) => a.data_emissao.localeCompare(b.data_emissao) || a.numero.localeCompare(b.numero),
      );
      const lancamentos: Lancamento[] = fechDoRep
        .filter((f: any) => f.inicio === q.inicio)
        .sort((a: any, b: any) => a.lancado_em.localeCompare(b.lancado_em))
        .map((f: any) => ({
          codigo: f.gestaoclick_pagamento_codigo,
          id: f.gestaoclick_pagamento_id,
          lancado_em: f.lancado_em,
          vencimento: f.pagamento,
          liquido: f.liquido_centavos,
          notas: f.notas,
          ...(() => {
            const c = f.gestaoclick_pagamento_id ? contas.get(String(f.gestaoclick_pagamento_id)) : null;
            if (!c) return { situacao: null, pago_em: null };
            return {
              situacao: situacaoDaConta({ liquidado: String(c.liquidado), data_vencimento: c.data_vencimento }, hoje),
              pago_em: c.data_liquidacao || null,
            };
          })(),
        }));
      return { q, notas, pendentes, lancamentos, fechada: quinzenaFechada(q, hoje) };
    });

    // A quinzena que recebe os acertos: a mais antiga com algo a lançar, ou a de hoje.
    const alvoAcertos = [...montadas].reverse().find((m) => m.pendentes.length > 0)?.q.inicio ?? quinzenas[0].inicio;

    for (const m of montadas) {
      const aqui = m.q.inicio === alvoAcertos;
      let situacao: QuinzenaDoRep['situacao'];
      if (m.pendentes.length && m.lancamentos.length) situacao = 'parcial';
      else if (m.pendentes.length) situacao = m.fechada ? 'pronta' : 'em_andamento';
      else if (m.lancamentos.length) situacao = 'lancada';
      else situacao = m.fechada ? 'vazia' : 'em_andamento';

      saida.push({
        representante_id: rep.id,
        representante: rep.nome,
        razao_social: rep.razao_social,
        fornecedor_ok: !!rep.gestaoclick_fornecedor_id,
        quinzena: m.q,
        fechada: m.fechada,
        situacao,
        notas: m.notas,
        unidades: m.notas.reduce((s, n) => s + n.unidades, 0),
        acertos: aqui ? acertos : [],
        saldo_pendente: aqui ? saldoPendente : 0,
        bruto: m.notas.reduce((s, n) => s + n.comissao, 0),
        lancado: m.lancamentos.reduce((s, l) => s + l.liquido, 0),
        lancamentos: m.lancamentos,
        em_risco: aqui ? emRisco : [],
        a_faturar:
          m.q.inicio === quinzenas[0].inicio
            ? (aFaturar.get(rep.id) || []).sort(
                (a, b) => (a.data_entrega || '9').localeCompare(b.data_entrega || '9') || a.cliente.localeCompare(b.cliente),
              )
            : [],
      });
    }
  }
  return saida;
}

/**
 * Lança as notas escolhidas de uma quinzena (pode ser parte, pode ser antes de ela fechar):
 * conta a pagar em aberto no Gestão Click, lida de volta, e só então o lançamento e as notas
 * no banco. Nota já lançada é recusada. Os acertos marcados e o saldo pendente entram junto.
 */
export async function lancarComissao(
  supabase: any,
  tokens: Tokens,
  userId: string,
  pedido: { representante_id: number; inicio: string; notas: string[]; acertos: string[]; vencimento?: string },
): Promise<{ codigo: string | null; id: string | null; liquido: number }> {
  const hoje = hojeBR();
  const todas = await montarQuinzenas(supabase, tokens, { hoje, quantas: 8 });
  const doRep = todas.filter((q) => q.representante_id === pedido.representante_id);
  const alvo = doRep.find((q) => q.quinzena.inicio === pedido.inicio);
  if (!alvo) throw new Error('Quinzena não encontrada.');

  const pendentes = new Map(alvo.notas.filter((n) => n.lancada_em === null).map((n) => [n.nf_id, n]));
  const notas = (pedido.notas || []).map((id) => {
    const n = pendentes.get(id);
    if (!n) throw new Error('Uma das notas escolhidas já foi lançada ou não é desta quinzena. Atualize a tela.');
    return n;
  });
  const acertosDoRep = doRep.flatMap((q) => q.acertos);
  const acertos = (pedido.acertos || []).map((id) => {
    const a = acertosDoRep.find((x) => x.nf_id === id);
    if (!a) throw new Error('Um dos acertos escolhidos não vale mais. Atualize a tela.');
    return a;
  });
  if (!notas.length && !acertos.length) throw new Error('Escolha ao menos uma nota.');
  const saldoAnterior = doRep.reduce((s, q) => Math.max(s, q.saldo_pendente), 0);

  const vencimento =
    pedido.vencimento && /^\d{4}-\d{2}-\d{2}$/.test(pedido.vencimento) ? pedido.vencimento : alvo.quinzena.pagamento;
  const unidades = notas.reduce((s, n) => s + n.unidades, 0);
  const parcial = !alvo.fechada || notas.length < pendentes.size || alvo.lancamentos.length > 0;
  const descricao = descricaoDaConta(alvo.representante, alvo.quinzena, notas.length, unidades, parcial);
  const f = fecharQuinzena({
    bruto: notas.reduce((s, n) => s + n.comissao, 0),
    descontos: acertos.filter((a) => a.tipo === 'descontar').reduce((s, a) => s + a.valor, 0),
    creditos: acertos.filter((a) => a.tipo === 'devolver').reduce((s, a) => s + a.valor, 0),
    saldoAnterior,
  });

  const { data: rep } = await supabase
    .from('representantes')
    .select('gestaoclick_fornecedor_id')
    .eq('id', pedido.representante_id)
    .single();

  let pagamento: { id: string | null; codigo: string | null } = { id: null, codigo: null };
  if (f.liquido > 0) {
    if (!rep?.gestaoclick_fornecedor_id) throw new Error('O representante não tem fornecedor no Gestão Click.');
    const corpo = {
      descricao,
      valor: (f.liquido / 100).toFixed(2),
      data_vencimento: vencimento,
      data_competencia: alvo.quinzena.fim,
      plano_contas_id: PLANO_CONTAS_COMISSAO,
      forma_pagamento_id: FORMA_PIX,
      conta_bancaria_id: CONTA_CAIXA,
      entidade: 'F',
      fornecedor_id: rep.gestaoclick_fornecedor_id,
      liquidado: '0',
    };
    const criado = await gc(tokens, '/pagamentos', { method: 'POST', body: JSON.stringify(corpo) });
    const id = String(criado?.data?.id || '');
    if (!id) throw new Error('O Gestão Click não devolveu o id da conta.');
    const lido = (await gc(tokens, `/pagamentos/${id}`))?.data || {};
    if (Math.abs(Number(lido.valor) - Number(corpo.valor)) > 0.001 || lido.data_vencimento !== corpo.data_vencimento) {
      throw new Error(`A conta ${lido.codigo || id} foi criada, mas não bate ao ler de volta. Confira na tela do Gestão Click.`);
    }
    pagamento = { id, codigo: String(lido.codigo || '') };
  }

  // Código da venda de cada nota: é por ele que o boleto será achado no desconto.
  const vendaCodigo = new Map<string, string>();
  for (const n of notas) {
    if (!n.pedido_id) continue;
    try {
      const v = (await gc(tokens, `/vendas/${n.pedido_id}`))?.data;
      if (v?.codigo) vendaCodigo.set(n.nf_id, String(v.codigo));
    } catch (_) {
      /* sem o código, a nota só não entra no desconto do não pago */
    }
  }

  const { data: fech, error: e1 } = await supabase
    .from('comissoes_fechamentos')
    .insert({
      representante_id: pedido.representante_id,
      inicio: alvo.quinzena.inicio,
      fim: alvo.quinzena.fim,
      pagamento: vencimento,
      notas: notas.length,
      unidades,
      bruto_centavos: f.bruto,
      descontos_centavos: f.descontos,
      creditos_centavos: f.creditos,
      saldo_anterior_centavos: f.saldoAnterior,
      liquido_centavos: f.liquido,
      saldo_proximo_centavos: f.saldoProximo,
      gestaoclick_pagamento_id: pagamento.id,
      gestaoclick_pagamento_codigo: pagamento.codigo,
      lancado_por: userId,
    })
    .select('id')
    .single();
  if (e1) throw new Error(`Conta ${pagamento.codigo ?? ''} criada no Gestão Click, mas o lançamento não gravou: ${e1.message}`);

  if (notas.length) {
    const { error: e2 } = await supabase.from('comissoes_notas').insert(
      notas.map((n) => ({
        gestaoclick_nf_id: n.nf_id,
        numero_nf: n.numero,
        representante_id: pedido.representante_id,
        fechamento_id: fech.id,
        gestaoclick_cliente_id: n.gc_cliente_id,
        cliente_nome: n.cliente,
        data_emissao: n.data_emissao,
        venda_codigo: vendaCodigo.get(n.nf_id) || null,
        gestaoclick_venda_id: n.pedido_id || null,
        unidades: n.unidades,
        comissao_centavos: n.comissao,
      })),
    );
    if (e2) throw new Error(`Lançamento gravado, mas as notas não: ${e2.message}`);
  }
  for (const a of acertos) {
    const campo = a.tipo === 'descontar' ? 'descontada_em' : 'devolvida_em';
    await supabase.from('comissoes_notas').update({ [campo]: fech.id }).eq('gestaoclick_nf_id', a.nf_id);
  }
  return { ...pagamento, liquido: f.liquido };
}
