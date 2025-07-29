
import { useState, useEffect, useCallback } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import PageHeader from "@/components/common/PageHeader";
import ClienteDetailsView from "@/components/clientes/ClienteDetailsView";
import ClientesContent from "@/components/clientes/ClientesContent";

export default function Clientes() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const {
    carregarClientes,
    clienteAtual,
    selecionarCliente
  } = useClienteStore();

  // Clear selected client when component mounts to always show list view
  useEffect(() => {
    selecionarCliente(null);
  }, [selecionarCliente]);

  // Carregar clientes ao montar o componente
  useEffect(() => {
    carregarClientes();
  }, [carregarClientes, refreshTrigger]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  const handleBackToList = useCallback(() => {
    selecionarCliente(null);
    handleRefresh();
  }, [selecionarCliente, handleRefresh]);

  const handleOpenForm = useCallback(() => {
    // This will be handled by the ClientesContent component
  }, []);

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

      <ClientesContent onRefresh={handleRefresh} />
    </>
  );
}
