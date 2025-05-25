
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cliente } from "@/types";

interface GiroMetaFormProps {
  cliente: Cliente;
  metaAtual: number;
  onClose: () => void;
  onSave: (meta: number) => void;
}

export default function GiroMetaForm({ cliente, metaAtual, onClose, onSave }: GiroMetaFormProps) {
  const [metaSemanal, setMetaSemanal] = useState(metaAtual);
  const [metaMensal, setMetaMensal] = useState(metaAtual * 4.33); // aproximadamente 4.33 semanas em um mês
  
  const handleChangeSemanal = (value: number) => {
    setMetaSemanal(value);
    setMetaMensal(Math.round(value * 4.33));
  };
  
  const handleChangeMensal = (value: number) => {
    setMetaMensal(value);
    setMetaSemanal(Math.round(value / 4.33));
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir Meta de Giro</DialogTitle>
          <DialogDescription>
            Configure as metas de giro para {cliente.nome}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="meta-semanal">Meta Semanal</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="meta-semanal"
                type="number"
                min={1}
                value={metaSemanal}
                onChange={(e) => handleChangeSemanal(parseInt(e.target.value) || 0)}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">unidades/semana</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meta-mensal">Meta Mensal</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="meta-mensal"
                type="number"
                min={1}
                value={metaMensal}
                onChange={(e) => handleChangeMensal(parseInt(e.target.value) || 0)}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">unidades/mês</span>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium">Giro Atual Semanal</div>
            <div className="text-sm text-muted-foreground">
              {calcularGiroSemanalBase(cliente)} unidades/semana
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(metaSemanal)}>Salvar Meta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to calculate weekly turnover
function calcularGiroSemanalBase(cliente: Cliente): number {
  // Para periodicidade em dias, converter para semanas
  if (cliente.periodicidadePadrao === 3) {
    // Caso especial: 3x por semana
    return cliente.quantidadePadrao * 3;
  }
  
  // Para outros casos, calcular giro semanal
  const periodicidadeSemanas = cliente.periodicidadePadrao / 7;
  return Math.round(cliente.quantidadePadrao / periodicidadeSemanas);
}
