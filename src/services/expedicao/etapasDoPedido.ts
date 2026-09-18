/**
 * As etapas de um pedido na expedição, num lugar só.
 *
 * Separado → Despachado → Entregue. As duas primeiras são marcas reversíveis, e
 * não escrevem nada em estoque. A terceira, a entrega, é a que cobra caro: dá
 * baixa no estoque, registra o histórico, grava trocas e bonificações e
 * reagenda o cliente.
 *
 * Por que isto existe: a tela de expedição e a extensão do WhatsApp precisam
 * fazer as mesmas transições. Sem um serviço, seriam duas versões da mesma
 * regra — e é o tipo de duplicação que dá baixa dobrada em estoque quando uma
 * das duas esquece uma trava.
 *
 * Os carimbos de hora de cada etapa não são escritos aqui: quem cuida deles é o
 * gatilho `carimbar_etapas_do_pedido` no banco, para valerem também para quem
 * escrever na tabela por fora.
 */
import { supabase } from '@/integrations/supabase/client';

export type EtapaDoPedido = 'Agendado' | 'Separado' | 'Despachado';

export class ErroDeEtapa extends Error {}

export interface PedidoNaExpedicao {
  id: string;
  cliente_id: string;
  status_agendamento: string | null;
  substatus_pedido: EtapaDoPedido | null;
  quantidade_total: number | null;
  data_proxima_reposicao: string | null;
  confirmado_em: string | null;
  separado_em: string | null;
  despachado_em: string | null;
  gestaoclick_venda_id: string | null;
}

const CAMPOS =
  'id, cliente_id, status_agendamento, substatus_pedido, quantidade_total, data_proxima_reposicao, confirmado_em, separado_em, despachado_em, gestaoclick_venda_id';

export async function lerPedido(agendamentoId: string): Promise<PedidoNaExpedicao> {
  const { data, error } = await supabase
    .from('agendamentos_clientes')
    .select(CAMPOS)
    .eq('id', agendamentoId)
    .single();

  if (error) throw error;
  return data as PedidoNaExpedicao;
}

export async function pedidoDoCliente(clienteId: string): Promise<PedidoNaExpedicao | null> {
  const { data, error } = await supabase
    .from('agendamentos_clientes')
    .select(CAMPOS)
    .eq('cliente_id', clienteId)
    .maybeSingle();

  if (error) throw error;
  return (data as PedidoNaExpedicao) || null;
}

async function mudarEtapa(agendamentoId: string, etapa: EtapaDoPedido) {
  const { error } = await supabase
    .from('agendamentos_clientes')
    .update({ substatus_pedido: etapa, updated_at: new Date().toISOString() })
    .eq('id', agendamentoId);

  if (error) throw error;
}

/**
 * Marcar como separado.
 *
 * Efeito que não aparece na tela: a partir daqui o Mischa OS considera essas
 * unidades reservadas no saldo real, e o PCP para de pedir aquela produção.
 * Nada é escrito em movimentação de estoque — isso só na entrega.
 */
export const marcarSeparado = (agendamentoId: string) => mudarEtapa(agendamentoId, 'Separado');

export const desfazerSeparacao = (agendamentoId: string) => mudarEtapa(agendamentoId, 'Agendado');

export const marcarDespachado = (agendamentoId: string) => mudarEtapa(agendamentoId, 'Despachado');

export const desfazerDespacho = (agendamentoId: string) => mudarEtapa(agendamentoId, 'Separado');

