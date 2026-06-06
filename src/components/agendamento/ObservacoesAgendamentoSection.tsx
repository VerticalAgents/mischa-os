import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
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
  const temTrocas = trocasPendentes.length > 0;
  const [trocasOpen, setTrocasOpen] = useState(temTrocas);

  // Mantém o accordion aberto se houver trocas
  useEffect(() => {
    if (temTrocas && !trocasOpen) setTrocasOpen(true);
  }, [temTrocas, trocasOpen]);

  return (
    <div className="space-y-4 border-t pt-4">
      {/* Trocas a Realizar (accordion separado, vem antes) */}
      <div className="border rounded-md">
        <Button
          type="button"
          variant="ghost"
          onClick={() => !temTrocas && setTrocasOpen(!trocasOpen)}
          disabled={temTrocas}
          className="w-full justify-between h-auto px-3 py-2 hover:bg-muted/50 disabled:opacity-100 disabled:cursor-default"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-amber-600" />
            <Label className="text-sm font-medium cursor-pointer">Trocas a Realizar</Label>
            <span className="text-xs text-amber-600">(temporárias)</span>
            {temTrocas && (
              <span className="text-xs text-muted-foreground ml-1">
                · {trocasPendentes.length} {trocasPendentes.length === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>
          {!temTrocas && (trocasOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
        </Button>
        {trocasOpen && (
          <div className="px-3 pb-3 pt-1">
            <TrocasPendentesEditor
              value={trocasPendentes}
              onChange={onTrocasPendentesChange}
            />
          </div>
        )}
      </div>

      {/* Observações lado a lado */}
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
    </div>
  );
}
