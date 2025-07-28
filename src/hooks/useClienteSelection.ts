
import { useState, useCallback } from 'react';

export const useClienteSelection = () => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedClienteIds([]);
  }, [isSelectionMode]);

  const toggleClienteSelection = useCallback((id: string) => {
    setSelectedClienteIds(prev => 
      prev.includes(id) 
        ? prev.filter(clienteId => clienteId !== id)
        : [...prev, id]
    );
  }, []);

  const handleSelectAllClientes = useCallback((clientes: any[]) => {
    if (selectedClienteIds.length === clientes.length) {
      setSelectedClienteIds([]);
    } else {
      setSelectedClienteIds(clientes.map(cliente => cliente.id));
    }
  }, [selectedClienteIds.length]);

  const clearSelection = useCallback(() => {
    setSelectedClienteIds([]);
  }, []);

  return {
    isSelectionMode,
    selectedClienteIds,
    toggleSelectionMode,
    toggleClienteSelection,
    handleSelectAllClientes,
    clearSelection
  };
};
