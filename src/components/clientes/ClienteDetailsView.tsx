
import { useState } from 'react';
import { Cliente } from '@/types';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ClienteDetalhesTabs from "./ClienteDetalhesTabs";

interface ClienteDetailsViewProps {
  cliente: Cliente;
  onBack: () => void;
}

export default function ClienteDetailsView({ cliente, onBack }: ClienteDetailsViewProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAgendamentoUpdate = () => {
    console.log('ClienteDetailsView: Agendamento atualizado, forçando refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={cliente.nome}
        description={`Detalhes e configurações do cliente`}
        action={{
          label: "Voltar para lista",
          onClick: onBack,
          icon: ArrowLeft
        }}
      />
      
      <ClienteDetalhesTabs 
        cliente={cliente} 
        onAgendamentoUpdate={handleAgendamentoUpdate}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