export interface ItemDaEntrega {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

/**
 * O que sai na entrega: os itens do pedido mais as trocas e bonificações
 * pendentes. É a mesma conta que o banco usa para dar baixa — por isso o painel
 * mostra esta, e não a versão sem trocas que a tela de hoje usa para conferir
 * estoque (é daí que vem o "passou aqui e o banco recusou").
 */
export async function itensDaEntrega(agendamentoId: string): Promise<ItemDaEntrega[]> {
  const { data, error } = await supabase.rpc('compute_entrega_itens_completo', {
    p_agendamento_id: agendamentoId,
  });

  if (error) throw error;
  return (data || []) as ItemDaEntrega[];
}

export interface FaltaDeEstoque {
  produto: string;
  necessario: number;
  disponivel: number;
}

/** Confere o saldo de cada item. Lista vazia significa que dá para entregar. */
export async function conferirEstoque(agendamentoId: string): Promise<FaltaDeEstoque[]> {
  const itens = await itensDaEntrega(agendamentoId);
  const faltas: FaltaDeEstoque[] = [];

  for (const item of itens) {
    const { data } = await supabase.rpc('saldo_produto', { p_id: item.produto_id });
    const disponivel = Number(data ?? 0);

    if (disponivel < item.quantidade) {
      faltas.push({ produto: item.produto_nome, necessario: item.quantidade, disponivel });
    }
  }

  return faltas;
}

export interface EntradaConfirmacaoDeEntrega {
  agendamentoId: string;
  /** Quando a entrega aconteceu. Sem isso, agora. Nunca no futuro. */
  dataEntrega?: Date | null;
  observacao?: string | null;
}

/**
 * Confirmar a entrega.
 *
 * **Não tem desfazer.** Ela dá baixa no estoque, registra a entrega no
 * histórico, grava as trocas e bonificações pendentes e reagenda o cliente para
 * a data da entrega mais a periodicidade dele.
 *
 * A trava de só aceitar pedido despachado mora aqui de propósito: a rotina do
 * banco não tem trava nenhuma, e chamá-la duas vezes dá baixa dobrada no
 * estoque. Antes, quem protegia era a tela esconder o botão.
 */
export async function confirmarEntrega({
  agendamentoId,
  dataEntrega,
  observacao,
}: EntradaConfirmacaoDeEntrega): Promise<void> {
  const pedido = await lerPedido(agendamentoId);

  if (pedido.substatus_pedido !== 'Despachado') {
    throw new ErroDeEtapa(
      `Só dá para confirmar entrega de pedido despachado. Este está como "${pedido.substatus_pedido || 'Agendado'}".`
    );
  }

  if (dataEntrega && dataEntrega.getTime() > Date.now()) {
    throw new ErroDeEtapa('A data da entrega não pode ser no futuro.');
  }

  const faltas = await conferirEstoque(agendamentoId);
  if (faltas.length) {
    throw new ErroDeEtapa(
      `Falta estoque: ${faltas
        .map((f) => `${f.produto} (precisa ${f.necessario}, tem ${f.disponivel})`)
        .join('; ')}`
    );
  }

  // A rotina do banco faz tudo de uma vez, e é ela quem reagenda. Quem mexer
  // no agendamento logo depois sobrescreve a data certa por uma errada: foi o
  // que a tela de expedição fazia até aqui.
  const { error } = await supabase.rpc('process_entrega_safe', {
    p_agendamento_id: agendamentoId,
    p_observacao: observacao || null,
    p_data_entrega: dataEntrega ? dataEntrega.toISOString() : null,
  });

  if (error) {
    if (error.message?.includes('Saldo insuficiente')) {
      throw new ErroDeEtapa(error.message);
    }
    throw error;
  }
}

/** Quais botões fazem sentido para a etapa em que o pedido está. */
export function acoesPossiveis(pedido: PedidoNaExpedicao | null): {
  podeSeparar: boolean;
  podeDesfazerSeparacao: boolean;
  podeDespachar: boolean;
  podeDesfazerDespacho: boolean;
  podeConfirmarEntrega: boolean;
} {
  const etapa = pedido?.substatus_pedido || 'Agendado';
  const agendado = pedido?.status_agendamento === 'Agendado';

  return {
    // Separar só faz sentido depois que o cliente confirmou a reposição.
    podeSeparar: agendado && etapa === 'Agendado',
    podeDesfazerSeparacao: etapa === 'Separado',
    podeDespachar: etapa === 'Separado',
    podeDesfazerDespacho: etapa === 'Despachado',
    podeConfirmarEntrega: etapa === 'Despachado',
  };
}
