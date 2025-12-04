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
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Mudar Status do Lead</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* === ENTRADA === */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Entrada</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onStatusChange('cadastrado')} disabled={currentStatus === 'cadastrado'}>
          📝 Cadastrado (Não visitado)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('visitado')} disabled={currentStatus === 'visitado'}>
          📍 Visitado (Amostra entregue)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* === FOLLOW-UP WHATSAPP === */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Follow-up WhatsApp</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => onStatusChange('followup_wpp_pendente')} 
          disabled={currentStatus === 'followup_wpp_pendente'}
          className="text-amber-600"
        >
          ⚠️ WhatsApp Pendente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('followup_wpp_tentativa')} disabled={currentStatus === 'followup_wpp_tentativa'}>
          💬 WhatsApp Enviado
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('followup_wpp_negociacao')} disabled={currentStatus === 'followup_wpp_negociacao'}>
          🤝 Negociando (WhatsApp)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* === FOLLOW-UP PRESENCIAL === */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Follow-up Presencial</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => onStatusChange('followup_presencial_pendente')} 
          disabled={currentStatus === 'followup_presencial_pendente'}
          className="text-orange-600"
        >
          ⚠️ Retorno Pendente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('followup_presencial_tentativa')} disabled={currentStatus === 'followup_presencial_tentativa'}>
          🏢 Revisitado
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('followup_presencial_negociacao')} disabled={currentStatus === 'followup_presencial_negociacao'}>
          🤝 Negociando (Presencial)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* === FECHAMENTO === */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Fechamento (Sucesso)</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => onStatusChange('efetivado_imediato')} 
          disabled={currentStatus === 'efetivado_imediato'}
          className="text-green-600 font-medium"
        >
          ✅ Fechado na Hora → Cadastrar Cliente
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onStatusChange('efetivado_wpp')} 
          disabled={currentStatus === 'efetivado_wpp'}
          className="text-emerald-600 font-medium"
        >
          ✅ Fechado WhatsApp → Cadastrar Cliente
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onStatusChange('efetivado_presencial')} 
          disabled={currentStatus === 'efetivado_presencial'}
          className="text-teal-600 font-medium"
        >
          ✅ Fechado Presencial → Cadastrar Cliente
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onStatusChange('efetivado_inbound')} 
          disabled={currentStatus === 'efetivado_inbound'}
          className="text-cyan-600 font-medium"
        >
          ✅ Fechado Inbound → Cadastrar Cliente
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* === PERDA === */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Perda</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onStatusChange('perdido_imediato')} disabled={currentStatus === 'perdido_imediato'} className="text-red-600">
          ❌ Perdido Imediato
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('perdido_wpp')} disabled={currentStatus === 'perdido_wpp'} className="text-red-600">
          ❌ Perdido WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('perdido_presencial')} disabled={currentStatus === 'perdido_presencial'} className="text-red-600">
          ❌ Perdido Presencial
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
