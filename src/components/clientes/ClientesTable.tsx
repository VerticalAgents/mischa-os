
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Edit, Trash2, Copy } from "lucide-react";
import { Cliente } from "@/types";
import StatusBadge from "@/components/common/StatusBadge";
import { useClienteStore } from "@/hooks/useClienteStore";
import { toast } from "@/hooks/use-toast";
import ClienteFormDialog from "./ClienteFormDialog";

import { useRazaoSocialGC } from "@/hooks/useRazaoSocialGC";

interface ColumnOption {
  id: string;
  label: string;
  canToggle: boolean;
}

interface ClientesTableProps {
  clientes: Cliente[];
  visibleColumns: string[];
  columnOptions: ColumnOption[];
  onSelectCliente: (id: string) => void;
  onDeleteCliente: (id: string) => void;
  selectedClientes: string[];
  onToggleClienteSelection: (id: string) => void;
  onSelectAllClientes: () => void;
  showSelectionControls: boolean;
}

export default function ClientesTable({
  clientes,
  visibleColumns,
  columnOptions,
  onSelectCliente,
  onDeleteCliente,
  selectedClientes,
  onToggleClienteSelection,
  onSelectAllClientes,
  showSelectionControls
}: ClientesTableProps) {
  const { duplicarCliente } = useClienteStore();
  const { buscarRazoesSociaisLote, getRazaoSocial, loading: loadingRazaoSocial } = useRazaoSocialGC();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);

  // Buscar razões sociais quando os clientes carregarem
  useEffect(() => {
    const gcIds = clientes
      .map(c => c.gestaoClickClienteId)
      .filter((id): id is string => !!id);
    
    if (gcIds.length > 0) {
      buscarRazoesSociaisLote(gcIds);
    }
  }, [clientes, buscarRazoesSociaisLote]);

  const formatarData = (data: Date | undefined) => {
    if (!data) return "-";
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Ativo': 'Ativo',
      'Inativo': 'Inativo',
      'Em análise': 'Em análise',
      'A ativar': 'A ativar',
      'Standby': 'Standby'
    };
    return statusMap[status] || status;
  };

  const formatarStatusAgendamento = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Agendar': 'Agendar',
      'Não Agendado': 'Não Agendado',
      'Agendado': 'Agendado',
      'Cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  };


  const handleDuplicarCliente = async (cliente: Cliente) => {
    try {
      const clienteDuplicado = await duplicarCliente(cliente.id);
      toast({
        title: "Cliente duplicado",
        description: `As configurações de ${cliente.nome} foram copiadas para um novo cliente`
      });
      
      // Abrir modal de edição com o cliente duplicado
      setClienteParaEditar(clienteDuplicado);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Erro ao duplicar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao duplicar cliente",
        variant: "destructive"
      });
    }
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteParaEditar(cliente);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setClienteParaEditar(null);
  };

  const handleRowClick = (clienteId: string, event: React.MouseEvent) => {
    // Verificar se o clique foi em um elemento interativo (checkbox, dropdown menu, etc)
    const target = event.target as HTMLElement;
    const isInteractiveElement = target.closest('button') || 
                                target.closest('[role="checkbox"]') || 
                                target.closest('[role="menuitem"]') ||
                                (target as HTMLInputElement).type === 'checkbox';
    
    if (!isInteractiveElement) {
      onSelectCliente(clienteId);
    }
  };

  const getColumnValue = (cliente: Cliente, columnId: string) => {
    switch (columnId) {
      case "idGestaoClick":
        return cliente.gestaoClickClienteId || "-";
      case "razaoSocial":
        return getRazaoSocial(cliente.gestaoClickClienteId);
      case "nome":
        return cliente.nome;
      case "cnpjCpf":
        return cliente.cnpjCpf || "-";
      case "contato":
        return cliente.contatoTelefone || cliente.contatoEmail || "-";
      case "periodicidade":
        return `${cliente.periodicidadePadrao || 7} dias`;
      case "status":
        return formatarStatus(cliente.statusCliente);
      case "statusAgendamento":
        return formatarStatusAgendamento(cliente.statusAgendamento || 'Não Agendado');
      case "proximaDataReposicao":
        return formatarData(cliente.proximaDataReposicao);
      default:
        return "-";
    }
  };

  const renderCellContent = (cliente: Cliente, columnId: string) => {
    const value = getColumnValue(cliente, columnId);
    
    switch (columnId) {
      case "status":
        return <StatusBadge status={cliente.statusCliente} />;
      case "statusAgendamento":
        const statusAgendamento = cliente.statusAgendamento || 'Não Agendado';
        return (
          <Badge variant={
            statusAgendamento === 'Agendado' ? 'default' :
            statusAgendamento === 'Agendar' ? 'secondary' :
            statusAgendamento === 'Cancelado' ? 'destructive' : 'outline'
          }>
            {statusAgendamento}
          </Badge>
        );
      case "acoes":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSelectCliente(cliente.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditarCliente(cliente)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicarCliente(cliente)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteCliente(cliente.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      default:
        return <span>{value}</span>;
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              {showSelectionControls && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClientes.length === clientes.length && clientes.length > 0}
                    onCheckedChange={onSelectAllClientes}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
              )}
              {columnOptions
                .filter(col => visibleColumns.includes(col.id))
                .map((column) => (
                  <TableHead key={column.id}>{column.label}</TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length + (showSelectionControls ? 1 : 0)} 
                  className="h-24 text-center"
                >
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
                <TableRow 
                  key={cliente.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleRowClick(cliente.id, e)}
                >
                  {showSelectionControls && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedClientes.includes(cliente.id)}
                        onCheckedChange={() => onToggleClienteSelection(cliente.id)}
                        aria-label={`Selecionar ${cliente.nome}`}
                      />
                    </TableCell>
                  )}
                  {columnOptions
                    .filter(col => visibleColumns.includes(col.id))
                    .map((column) => (
                      <TableCell key={`${cliente.id}-${column.id}`} className="whitespace-nowrap">
                        {renderCellContent(cliente, column.id)}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClienteFormDialog 
        open={isFormOpen} 
        onOpenChange={handleFormClose}
        cliente={clienteParaEditar}
        onClienteUpdate={handleFormClose}
      />
    </>
  );
}
