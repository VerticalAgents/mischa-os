
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useClienteStore } from "@/hooks/useClienteStore";
import PageHeader from "@/components/common/PageHeader";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import ClientesFilters, { ColumnOption } from "@/components/clientes/ClientesFilters";
import ClientesTable from "@/components/clientes/ClientesTable";
import ClienteDetailsView from "@/components/clientes/ClienteDetailsView";

export default function Clientes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const {
    filtros,
    setFiltroTermo,
    setFiltroStatus,
    getClientesFiltrados,
    clienteAtual,
    selecionarCliente
  } = useClienteStore();

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "nome", "cnpjCpf", "enderecoEntrega", "contato", "quantidadePadrao", 
    "periodicidade", "giroSemanal", "status", "statusAgendamento", 
    "proximaDataReposicao", "acoes"
  ]);

  // Available columns for the table
  const columnOptions: ColumnOption[] = [
    { id: "nome", label: "Nome", canToggle: false },
    { id: "cnpjCpf", label: "CNPJ/CPF", canToggle: true },
    { id: "enderecoEntrega", label: "Endereço", canToggle: true },
    { id: "contato", label: "Contato", canToggle: true },
    { id: "quantidadePadrao", label: "Qtde. Padrão", canToggle: true },
    { id: "periodicidade", label: "Period.", canToggle: true },
    { id: "giroSemanal", label: "Giro Semanal", canToggle: false },
    { id: "status", label: "Status", canToggle: true },
    { id: "statusAgendamento", label: "Status Agendamento", canToggle: true },
    { id: "proximaDataReposicao", label: "Próx. Reposição", canToggle: true },
    { id: "acoes", label: "Ações", canToggle: false }
  ];

  const clientes = getClientesFiltrados();
  
  const handleOpenForm = () => {
    setIsFormOpen(true);
  };
  
  const handleSelectCliente = (id: number) => {
    selecionarCliente(id);
  };
  
  const handleBackToList = () => {
    selecionarCliente(null);
  };

  // Renderizar a tela de detalhes do cliente quando um cliente for selecionado
  if (clienteAtual) {
    return (
      <ClienteDetailsView 
        cliente={clienteAtual} 
        onBack={handleBackToList} 
      />
    );
  }
  
  return (
    <>
      <PageHeader 
        title="Clientes" 
        description="Gerencie os pontos de venda dos seus produtos" 
        action={{
          label: "Novo Cliente",
          onClick: handleOpenForm
        }} 
      />

      <ClientesFilters 
        filtros={filtros}
        setFiltroTermo={setFiltroTermo}
        setFiltroStatus={setFiltroStatus}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        columnOptions={columnOptions}
      />

      <ClientesTable 
        clientes={clientes}
        visibleColumns={visibleColumns}
        columnOptions={columnOptions}
        onSelectCliente={handleSelectCliente}
      />

      <ClienteFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
      />
    </>
  );
}
