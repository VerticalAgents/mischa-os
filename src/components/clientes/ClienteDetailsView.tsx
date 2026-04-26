
import { useState } from 'react';
import { Cliente } from '@/types';
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ClienteDetalhesTabs from "./ClienteDetalhesTabs";
import ClienteFormDialog from "./ClienteFormDialog";
import { useEditPermission } from "@/contexts/EditPermissionContext";

interface ClienteDetailsViewProps {
  cliente: Cliente;
  onBack: () => void;
  hideFinanceiro?: boolean;
}

export default function ClienteDetailsView({ cliente, onBack, hideFinanceiro = false }: ClienteDetailsViewProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { canEdit } = useEditPermission();

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
        actionsClassName="flex-row items-center gap-2"
      >
        {canEdit && (
          <Button 
            onClick={() => setIsEditDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar Cliente
          </Button>
        )}
      </PageHeader>
      
      <ClienteDetalhesTabs 
        cliente={cliente} 
        onAgendamentoUpdate={handleAgendamentoUpdate}
        refreshTrigger={refreshTrigger}
        hideFinanceiro={hideFinanceiro}
      />

      <ClienteFormDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        cliente={cliente}
        onClienteUpdate={handleClienteUpdate}
      />
    </div>
  );
}
