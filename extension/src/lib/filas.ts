/**
 * As filas de trabalho do painel.
 *
 * O painel do cliente responde "quem é esta conversa". As filas respondem a
 * pergunta inversa: "com quem eu preciso falar agora?". São as listas que o
 * Lucca abriria no meio do expediente — previstos da semana, quem não
 * confirmou, quem está atrasado, quem está devendo.
 *
 * Cada fila é uma consulta só, e todas devolvem o mesmo formato, para a tela
 * não precisar saber de onde veio cada uma.
 */
import { supabase } from './supabase';
import { calcularConfirmationScore } from '@/utils/confirmationScore';
import type { ConfirmationScore } from '@/types/confirmationScore';

export type NomeDaFila =
  | 'semana'
  | 'provavel'
  | 'nao-confirmados'
  | 'atrasados'
  | 'devendo'
  | 'sumidos';

export interface ItemDaFila {
  clienteId: string;
  nome: string;
  telefone: string | null;
  /** A linha de baixo do cartão: o que importa naquela fila. */
  detalhe: string;
  /** Data que ordena a fila (reposição, vencimento, última compra). */
  data?: string | null;
  score?: ConfirmationScore | null;
  valor?: number;
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const hoje = () => iso(new Date());

const daquiADias = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return iso(d);
};

/** Domingo desta semana. Segunda é o começo, como no resto do sistema. */
const fimDaSemana = () => {
  const d = new Date();
  const diasAteDomingo = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + diasAteDomingo);
  return iso(d);
};

const diaBR = (s?: string | null) =>
  s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '—';

const dinheiro = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface LinhaDeAgendamento {
  cliente_id: string;
  status_agendamento: string | null;
  substatus_pedido: string | null;
  data_proxima_reposicao: string | null;
  quantidade_total: number | null;
  id: string;
  clientes: { nome: string; contato_telefone: string | null; periodicidade_padrao: number | null } | null;
}

const CAMPOS_AGENDAMENTO =
  'id, cliente_id, status_agendamento, substatus_pedido, data_proxima_reposicao, quantidade_total, clientes!inner(nome, contato_telefone, periodicidade_padrao, ativo)';

async function agendamentosEntre(de: string, ate: string, status: string[]) {
  const { data, error } = await supabase
    .from('agendamentos_clientes')
    .select(CAMPOS_AGENDAMENTO)
    .in('status_agendamento', status)
    .gte('data_proxima_reposicao', de)
    .lte('data_proxima_reposicao', ate)
    .eq('clientes.ativo', true)
    .order('data_proxima_reposicao');

  if (error) throw error;
  return (data || []) as unknown as LinhaDeAgendamento[];
}

const paraItem = (linha: LinhaDeAgendamento, detalhe: string): ItemDaFila => ({
  clienteId: linha.cliente_id,
  nome: linha.clientes?.nome || 'cliente sem nome',
  telefone: linha.clientes?.contato_telefone ?? null,
  detalhe,
  data: linha.data_proxima_reposicao,
});

/** Reposições marcadas de hoje até domingo, confirmadas ou não. */
export async function previstosDaSemana(): Promise<ItemDaFila[]> {
  const linhas = await agendamentosEntre(hoje(), fimDaSemana(), ['Previsto', 'Agendado']);

  return linhas.map((l) =>
    paraItem(
      l,
      `${diaBR(l.data_proxima_reposicao)} · ${l.quantidade_total ?? 0} un · ${
        l.status_agendamento === 'Agendado' ? 'confirmado' : 'previsto'
      }`
    )
  );
}

/**
 * Previstos da semana, com a nota de confirmação de cada um.
 *
 * A nota sai da mesma fórmula da tela de agendamentos. Para não fazer duas
 * consultas por cliente, o histórico dos clientes da semana vem de uma vez só e
 * a conta é feita aqui.
 */
