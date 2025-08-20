
import { useState } from "react";
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
import { useClienteStore } from "@/hooks/useClienteStore";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { toast } from "sonner";
import { format } from "date-fns";

interface NovaEntregaManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NovaEntregaManualModal = ({ open, onOpenChange }: NovaEntregaManualModalProps) => {
  const [clienteId, setClienteId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataEntrega, setDataEntrega] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retorno'>('entrega');
  const [loading, setLoading] = useState(false);

  const { clientes } = useClienteStore();
  const { adicionarRegistro } = useHistoricoEntregasStore();

  const handleSalvar = async () => {
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

    setLoading(true);
    try {
      await adicionarRegistro({
        cliente_id: clienteId,
        data: new Date(dataEntrega),
        tipo: tipoEntrega,
        quantidade: parseInt(quantidade),
        itens: [],
        observacao: observacao.trim() || undefined,
        status_anterior: 'Manual',
        editado_manualmente: true
      });
      
      // Limpar formulário
      setClienteId("");
      setQuantidade("");
      setObservacao("");
      setDataEntrega(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setTipoEntrega('entrega');
      
      onOpenChange(false);
      toast.success("Entrega manual registrada com sucesso");
    } catch (error) {
      toast.error("Erro ao registrar entrega manual");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Nova Entrega Manual
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.filter(cliente => cliente.ativo).map(cliente => (
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
              placeholder="Ex: 100"
            />
          </div>
          
          <div>
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione uma observação sobre esta entrega..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
