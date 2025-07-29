
import { useState, useEffect, useCallback, useRef } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import PageHeader from "@/components/common/PageHeader";
import ClienteDetailsView from "@/components/clientes/ClienteDetailsView";
import ClientesContent from "@/components/clientes/ClientesContent";

export default function Clientes() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const loadingRef = useRef<boolean>(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    carregarClientes,
    clienteAtual,
    selecionarCliente,
    error,
    clearError
  } = useClienteStore();

  // Clear selected client when component mounts
  useEffect(() => {
    selecionarCliente(null);
  }, [selecionarCliente]);

  // Carregar clientes ao montar o componente com debounce
  useEffect(() => {
    const loadClientes = async () => {
      if (loadingRef.current) {
        console.log('Clientes.tsx: Carregamento já em andamento, cancelando');
        return;
      }
      
      loadingRef.current = true;
      
      try {
        await carregarClientes();
      } catch (error) {
        console.error('Clientes.tsx: Erro ao carregar clientes:', error);
      } finally {
        loadingRef.current = false;
      }
    };

    loadClientes();
  }, [carregarClientes, refreshTrigger]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const handleRefresh = useCallback(() => {
    // Debounce refresh calls
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      if (error) {
        clearError();
      }
      setRefreshTrigger(prev => prev + 1);
    }, 300);
  }, [error, clearError]);
  
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
