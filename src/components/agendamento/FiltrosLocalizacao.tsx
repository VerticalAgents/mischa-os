
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FiltrosLocalizacaoProps {
  onFiltroChange: (filtro: { rota?: string }) => void;
}

export default function FiltrosLocalizacao({ onFiltroChange }: FiltrosLocalizacaoProps) {
  const [rotaSelecionada, setRotaSelecionada] = useState<string>("todas");

  const handleRotaChange = (rota: string) => {
    setRotaSelecionada(rota);
    onFiltroChange({ rota: rota === "todas" ? undefined : rota });
  };

  // Define valid route options
  const rotasOptions = [
    { value: "todas", label: "Todas as rotas" },
    { value: "rota1", label: "Rota 1 - Centro" },
    { value: "rota2", label: "Rota 2 - Zona Sul" },
    { value: "rota3", label: "Rota 3 - Zona Norte" }
  ];

  return (
    <div className="flex gap-4 items-end">
      <div className="flex-1">
        <Label htmlFor="rota">Filtrar por Rota</Label>
        <Select value={rotaSelecionada} onValueChange={handleRotaChange}>
          <SelectTrigger id="rota">
            <SelectValue placeholder="Todas as rotas" />
          </SelectTrigger>
          <SelectContent>
            {rotasOptions.map((rota) => (
              <SelectItem key={rota.value} value={rota.value}>
                {rota.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