export async function confirmacaoProvavel(): Promise<ItemDaFila[]> {
  const linhas = await agendamentosEntre(hoje(), fimDaSemana(), ['Previsto', 'Agendado']);
  if (!linhas.length) return [];

  const ids = linhas.map((l) => l.cliente_id);

  const [entregas, reagendamentos] = await Promise.all([
    supabase
      .from('historico_entregas')
      .select('cliente_id, data')
      .in('cliente_id', ids)
      .eq('tipo', 'entrega')
      .gte('data', daquiADias(-84))
      .order('data', { ascending: true }),
    supabase
      .from('reagendamentos_entre_semanas')
      .select('cliente_id, data_original, tipo, created_at, agendamento_id')
      .in('cliente_id', ids)
      .gte('created_at', daquiADias(-90)),
  ]);

  const porCliente = <T extends { cliente_id: string }>(linhas: T[] | null, id: string) =>
    (linhas || []).filter((l) => l.cliente_id === id);

  return linhas
    .map((l) => {
      const score = l.data_proxima_reposicao
        ? calcularConfirmationScore({
            entregas: porCliente(entregas.data as { cliente_id: string; data: string }[], l.cliente_id),
            reagendamentos: porCliente(reagendamentos.data as never[], l.cliente_id),
            dataAgendada: new Date(`${l.data_proxima_reposicao}T00:00:00`),
            agendamentoId: l.id,
            periodicidadePadrao: l.clientes?.periodicidade_padrao ?? undefined,
          })
        : null;

      return {
        ...paraItem(l, `${diaBR(l.data_proxima_reposicao)} · ${score?.motivo || 'sem histórico'}`),
        score,
      };
    })
    .sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0));
}

/**
 * Previstos dos próximos dias que ninguém confirmou ainda.
 *
 * É a fila de trabalho mais direta que existe: são as ligações de hoje.
 */
export async function naoConfirmados(diasAFrente = 3): Promise<ItemDaFila[]> {
  const linhas = await agendamentosEntre(hoje(), daquiADias(diasAFrente), ['Previsto']);

  return linhas.map((l) => {
    const dias = Math.round(
      (new Date(`${l.data_proxima_reposicao}T00:00:00`).getTime() -
        new Date(`${hoje()}T00:00:00`).getTime()) /
        86400000
    );
    const quando = dias === 0 ? 'é hoje' : dias === 1 ? 'é amanhã' : `em ${dias} dias`;
    return paraItem(l, `${diaBR(l.data_proxima_reposicao)} · ${quando} · ${l.quantidade_total ?? 0} un`);
  });
}

/** A data passou e o pedido não foi entregue. */
export async function atrasados(): Promise<ItemDaFila[]> {
  const linhas = await agendamentosEntre('2000-01-01', daquiADias(-1), ['Previsto', 'Agendado']);

  return linhas
    .map((l) => {
      const dias = Math.round(
        (new Date(`${hoje()}T00:00:00`).getTime() -
          new Date(`${l.data_proxima_reposicao}T00:00:00`).getTime()) /
          86400000
      );
      return paraItem(
        l,
        `${diaBR(l.data_proxima_reposicao)} · ${dias} dia(s) atrás · ${
          l.substatus_pedido === 'Agendado' ? 'nem separado' : (l.substatus_pedido || '').toLowerCase()
        }`
      );
    })
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''));
}

/**
 * Quem tem título vencido.
 *
 * Vem da mesma chamada da tela de inadimplência, que varre a base inteira. É a
 * fila mais cara de montar: por isso ela só é buscada quando aberta.
 */
