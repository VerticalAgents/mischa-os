
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface ProductionParamsProps {
  capacidadeForma: number;
  atualizarCapacidadeForma: (capacidade: number) => void;
  formasPorLote: number;
  atualizarFormasPorLote: (formas: number) => void;
  mostrarPedidosPrevistos: boolean;
  setMostrarPedidosPrevistos: (mostrar: boolean) => void;
}

export default function ProductionParams({
  capacidadeForma,
  atualizarCapacidadeForma,
  formasPorLote,
  atualizarFormasPorLote,
  mostrarPedidosPrevistos,
  setMostrarPedidosPrevistos
}: ProductionParamsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parâmetros de Produção</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Unidades por forma:</label>
            <Input 
              type="number" 
              value={capacidadeForma} 
              onChange={(e) => atualizarCapacidadeForma(parseInt(e.target.value) || 30)} 
              min="1"
              max="100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Formas por lote:</label>
            <Input 
              type="number" 
              value={formasPorLote} 
              onChange={(e) => atualizarFormasPorLote(parseInt(e.target.value) || 10)} 
              min="1"
              max="20"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="mostrarPedidosPrevistos"
              checked={mostrarPedidosPrevistos}
              onCheckedChange={setMostrarPedidosPrevistos}
            />
            <label htmlFor="mostrarPedidosPrevistos" className="text-sm">
              Incluir pedidos previstos (50%)
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
