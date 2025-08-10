
import { useState, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PedidoCard from "./PedidoCard";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { usePedidoConverter } from "./hooks/usePedidoConverter";
import { Skeleton } from "@/components/ui/skeleton";

interface PedidoCardData {
  id: string;
  cliente: {
    nome: string;
    endereco?: string;
    telefone?: string;
    linkGoogleMaps?: string;
  };
  dataEntrega: string;
  quantidadeTotal: number;
  tipoPedido: string;
  substatus?: string;
}

interface DespachoProps {
  tipoFiltro?: 'hoje' | 'atrasadas';
}

export default function Despacho({ tipoFiltro }: DespachoProps) {
  const [date, setDate] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [pedidosFiltrados, setPedidosFiltrados] = useState<PedidoCardData[]>([]);
  const { pedidos, loading } = useExpedicaoStore();
  const { converterPedidoParaCard } = usePedidoConverter();

  useEffect(() => {
    document.title = "Expedição | Painel";
  }, []);

  const onMarcarSeparado = async (pedidoId: string) => {
    try {
      console.log("Marcando pedido como separado:", pedidoId);
      // TODO: Implementar função de marcar como separado
    } catch (error: any) {
      console.error("Erro ao marcar pedido como separado:", error.message);
    }
  };

  const onEditarAgendamento = (pedidoId: string) => {
    console.log("Editando agendamento:", pedidoId);
    // TODO: Implementar função de editar agendamento
  };

  const filtrarPedidosPorData = useCallback(() => {
    if (!date?.from || !date?.to) {
      setPedidosFiltrados([]);
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let pedidosFiltradosTemp = pedidos.filter((pedido) => {
      const dataEntrega = new Date(pedido.data_prevista_entrega);
      dataEntrega.setHours(0, 0, 0, 0);

      if (tipoFiltro === 'hoje') {
        return dataEntrega.getTime() === hoje.getTime();
      } else if (tipoFiltro === 'atrasadas') {
        return dataEntrega < hoje;
      } else {
        return dataEntrega >= date.from && dataEntrega <= date.to;
      }
    });

    const pedidosConvertidos = pedidosFiltradosTemp.map(converterPedidoParaCard);
    setPedidosFiltrados(pedidosConvertidos);
  }, [date, pedidos, tipoFiltro, converterPedidoParaCard]);

  useEffect(() => {
    filtrarPedidosPorData();
  }, [filtrarPedidosPorData]);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {tipoFiltro === 'hoje' ? 'Entregas de Hoje' : 
           tipoFiltro === 'atrasadas' ? 'Entregas Atrasadas' : 
           'Lista de Despacho'}
        </h1>
        {!tipoFiltro && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    `${format(date.from, "dd/MM/yyyy", {
                      locale: ptBR,
                    })} - ${format(date.to, "dd/MM/yyyy", { locale: ptBR })}`
                  ) : (
                    format(date.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Escolha um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-[150px]" />
            </div>
          ))}
        </div>
      ) : pedidosFiltrados.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {pedidosFiltrados.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onMarcarSeparado={() => onMarcarSeparado(pedido.id)}
              onEditarAgendamento={() => onEditarAgendamento(pedido.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">
            {tipoFiltro === 'hoje' ? 'Nenhuma entrega agendada para hoje.' :
             tipoFiltro === 'atrasadas' ? 'Nenhuma entrega atrasada encontrada.' :
             'Nenhum pedido encontrado para o período selecionado.'}
          </p>
        </div>
      )}
    </div>
  );
}
