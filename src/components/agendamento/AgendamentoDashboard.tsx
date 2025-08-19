
import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Day } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Users, Package, Truck, AlertTriangle } from "lucide-react";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import TipoPedidoBadge from "@/components/expedicao/TipoPedidoBadge";
import SubstatusBadge from "@/components/common/SubstatusBadge";
import { SubstatusPedidoAgendado } from "@/types";

export default function AgendamentoDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStartsOn, setWeekStartsOn] = useState<Day>(0); // 0 para Domingo, 1 para Segunda
  const [agendamentosPorDia, setAgendamentosPorDia] = useState<{ [key: string]: any[] }>({});
  const { agendamentos } = useAgendamentoClienteStore();
  const { clientes } = useClienteStore();

  useEffect(() => {
    // Agrupar agendamentos por dia
    const agendamentosAgrupados: { [key: string]: any[] } = {};
    agendamentos.forEach((agendamento) => {
      const dataReposicao = new Date(agendamento.dataReposicao);
      const dataFormatada = format(dataReposicao, "yyyy-MM-dd");
      if (!agendamentosAgrupados[dataFormatada]) {
        agendamentosAgrupados[dataFormatada] = [];
      }
      agendamentosAgrupados[dataFormatada].push(agendamento);
    });
    setAgendamentosPorDia(agendamentosAgrupados);
  }, [agendamentos]);

  const goToPreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const today = new Date();
  const start = startOfWeek(currentDate, { weekStartsOn });
  const end = addDays(start, 6);

  const renderAgendamento = (agendamento: any) => {
    return (
      <div key={agendamento.cliente.id} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{agendamento.cliente.nome}</span>
            <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
            <Badge 
              variant="default"
              className="bg-blue-500 text-white"
            >
              {agendamento.statusAgendamento}
            </Badge>
            <SubstatusBadge 
              substatus={agendamento.substatus_pedido as SubstatusPedidoAgendado} 
              className="text-xs"
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao || 0} unidades
          </div>
        </div>
      </div>
    );
  };

  const renderDay = (date: Date) => {
    const dataFormatada = format(date, "yyyy-MM-dd");
    const agendamentosDoDia = agendamentosPorDia[dataFormatada] || [];
    const isToday = isSameDay(date, today);

    return (
      <Card key={date.toISOString()} className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{format(date, "EEEE", { locale: ptBR })}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {format(date, "dd/MM", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agendamentosDoDia.length > 0 ? (
              agendamentosDoDia.map(renderAgendamento)
            ) : (
              <div className="text-xs text-muted-foreground">Nenhum agendamento para este dia.</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getDaysInWeek = (start: Date): Date[] => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  const daysInWeek = getDaysInWeek(start);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Dashboard de Agendamentos</h2>
      </div>
      <div className="grid grid-cols-7 gap-4">
        {daysInWeek.map((date) => renderDay(date))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Semana Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={goToNextWeek}>
          Próxima Semana
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
