
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { Cliente } from "@/types";
import { toast } from "@/hooks/use-toast";

interface ReclassificacaoStatusProps {
  cliente: Cliente;
  statusAtual: string;
  onStatusChange: (novoStatus: string, observacao?: string) => void;
}

const statusOptions = [
  { value: "Previsto", label: "Previsto", color: "bg-amber-500" },
  { value: "Agendado", label: "Agendado", color: "bg-green-500" },
  { value: "Contatado, sem resposta", label: "Contatado, sem resposta", color: "bg-yellow-500" },
  { value: "Reenviar após 24h", label: "Reenviar após 24h", color: "bg-orange-500" },
  { value: "Confirmado", label: "Confirmado", color: "bg-green-600" },
  { value: "Reagendar", label: "Reagendar", color: "bg-purple-500" },
  { value: "Verificação presencial", label: "Verificação presencial", color: "bg-blue-500" }
];

export default function ReclassificacaoStatus({ 
  cliente, 
  statusAtual, 
  onStatusChange 
}: ReclassificacaoStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [novoStatus, setNovoStatus] = useState(statusAtual);
  const [observacao, setObservacao] = useState("");

  const handleConfirmar = () => {
    if (novoStatus !== statusAtual) {
      onStatusChange(novoStatus, observacao);
      toast({
        title: "Status atualizado",
        description: `${cliente.nome} movido para "${novoStatus}"`,
      });
    }
    setIsOpen(false);
    setObservacao("");
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || "bg-gray-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Status</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reclassificar Status</DialogTitle>
          <DialogDescription>
            Altere o status de agendamento para {cliente.nome}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status atual</Label>
            <Badge className={`${getStatusColor(statusAtual)} text-white`}>
              {statusAtual}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="novo-status">Novo status</Label>
            <Select value={novoStatus} onValueChange={setNovoStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${option.color}`}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione uma observação sobre a mudança de status..."
              className="min-h-[80px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
