import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { LeadStatus } from "@/types/lead";

interface LeadStatusChangerProps {
  onStatusChange: (status: LeadStatus) => void;
  currentStatus: LeadStatus;
}

export default function LeadStatusChanger({ onStatusChange, currentStatus }: LeadStatusChangerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Mudar Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onStatusChange('Visitados')}
          disabled={currentStatus === 'Visitados'}
        >
          📍 Marcar como Visitado
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onStatusChange('EfetivadosImediato')}
          disabled={currentStatus === 'EfetivadosImediato'}
          className="text-green-600"
        >
          ✅ Efetivado na Hora → Cadastrar
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onStatusChange('ContatosCapturados')}
          disabled={currentStatus === 'ContatosCapturados'}
        >
          📋 Contato Capturado
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onStatusChange('ChamadosWhatsApp')}
          disabled={currentStatus === 'ChamadosWhatsApp'}
        >
          💬 Chamado no WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onStatusChange('RespostaWhatsApp')}
          disabled={currentStatus === 'RespostaWhatsApp'}
        >
          ↩️ Respondeu WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onStatusChange('EfetivadosWhatsApp')}
          disabled={currentStatus === 'EfetivadosWhatsApp'}
          className="text-emerald-600"
        >
          🎉 Efetivado WhatsApp → Cadastrar
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onStatusChange('Perdidos')}
          disabled={currentStatus === 'Perdidos'}
          className="text-red-600"
        >
          ❌ Marcar como Perdido
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
