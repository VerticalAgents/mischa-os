import { supabase } from "@/integrations/supabase/client";
import {
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
      "cliente_id, status_agendamento, substatus_pedido, separado_em, gestaoclick_venda_id, data_proxima_reposicao, quantidade_total, displays"
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
  }));
}

/** Lança ou altera o pedido. Quem decide o dia da entrega e as travas é o banco. */
export async function lancarPedido(clienteId: string, pedido: PedidoDisplays): Promise<ResultadoLancamento> {
  const validacao = validarPedido(pedido);
  if (!validacao.ok) throw new Error(validacao.erro);
  const { data, error } = await supabase.rpc("rep_lancar_pedido_displays", {
    p_cliente_id: clienteId,
    p_displays: pedido as any,
    p_itens: expandirParaItens(pedido) as any,
  });
  if (error) throw new Error(error.message);
  return data as unknown as ResultadoLancamento;
}

/** Cancelar é voltar o pedido de confirmado para previsto. */
export async function cancelarPedido(clienteId: string): Promise<void> {
  const { error } = await supabase.rpc("rep_cancelar_pedido_displays", { p_cliente_id: clienteId });
  if (error) throw new Error(error.message);
}
