
import { Button } from "@/components/ui/button";
import { Cliente } from "@/types";
import StatusBadge from "@/components/common/StatusBadge";
import ClienteDetalhesTabs from "@/components/clientes/ClienteDetalhesTabs";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import { useState } from "react";

interface ClienteDetailsViewProps {
  cliente: Cliente;
  onBack: () => void;
}

export default function ClienteDetailsView({ cliente, onBack }: ClienteDetailsViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
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
        <Button onClick={() => setIsFormOpen(true)}>Editar Cliente</Button>
      </div>

      <ClienteDetalhesTabs cliente={cliente} onEdit={() => setIsFormOpen(true)} />

      <ClienteFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        clienteId={cliente.id} 
      />
    </>
  );
}
