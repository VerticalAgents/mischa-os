import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, ChevronDown } from "lucide-react";
import { useSupabaseRotasEntrega } from "@/hooks/useSupabaseRotasEntrega";

interface RotasFilterProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export const RotasFilter = ({
  selectedIds,
  onSelectionChange,
}: RotasFilterProps) => {
  const { rotasEntrega } = useSupabaseRotasEntrega();
  const [open, setOpen] = React.useState(false);

  const rotasAtivas = rotasEntrega.filter((r) => r.ativo);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === rotasAtivas.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(rotasAtivas.map((r) => r.id));
    }
  };

  const allSelected = selectedIds.length === rotasAtivas.length;
  const noneSelected = selectedIds.length === 0;

  const getButtonText = () => {
    if (noneSelected || allSelected) return "Todas as rotas";
    if (selectedIds.length === 1) {
      const rota = rotasAtivas.find((r) => r.id === selectedIds[0]);
      return rota?.nome || "1 rota";
    }
    return `${selectedIds.length} rotas`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-between min-w-[180px]"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{getButtonText()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleToggleAll}
              id="todas-rotas"
            />
            <label
              htmlFor="todas-rotas"
              className="flex-1 cursor-pointer text-sm font-medium"
            >
              Todas
            </label>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {rotasAtivas.map((rota) => (
            <div
              key={rota.id}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.includes(rota.id)}
                onCheckedChange={() => handleToggle(rota.id)}
                id={`rota-${rota.id}`}
              />
              <label
                htmlFor={`rota-${rota.id}`}
                className="flex-1 cursor-pointer text-sm"
              >
                {rota.nome}
              </label>
            </div>
          ))}
          {rotasAtivas.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nenhuma rota cadastrada
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
