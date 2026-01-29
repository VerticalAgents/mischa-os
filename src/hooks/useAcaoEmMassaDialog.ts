import { useState, useCallback, useMemo } from 'react';

interface UseAcaoEmMassaDialogOptions<T extends { id: string | number }> {
  items: T[];
  isItemEligible?: (item: T) => boolean;
}

export function useAcaoEmMassaDialog<T extends { id: string | number }>({
  items,
  isItemEligible = () => true
}: UseAcaoEmMassaDialogOptions<T>) {
  const [open, setOpen] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [dataEntrega, setDataEntrega] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Itens elegíveis para a ação
  const itensElegiveis = useMemo(() => {
    return items.filter(isItemEligible);
  }, [items, isItemEligible]);

  // Abrir modal e selecionar todos por padrão
  const openDialog = useCallback(() => {
    const todosIds = new Set(itensElegiveis.map(item => String(item.id)));
    setSelecionados(todosIds);
    setDataEntrega(new Date());
    setOpen(true);
  }, [itensElegiveis]);

  // Fechar modal e limpar seleção
  const closeDialog = useCallback(() => {
    setOpen(false);
    setSelecionados(new Set());
  }, []);

  // Toggle de um item individual
  const toggleItem = useCallback((id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle de todos os itens
  const toggleAll = useCallback(() => {
    if (selecionados.size === itensElegiveis.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(itensElegiveis.map(item => String(item.id))));
    }
  }, [itensElegiveis, selecionados.size]);

  // Verificar se todos estão selecionados
  const todosSelecionados = useMemo(() => {
    return itensElegiveis.length > 0 && selecionados.size === itensElegiveis.length;
  }, [itensElegiveis.length, selecionados.size]);

  // Verificar se está no estado indeterminado
  const algumSelecionado = useMemo(() => {
    return selecionados.size > 0 && selecionados.size < itensElegiveis.length;
  }, [selecionados.size, itensElegiveis.length]);

  // Obter itens selecionados
  const itensSelecionados = useMemo(() => {
    return itensElegiveis.filter(item => selecionados.has(String(item.id)));
  }, [itensElegiveis, selecionados]);

  return {
    open,
    setOpen,
    openDialog,
    closeDialog,
    selecionados,
    toggleItem,
    toggleAll,
    todosSelecionados,
    algumSelecionado,
    itensElegiveis,
    itensSelecionados,
    dataEntrega,
    setDataEntrega,
    loading,
    setLoading,
    totalSelecionados: selecionados.size,
    totalElegiveis: itensElegiveis.length
  };
}
