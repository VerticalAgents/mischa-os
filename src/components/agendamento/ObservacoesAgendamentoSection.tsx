import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ObservacoesAgendamentoSectionProps {
  observacoesGerais: string;
  onObservacoesGeraisChange: (value: string) => void;
  observacoesAgendamento: string;
  onObservacoesAgendamentoChange: (value: string) => void;
}

export default function ObservacoesAgendamentoSection({
  observacoesGerais,
  onObservacoesGeraisChange,
  observacoesAgendamento,
  onObservacoesAgendamentoChange,
}: ObservacoesAgendamentoSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">📝 Observações Gerais</Label>
          <span className="text-xs text-muted-foreground">(permanentes)</span>
        </div>
        <Textarea
          value={observacoesGerais}
          onChange={(e) => onObservacoesGeraisChange(e.target.value)}
          placeholder="Informações permanentes sobre o cliente (preferências, horários, etc.)"
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">📋 Observações deste Agendamento</Label>
          <span className="text-xs text-amber-600">(temporárias)</span>
        </div>
        <Textarea
          value={observacoesAgendamento}
          onChange={(e) => onObservacoesAgendamentoChange(e.target.value)}
          placeholder="Instruções específicas para esta entrega (levar expositor novo, etc.)"
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
