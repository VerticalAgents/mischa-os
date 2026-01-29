import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeekNavigatorProps {
  semanaAtual: Date;
  onSemanaAnterior: () => void;
  onProximaSemana: () => void;
  onVoltarHoje: () => void;
  ehSemanaAtual: boolean;
}

export const WeekNavigator = ({
  semanaAtual,
  onSemanaAnterior,
  onProximaSemana,
  onVoltarHoje,
  ehSemanaAtual
}: WeekNavigatorProps) => {
  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 0 });

  const formatarData = (data: Date) => format(data, "dd/MM", { locale: ptBR });
  const formatarAno = (data: Date) => format(data, "yyyy", { locale: ptBR });

  const periodoTexto = `${formatarData(inicioSemana)} - ${formatarData(fimSemana)}/${formatarAno(fimSemana)}`;

  return (
    <div className="flex items-center gap-2 bg-muted border rounded-lg p-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onSemanaAnterior}
        className="h-8 w-8 p-0"
        title="Semana anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 px-2 min-w-[160px] justify-center">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium whitespace-nowrap">{periodoTexto}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onProximaSemana}
        className="h-8 w-8 p-0"
        title="Próxima semana"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onVoltarHoje}
        disabled={ehSemanaAtual}
        className="ml-2 text-xs"
      >
        Semana Atual
      </Button>
    </div>
  );
};
