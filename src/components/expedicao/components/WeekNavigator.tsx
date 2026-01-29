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
  modoVisualizacao?: 'semana' | 'todos';
  onMudarModoVisualizacao?: (modo: 'semana' | 'todos') => void;
}

export const WeekNavigator = ({
  semanaAtual,
  onSemanaAnterior,
  onProximaSemana,
  onVoltarHoje,
  ehSemanaAtual,
  modoVisualizacao = 'semana',
  onMudarModoVisualizacao
}: WeekNavigatorProps) => {
  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 0 });

  const formatarData = (data: Date) => format(data, "dd/MM", { locale: ptBR });
  const formatarAno = (data: Date) => format(data, "yyyy", { locale: ptBR });

  const periodoTexto = `${formatarData(inicioSemana)} - ${formatarData(fimSemana)}/${formatarAno(fimSemana)}`;

  const isVerTodos = modoVisualizacao === 'todos';

  return (
    <div className="flex items-center gap-2 bg-muted border rounded-lg p-2 flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        onClick={onSemanaAnterior}
        className="h-8 w-8 p-0"
        title="Semana anterior"
        disabled={isVerTodos}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className={`flex items-center gap-2 px-2 min-w-[160px] justify-center ${isVerTodos ? 'opacity-50' : ''}`}>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium whitespace-nowrap">
          {isVerTodos ? "Todos os pendentes" : periodoTexto}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onProximaSemana}
        className="h-8 w-8 p-0"
        title="Próxima semana"
        disabled={isVerTodos}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 ml-2">
        <Button
          variant={!isVerTodos ? "default" : "outline"}
          size="sm"
          onClick={() => {
            onMudarModoVisualizacao?.('semana');
            if (!ehSemanaAtual) onVoltarHoje();
          }}
          className="text-xs"
        >
          Semana Atual
        </Button>
        
        {onMudarModoVisualizacao && (
          <Button
            variant={isVerTodos ? "default" : "outline"}
            size="sm"
            onClick={() => onMudarModoVisualizacao('todos')}
            className="text-xs"
          >
            Ver Todos
          </Button>
        )}
      </div>
    </div>
  );
};
