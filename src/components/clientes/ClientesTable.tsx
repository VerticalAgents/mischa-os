
import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Edit, Trash2, Copy, ArrowDown, ArrowUp } from "lucide-react";
import { Cliente } from "@/types";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/common/StatusBadge";
import { useClienteStore } from "@/hooks/useClienteStore";
import { toast } from "@/hooks/use-toast";
import ClienteFormDialog from "./ClienteFormDialog";

import { useRazaoSocialGC } from "@/hooks/useRazaoSocialGC";
import { useScoresFinanceiros } from "@/hooks/useScoresFinanceiros";
import BadgeScore from "./BadgeScore";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Largura máxima de cada coluna.
 *
 * Sem isto a tabela pedia 1613 px: nenhuma célula podia quebrar nem cortar
 * (`whitespace-nowrap` em todas), então a razão social sozinha esticava 436 px.
 * Numa janela de 1366, com a barra lateral, sobram ~1050 px — e o que passava
 * disso ficava escondido, sem barra de rolagem à vista.
 *
 * Texto que não cabe é cortado com reticências e mostrado inteiro ao passar o
 * mouse. Cortar é melhor que esconder: pelo menos o começo do nome identifica.
 */
const LARGURA_COLUNA: Record<string, string> = {
  idGestaoClick: "w-[48px]",
  razaoSocial: "max-w-[164px]",
  nome: "max-w-[158px]",
  tipoCliente: "w-[76px]",
  cnpjCpf: "w-[118px] text-xs tabular-nums",
  contato: "max-w-[120px]",
  periodicidade: "w-[62px] text-xs",
  status: "w-[78px]",
  scorePagamento: "w-[74px]",
  acoes: "w-[48px]",
};

/** Colunas cujo conteúdo é texto livre e pode ser cortado. */
const CORTAVEL = new Set(["razaoSocial", "nome", "contato"]);

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
  // Só busca se a coluna estiver à vista: é uma varredura de 12 meses na API
  // externa e não faz sentido pagá-la quando ninguém vai olhar.
  const mostrandoScore = visibleColumns.includes("scorePagamento");
  const { scores, loading: carregandoScores } = useScoresFinanceiros(mostrandoScore);

  // A ordenação mora aqui porque depende das notas, que são buscadas aqui.
  // `null` preserva a ordem que a página entregou (nome, filtros etc.).
  const [ordemScore, setOrdemScore] = useState<"pior" | "melhor" | null>(null);

  const alternarOrdemScore = () =>
    setOrdemScore((atual) => (atual === null ? "pior" : atual === "pior" ? "melhor" : null));

  const notaDe = (cliente: Cliente): number | null => {
    const gcId = cliente.gestaoClickClienteId;
    const s = gcId ? scores[String(gcId)] : undefined;
    return s?.score ?? null;
  };

  const clientesOrdenados = useMemo(() => {
    if (!ordemScore) return clientes;
    return [...clientes].sort((a, b) => {
      const na = notaDe(a);
      const nb = notaDe(b);
      // Quem não tem nota vai para o fim nas duas direções: não é "nota zero",
      // é ausência de informação, e misturar os dois enganaria a leitura.
      if (na === null && nb === null) return 0;
      if (na === null) return 1;
      if (nb === null) return -1;
      return ordemScore === "pior" ? na - nb : nb - na;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes, scores, ordemScore]);
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
      case "tipoCliente":
        return cliente.tipoCliente || "PDV";
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
      case "scorePagamento": {
        if (carregandoScores) return <Skeleton className="h-5 w-16" />;
        const gcId = cliente.gestaoClickClienteId;
        return <BadgeScore score={gcId ? scores[String(gcId)] : null} compacto />;
      }
      case "status":
        return <StatusBadge status={cliente.statusCliente} />;
      case "tipoCliente": {
        const tipo = cliente.tipoCliente || "PDV";
        if (tipo === "PDV") {
          return <span className="text-xs text-muted-foreground">PDV</span>;
        }
        return (
          <Badge
            variant="outline"
            className={
              tipo === "INDUSTRIAL"
                ? "border-purple-300 bg-purple-50 text-purple-700"
                : "border-blue-300 bg-blue-50 text-blue-700"
            }
          >
            {tipo === "INDUSTRIAL" ? "Industrial" : "Ambos"}
          </Badge>
        );
      }
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
                <TableHead className="w-12 px-2">
                  <Checkbox
                    checked={selectedClientes.length === clientes.length && clientes.length > 0}
                    onCheckedChange={onSelectAllClientes}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
              )}
              {columnOptions
                .filter(col => visibleColumns.includes(col.id))
                .map((column) =>
                  column.id === "scorePagamento" ? (
                    <TableHead key={column.id} className={cn("px-2", LARGURA_COLUNA[column.id])}>
                      <button
                        type="button"
                        onClick={alternarOrdemScore}
                        className="flex items-center gap-1 hover:text-foreground"
                        title="Ordenar pelos piores pagadores"
                      >
                        {column.label}
                        {ordemScore === "pior" && <ArrowUp className="h-3 w-3" />}
                        {ordemScore === "melhor" && <ArrowDown className="h-3 w-3" />}
                      </button>
                    </TableHead>
                  ) : (
                    <TableHead key={column.id} className={cn("px-2", LARGURA_COLUNA[column.id])}>
                      {column.label}
                    </TableHead>
                  )
                )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientesOrdenados.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length + (showSelectionControls ? 1 : 0)} 
                  className="h-24 text-center"
                >
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              clientesOrdenados.map((cliente) => (
                <TableRow 
                  key={cliente.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleRowClick(cliente.id, e)}
                >
                  {showSelectionControls && (
                    <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
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
                      <TableCell
                        key={`${cliente.id}-${column.id}`}
                        className={cn(
                          "whitespace-nowrap px-2",
                          LARGURA_COLUNA[column.id],
                          CORTAVEL.has(column.id) && "overflow-hidden text-ellipsis"
                        )}
                        title={
                          CORTAVEL.has(column.id)
                            ? String(getColumnValue(cliente, column.id) ?? "")
                            : undefined
                        }
                      >
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
