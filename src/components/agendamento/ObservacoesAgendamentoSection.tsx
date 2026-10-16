import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ObservacoesAgendamentoSectionProps {
  observacoesGerais: string;
  onObservacoesGeraisChange: (value: string) => void;
  observacoesAgendamento: string;
  onObservacoesAgendamentoChange: (value: string) => void;
  /** Um campo embaixo do outro, para tela estreita (o pedido do representante, num modal). */
  empilhado?: boolean;
  /** Troca os títulos e os exemplos (o representante fala em "pedido", não em "agendamento"). */
  textos?: { geral: string; geralExemplo: string; agendamento: string; agendamentoExemplo: string };
}

export default function ObservacoesAgendamentoSection({
  observacoesGerais,
  onObservacoesGeraisChange,
  observacoesAgendamento,
  onObservacoesAgendamentoChange,
  empilhado = false,
  textos,
}: ObservacoesAgendamentoSectionProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${empilhado ? "" : "md:grid-cols-2"}`}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">📝 {textos?.geral ?? "Observações Gerais"}</Label>
        <Textarea
          value={observacoesGerais}
          onChange={(e) => onObservacoesGeraisChange(e.target.value)}
          placeholder={textos?.geralExemplo ?? "Informações permanentes sobre o cliente (preferências, horários, etc.)"}
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">📋 {textos?.agendamento ?? "Observações deste Agendamento"}</Label>
        <Textarea
          value={observacoesAgendamento}
          onChange={(e) => onObservacoesAgendamentoChange(e.target.value)}
          placeholder={textos?.agendamentoExemplo ?? "Instruções específicas para esta entrega (levar expositor novo, etc.)"}
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
