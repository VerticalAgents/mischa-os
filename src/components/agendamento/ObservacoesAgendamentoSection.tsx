import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, RefreshCw } from "lucide-react";
import TrocasPendentesEditor, { TrocaPendente } from "./TrocasPendentesEditor";

interface ObservacoesAgendamentoSectionProps {
  // Observações gerais (permanentes - do cliente)
  observacoesGerais: string;
  onObservacoesGeraisChange: (value: string) => void;
  
  // Observações do agendamento (temporárias)
  observacoesAgendamento: string;
  onObservacoesAgendamentoChange: (value: string) => void;
  
  // Trocas pendentes (temporárias)
  trocasPendentes: TrocaPendente[];
  onTrocasPendentesChange: (trocas: TrocaPendente[]) => void;
}

export default function ObservacoesAgendamentoSection({
  observacoesGerais,
  onObservacoesGeraisChange,
  observacoesAgendamento,
  onObservacoesAgendamentoChange,
  trocasPendentes,
  onTrocasPendentesChange
}: ObservacoesAgendamentoSectionProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      {/* Observações Gerais (Permanentes) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">📝 Observações Gerais</Label>
          <span className="text-xs text-muted-foreground">(permanentes)</span>
        </div>
        <Textarea
          value={observacoesGerais}
          onChange={(e) => onObservacoesGeraisChange(e.target.value)}
          placeholder="Informações permanentes sobre o cliente (preferências, horários, etc.)"
          rows={2}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Ficam gravadas no cadastro do cliente
        </p>
      </div>

      {/* Observações do Agendamento (Temporárias) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">📋 Observações deste Agendamento</Label>
          <span className="text-xs text-amber-600">(temporárias)</span>
        </div>
        <Textarea
          value={observacoesAgendamento}
          onChange={(e) => onObservacoesAgendamentoChange(e.target.value)}
          placeholder="Instruções específicas para esta entrega (levar expositor novo, etc.)"
          rows={2}
          className="text-sm"
        />
        <Alert className="py-2 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            Serão limpas após confirmação da entrega
          </AlertDescription>
        </Alert>
      </div>

      {/* Trocas a Realizar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">🔄 Trocas a Realizar</Label>
          <span className="text-xs text-amber-600">(temporárias)</span>
        </div>
        <TrocasPendentesEditor
          value={trocasPendentes}
          onChange={onTrocasPendentesChange}
        />
        <Alert className="py-2 bg-amber-50 border-amber-200">
          <RefreshCw className="h-3 w-3 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            Serão registradas no histórico após confirmação da entrega
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
