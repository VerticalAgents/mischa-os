
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useConfigStore } from "@/hooks/useConfigStore";

interface FiltrosLocalizacaoProps {
  onFiltroChange: (filtro: { rota?: string }) => void;
}

export default function FiltrosLocalizacao({ onFiltroChange }: FiltrosLocalizacaoProps) {
  const { rotasEntrega } = useConfigStore();
  const [rotaSelecionada, setRotaSelecionada] = useState<string>("");

  // Obter rotas das configurações do sistema ou usar rotas padrão
  const rotasDisponiveis = rotasEntrega.length > 0 ? rotasEntrega.map(r => r.nome) : [
    "Rota Centro",
    "Rota Norte", 
    "Rota Sul",
    "Rota Leste",
    "Rota Oeste"
  ];

  const handleRotaChange = (rota: string) => {
    setRotaSelecionada(rota);
    onFiltroChange({ rota: rota || undefined });
  };

  const limparFiltros = () => {
    setRotaSelecionada("");
    onFiltroChange({});
  };

  const temFiltrosAtivos = rotaSelecionada;

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Select value={rotaSelecionada} onValueChange={handleRotaChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por rota" />
          </SelectTrigger>
          <SelectContent>
            {rotasDisponiveis.map((rota) => (
              <SelectItem key={rota} value={rota}>
                {rota}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {temFiltrosAtivos && (
          <Button
            variant="outline"
            size="sm"
            onClick={limparFiltros}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {temFiltrosAtivos && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {rotaSelecionada && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {rotaSelecionada}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleRotaChange("")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
