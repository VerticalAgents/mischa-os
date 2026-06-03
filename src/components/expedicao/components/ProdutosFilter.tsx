import React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, ChevronDown } from "lucide-react";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

interface ProdutosFilterProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  allowedIds?: string[];
  modo?: 'incluir' | 'excluir';
  onModoChange?: (modo: 'incluir' | 'excluir') => void;
  className?: string;
}

export const ProdutosFilter = ({
  selectedIds,
  onSelectionChange,
  allowedIds,
  modo = 'incluir',
  onModoChange,
  className,
}: ProdutosFilterProps) => {
  const { produtos } = useSupabaseProdutos();
  const [open, setOpen] = React.useState(false);

  const allowedSet = allowedIds ? new Set(allowedIds) : null;
  const produtosAtivos = produtos.filter(
    (p) => p.ativo && (!allowedSet || allowedSet.has(p.id))
  );

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleClear = () => onSelectionChange([]);

  const noneSelected = selectedIds.length === 0;

  const getButtonText = () => {
    if (noneSelected) return "Todos os produtos";
    const prefix = modo === 'excluir' ? 'Sem ' : '';
    if (selectedIds.length === 1) {
      const p = produtosAtivos.find((x) => x.id === selectedIds[0]);
      return prefix + (p?.nome || "1 produto");
    }
    return `${prefix}${selectedIds.length} produtos`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between min-w-[200px]", className)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{getButtonText()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium px-2">Filtrar por produto</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={noneSelected}
            className="h-7 px-2 text-xs"
          >
            Limpar
          </Button>
        </div>
        {onModoChange && (
          <div className="px-2 py-2 border-b flex rounded-none overflow-hidden">
            <Button
              variant={modo === 'incluir' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModoChange('incluir')}
              className="flex-1 h-7 text-xs rounded-r-none"
            >
              Contém
            </Button>
            <Button
              variant={modo === 'excluir' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModoChange('excluir')}
              className="flex-1 h-7 text-xs rounded-l-none"
            >
              Não contém
            </Button>
          </div>
        )}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {produtosAtivos.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Nenhum produto ativo
            </div>
          ) : (
            produtosAtivos.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.includes(p.id)}
                  onCheckedChange={() => handleToggle(p.id)}
                  id={`prod-${p.id}`}
                />
                <label
                  htmlFor={`prod-${p.id}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {p.nome}
                </label>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};