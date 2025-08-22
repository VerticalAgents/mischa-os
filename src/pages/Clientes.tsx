
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import PageHeader from "@/components/common/PageHeader";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import ClientesFilters, { ColumnOption } from "@/components/clientes/ClientesFilters";
import ClientesTable from "@/components/clientes/ClientesTable";
import ClienteDetailsView from "@/components/clientes/ClienteDetailsView";
import ClientesBulkActions from "@/components/clientes/ClientesBulkActions";
import DeleteClienteDialog from "@/components/clientes/DeleteClienteDialog";

export default function Clientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [processingUrlParam, setProcessingUrlParam] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const {
    filtros,
    loading,
    carregarClientes,
    setFiltroTermo,
    setFiltroStatus,
    getClientesFiltrados,
    clienteAtual,
    selecionarCliente,
    removerCliente,
    getClientePorId
  } = useClienteStore();

  // Handle URL parameter for direct client selection
  const clienteIdFromUrl = searchParams.get('clienteId');

  // Sequential loading and URL processing
  useEffect(() => {
    const processInitialLoad = async () => {
      console.log('Clientes: Iniciando carregamento inicial');
      
      // Step 1: Load clients data first
      if (initialLoad) {
        await carregarClientes();
        setInitialLoad(false);
        console.log('Clientes: Dados carregados');
      }
      
      // Step 2: Process URL parameter only after data is loaded and not already processing
      if (!loading && !initialLoad && clienteIdFromUrl && !processingUrlParam && !clienteAtual) {
        console.log('Clientes: Processando parâmetro da URL:', clienteIdFromUrl);
        setProcessingUrlParam(true);
        
        const cliente = getClientePorId(clienteIdFromUrl);
        if (cliente) {
          console.log('Clientes: Cliente encontrado, selecionando:', cliente.nome);
          selecionarCliente(clienteIdFromUrl);
        } else {
          console.log('Clientes: Cliente não encontrado, tentando recarregar dados');
          // If client not found, try refreshing data once more
          setRefreshTrigger(prev => prev + 1);
        }
        
        setProcessingUrlParam(false);
      }
    };

    processInitialLoad();
  }, [
    carregarClientes,
    loading,
    initialLoad,
    clienteIdFromUrl,
    processingUrlParam,
    clienteAtual,
    getClientePorId,
    selecionarCliente,
    refreshTrigger
  ]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Clientes: Recarregando devido ao refreshTrigger');
      carregarClientes();
    }
  }, [carregarClientes, refreshTrigger]);

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

  // Column visibility state with persistence - removed statusAgendamento and proximaDataReposicao
  const defaultColumns = [
    "nome", "giroSemanal", "cnpjCpf", "enderecoEntrega", "contato", "quantidadePadrao", 
    "periodicidade", "status", "acoes"
  ];
  
  const { visibleColumns, setVisibleColumns } = useColumnVisibility(
    'clientes-visible-columns',
    defaultColumns
  );

  const clientes = getClientesFiltrados();
  
  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleSelectCliente = (id: string) => {
    console.log('Clientes: Selecionando cliente via tabela:', id);
    selecionarCliente(id);
    // Update URL to reflect the selection
    setSearchParams({ clienteId: id });
  };
  
  const handleBackToList = () => {
    console.log('Clientes: Voltando para a lista');
    selecionarCliente(null);
    // Clear URL parameters when user voluntarily goes back to the list
    setSearchParams({});
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteCliente = (id: string) => {
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCliente = async () => {
    if (clienteToDelete) {
      await removerCliente(clienteToDelete);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
      setRefreshTrigger(prev => prev + 1);
    }
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

  // Show loading state during initial load or URL processing
  if (loading && initialLoad) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Carregando clientes...</div>
      </div>
    );
  }

  // Render client details view when a client is selected
  if (clienteAtual) {
    console.log('Clientes: Renderizando detalhes do cliente:', clienteAtual.nome);
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
          onDeleteCliente={handleDeleteCliente}
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

      <DeleteClienteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        cliente={clienteToDelete ? getClientePorId(clienteToDelete) : null}
        onConfirm={confirmDeleteCliente}
      />
    </>
  );
}
