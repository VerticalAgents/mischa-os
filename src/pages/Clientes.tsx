
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useClientesSupabase } from "@/hooks/useClientesSupabase";
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
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    termo: '',
    status: 'Todos' as const
  });
  
  const { clientes } = useClientesSupabase();

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

  // Filter clients
  const clientesFiltrados = clientes.filter(cliente => {
    const termoMatch = !filtros.termo || 
      cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
      (cliente.cnpj_cpf && cliente.cnpj_cpf.toLowerCase().includes(filtros.termo.toLowerCase()));
    
    const statusMatch = filtros.status === 'Todos' || cliente.status_cliente === filtros.status;
    
    return termoMatch && statusMatch;
  });
  
  const handleOpenForm = () => {
    setIsFormOpen(true);
  };
  
  const handleSelectCliente = (id: string) => {
    setClienteSelecionado(id);
  };
  
  const handleBackToList = () => {
    setClienteSelecionado(null);
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
    if (selectedClienteIds.length === clientesFiltrados.length) {
      setSelectedClienteIds([]);
    } else {
      setSelectedClienteIds(clientesFiltrados.map(cliente => cliente.id));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedClienteIds([]);
  };

  // Find selected client
  const clienteAtual = clienteSelecionado ? clientes.find(c => c.id === clienteSelecionado) : null;

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
        setFiltroTermo={(termo: string) => setFiltros(prev => ({ ...prev, termo }))}
        setFiltroStatus={(status: any) => setFiltros(prev => ({ ...prev, status }))}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        columnOptions={columnOptions}
      />

      <ClientesTable 
        clientes={clientesFiltrados}
        visibleColumns={visibleColumns}
        columnOptions={columnOptions}
        onSelectCliente={handleSelectCliente}
        selectedClientes={selectedClienteIds}
        onToggleClienteSelection={toggleClienteSelection}
        onSelectAllClientes={handleSelectAllClientes}
        showSelectionControls={isSelectionMode}
      />

      <ClienteFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
      />
    </>
  );
}
