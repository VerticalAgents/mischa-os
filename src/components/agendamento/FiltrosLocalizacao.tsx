
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FiltrosLocalizacaoProps {
  onFiltroChange: (filtro: { rota?: string }) => void;
}

export default function FiltrosLocalizacao({ onFiltroChange }: FiltrosLocalizacaoProps) {
  const [rotaSelecionada, setRotaSelecionada] = useState<string>("");

  const handleRotaChange = (rota: string) => {
    setRotaSelecionada(rota);
    onFiltroChange({ rota: rota === "todas" ? undefined : rota });
  };

  return (
    <div className="flex gap-4 items-end">
      <div className="flex-1">
        <Label htmlFor="rota">Filtrar por Rota</Label>
        <Select value={rotaSelecionada} onValueChange={handleRotaChange}>
          <SelectTrigger id="rota">
            <SelectValue placeholder="Todas as rotas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as rotas</SelectItem>
            <SelectItem value="rota1">Rota 1 - Centro</SelectItem>
            <SelectItem value="rota2">Rota 2 - Zona Sul</SelectItem>
            <SelectItem value="rota3">Rota 3 - Zona Norte</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
