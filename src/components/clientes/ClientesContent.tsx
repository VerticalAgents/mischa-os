
import { useState, useEffect } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import ClientesFilters from "./ClientesFilters";
import ClientesTable from "./ClientesTable";
import ClientesBulkActions from "./ClientesBulkActions";
import ClienteFormDialog from "./ClienteFormDialog";
import { StatusCliente } from "@/types";

interface FiltrosCliente {
  termo: string;
  status: StatusCliente | "Todos";
}

interface ClientesContentProps {
  onRefresh?: () => void;
  isFormOpen?: boolean;
  setIsFormOpen?: (open: boolean) => void;
}

const defaultColumnOptions = [
  { id: 'nome', label: 'Nome', canToggle: false },
  { id: 'cnpjCpf', label: 'CNPJ/CPF', canToggle: true },
  { id: 'statusCliente', label: 'Status', canToggle: true },
  { id: 'contatoTelefone', label: 'Telefone', canToggle: true },
  { id: 'enderecoEntrega', label: 'Endereço', canToggle: true },
  { id: 'acoes', label: 'Ações', canToggle: false }
];

export default function ClientesContent({ 
  onRefresh, 
  isFormOpen = false, 
  setIsFormOpen 
}: ClientesContentProps) {
  const { carregarClientes, buscarClientes, loading } = useClienteStore();
  const [clientesSelecionados, setClientesSelecionados] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<FiltrosCliente>({
    termo: "",
    status: "Todos"
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'nome', 'cnpjCpf', 'statusCliente', 'contatoTelefone', 'acoes'
  ]);

  const clientesFiltrados = buscarClientes(filtros);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  const handleToggleSelection = (clienteId: string) => {
    setClientesSelecionados(prev =>
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const handleSelectAll = () => {
    if (clientesSelecionados.length === clientesFiltrados.length) {
      setClientesSelecionados([]);
    } else {
      setClientesSelecionados(clientesFiltrados.map(cliente => cliente.id));
    }
  };

  const handleClearSelection = () => {
    setClientesSelecionados([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientesFilters 
        filtros={filtros}
        setFiltroTermo={(termo) => setFiltros(prev => ({ ...prev, termo }))}
        setFiltroStatus={(status) => setFiltros(prev => ({ ...prev, status }))}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        columnOptions={defaultColumnOptions}
      />
      
      {clientesSelecionados.length > 0 && (
        <ClientesBulkActions 
          selectedClients={clientesSelecionados}
          onClearSelection={handleClearSelection}
        />
      )}
      
      <ClientesTable
        clientes={clientesFiltrados}
        selectedClients={clientesSelecionados}
        onToggleSelection={handleToggleSelection}
        onSelectAll={handleSelectAll}
        visibleColumns={visibleColumns}
      />

      {isFormOpen && setIsFormOpen && (
        <ClienteFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={() => {
            onRefresh?.();
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
}