export async function devendo(): Promise<ItemDaFila[]> {
  const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
    body: { action: 'buscar_recebimentos_abertos', meses_retroativos: 12 },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'não consegui falar com o Gestão Click');

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, contato_telefone, gestaoclick_cliente_id')
    .not('gestaoclick_cliente_id', 'is', null);

  const porGc = new Map(
    ((clientes || []) as { id: string; nome: string; contato_telefone: string | null; gestaoclick_cliente_id: string }[]).map(
      (c) => [String(c.gestaoclick_cliente_id), c]
    )
  );

  const hojeMs = new Date(`${hoje()}T00:00:00`).getTime();
  const acumulado = new Map<string, { vencido: number; pior: number; titulos: number }>();

  for (const rec of (data.recebimentos || []) as {
    cliente_id: string;
    valor: string;
    data_vencimento: string;
  }[]) {
    const [d, m, a] = String(rec.data_vencimento || '').split('/');
    const vencimento = a ? `${a}-${m}-${d}` : String(rec.data_vencimento || '').slice(0, 10);
    if (!vencimento) continue;

    const dias = Math.round((hojeMs - new Date(`${vencimento}T00:00:00`).getTime()) / 86400000);
    if (dias <= 2) continue; // tolerância de 2 dias, a mesma do score de pagamento

    const chave = String(rec.cliente_id);
    const atual = acumulado.get(chave) || { vencido: 0, pior: 0, titulos: 0 };
    atual.vencido += parseFloat(String(rec.valor || '0').replace(',', '.')) || 0;
    atual.pior = Math.max(atual.pior, dias);
    atual.titulos += 1;
    acumulado.set(chave, atual);
  }

  const itens: ItemDaFila[] = [];
  for (const [gcId, resumo] of acumulado) {
    const cliente = porGc.get(gcId);
    if (!cliente) continue;

    itens.push({
      clienteId: cliente.id,
      nome: cliente.nome,
      telefone: cliente.contato_telefone,
      detalhe: `${dinheiro(resumo.vencido)} vencido · ${resumo.titulos} título(s) · ${resumo.pior} dias`,
      valor: resumo.vencido,
    });
  }

  return itens.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
}

/**
 * Cliente ativo que não recebe entrega há muito tempo.
 *
 * A fonte é o histórico de entregas, **não** o campo
 * `clientes.ultima_data_reposicao_efetiva`: esse campo está parado no cadastro
 * e, se a gente confiasse nele, os 214 clientes ativos apareceriam como
 * sumidos. Pelo histórico real são 127 (conferido em 18/09/2026).
 */
export async function sumidos(diasSemComprar = 45): Promise<ItemDaFila[]> {
  const [{ data: clientes, error }, { data: entregas }] = await Promise.all([
    supabase.from('clientes').select('id, nome, contato_telefone').eq('ativo', true),
    supabase
      .from('historico_entregas')
      .select('cliente_id, data')
      .eq('tipo', 'entrega')
      .order('data', { ascending: false }),
  ]);

  if (error) throw error;

  // A consulta já vem da mais recente para a mais antiga: a primeira de cada
  // cliente é a última entrega dele.
  const ultima = new Map<string, string>();
  for (const e of (entregas || []) as { cliente_id: string; data: string }[]) {
    if (!ultima.has(e.cliente_id)) ultima.set(e.cliente_id, e.data);
  }

  const limite = daquiADias(-diasSemComprar);

  return ((clientes || []) as { id: string; nome: string; contato_telefone: string | null }[])
    .map((c) => ({ cliente: c, data: ultima.get(c.id) || null }))
    .filter(({ data }) => !data || data.slice(0, 10) < limite)
    .map(({ cliente, data }) => ({
      clienteId: cliente.id,
      nome: cliente.nome,
      telefone: cliente.contato_telefone,
      detalhe: data
        ? `última entrega em ${diaBR(data)} · ${Math.round(
            (Date.now() - new Date(data).getTime()) / 86400000
          )} dias`
        : 'nunca recebeu entrega',
      data,
    }))
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''));
}

export const FILAS: { nome: NomeDaFila; rotulo: string; buscar: () => Promise<ItemDaFila[]> }[] = [
  { nome: 'semana', rotulo: 'Semana', buscar: previstosDaSemana },
  { nome: 'nao-confirmados', rotulo: 'A confirmar', buscar: () => naoConfirmados() },
  { nome: 'provavel', rotulo: 'Probabilidade', buscar: confirmacaoProvavel },
  { nome: 'atrasados', rotulo: 'Atrasados', buscar: atrasados },
  { nome: 'devendo', rotulo: 'Devendo', buscar: devendo },
  { nome: 'sumidos', rotulo: 'Sumidos', buscar: () => sumidos() },
];
