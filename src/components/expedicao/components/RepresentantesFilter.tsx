import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ChevronDown } from "lucide-react";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";

interface RepresentantesFilterProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export const RepresentantesFilter = ({
  selectedIds,
  onSelectionChange,
}: RepresentantesFilterProps) => {
  const { representantes } = useSupabaseRepresentantes();
  const [open, setOpen] = React.useState(false);

  const representantesAtivos = representantes.filter((r) => r.ativo);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === representantesAtivos.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(representantesAtivos.map((r) => r.id));
    }
  };

  const allSelected = selectedIds.length === representantesAtivos.length;
  const noneSelected = selectedIds.length === 0;

  const getButtonText = () => {
    if (noneSelected || allSelected) return "Todos os representantes";
    if (selectedIds.length === 1) {
      const rep = representantesAtivos.find((r) => r.id === selectedIds[0]);
      return rep?.nome || "1 representante";
    }
    return `${selectedIds.length} representantes`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-between min-w-[200px]"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{getButtonText()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleToggleAll}
              id="todos-representantes"
            />
            <label
              htmlFor="todos-representantes"
              className="flex-1 cursor-pointer text-sm font-medium"
            >
              Todos
            </label>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {representantesAtivos.map((rep) => (
            <div
              key={rep.id}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.includes(rep.id)}
                onCheckedChange={() => handleToggle(rep.id)}
                id={`rep-${rep.id}`}
              />
              <label
                htmlFor={`rep-${rep.id}`}
                className="flex-1 cursor-pointer text-sm"
              >
                {rep.nome}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
