
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
import { Lock, Unlock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HistoricoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: any;
}

const PIN_MESTRE = "651998";

export const HistoricoEditModal = ({ open, onOpenChange, registro }: HistoricoEditModalProps) => {
  const [pin, setPin] = useState("");
  const [pinValidado, setPinValidado] = useState(false);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retorno'>('entrega');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { editarRegistro, excluirRegistro } = useHistoricoEntregasStore();

  useEffect(() => {
    if (open && registro) {
      setQuantidade(registro.quantidade?.toString() || "");
      setObservacao(registro.observacao || "");
      setDataEntrega(format(new Date(registro.data), "yyyy-MM-dd'T'HH:mm"));
      setTipoEntrega(registro.tipo);
      setPin("");
      setPinValidado(false);
    }
  }, [open, registro]);

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

    if (!quantidade || parseInt(quantidade) <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (!dataEntrega) {
      toast.error("Data da entrega é obrigatória");
      return;
    }

    try {
      await editarRegistro(registro.id, {
        quantidade: parseInt(quantidade),
        observacao: observacao.trim() || null,
        data: new Date(dataEntrega),
        tipo: tipoEntrega
      });
      
      onOpenChange(false);
      toast.success("Registro editado com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar alterações");
    }
  };

  const handleExcluir = async () => {
    if (!pinValidado) {
      toast.error("É necessário validar o PIN mestre primeiro");
      return;
    }

    try {
      await excluirRegistro(registro.id);
      onOpenChange(false);
      setShowDeleteDialog(false);
      toast.success("Registro excluído com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir registro");
    }
  };

  const handleClose = () => {
    setPin("");
    setPinValidado(false);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  if (!registro) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pinValidado ? (
                <Unlock className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-red-500" />
              )}
              Editar Registro de {registro.tipo === 'entrega' ? 'Entrega' : 'Retorno'}
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
                    ✅ PIN validado. Você pode editar o registro.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Cliente:</span>
                    <p>{registro.cliente_nome}</p>
                  </div>
                  <div>
                    <span className="font-medium">Data Original:</span>
                    <p>{format(new Date(registro.data), "dd/MM/yyyy HH:mm")}</p>
                  </div>
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
                  />
                </div>
                
                <div>
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Adicione uma observação sobre a edição..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                  <Button onClick={handleSalvar} className="flex-1">
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O registro de {registro.tipo === 'entrega' ? 'entrega' : 'retorno'} será 
              permanentemente removido do sistema e isso afetará os cálculos de giro.
              <br /><br />
              <strong>Cliente:</strong> {registro.cliente_nome}<br />
              <strong>Data:</strong> {format(new Date(registro.data), "dd/MM/yyyy HH:mm")}<br />
              <strong>Quantidade:</strong> {registro.quantidade} unidades
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
