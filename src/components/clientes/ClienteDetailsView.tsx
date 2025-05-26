
import { useState } from 'react';
import { Cliente } from '@/types';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ClienteDetalhesTabs from "./ClienteDetalhesTabs";
import ClienteFormDialog from "./ClienteFormDialog";

interface ClienteDetailsViewProps {
  cliente: Cliente;
  onBack: () => void;
}

export default function ClienteDetailsView({ cliente, onBack }: ClienteDetailsViewProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAgendamentoUpdate = () => {
    console.log('ClienteDetailsView: Agendamento atualizado, forçando refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClienteUpdate = () => {
    console.log('ClienteDetailsView: Cliente atualizado, forçando refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={cliente.nome}
        description={`Detalhes e configurações do cliente`}
        action={{
          label: "Voltar para lista",
          onClick: onBack
        }}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={() => setIsEditDialogOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Editar Cliente
        </Button>
      </div>
      
      <ClienteDetalhesTabs 
        cliente={cliente} 
        onAgendamentoUpdate={handleAgendamentoUpdate}
        refreshTrigger={refreshTrigger}
      />

      <ClienteFormDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        clienteId={cliente.id}
        onClienteUpdate={handleClienteUpdate}
      />
    </div>
  );
}
