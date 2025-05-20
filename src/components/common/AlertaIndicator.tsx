
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AlertaIndicator() {
  const { alertas, marcarComoLida, marcarTodasComoLidas } = useAlertaStore(
    (state) => ({
      alertas: state.getAlertasNaoLidas().slice(0, 5), // Pegar apenas os 5 mais recentes
      marcarComoLida: state.marcarComoLida,
      marcarTodasComoLidas: state.marcarTodasComoLidas
    })
  );
  
  const quantidadeAlertasNaoLidas = alertas.length;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {quantidadeAlertasNaoLidas > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
              {quantidadeAlertasNaoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {quantidadeAlertasNaoLidas > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => marcarTodasComoLidas()}
                className="text-xs h-7"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-[300px] overflow-auto">
          {alertas.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              Nenhuma notificação não lida
            </div>
          ) : (
            <div className="divide-y">
              {alertas.map((alerta) => (
                <div key={alerta.id} className="p-4 hover:bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{getTipoAlerta(alerta.tipo)}</p>
                      <p className="text-sm text-muted-foreground">{alerta.mensagem}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alerta.dataAlerta), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => marcarComoLida(alerta.id)}
                      className="text-xs h-6 w-6 p-0"
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 border-t text-center">
          <Link to="/alertas" className="text-sm text-primary hover:underline">
            Ver todas as notificações
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getTipoAlerta(tipo: string): string {
  switch (tipo) {
    case "DeltaForaTolerancia":
      return "Recálculo de Quantidade";
    case "EstoqueAbaixoMinimo":
      return "Alerta de Estoque";
    case "ProximasEntregas":
      return "Entregas Pendentes";
    default:
      return "Notificação";
  }
}
