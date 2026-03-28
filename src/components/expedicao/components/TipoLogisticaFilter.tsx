import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, ChevronDown } from "lucide-react";

const OPCOES_LOGISTICA = [
  { value: "_sem_logistica", label: "Sem logística cadastrada", italic: true },
  { value: "Própria", label: "Própria", italic: false },
  { value: "Terceirizada", label: "Terceirizada", italic: false },
  { value: "Retirada", label: "Retirada", italic: false },
];

interface TipoLogisticaFilterProps {
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

export const TipoLogisticaFilter = ({
  selectedValues,
  onSelectionChange,
}: TipoLogisticaFilterProps) => {
  const [open, setOpen] = React.useState(false);
  const totalOpcoes = OPCOES_LOGISTICA.length;

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const handleToggleAll = () => {
    if (selectedValues.length === totalOpcoes) {
      onSelectionChange([]);
    } else {
      onSelectionChange(OPCOES_LOGISTICA.map((o) => o.value));
    }
  };

  const allSelected = selectedValues.length === totalOpcoes;
  const noneSelected = selectedValues.length === 0;

  const getButtonText = () => {
    if (noneSelected || allSelected) return "Todos os tipos logística";
    if (selectedValues.length === 1) {
      const opcao = OPCOES_LOGISTICA.find((o) => o.value === selectedValues[0]);
      return opcao?.label || "1 tipo";
    }
    return `${selectedValues.length} tipos logística`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[200px]">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
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
              id="todos-logistica"
            />
            <label
              htmlFor="todos-logistica"
              className="flex-1 cursor-pointer text-sm font-medium"
            >
              Todos
            </label>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {OPCOES_LOGISTICA.map((opcao) => (
            <div
              key={opcao.value}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
            >
              <Checkbox
                checked={selectedValues.includes(opcao.value)}
                onCheckedChange={() => handleToggle(opcao.value)}
                id={`log-${opcao.value}`}
              />
              <label
                htmlFor={`log-${opcao.value}`}
                className={`flex-1 cursor-pointer text-sm ${opcao.italic ? "italic text-muted-foreground" : ""}`}
              >
                {opcao.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
