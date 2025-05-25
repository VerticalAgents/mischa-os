
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Cliente } from "@/hooks/useClientesSupabase";

interface AgendamentoItem {
  cliente: Cliente;
  pedido?: any;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

interface AgendamentoActionsProps {
  agendamento: AgendamentoItem;
}

export default function AgendamentoActions({ agendamento }: AgendamentoActionsProps) {
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (agendamento.isPedidoUnico) return;
    
    const cliente = agendamento.cliente;
    if (!cliente.contato_telefone) return;
    
    let phone = cliente.contato_telefone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('55')) phone = '55' + phone;
    
    const dataFormatada = format(agendamento.dataReposicao, 'dd/MM/yyyy');
    
    const message = encodeURIComponent(
      `Olá ${cliente.nome}, tudo bem? Gostaríamos de confirmar a entrega prevista para o dia ${dataFormatada}. Por favor, nos confirme a necessidade da reposição.`
    );
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  if (agendamento.isPedidoUnico || !agendamento.cliente.contato_telefone) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleWhatsAppClick}
      className="flex items-center gap-1"
    >
      <MessageSquare className="h-4 w-4 text-green-500" />
      <span className="hidden sm:inline">WhatsApp</span>
    </Button>
  );
}
