
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

interface CalculosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalculosModal = ({ open, onOpenChange }: CalculosModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cálculos de Separação
          </DialogTitle>
          <DialogDescription>
            Ferramenta para auxiliar no desenvolvimento visual do raciocínio de separação de pedidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-8 text-center text-gray-500">
            <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Área de cálculos em desenvolvimento...</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
