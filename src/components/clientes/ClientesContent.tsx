
import { useState, useEffect } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import ClientesFilters from "./ClientesFilters";
import ClientesTable from "./ClientesTable";
import ClientesBulkActions from "./ClientesBulkActions";
import { StatusCliente } from "@/types";

interface FiltrosCliente {
  termo: string;
  status: StatusCliente | "Todos";
}

export default function ClientesContent() {
  const { carregarClientes, buscarClientes, loading } = useClienteStore();
  const [clientesSelecionados, setClientesSelecionados] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<FiltrosCliente>({
    termo: "",
    status: "Todos"
  });

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
        onFiltroChange={(novosFiltros) => setFiltros(novosFiltros)}
        totalClientes={clientesFiltrados.length}
      />
      
      {clientesSelecionados.length > 0 && (
        <ClientesBulkActions 
          clientesSelecionados={clientesSelecionados}
          onClearSelection={handleClearSelection}
        />
      )}
      
      <ClientesTable
        clientes={clientesFiltrados}
        clientesSelecionados={clientesSelecionados}
        onToggleSelection={handleToggleSelection}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
