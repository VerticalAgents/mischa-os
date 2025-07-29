
import { useState } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useClienteSelection } from "@/hooks/useClienteSelection";
import ClienteFormDialog from "./ClienteFormDialog";
import ClientesFilters, { ColumnOption } from "./ClientesFilters";
import ClientesTable from "./ClientesTable";
import ClientesBulkActions from "./ClientesBulkActions";
import DeleteClienteDialog from "./DeleteClienteDialog";

interface ClientesContentProps {
  onRefresh: () => void;
}

export default function ClientesContent({ onRefresh }: ClientesContentProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  
  const {
    filtros,
    loading,
    setFiltroTermo,
    setFiltroStatus,
    getClientesFiltrados,
    selecionarCliente,
    removerCliente,
    getClientePorId
  } = useClienteStore();

  const {
    isSelectionMode,
    selectedClienteIds,
    toggleSelectionMode,
    toggleClienteSelection,
    handleSelectAllClientes,
    clearSelection
  } = useClienteSelection();

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

  const defaultColumns = [
    "nome", "giroSemanal", "cnpjCpf", "enderecoEntrega", "contato", "quantidadePadrao", 
    "periodicidade", "status", "statusAgendamento", "proximaDataReposicao", "acoes"
  ];
  
  const { visibleColumns, setVisibleColumns } = useColumnVisibility(
    'clientes-visible-columns',
    defaultColumns
  );

  const clientes = getClientesFiltrados();
  
  const handleFormClose = () => {
    setIsFormOpen(false);
    onRefresh();
  };
  
  const handleSelectCliente = (id: string) => {
    selecionarCliente(id);
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
      onRefresh();
    }
  };

  return (
    <>
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
          onSelectAllClientes={() => handleSelectAllClientes(clientes)}
          showSelectionControls={isSelectionMode}
        />
      )}

      <ClienteFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onClienteUpdate={onRefresh}
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
