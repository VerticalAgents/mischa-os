import RepAgendamentos from "@/pages/rep/RepAgendamentos";
import RepPedidos from "@/pages/rep/RepPedidos";
import { useModeloPedidoRep } from "@/hooks/useModeloPedidoRep";

/**
 * A mesma rota serve os dois modelos: quem vende em displays (canal da Imigração)
 * lança pedido; os demais representantes continuam com a agenda de sempre.
 */
export default function RepAgenda() {
  const { vendeEmDisplays, loading } = useModeloPedidoRep();
  if (loading) return null;
  return vendeEmDisplays ? <RepPedidos /> : <RepAgendamentos />;
}
