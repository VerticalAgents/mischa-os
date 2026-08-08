import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tags, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoriaInfo } from "@/hooks/useProducaoDashboard";

interface CategoriasProdutoFilterProps {
  categorias: CategoriaInfo[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  className?: string;
}

export default function CategoriasProdutoFilter({
  categorias,
  selectedIds,
  onSelectionChange,
  className,
}: CategoriasProdutoFilterProps) {
  const [open, setOpen] = React.useState(false);

  const allSelected = selectedIds.length === 0 || selectedIds.length === categorias.length;

  const handleToggle = (id: number) => {
    const base = selectedIds.length === 0 ? categorias.map(c => c.id) : selectedIds;
    const next = base.includes(id) ? base.filter(i => i !== id) : [...base, id];
    onSelectionChange(next.length === categorias.length ? [] : next);
  };

  const handleToggleAll = () => onSelectionChange(allSelected ? [] : []);

  const texto = () => {
    if (allSelected) return "Todas as categorias";
    if (selectedIds.length === 1) {
      return categorias.find(c => c.id === selectedIds[0])?.nome || "1 categoria";
    }
    return `${selectedIds.length} categorias`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 justify-between gap-2 font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <Tags className="h-4 w-4 shrink-0" />
            <span className="truncate">{texto()}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 z-[100]" align="start">
        <button
          type="button"
          onClick={handleToggleAll}
          className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-2 py-1.5"
        >
          Selecionar todas
        </button>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {categorias.map(categoria => {
            const checked = allSelected || selectedIds.includes(categoria.id);
            return (
              <label
                key={categoria.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleToggle(categoria.id)}
                />
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: categoria.cor }}
                />
                <span className="text-sm truncate">{categoria.nome}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
