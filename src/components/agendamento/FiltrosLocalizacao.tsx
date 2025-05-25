
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

interface FiltrosLocalizacaoProps {
  onFiltroChange: (filtro: { rota?: string; cidade?: string }) => void;
}

// Mock data para rotas e cidades
const rotasMock = [
  "Rota Centro",
  "Rota Norte",
  "Rota Sul",
  "Rota Leste",
  "Rota Oeste"
];

const cidadesMock = [
  "São Paulo",
  "Guarulhos",
  "Osasco",
  "Santo André",
  "São Bernardo"
];

export default function FiltrosLocalizacao({ onFiltroChange }: FiltrosLocalizacaoProps) {
  const [rotaSelecionada, setRotaSelecionada] = useState<string>("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");

  const handleRotaChange = (rota: string) => {
    setRotaSelecionada(rota);
    onFiltroChange({ rota: rota || undefined, cidade: cidadeSelecionada || undefined });
  };

  const handleCidadeChange = (cidade: string) => {
    setCidadeSelecionada(cidade);
    onFiltroChange({ rota: rotaSelecionada || undefined, cidade: cidade || undefined });
  };

  const limparFiltros = () => {
    setRotaSelecionada("");
    setCidadeSelecionada("");
    onFiltroChange({});
  };

  const temFiltrosAtivos = rotaSelecionada || cidadeSelecionada;

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Select value={rotaSelecionada} onValueChange={handleRotaChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por rota" />
          </SelectTrigger>
          <SelectContent>
            {rotasMock.map((rota) => (
              <SelectItem key={rota} value={rota}>
                {rota}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cidadeSelecionada} onValueChange={handleCidadeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por cidade" />
          </SelectTrigger>
          <SelectContent>
            {cidadesMock.map((cidade) => (
              <SelectItem key={cidade} value={cidade}>
                {cidade}
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
          {cidadeSelecionada && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {cidadeSelecionada}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleCidadeChange("")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
