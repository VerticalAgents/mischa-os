
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Cliente } from "@/hooks/useClientesSupabase";
import { Pedido } from "@/types/pedido";

interface ConfirmacaoActionsProps {
  cliente: Cliente;
  pedido?: Pedido;
  onReagendar: (cliente: Cliente, novaData: Date) => void;
  onConfirmar: (cliente: Cliente) => void;
  onCancelar: (cliente: Cliente) => void;
}

export default function ConfirmacaoActions({ 
  cliente, 
  pedido, 
  onReagendar, 
  onConfirmar, 
  onCancelar 
}: ConfirmacaoActionsProps) {
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!cliente.contato_telefone) return;
    
    let phone = cliente.contato_telefone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('55')) phone = '55' + phone;
    
    const dataFormatada = cliente.proxima_data_reposicao 
      ? format(new Date(cliente.proxima_data_reposicao), 'dd/MM/yyyy', { locale: ptBR })
      : 'data a definir';
    
    const message = encodeURIComponent(
      `Olá ${cliente.nome}, tudo bem? Gostaríamos de confirmar a entrega prevista para o dia ${dataFormatada}. Por favor, nos confirme a necessidade da reposição.`
    );
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleReagendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + 7); // Reagendar para uma semana à frente
    
    onReagendar(cliente, novaData);
  };

  const handleConfirmarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirmar(cliente);
  };

  const handleCancelarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelar(cliente);
  };

  return (
    <div className="flex items-center gap-2">
      {cliente.contato_telefone && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleWhatsAppClick}
          className="flex items-center gap-1"
        >
          <MessageSquare className="h-4 w-4 text-green-500" />
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleReagendarClick}
        className="flex items-center gap-1"
      >
        <Calendar className="h-4 w-4 text-blue-500" />
        <span className="hidden sm:inline">Reagendar</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleConfirmarClick}
        className="flex items-center gap-1"
      >
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="hidden sm:inline">Confirmar</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCancelarClick}
        className="flex items-center gap-1"
      >
        <X className="h-4 w-4 text-red-500" />
        <span className="hidden sm:inline">Cancelar</span>
      </Button>
    </div>
  );
}
