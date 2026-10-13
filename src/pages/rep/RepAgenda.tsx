import RepAgendamentos from "@/pages/rep/RepAgendamentos";
import RepAgendaDisplays from "@/pages/rep/RepAgendaDisplays";
import { useModeloPedidoRep } from "@/hooks/useModeloPedidoRep";

/**
 * A mesma rota serve os dois modelos: quem vende em displays (canal da Imigração) vê a
 * semana e abre o pedido na tela de Pedidos; os demais continuam com a agenda de sempre.
 */
export default function RepAgenda() {
  const { vendeEmDisplays, loading } = useModeloPedidoRep();
  if (loading) return null;
  return vendeEmDisplays ? <RepAgendaDisplays /> : <RepAgendamentos />;
}
