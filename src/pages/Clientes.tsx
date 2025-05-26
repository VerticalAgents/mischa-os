import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useClienteStore } from "@/hooks/useClienteStore";
import PageHeader from "@/components/common/PageHeader";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import ClientesFilters, { ColumnOption } from "@/components/clientes/ClientesFilters";
import ClientesTable from "@/components/clientes/ClientesTable";
import ClienteDetailsView from "@/components/clientes/ClienteDetailsView";
import ClientesBulkActions from "@/components/clientes/ClientesBulkActions";

export default function Clientes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const {
    filtros,
    loading,
    carregarClientes,
    setFiltroTermo,
    setFiltroStatus,
    getClientesFiltrados,
    clienteAtual,
    selecionarCliente
  } = useClienteStore();

  // Carregar clientes ao montar o componente
  useEffect(() => {
    carregarClientes();
  }, [carregarClientes, refreshTrigger]);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "nome", "giroSemanal", "cnpjCpf", "enderecoEntrega", "contato", "quantidadePadrao", 
    "periodicidade", "status", "statusAgendamento", "proximaDataReposicao", "acoes"
  ]);

  // Available columns for the table
  const columnOptions: ColumnOption[] = [
    { id: "nome", label: "Nome", canToggle: false },
    { id: "giroSemanal", label: "Giro Semanal", canToggle: false },
    { id: "cnpjCpf", label: "CNPJ/CPF", canToggle: true },
    { id: "enderecoEntrega", label: "Endereço", canToggle: true },
    { id: "contato", label: "Contato", canToggle: true },
    { id: "quantidadePadrao", label: "Qtde. Padrão", canToggle: true },
    { id: "periodicidade", label: "Period.", canToggle: true },
    { id: "status", label: "Status", canToggle: true },
    { id: "statusAgendamento", label: "Status Agendamento", canToggle: true },
    { id: "proximaDataReposicao", label: "Próx. Reposição", canToggle: true },
    { id: "acoes", label: "Ações", canToggle: false }
  ];

  const clientes = getClientesFiltrados();
  
  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    // Trigger a refresh of the client list after closing the form
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleSelectCliente = (id: string) => {
    selecionarCliente(id);
  };
  
  const handleBackToList = () => {
    selecionarCliente(null);
    // Reload clients when returning to list to ensure data is fresh
    setRefreshTrigger(prev => prev + 1);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedClienteIds([]);
  };

  // Toggle client selection
  const toggleClienteSelection = (id: string) => {
    setSelectedClienteIds(prev => 
      prev.includes(id) 
        ? prev.filter(clienteId => clienteId !== id)
        : [...prev, id]
    );
  };

  // Select/deselect all clients
  const handleSelectAllClientes = () => {
    if (selectedClienteIds.length === clientes.length) {
      setSelectedClienteIds([]);
    } else {
      setSelectedClienteIds(clientes.map(cliente => cliente.id));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedClienteIds([]);
  };

  // Render client details view when a client is selected
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

      <ClientesBulkActions 
        selectedClienteIds={selectedClienteIds}
        onClearSelection={clearSelection}
        onToggleSelectionMode={toggleSelectionMode}
        isSelectionMode={isSelectionMode}
      />

      <ClientesFilters 
        filtros={filtros}
        setFiltroTermo={setFiltroTermo}
        setFiltroStatus={setFiltroStatus}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        columnOptions={columnOptions}
      />

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-muted-foreground">Carregando clientes...</div>
        </div>
      ) : (
        <ClientesTable 
          clientes={clientes}
          visibleColumns={visibleColumns}
          columnOptions={columnOptions}
          onSelectCliente={handleSelectCliente}
          selectedClientes={selectedClienteIds}
          onToggleClienteSelection={toggleClienteSelection}
          onSelectAllClientes={handleSelectAllClientes}
          showSelectionControls={isSelectionMode}
        />
      )}

      <ClienteFormDialog 
        open={isFormOpen} 
        onOpenChange={handleFormClose}
        onClienteUpdate={() => setRefreshTrigger(prev => prev + 1)}
      />
    </>
  );
}
