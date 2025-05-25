
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { Cliente } from "@/hooks/useClientesSupabase";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useAutomacaoStatus } from "@/hooks/useAutomacaoStatus";
import ReclassificacaoStatus from "./ReclassificacaoStatus";

interface ConfirmacaoActionsProps {
  cliente: Cliente;
  statusNome: string;
  statusId: number;
  observacoes: {[key: string]: string};
  setObservacoes: (obs: {[key: string]: string}) => void;
  onNoReplenishment: (cliente: Cliente) => void;
  onStatusChange: (cliente: Cliente, novoStatus: string, observacao?: string) => void;
  moveClientToStatus: (cliente: Cliente, newStatusId: number) => void;
}

export default function ConfirmacaoActions({
  cliente,
  statusNome,
  statusId,
  observacoes,
  setObservacoes,
  onNoReplenishment,
  onStatusChange,
  moveClientToStatus
}: ConfirmacaoActionsProps) {
  const { confirmarEntrega } = useAutomacaoStatus();

  // Function to handle WhatsApp message
  const handleWhatsAppClick = (cliente: Cliente) => {
    if (!cliente.contato_telefone) {
      toast({
        title: "Número não disponível",
        description: "Este cliente não possui número de telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }
    
    // Format phone number for WhatsApp
    let phone = cliente.contato_telefone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('55')) phone = '55' + phone;
    
    // Get the client's next replenishment date
    const nextDate = cliente.proxima_data_reposicao 
      ? format(new Date(cliente.proxima_data_reposicao), 'dd/MM/yyyy') 
      : 'data a definir';
    
    // Create message
    const message = encodeURIComponent(
      `Olá ${cliente.nome}, tudo bem? Gostaríamos de confirmar a entrega prevista para o dia ${nextDate}. Por favor, nos confirme a necessidade da reposição.`
    );
    
    // Open WhatsApp
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    // Update observations record
    const now = new Date();
    const obsText = observacoes[cliente.id] || '';
    const newObs = `${format(now, 'dd/MM HH:mm')} - Mensagem enviada via WhatsApp\n${obsText}`;
    
    setObservacoes({
      ...observacoes,
      [cliente.id]: newObs
    });
    
    toast({
      title: "WhatsApp aberto",
      description: `Mensagem preparada para ${cliente.nome}`,
    });
  };

  // Função atualizada para confirmar entrega com automação de status
  const handleConfirmarEntrega = (cliente: Cliente) => {
    // Usar o hook de automação para confirmar e atualizar status automaticamente
    confirmarEntrega(cliente.id);
    
    // Atualizar observações
    const now = new Date();
    const obsText = observacoes[cliente.id] || '';
    const newObs = `${format(now, 'dd/MM HH:mm')} - Entrega confirmada - Status atualizado para "Confirmado"\n${obsText}`;
    
    setObservacoes({
      ...observacoes,
      [cliente.id]: newObs
    });
    
    toast({
      title: "Entrega confirmada",
      description: `${cliente.nome} confirmado e status atualizado automaticamente`,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full flex items-center gap-1"
        onClick={() => handleWhatsAppClick(cliente)}
      >
        <MessageSquare className="h-4 w-4 text-green-500" />
        <span>WhatsApp</span>
      </Button>
      
      {/* Botão de confirmar entrega com automação */}
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full flex items-center gap-1"
        onClick={() => handleConfirmarEntrega(cliente)}
      >
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>Confirmar Entrega</span>
      </Button>
      
      <ReclassificacaoStatus
        cliente={cliente}
        statusAtual={statusNome}
        onStatusChange={(novoStatus, observacao) => onStatusChange(cliente, novoStatus, observacao)}
      />
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full flex items-center gap-1 text-muted-foreground"
        onClick={() => onNoReplenishment(cliente)}
      >
        <XCircle className="h-4 w-4 text-red-500" />
        <span>Não será reposto</span>
      </Button>
      
      {statusId === 1 && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center gap-1"
          onClick={() => moveClientToStatus(cliente, 3)}
        >
          <Clock className="h-4 w-4 text-amber-500" />
          <span>Aguardando resposta</span>
        </Button>
      )}
      
      {(statusId === 3 || statusId === 4) && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center gap-1"
          onClick={() => moveClientToStatus(cliente, 7)}
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Confirmado</span>
        </Button>
      )}
    </div>
  );
}
