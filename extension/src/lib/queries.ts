/**
 * Tudo o que o painel pergunta ao Mischa OS.
 *
 * Uma função por pedaço da tela, nenhuma delas sabendo o que é React. Assim a
 * interface fica burra e o que dá errado aparece num lugar só.
 */
import { supabase } from './supabase';
import type { ClienteResumido, VinculoWhatsapp } from './resolverCliente';
import { calcularScoreFinanceiro, ScoreFinanceiro } from '@/utils/scoreFinanceiro';
import { tituloDeGC } from '@/utils/titulosGC';
import { calcularConfirmationScore } from '@/utils/confirmationScore';
import { calcularGiroSemanalHistorico } from '@/utils/giroCalculations';
import type { ConfirmationScore } from '@/types/confirmationScore';

const hojeISO = () => {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
};

const diasAtras = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface ClienteDoPainel {
  id: string;
  nome: string;
  contato_nome: string | null;
  contato_telefone: string | null;
  quantidade_padrao: number | null;
  periodicidade_padrao: number | null;
  giro_medio_semanal: number | null;
  ultima_data_reposicao_efetiva: string | null;
  forma_pagamento: string | null;
  prazo_pagamento_dias: number | null;
  gestaoclick_cliente_id: string | null;
  status_cliente: string | null;
}

export interface AgendamentoDoPainel {
  id: string;
  status_agendamento: string | null;
  data_proxima_reposicao: string | null;
  quantidade_total: number | null;
  tipo_pedido: string | null;
  itens_personalizados: { produto: string; quantidade: number }[] | null;
  observacoes_agendamento: string | null;
  trocas_pendentes: { produto_nome?: string; quantidade?: number }[] | null;
  bonificacoes_pendentes: { produto_nome?: string; quantidade?: number }[] | null;
  gestaoclick_venda_id: string | null;
}

export interface EntregaDoPainel {
  data: string;
  quantidade: number | null;
  itens: { produto: string; quantidade: number }[];
}

/** Os clientes ativos, para casar com a conversa e para a lista de vínculo. */
export async function listarClientesAtivos(): Promise<ClienteResumido[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, contato_telefone')
    .eq('ativo', true)
    .order('nome');

  if (error) throw error;
  return (data || []) as ClienteResumido[];
}

export async function listarVinculos(): Promise<VinculoWhatsapp[]> {
  const { data, error } = await supabase
    .from('whatsapp_vinculos')
    .select('id, cliente_id, lead_id, chat_titulo, telefone_e164, lid');

  if (error) throw error;
  return (data || []) as VinculoWhatsapp[];
}

/**
 * Guarda (ou troca) o vínculo desta conversa.
 *
 * Os índices do banco garantem uma identidade por cliente, então vincular de
 * novo substitui o vínculo anterior em vez de criar um segundo.
 */
export async function vincularConversa(params: {
  clienteId: string;
  chatTitulo: string | null;
  telefoneE164: string | null;
  lid: string | null;
}) {
  const { clienteId, chatTitulo, telefoneE164, lid } = params;

  if (chatTitulo) {
    await supabase.from('whatsapp_vinculos').delete().ilike('chat_titulo', chatTitulo);
  }
  if (telefoneE164) {
    await supabase.from('whatsapp_vinculos').delete().eq('telefone_e164', telefoneE164);
  }
  if (lid) {
    await supabase.from('whatsapp_vinculos').delete().eq('lid', lid);
  }

  const { error } = await supabase.from('whatsapp_vinculos').insert({
    cliente_id: clienteId,
    chat_titulo: chatTitulo,
    telefone_e164: telefoneE164,
    lid,
    origem: 'manual',
  });
  if (error) throw error;

  // Aproveita para completar o cadastro: hoje só 42 dos 214 clientes ativos
  // têm telefone, e é justamente o que faria o reconhecimento ser automático.
  if (telefoneE164) {
    const { data } = await supabase
      .from('clientes')
      .select('contato_telefone')
      .eq('id', clienteId)
      .maybeSingle();

    if (!data?.contato_telefone) {
      await supabase.from('clientes').update({ contato_telefone: telefoneE164 }).eq('id', clienteId);
    }
  }
}

export async function desvincularConversa(vinculoId: string) {
  const { error } = await supabase.from('whatsapp_vinculos').delete().eq('id', vinculoId);
  if (error) throw error;
}

export async function carregarCliente(clienteId: string): Promise<ClienteDoPainel> {
  const { data, error } = await supabase
    .from('clientes')
    .select(
      'id, nome, contato_nome, contato_telefone, quantidade_padrao, periodicidade_padrao, giro_medio_semanal, ultima_data_reposicao_efetiva, forma_pagamento, prazo_pagamento_dias, gestaoclick_cliente_id, status_cliente'
    )
    .eq('id', clienteId)
    .single();

  if (error) throw error;
  return data as ClienteDoPainel;
}

export async function carregarAgendamento(clienteId: string): Promise<AgendamentoDoPainel | null> {
  const { data, error } = await supabase
    .from('agendamentos_clientes')
    .select(
      'id, status_agendamento, data_proxima_reposicao, quantidade_total, tipo_pedido, itens_personalizados, observacoes_agendamento, trocas_pendentes, bonificacoes_pendentes, gestaoclick_venda_id'
    )
    .eq('cliente_id', clienteId)
    .maybeSingle();

  if (error) throw error;
  return (data as AgendamentoDoPainel) || null;
}

