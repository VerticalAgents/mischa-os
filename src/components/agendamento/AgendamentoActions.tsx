
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface AgendamentoItem {
  cliente: { 
    id: number; 
    nome: string; 
    contatoNome?: string; 
    contatoTelefone?: string;
    quantidadePadrao?: number;
  };
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
    if (!cliente.contatoTelefone) return;
    
    let phone = cliente.contatoTelefone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('55')) phone = '55' + phone;
    
    const dataFormatada = format(agendamento.dataReposicao, 'dd/MM/yyyy');
    
    const message = encodeURIComponent(
      `Olá ${cliente.nome}, tudo bem? Gostaríamos de confirmar a entrega prevista para o dia ${dataFormatada}. Por favor, nos confirme a necessidade da reposição.`
    );
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  if (agendamento.isPedidoUnico || !agendamento.cliente.contatoTelefone) {
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
