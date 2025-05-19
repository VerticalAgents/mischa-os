
import { Button } from "@/components/ui/button";
import { Cliente } from "@/types";
import { Trash2 } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import ClienteDetalhesTabs from "@/components/clientes/ClienteDetalhesTabs";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import { useState } from "react";
import { useClienteStore } from "@/hooks/useClienteStore"; 
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
import { toast } from "sonner";

interface ClienteDetailsViewProps {
  cliente: Cliente;
  onBack: () => void;
}

export default function ClienteDetailsView({ cliente, onBack }: ClienteDetailsViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { removerCliente } = useClienteStore();
  
  const handleDeleteCliente = () => {
    removerCliente(cliente.id);
    toast.success(`Cliente ${cliente.nome} excluído com sucesso.`);
    onBack();
  };
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Voltar para lista
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{cliente.nome}</h1>
          <p className="text-muted-foreground">
            {cliente.cnpjCpf}
            <StatusBadge status={cliente.statusCliente} className="ml-2" />
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsFormOpen(true)}>Editar Cliente</Button>
        </div>
      </div>

      <ClienteDetalhesTabs cliente={cliente} onEdit={() => setIsFormOpen(true)} />

      <div className="mt-8 border-t pt-6">
        <div className="flex justify-end">
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Cliente
          </Button>
        </div>
      </div>

      <ClienteFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        clienteId={cliente.id} 
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente {cliente.nome}?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCliente}>
              Sim, excluir cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
