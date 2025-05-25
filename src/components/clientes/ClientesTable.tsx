import { ExternalLink, Calendar, ArrowUp, ArrowDown, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Cliente } from "@/hooks/useClientesSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/common/StatusBadge";
import { ColumnOption } from "./ClientesFilters";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ClientesTableProps {
  clientes: Cliente[];
  visibleColumns: string[];
  columnOptions: ColumnOption[];
  onSelectCliente: (id: string) => void;
  selectedClientes?: string[];
  onSelectAllClientes?: () => void;
  onToggleClienteSelection?: (id: string) => void;
  showSelectionControls?: boolean;
}

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

export default function ClientesTable({
  clientes,
  visibleColumns,
  columnOptions,
  onSelectCliente,
  selectedClientes = [],
  onToggleClienteSelection,
  onSelectAllClientes,
  showSelectionControls = false
}: ClientesTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: null });
  const [columnOrder, setColumnOrder] = useState<string[]>(visibleColumns);
  const { isDark } = useThemeStore();

  // Update column order when visible columns change
  useEffect(() => {
    // Keep fixed columns (nome at start, acoes at end)
    // and respect the order of other columns from visibleColumns
    const orderedColumns = [...visibleColumns].sort((a, b) => {
      if (a === "nome") return -1;
      if (b === "nome") return 1;
      if (a === "giroSemanal") return -1;
      if (b === "giroSemanal") return 1;
      if (a === "acoes") return 1;
      if (b === "acoes") return -1;
      return visibleColumns.indexOf(a) - visibleColumns.indexOf(b);
    });
    
    setColumnOrder(orderedColumns);
  }, [visibleColumns]);

  // Helper to format periodicidade in text
  const formatPeriodicidade = (dias: number): string => {
    if (dias % 7 === 0) {
      const semanas = dias / 7;
      return semanas === 1 ? "1 semana" : `${semanas} semanas`;
    } else if (dias === 3) {
      return "3x semana";
    } else {
      return `${dias} dias`;
    }
  };

  // Calculate weekly turnover based on quantity and periodicity
  const calcularGiroSemanal = (qtdPadrao: number, periodicidadeDias: number): number => {
    // For periodicity in days, convert to weeks
    if (periodicidadeDias === 3) {
      // Special case: 3x per week
      return qtdPadrao * 3;
    }

    // For other cases, calculate weekly turnover
    const periodicidadeSemanas = periodicidadeDias / 7;
    return Math.round(qtdPadrao / periodicidadeSemanas);
  };

  // Function to handle sorting
  const requestSort = (key: string) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Sort clients based on current sorting configuration
  const sortedClientes = [...clientes].sort((a, b) => {
    if (sortConfig.direction === null) {
      return 0;
    }

    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case "nome":
        aValue = a.nome;
        bValue = b.nome;
        break;
      case "cnpjCpf":
        aValue = a.cnpj_cpf || "";
        bValue = b.cnpj_cpf || "";
        break;
      case "enderecoEntrega":
        aValue = a.endereco_entrega || "";
        bValue = b.endereco_entrega || "";
        break;
      case "contato":
        aValue = a.contato_nome || "";
        bValue = b.contato_nome || "";
        break;
      case "quantidadePadrao":
        aValue = a.quantidade_padrao || 0;
        bValue = b.quantidade_padrao || 0;
        break;
      case "periodicidade":
        aValue = a.periodicidade_padrao || 7;
        bValue = b.periodicidade_padrao || 7;
        break;
      case "giroSemanal":
        aValue = calcularGiroSemanal(a.quantidade_padrao || 0, a.periodicidade_padrao || 7);
        bValue = calcularGiroSemanal(b.quantidade_padrao || 0, b.periodicidade_padrao || 7);
        break;
      case "status":
        aValue = a.status_cliente || "";
        bValue = b.status_cliente || "";
        break;
      case "statusAgendamento":
        aValue = a.status_agendamento || "";
        bValue = b.status_agendamento || "";
        break;
      case "proximaDataReposicao":
        aValue = a.proxima_data_reposicao ? new Date(a.proxima_data_reposicao).getTime() : 0;
        bValue = b.proxima_data_reposicao ? new Date(b.proxima_data_reposicao).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (sortConfig.direction === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const getSortIcon = (columnId: string) => {
    if (sortConfig.key !== columnId) {
      return null;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  const allSelected = clientes.length > 0 && selectedClientes.length === clientes.length;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {showSelectionControls && (
                <TableHead className="w-[50px]">
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={onSelectAllClientes}
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              {columnOrder.map(columnId => {
                const column = columnOptions.find(col => col.id === columnId);
                if (!column || !visibleColumns.includes(columnId)) return null;
                
                return (
                  <TableHead 
                    key={columnId}
                    className={cn(
                      "cursor-pointer select-none",
                      columnId === "giroSemanal" && "font-semibold"
                    )}
                    onClick={() => requestSort(columnId)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {getSortIcon(columnId)}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + (showSelectionControls ? 1 : 0)} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedClientes.map(cliente => {
                const giroSemanal = calcularGiroSemanal(
                  cliente.quantidade_padrao || 0, 
                  cliente.periodicidade_padrao || 7
                );
                const isSelected = selectedClientes.includes(cliente.id);
                
                return (
                  <TableRow 
                    key={cliente.id} 
                    className={cn(
                      "cursor-pointer",
                      isSelected && "bg-muted/50"
                    )}
                    onClick={() => {
                      if (showSelectionControls && onToggleClienteSelection) {
                        onToggleClienteSelection(cliente.id);
                      } else {
                        onSelectCliente(cliente.id);
                      }
                    }}
                  >
                    {showSelectionControls && (
                      <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => onToggleClienteSelection && onToggleClienteSelection(cliente.id)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                    )}
                    
                    {columnOrder.map(columnId => {
                      if (!visibleColumns.includes(columnId)) return null;
                      
                      switch(columnId) {
                        case "nome":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`} className="font-medium">
                              {cliente.nome}
                            </TableCell>
                          );
                        case "giroSemanal":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`} className="font-semibold">
                              <Badge variant="outline" className="bg-blue-50">
                                {giroSemanal}
                              </Badge>
                            </TableCell>
                          );
                        case "cnpjCpf":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              {cliente.cnpj_cpf || "-"}
                            </TableCell>
                          );
                        case "enderecoEntrega":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              {cliente.endereco_entrega || "-"}
                            </TableCell>
                          );
                        case "contato":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              <div className="text-sm">
                                <div>{cliente.contato_nome || "-"}</div>
                                <div className="text-muted-foreground">
                                  {cliente.contato_telefone || "-"}
                                </div>
                              </div>
                            </TableCell>
                          );
                        case "quantidadePadrao":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              {cliente.quantidade_padrao || 0}
                            </TableCell>
                          );
                        case "periodicidade":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              {formatPeriodicidade(cliente.periodicidade_padrao || 7)}
                            </TableCell>
                          );
                        case "status":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              <StatusBadge status={cliente.status_cliente as any} />
                            </TableCell>
                          );
                        case "statusAgendamento":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              {cliente.status_agendamento ? (
                                <Badge variant="outline">
                                  {cliente.status_agendamento}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                          );
                        case "proximaDataReposicao":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              {cliente.proxima_data_reposicao ? 
                                format(new Date(cliente.proxima_data_reposicao), 'dd/MM/yyyy', { locale: ptBR }) : 
                                '-'}
                            </TableCell>
                          );
                        case "acoes":
                          return (
                            <TableCell key={`${cliente.id}-${columnId}`}>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectCliente(cliente.id);
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          );
                        default:
                          return null;
                      }
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
