import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ItemExtra } from "@/services/pedidos/pedidoDisplays";
import { PedidoDisplays, SABORES } from "@/utils/pedidoDisplays";

/** Os textos do pedido em displays, iguais na lista, no formulário e no aviso de confirmação. */

export const AVISO_SEPARADO =
  "Pedido já separado pela fábrica: não dá mais para alterar nem cancelar por aqui. Para mudar, fale com a Mischa's.";

export const reais = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const semBrownie = (nome: string) => nome.replace(/^Brownie\s+/, "");
export const diaPorExtenso = (iso: string) => format(parseISO(iso), "EEEE, dd/MM", { locale: ptBR });

/** "2 sortidos + 1 Avelã" */
export function resumoDosDisplays(pedido: PedidoDisplays | null): string {
  if (!pedido) return "";
  const partes: string[] = [];
  if (pedido.sortido > 0) partes.push(`${pedido.sortido} ${pedido.sortido === 1 ? "sortido" : "sortidos"}`);
  SABORES.forEach((sabor) => {
    const n = pedido.sabores?.[sabor] || 0;
    if (n > 0) partes.push(`${n} ${semBrownie(sabor)}`);
  });
  return partes.join(" + ");
}

/** "3 Avelã (Vencimento), 2 Tradicional" */
export function resumoDosExtras(itens: ItemExtra[]): string {
  return itens
    .map((i) => `${i.quantidade} ${semBrownie(i.produto_nome)}${i.motivo_nome ? ` (${i.motivo_nome})` : ""}`)
    .join(", ");
}
