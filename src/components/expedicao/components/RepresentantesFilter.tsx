import { cn } from "@/lib/utils";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ChevronDown } from "lucide-react";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RepresentantesFilterProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  className?: string;
  compact?: boolean;
}

export const RepresentantesFilter = ({
  selectedIds,
  onSelectionChange,
  className,
  compact = false,
}: RepresentantesFilterProps) => {
  const { representantes } = useSupabaseRepresentantes();
  const [open, setOpen] = React.useState(false);

  const representantesAtivos = representantes.filter((r) => r.ativo);
  const SEM_REPRESENTANTE_ID = -1;
  const totalOpcoes = representantesAtivos.length + 1; // +1 para "Sem representante"

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === totalOpcoes) {
      onSelectionChange([]);
    } else {
      onSelectionChange([SEM_REPRESENTANTE_ID, ...representantesAtivos.map((r) => r.id)]);
    }
  };

  const allSelected = selectedIds.length === totalOpcoes;
  const noneSelected = selectedIds.length === 0;

  const getButtonText = () => {
    if (noneSelected || allSelected) return "Todos os representantes";
    if (selectedIds.length === 1) {
      if (selectedIds[0] === SEM_REPRESENTANTE_ID) return "Sem representante";
      const rep = representantesAtivos.find((r) => r.id === selectedIds[0]);
      return rep?.nome || "1 representante";
    }
    return `${selectedIds.length} representantes`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn("h-9 w-9 relative", className)}
              >
                <Users className="h-4 w-4" />
                {!noneSelected && !allSelected && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                    {selectedIds.length}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getButtonText()}</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            className={cn("justify-between min-w-[200px]", className)}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{getButtonText()}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        )}
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
          {/* Sem representante */}
          <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer">
            <Checkbox
              checked={selectedIds.includes(SEM_REPRESENTANTE_ID)}
              onCheckedChange={() => handleToggle(SEM_REPRESENTANTE_ID)}
              id="rep-sem"
            />
            <label
              htmlFor="rep-sem"
              className="flex-1 cursor-pointer text-sm italic text-muted-foreground"
            >
              Sem representante
            </label>
          </div>
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
