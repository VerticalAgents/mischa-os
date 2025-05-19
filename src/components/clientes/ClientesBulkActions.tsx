
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cliente } from "@/types";
import { useClienteStore } from "@/hooks/cliente";
import { CheckSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClientesBulkActionsProps {
  selectedClienteIds: number[];
  onClearSelection: () => void;
  onToggleSelectionMode: () => void;
  isSelectionMode: boolean;
}

export default function ClientesBulkActions({
  selectedClienteIds,
  onClearSelection,
  onToggleSelectionMode,
  isSelectionMode
}: ClientesBulkActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<string>("");
  const [bulkEditValue, setBulkEditValue] = useState<string>("");
  
  const { removerCliente, clientes, atualizarCliente } = useClienteStore();
  
  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    setIsConfirmDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    selectedClienteIds.forEach(id => {
      removerCliente(id);
    });
    
    toast.success(`${selectedClienteIds.length} clientes excluídos com sucesso.`);
    setIsConfirmDeleteDialogOpen(false);
    onClearSelection();
    onToggleSelectionMode();
  };
  
  const handleBulkEdit = () => {
    if (!bulkEditField || !bulkEditValue) {
      toast.error("Selecione um campo e valor para editar.");
      return;
    }
    
    selectedClienteIds.forEach(id => {
      let updateData: Partial<Cliente> = {};
      
      switch (bulkEditField) {
        case "statusCliente":
          updateData = { statusCliente: bulkEditValue as any };
          break;
        case "tipoLogistica":
          updateData = { tipoLogistica: bulkEditValue as any };
          break;
        case "tipoCobranca":
          updateData = { tipoCobranca: bulkEditValue as any };
          break;
        case "formaPagamento":
          updateData = { formaPagamento: bulkEditValue as any };
          break;
        case "quantidadePadrao":
          updateData = { quantidadePadrao: parseInt(bulkEditValue) };
          break;
        case "periodicidadePadrao":
          updateData = { periodicidadePadrao: parseInt(bulkEditValue) };
          break;
      }
      
      atualizarCliente(id, updateData);
    });
    
    toast.success(`${selectedClienteIds.length} clientes atualizados com sucesso.`);
    setIsBulkEditDialogOpen(false);
    setBulkEditField("");
    setBulkEditValue("");
    onClearSelection();
  };
  
  return (
    <>
      <div className="flex space-x-2 mb-4">
        <Button
          variant={isSelectionMode ? "default" : "outline"}
          onClick={onToggleSelectionMode}
          className="flex items-center gap-1"
        >
          <CheckSquare className="h-4 w-4" />
          {isSelectionMode ? "Sair do modo seleção" : "Selecionar clientes"}
        </Button>
        
        {isSelectionMode && selectedClienteIds.length > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => setIsBulkEditDialogOpen(true)}
            >
              Editar {selectedClienteIds.length} clientes
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Excluir {selectedClienteIds.length} clientes
            </Button>
          </>
        )}
      </div>
      
      {/* First delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir clientes</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedClienteIds.length} clientes. 
              Esta operação exige confirmação adicional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Prosseguir com exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Second delete confirmation dialog */}
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação final</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-destructive">Atenção:</strong> Você tem certeza que deseja excluir {selectedClienteIds.length} clientes?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Sim, excluir {selectedClienteIds.length} clientes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Bulk edit dialog */}
      <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {selectedClienteIds.length} clientes</DialogTitle>
            <DialogDescription>
              Selecione o campo e o valor a serem aplicados a todos os clientes selecionados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field">Campo</Label>
              <Select
                value={bulkEditField}
                onValueChange={(value) => setBulkEditField(value)}
              >
                <SelectTrigger id="field">
                  <SelectValue placeholder="Selecione um campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="statusCliente">Status</SelectItem>
                  <SelectItem value="tipoLogistica">Tipo de Logística</SelectItem>
                  <SelectItem value="tipoCobranca">Tipo de Cobrança</SelectItem>
                  <SelectItem value="formaPagamento">Forma de Pagamento</SelectItem>
                  <SelectItem value="quantidadePadrao">Quantidade Padrão</SelectItem>
                  <SelectItem value="periodicidadePadrao">Periodicidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              {bulkEditField === "statusCliente" && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={bulkEditValue}
                    onValueChange={(value) => setBulkEditValue(value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Em análise">Em análise</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="A ativar">A ativar</SelectItem>
                      <SelectItem value="Standby">Standby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {bulkEditField === "tipoLogistica" && (
                <div>
                  <Label htmlFor="logistica">Tipo de Logística</Label>
                  <Select
                    value={bulkEditValue}
                    onValueChange={(value) => setBulkEditValue(value)}
                  >
                    <SelectTrigger id="logistica">
                      <SelectValue placeholder="Selecione um tipo de logística" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Própria">Própria</SelectItem>
                      <SelectItem value="Distribuição">Distribuição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {bulkEditField === "tipoCobranca" && (
                <div>
                  <Label htmlFor="cobranca">Tipo de Cobrança</Label>
                  <Select
                    value={bulkEditValue}
                    onValueChange={(value) => setBulkEditValue(value)}
                  >
                    <SelectTrigger id="cobranca">
                      <SelectValue placeholder="Selecione um tipo de cobrança" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À vista">À vista</SelectItem>
                      <SelectItem value="Consignado">Consignado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {bulkEditField === "formaPagamento" && (
                <div>
                  <Label htmlFor="pagamento">Forma de Pagamento</Label>
                  <Select
                    value={bulkEditValue}
                    onValueChange={(value) => setBulkEditValue(value)}
                  >
                    <SelectTrigger id="pagamento">
                      <SelectValue placeholder="Selecione uma forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {["quantidadePadrao", "periodicidadePadrao"].includes(bulkEditField) && (
                <div>
                  <Label htmlFor="value">
                    {bulkEditField === "quantidadePadrao" ? "Quantidade Padrão" : "Periodicidade (dias)"}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    value={bulkEditValue}
                    onChange={(e) => setBulkEditValue(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkEdit}>
              Aplicar a {selectedClienteIds.length} clientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
