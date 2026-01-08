import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, FileText } from "lucide-react";

interface ExpedicaoListasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLista: (tipo: 'separacao' | 'documentos') => void;
  totalPedidos: number;
}

export const ExpedicaoListasModal = ({ 
  open, 
  onOpenChange, 
  onSelectLista,
  totalPedidos 
}: ExpedicaoListasModalProps) => {
  const handleSelect = (tipo: 'separacao' | 'documentos') => {
    onSelectLista(tipo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Listas de Expedição</DialogTitle>
          <DialogDescription>
            Escolha qual lista deseja imprimir
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Lista de Separação */}
          <button
            onClick={() => handleSelect('separacao')}
            className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-all cursor-pointer group"
          >
            <ClipboardList className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3" />
            <span className="font-semibold text-foreground">Lista de Separação</span>
            <span className="text-xs text-muted-foreground text-center mt-2">
              Para auxiliar na separação física dos produtos
            </span>
          </button>
          
          {/* Lista de Documentos */}
          <button
            onClick={() => handleSelect('documentos')}
            className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-all cursor-pointer group"
          >
            <FileText className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3" />
            <span className="font-semibold text-foreground">Lista de Documentos</span>
            <span className="text-xs text-muted-foreground text-center mt-2">
              Instruções de quais documentos imprimir (NF, Boleto, Ficha A4)
            </span>
          </button>
        </div>
        
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          Total: {totalPedidos} pedidos na lista atual
        </div>
      </DialogContent>
    </Dialog>
  );
};
