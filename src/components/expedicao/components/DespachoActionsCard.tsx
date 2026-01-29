import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Truck, Package, Download, MapPin, RefreshCw } from "lucide-react";

interface DespachoActionsCardProps {
  tipoFiltro: "hoje" | "atrasadas" | "antecipada";
  onDespacharEmMassa: () => void;
  onEntregarEmMassa: () => void;
  onDownloadCSV: () => void;
  onOtimizadorRota: () => void;
  onAtualizarDados: () => void;
  temPedidosSeparados: boolean;
  temPedidosDespachados: boolean;
  isLoading: boolean;
}

export const DespachoActionsCard = ({
  tipoFiltro,
  onDespacharEmMassa,
  onEntregarEmMassa,
  onDownloadCSV,
  onOtimizadorRota,
  onAtualizarDados,
  temPedidosSeparados,
  temPedidosDespachados,
  isLoading
}: DespachoActionsCardProps) => {
  const mostrarAcoesDespacho = tipoFiltro !== "antecipada";

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {mostrarAcoesDespacho && (
          <>
            <Button
              onClick={onDespacharEmMassa}
              variant="outline"
              className="w-full justify-start"
              disabled={!temPedidosSeparados || isLoading}
            >
              <Truck className="h-4 w-4 mr-2" />
              Despachar em Massa
            </Button>

            <Button
              onClick={onEntregarEmMassa}
              className="w-full justify-start bg-green-600 hover:bg-green-700"
              disabled={!temPedidosDespachados || isLoading}
            >
              <Package className="h-4 w-4 mr-2" />
              Entregar em Massa
            </Button>

            <Button
              onClick={onDownloadCSV}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>

            <Button
              onClick={onOtimizadorRota}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Otimizador de Rota
            </Button>
          </>
        )}

        <Button
          onClick={onAtualizarDados}
          variant="outline"
          className="w-full justify-start"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardContent>
    </Card>
  );
};