/** As últimas entregas, com o nome dos sabores no lugar do código do produto. */
export async function carregarUltimasEntregas(
  clienteId: string,
  quantas = 5
): Promise<EntregaDoPainel[]> {
  const { data, error } = await supabase
    .from('historico_entregas')
    .select('data, quantidade, itens')
    .eq('cliente_id', clienteId)
    .eq('tipo', 'entrega')
    .order('data', { ascending: false })
    .limit(quantas);

  if (error) throw error;

  const linhas = (data || []) as { data: string; quantidade: number | null; itens: unknown }[];

  const ids = new Set<string>();
  for (const linha of linhas) {
    for (const item of (linha.itens as { produto_id?: string }[]) || []) {
      if (item?.produto_id) ids.add(item.produto_id);
    }
  }

  const nomes = new Map<string, string>();
  if (ids.size) {
    const { data: produtos } = await supabase
      .from('produtos_finais')
      .select('id, nome')
      .in('id', [...ids]);

    for (const p of produtos || []) nomes.set(p.id, p.nome);
  }

  return linhas.map((linha) => ({
    data: linha.data,
    quantidade: linha.quantidade,
    itens: ((linha.itens as { produto_id?: string; quantidade?: number }[]) || []).map((i) => ({
      produto: (i.produto_id && nomes.get(i.produto_id)) || 'produto',
      quantidade: i.quantidade ?? 0,
    })),
  }));
}

/**
 * Score de confirmação deste cliente.
 *
 * Mesma fórmula da tela de agendamentos, que mora em `src/utils` desde que foi
 * extraída do hook — aqui só se busca o histórico de um cliente só.
 */
export async function carregarScoreConfirmacao(
  clienteId: string,
  agendamento: AgendamentoDoPainel | null,
  periodicidadePadrao?: number | null
): Promise<ConfirmationScore | null> {
  if (!agendamento?.data_proxima_reposicao) return null;

  const [entregas, reagendamentos] = await Promise.all([
    supabase
      .from('historico_entregas')
      .select('data')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'entrega')
      .gte('data', diasAtras(84))
      .order('data', { ascending: true }),
    supabase
      .from('reagendamentos_entre_semanas')
      .select('data_original, tipo, created_at, agendamento_id')
      .eq('cliente_id', clienteId)
      .gte('created_at', diasAtras(90)),
  ]);

  return calcularConfirmationScore({
    entregas: (entregas.data || []) as { data: string }[],
    reagendamentos: (reagendamentos.data || []) as never,
    dataAgendada: new Date(`${agendamento.data_proxima_reposicao}T00:00:00`),
    agendamentoId: agendamento.id,
    periodicidadePadrao: periodicidadePadrao ?? undefined,
  });
}

export interface FinanceiroDoPainel {
  score: ScoreFinanceiro;
  emAberto: {
    id: string;
    valor: number;
    dataVencimento: string;
    formaPagamento?: string;
    diasAtraso: number;
  }[];
}

/**
 * Situação financeira do cliente, direto do Gestão Click.
 *
 * Usa a mesma ponte do Mischa OS (`historico_financeiro_cliente`), que já traz
 * pagos e em aberto de uma vez e é o que alimenta o score. A tela de
 * inadimplência usa outra chamada, que varre a base inteira — cara demais para
 * um painel de um cliente só.
 */
export async function carregarFinanceiro(
  gestaoClickClienteId: string
): Promise<FinanceiroDoPainel> {
  const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
    body: { action: 'historico_financeiro_cliente', cliente_id: gestaoClickClienteId, meses: 12 },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'não consegui falar com o Gestão Click');

  const titulos = ((data.titulos || []) as unknown[]).map(tituloDeGC).filter(Boolean) as ReturnType<
    typeof tituloDeGC
  >[];

  const hoje = hojeISO();
  const score = calcularScoreFinanceiro(titulos as never, hoje);

  const emAberto = (titulos as { id: string; valor: number; dataVencimento: string; pago: boolean; formaPagamento?: string }[])
    .filter((t) => !t.pago)
    .map((t) => ({
      id: t.id,
      valor: t.valor,
      dataVencimento: t.dataVencimento,
      formaPagamento: t.formaPagamento,
      diasAtraso: Math.max(
        0,
        Math.round(
          (new Date(`${hoje}T00:00:00`).getTime() -
            new Date(`${t.dataVencimento}T00:00:00`).getTime()) /
            86400000
        )
      ),
    }))
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

  return { score, emAberto };
}

/**
 * O giro semanal que vale para conversar com o cliente.
 *
 * O campo do cadastro está zerado em 139 dos 214 clientes ativos, então quando
 * ele não diz nada a gente mede pelo histórico — a mesma conta que o Mischa OS
 * usa na análise de giro. O painel mostra de onde veio o número.
 */
export async function carregarGiro(
  clienteId: string,
  giroDoCadastro: number | null
): Promise<{ giro: number; medido: boolean }> {
  if (giroDoCadastro && giroDoCadastro > 0) return { giro: giroDoCadastro, medido: false };

  const { giroSemanal } = await calcularGiroSemanalHistorico(clienteId);
  return { giro: giroSemanal, medido: true };
}
