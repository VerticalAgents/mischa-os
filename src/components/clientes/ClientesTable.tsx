
import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Edit, Trash2, Copy, ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from "lucide-react";
import { Cliente } from "@/types";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/common/StatusBadge";
import { useClienteStore } from "@/hooks/useClienteStore";
import { toast } from "@/hooks/use-toast";
import ClienteFormDialog from "./ClienteFormDialog";

import { useRazaoSocialGC } from "@/hooks/useRazaoSocialGC";
import { useScoresFinanceiros } from "@/hooks/useScoresFinanceiros";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
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

/** Enquanto o dado não chegou: melhor uma rodinha do que um valor errado. */
const Rodinha = () => (
  <span className="flex items-center text-muted-foreground">
    <Loader2 className="h-3 w-3 animate-spin" />
  </span>
);

/**
 * Colunas que dá para ordenar clicando no cabeçalho.
 *
 * Ficam de fora "Ações" (não é dado) e "Tipo" (três valores, o filtro do topo
 * resolve melhor).
 */
const ORDENAVEL = new Set([
  "idGestaoClick",
  "razaoSocial",
  "nome",
  "cnpjCpf",
  "contato",
  "periodicidade",
  "status",
  "statusAgendamento",
  "proximaDataReposicao",
  "scorePagamento",
]);

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

  /**
   * Status e próxima reposição vêm do AGENDAMENTO, não do cadastro.
   *
   * A tabela `clientes` tem as colunas `status_agendamento` e
   * `proxima_data_reposicao`, mas nada no app escreve nelas: todo fluxo de
   * agendamento grava em `agendamentos_clientes`. A lista lia esses campos
   * mortos e mostrava "Não Agendado" para o cadastro inteiro, inclusive para
   * quem tinha reposição marcada para amanhã.
   */
  const { agendamentos, carregarTodosAgendamentos, loading: carregandoAgendamentos } =
    useAgendamentoClienteStore();

  const mostrandoAgendamento =
    visibleColumns.includes("statusAgendamento") ||
    visibleColumns.includes("proximaDataReposicao");

  useEffect(() => {
    if (mostrandoAgendamento && agendamentos.length === 0) {
      carregarTodosAgendamentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrandoAgendamento]);

  const agendamentoPorCliente = useMemo(() => {
    const mapa = new Map<string, (typeof agendamentos)[number]>();
    agendamentos.forEach((a) => {
      if (a.cliente?.id) mapa.set(String(a.cliente.id), a);
    });
    return mapa;
  }, [agendamentos]);

  /**
   * Ordenação por coluna, em três estados: crescente, decrescente e a ordem
   * original que a página entregou (que já vem com filtros aplicados).
   *
   * Mora aqui porque a nota de pagamento é buscada aqui — ordenar por ela na
   * página exigiria subir a busca junto, e ela só faz sentido nesta tabela.
   */
  const [ordem, setOrdem] = useState<{ coluna: string; sentido: "cresc" | "desc" } | null>(null);

  const alternarOrdem = (coluna: string) =>
    setOrdem((atual) => {
      if (atual?.coluna !== coluna) return { coluna, sentido: "cresc" };
      if (atual.sentido === "cresc") return { coluna, sentido: "desc" };
      return null;
    });

  const notaDe = (cliente: Cliente): number | null => {
    const gcId = cliente.gestaoClickClienteId;
    const s = gcId ? scores[String(gcId)] : undefined;
    return s?.score ?? null;
  };

  /** Valor comparável de uma coluna. `null` = sem informação, vai para o fim. */
  const chaveDeOrdem = (cliente: Cliente, coluna: string): string | number | null => {
    if (coluna === "scorePagamento") return notaDe(cliente);
    if (coluna === "periodicidade") return cliente.periodicidadePadrao ?? 7;
    if (coluna === "proximaDataReposicao") {
      const d = agendamentoPorCliente.get(String(cliente.id))?.dataReposicao;
      return d ? new Date(d).getTime() : null;
    }

    const bruto = getColumnValue(cliente, coluna);
    if (bruto === null || bruto === undefined || bruto === "-" || bruto === "") return null;
    return String(bruto).toLowerCase();
  };

  const clientesOrdenados = useMemo(() => {
    if (!ordem) return clientes;

    return [...clientes].sort((a, b) => {
      const va = chaveDeOrdem(a, ordem.coluna);
      const vb = chaveDeOrdem(b, ordem.coluna);

      // Sem informação vai para o fim NAS DUAS direções: ausência de dado não é
      // "menor valor", e misturar os dois enganaria a leitura.
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;

      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "pt-BR");

      return ordem.sentido === "cresc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes, scores, ordem]);
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

  // Declarada como função (e não como const) de propósito: a ordenação a
  // chama durante a montagem da lista, ANTES desta linha do arquivo.
  function getColumnValue(cliente: Cliente, columnId: string) {
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
        // Sem isto, a coluna mostraria "Não Agendado" enquanto os agendamentos
        // ainda estão vindo — exatamente o erro que estamos consertando.
        if (carregandoAgendamentos) return <Rodinha />;
        return formatarStatusAgendamento(
          agendamentoPorCliente.get(String(cliente.id))?.statusAgendamento || 'Não Agendado'
        );
      case "proximaDataReposicao": {
        if (carregandoAgendamentos) return <Rodinha />;
        const data = agendamentoPorCliente.get(String(cliente.id))?.dataReposicao;
        return formatarData(data ? new Date(data) : null);
      }
      default:
        return "-";
    }
  }

  const renderCellContent = (cliente: Cliente, columnId: string) => {
    const value = getColumnValue(cliente, columnId);
    
    switch (columnId) {
      case "scorePagamento": {
        // A varredura de 12 meses na API externa leva alguns segundos. O
        // esqueleto cinza era quase invisível nessa célula estreita e a coluna
        // parecia vazia — a rodinha diz que ainda está vindo.
        if (carregandoScores) return <Rodinha />;
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
      case "statusAgendamento": {
        if (carregandoAgendamentos) return <Rodinha />;
        // Do agendamento, não do cadastro: a coluna do cadastro nunca é escrita.
        const statusAgendamento =
          agendamentoPorCliente.get(String(cliente.id))?.statusAgendamento || 'Não Agendado';
        return (
          // "Cancelado" saiu: o agendamento só tem Agendar, Previsto e
          // Agendado. A variante existia porque o campo antigo do cadastro
          // aceitava outros valores — que nunca chegavam aqui.
          <Badge variant={
            statusAgendamento === 'Agendado' ? 'default' :
            statusAgendamento === 'Agendar' ? 'secondary' : 'outline'
          }>
            {statusAgendamento}
          </Badge>
        );
      }
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
                .filter((col) => visibleColumns.includes(col.id))
                .map((column) => {
                  const ordenavel = ORDENAVEL.has(column.id);
                  const ativa = ordem?.coluna === column.id;

                  return (
                    <TableHead key={column.id} className={cn("px-2", LARGURA_COLUNA[column.id])}>
                      {ordenavel ? (
                        <button
                          type="button"
                          onClick={() => alternarOrdem(column.id)}
                          className="group flex w-full items-center gap-1 hover:text-foreground"
                          title={`Ordenar por ${column.label.toLowerCase()}`}
                        >
                          <span className="truncate">{column.label}</span>
                          {ativa && ordem?.sentido === "cresc" && (
                            <ArrowUp className="h-3 w-3 shrink-0" />
                          )}
                          {ativa && ordem?.sentido === "desc" && (
                            <ArrowDown className="h-3 w-3 shrink-0" />
                          )}
                          {/* A seta cinza só no passar do mouse: dizer que dá
                              para ordenar sem poluir dez cabeçalhos de uma vez. */}
                          {!ativa && (
                            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-40" />
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  );
                })}
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
