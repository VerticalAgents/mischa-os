
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { PinDialog } from "@/components/ui/pin-dialog";
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

export const HistoricoEditModal = ({ open, onOpenChange, registro }: HistoricoEditModalProps) => {
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
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
      setShowPinDialog(true);
      setAdminVerified(false);
    }
  }, [open, registro]);

  const handlePinConfirm = (success: boolean) => {
    setShowPinDialog(false);
    setAdminVerified(success);
    if (!success) {
      onOpenChange(false);
    }
  };

  const handleSalvar = async () => {
    if (!adminVerified) {
      toast.error("É necessário verificação de administrador");
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
    if (!adminVerified) {
      toast.error("É necessário verificação de administrador");
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
    setShowPinDialog(false);
    setShowDeleteDialog(false);
    setAdminVerified(false);
    onOpenChange(false);
  };

  if (!registro) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar Registro de {registro.tipo === 'entrega' ? 'Entrega' : 'Retorno'}
            </DialogTitle>
          </DialogHeader>
          
          <AdminGuard fallback={
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Você precisa de permissões de administrador para editar registros.
              </p>
            </div>
          }>
            {adminVerified && (
              <div className="space-y-4">
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
          </AdminGuard>
        </DialogContent>
      </Dialog>

      <PinDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onConfirm={handlePinConfirm}
        title="Verificação de Administrador"
        description="Editar registros de entrega requer privilégios de administrador."
      />

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
