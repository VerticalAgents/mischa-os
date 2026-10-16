import { supabase } from "@/integrations/supabase/client";
import {
  ComposicaoSortido,
  MODELO_DISPLAYS,
  PedidoDisplays,
  expandirParaItens,
  validarPedido,
} from "@/utils/pedidoDisplays";

export interface ClienteDeDisplays {
  id: string;
  nome: string;
}

export interface PedidoDoCliente {
  clienteId: string;
  status: string;
  /** A fábrica já separou, ou a venda já foi gerada: o representante não mexe mais. */
  travado: boolean;
  dataEntrega: string | null;
  quantidadeTotal: number;
  displays: PedidoDisplays | null;
  trocas: ItemExtra[];
  /** Só a Mischa's lança bonificação; o representante vê. */
  bonificacoes: ItemExtra[];
  /** Observação só deste pedido (agendamentos_clientes.observacoes_agendamento). */
  observacao: string;
}

/** Troca ou bonificação pendurada no pedido (mesmo formato da agenda da casa). */
export interface ItemExtra {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome: string;
}

export interface ResultadoLancamento {
  data_entrega: string;
  quantidade_total: number;
  displays: number;
  alterado: boolean;
}

/** Clientes da carteira que compram em displays (o banco já filtra pela carteira de quem está logado). */
export async function listarClientesDeDisplays(): Promise<ClienteDeDisplays[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome")
    .eq("modelo_pedido", MODELO_DISPLAYS)
    .eq("ativo", true)
    .order("nome");
  if (error) throw error;
  return (data as ClienteDeDisplays[]) || [];
}

export async function listarPedidos(clienteIds: string[]): Promise<PedidoDoCliente[]> {
  if (clienteIds.length === 0) return [];
  const { data, error } = await supabase
    .from("agendamentos_clientes")
    .select(
      "cliente_id, status_agendamento, substatus_pedido, separado_em, gestaoclick_venda_id, data_proxima_reposicao, quantidade_total, displays, trocas_pendentes, bonificacoes_pendentes, observacoes_agendamento"
    )
    .in("cliente_id", clienteIds);
  if (error) throw error;
  return ((data as any[]) || []).map((a) => ({
    clienteId: a.cliente_id,
    status: a.status_agendamento,
    travado: a.substatus_pedido !== "Agendado" || !!a.separado_em || !!a.gestaoclick_venda_id,
    dataEntrega: a.data_proxima_reposicao,
    quantidadeTotal: a.quantidade_total || 0,
    displays: (a.displays as PedidoDisplays) ?? null,
    trocas: Array.isArray(a.trocas_pendentes) ? a.trocas_pendentes : [],
    bonificacoes: Array.isArray(a.bonificacoes_pendentes) ? a.bonificacoes_pendentes : [],
    observacao: a.observacoes_agendamento || "",
  }));
}

/** Lança ou altera o pedido. Quem decide o dia da entrega e as travas é o banco. */
export async function lancarPedido(
  clienteId: string,
  pedido: PedidoDisplays,
  trocas: ItemExtra[] = [],
  /** O que vai no sortido (Configurações › Proporções); sem ela, o padrão do código. */
  composicao?: ComposicaoSortido,
  /** Observação só deste pedido; vazio apaga, undefined não mexe. */
  observacao?: string
): Promise<ResultadoLancamento> {
  const validacao = validarPedido(pedido);
  if (!validacao.ok) throw new Error(validacao.erro);
  const { data, error } = await supabase.rpc("rep_lancar_pedido_displays", {
    p_cliente_id: clienteId,
    p_displays: pedido as any,
    p_itens: expandirParaItens(pedido, composicao) as any,
    p_trocas: trocas.filter((t) => t.produto_nome && t.quantidade > 0) as any,
    p_observacoes: observacao ?? null,
  } as any);
  if (error) throw new Error(error.message);
  return data as unknown as ResultadoLancamento;
}

/** Cancelar é voltar o pedido de confirmado para previsto. */
export async function cancelarPedido(clienteId: string): Promise<void> {
  const { error } = await supabase.rpc("rep_cancelar_pedido_displays", { p_cliente_id: clienteId });
  if (error) throw new Error(error.message);
}
