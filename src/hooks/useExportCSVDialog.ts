import { useState, useMemo } from 'react';
import { useExportacao } from './useExportacao';

interface PedidoExpedicao {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_endereco?: string;
  cliente_telefone?: string;
  link_google_maps?: string;
  representante_id?: number;
  data_prevista_entrega: Date;
  quantidade_total: number;
  tipo_pedido: string;
  status_agendamento: string;
}

export const useExportCSVDialog = (entregas: PedidoExpedicao[]) => {
  const { exportarEntregasCSV } = useExportacao();
  const [open, setOpen] = useState(false);
  const [enderecoPartida, setEnderecoPartida] = useState(
    "R. Cel. Paulino Teixeira, 35 - Rio Branco, Porto Alegre - RS, 90420-160"
  );
  const [filtroRepresentantes, setFiltroRepresentantes] = useState<number[]>([]);
  const [entregasSelecionadas, setEntregasSelecionadas] = useState<Set<string>>(new Set());

  // Filtrar entregas baseado nos representantes selecionados
  const entregasFiltradas = useMemo(() => {
    if (filtroRepresentantes.length === 0) {
      return entregas;
    }
    return entregas.filter(e => 
      e.representante_id && filtroRepresentantes.includes(e.representante_id)
    );
  }, [entregas, filtroRepresentantes]);

  // Sincronizar seleção quando as entregas filtradas mudam
  useMemo(() => {
    const novaSeleção = new Set(
      entregasFiltradas.map(e => e.id)
    );
    setEntregasSelecionadas(novaSeleção);
  }, [entregasFiltradas]);

  const toggleEntrega = (id: string) => {
    setEntregasSelecionadas(prev => {
      const nova = new Set(prev);
      if (nova.has(id)) {
        nova.delete(id);
      } else {
        nova.add(id);
      }
      return nova;
    });
  };

  const toggleAll = () => {
    if (entregasSelecionadas.size === entregasFiltradas.length) {
      setEntregasSelecionadas(new Set());
    } else {
      setEntregasSelecionadas(new Set(entregasFiltradas.map(e => e.id)));
    }
  };

  const handleExport = () => {
    const entregasParaExportar = entregasFiltradas.filter(e => 
      entregasSelecionadas.has(e.id)
    );

    if (entregasParaExportar.length === 0) {
      return;
    }

    exportarEntregasCSV(entregasParaExportar, 'entregas_expedicao', enderecoPartida);
    setOpen(false);
  };

  const openDialog = () => {
    // Resetar filtros e selecionar tudo ao abrir
    setFiltroRepresentantes([]);
    setEntregasSelecionadas(new Set(entregas.map(e => e.id)));
    setEnderecoPartida("R. Cel. Paulino Teixeira, 35 - Rio Branco, Porto Alegre - RS, 90420-160");
    setOpen(true);
  };

  return {
    open,
    setOpen,
    openDialog,
    enderecoPartida,
    setEnderecoPartida,
    filtroRepresentantes,
    setFiltroRepresentantes,
    entregasSelecionadas,
    entregasFiltradas,
    toggleEntrega,
    toggleAll,
    handleExport,
    totalSelecionadas: entregasSelecionadas.size,
    totalFiltradas: entregasFiltradas.length,
  };
};
