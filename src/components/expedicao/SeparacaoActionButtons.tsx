
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Printer, FileText } from "lucide-react";

interface SeparacaoActionButtonsProps {
  onMarcarTodos: () => void;
  onImprimirLista: () => void;
  onImprimirEtiquetas: () => void;
}

const SeparacaoActionButtons: React.FC<SeparacaoActionButtonsProps> = ({
  onMarcarTodos,
  onImprimirLista,
  onImprimirEtiquetas
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        onClick={onMarcarTodos} 
        size="sm" 
        className="flex items-center gap-1"
      >
        <Check className="h-4 w-4" /> Marcar todos como separados
      </Button>
      <Button onClick={onImprimirLista} size="sm" variant="outline" className="flex items-center gap-1">
        <Printer className="h-4 w-4" /> Imprimir Lista
      </Button>
      <Button onClick={onImprimirEtiquetas} size="sm" variant="outline" className="flex items-center gap-1">
        <FileText className="h-4 w-4" /> Imprimir Etiquetas
      </Button>
    </div>
  );
};

export default SeparacaoActionButtons;
