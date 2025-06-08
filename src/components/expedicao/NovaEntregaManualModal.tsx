
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

interface NovaEntregaManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PIN_MESTRE = "651998";

export const NovaEntregaManualModal = ({ open, onOpenChange }: NovaEntregaManualModalProps) => {
  const [pin, setPin] = useState("");
  const [pinValidado, setPinValidado] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retorno'>('entrega');
  const { adicionarRegistro } = useHistoricoEntregasStore();
  const { clientes } = useClienteStore();

  useEffect(() => {
    if (open) {
      // Resetar formulário
      setClienteId("");
      setQuantidade("");
      setObservacao("");
      setDataEntrega("");
      setTipoEntrega('entrega');
      setPin("");
      setPinValidado(false);
    }
  }, [open]);

  const handleValidarPin = () => {
    if (pin === PIN_MESTRE) {
      setPinValidado(true);
      toast.success("PIN validado com sucesso");
    } else {
      toast.error("PIN inválido");
      setPin("");
    }
  };

  const handleSalvar = async () => {
    if (!pinValidado) {
      toast.error("É necessário validar o PIN mestre primeiro");
      return;
    }

    if (!clienteId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (!quantidade || parseInt(quantidade) <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (!dataEntrega) {
      toast.error("Data da entrega é obrigatória");
      return;
    }

    try {
      await adicionarRegistro({
        cliente_id: clienteId,
        data: new Date(dataEntrega),
        tipo: tipoEntrega,
        quantidade: parseInt(quantidade),
        itens: [],
        observacao: observacao.trim() || null,
        status_anterior: 'Manual'
      });
      
      onOpenChange(false);
      toast.success("Entrega manual criada com sucesso");
    } catch (error) {
      toast.error("Erro ao criar entrega manual");
    }
  };

  const handleClose = () => {
    setPin("");
    setPinValidado(false);
    onOpenChange(false);
  };

  const clientesAtivos = clientes.filter(c => c.ativo);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {pinValidado ? (
              <Unlock className="h-5 w-5 text-green-500" />
            ) : (
              <Lock className="h-5 w-5 text-red-500" />
            )}
            Nova Entrega Manual
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!pinValidado ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  🔒 Esta ação requer autenticação com PIN mestre.
                </p>
              </div>
              
              <div>
                <Label htmlFor="pin">PIN Mestre</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Digite o PIN mestre"
                  onKeyPress={(e) => e.key === 'Enter' && handleValidarPin()}
                />
              </div>
              
              <Button onClick={handleValidarPin} className="w-full">
                Validar PIN
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✅ PIN validado. Você pode criar uma nova entrega.
                </p>
              </div>

              <div>
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesAtivos.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dataEntrega">Data da Entrega</Label>
                <Input
                  id="dataEntrega"
                  type="datetime-local"
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tipoEntrega">Tipo</Label>
                <Select value={tipoEntrega} onValueChange={(value: 'entrega' | 'retorno') => setTipoEntrega(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrega">Entrega</SelectItem>
                    <SelectItem value="retorno">Retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantidade">Quantidade (unidades)</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  min="1"
                  placeholder="Ex: 50"
                />
              </div>
              
              <div>
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observação sobre esta entrega manual..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSalvar} className="flex-1">
                  Criar Entrega
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
