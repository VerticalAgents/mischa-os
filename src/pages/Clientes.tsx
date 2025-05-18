
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, SlidersHorizontal, Calendar } from "lucide-react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { StatusCliente } from "@/types";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import { Badge } from "@/components/ui/badge";
import ClienteDetalhesTabs from "@/components/clientes/ClienteDetalhesTabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Define the available columns for the table
interface ColumnOption {
  id: string;
  label: string;
  canToggle: boolean;
}
export default function Clientes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const {
    filtros,
    setFiltroTermo,
    setFiltroStatus,
    getClientesFiltrados,
    clienteAtual,
    selecionarCliente
  } = useClienteStore();

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["nome", "cnpjCpf", "enderecoEntrega", "contato", "quantidadePadrao", "periodicidade", "giroSemanal", "status", "statusAgendamento", "proximaDataReposicao", "acoes"]);

  // Available columns for the table
  const columnOptions: ColumnOption[] = [{
    id: "nome",
    label: "Nome",
    canToggle: false
  }, {
    id: "cnpjCpf",
    label: "CNPJ/CPF",
    canToggle: true
  }, {
    id: "enderecoEntrega",
    label: "Endereço",
    canToggle: true
  }, {
    id: "contato",
    label: "Contato",
    canToggle: true
  }, {
    id: "quantidadePadrao",
    label: "Qtde. Padrão",
    canToggle: true
  }, {
    id: "periodicidade",
    label: "Period.",
    canToggle: true
  }, {
    id: "giroSemanal",
    label: "Giro Semanal",
    canToggle: false
  }, {
    id: "status",
    label: "Status",
    canToggle: true
  }, {
    id: "statusAgendamento",
    label: "Status Agendamento",
    canToggle: true
  }, {
    id: "proximaDataReposicao",
    label: "Próx. Reposição",
    canToggle: true
  }, {
    id: "acoes",
    label: "Ações",
    canToggle: false
  }];
  const clientes = getClientesFiltrados();
  const handleOpenForm = () => {
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
  };
  const handleSelectCliente = (id: number) => {
    selecionarCliente(id);
  };
  const handleBackToList = () => {
    selecionarCliente(null);
  };

  // Toggle column visibility
  const toggleColumn = (columnId: string, isVisible: boolean) => {
    if (!isVisible) {
      setVisibleColumns(visibleColumns.filter(id => id !== columnId));
    } else {
      setVisibleColumns([...visibleColumns, columnId]);
    }
  };

  // Helper para formatar a periodicidade em texto
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

  // Calcular o giro semanal com base na quantidade padrão e periodicidade
  const calcularGiroSemanal = (qtdPadrao: number, periodicidadeDias: number): number => {
    // Para periodicidade em dias, converter para semanas
    if (periodicidadeDias === 3) {
      // Caso especial: 3x por semana
      return qtdPadrao * 3;
    }

    // Para outros casos, calcular giro semanal
    const periodicidadeSemanas = periodicidadeDias / 7;
    return Math.round(qtdPadrao / periodicidadeSemanas);
  };

  // Renderizar a tela de detalhes do cliente quando um cliente for selecionado
  if (clienteAtual) {
    return <>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="outline" onClick={handleBackToList} className="mb-4">
              ← Voltar para lista
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{clienteAtual.nome}</h1>
            <p className="text-muted-foreground">
              {clienteAtual.cnpjCpf}
              <StatusBadge status={clienteAtual.statusCliente} className="ml-2" />
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>Editar Cliente</Button>
        </div>

        <ClienteDetalhesTabs cliente={clienteAtual} onEdit={handleOpenForm} />

        <ClienteFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} clienteId={clienteAtual.id} />
      </>;
  }
  return <>
      <PageHeader title="Clientes" description="Gerencie os pontos de venda dos seus produtos" action={{
      label: "Novo Cliente",
      onClick: handleOpenForm
    }} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CNPJ/CPF..." className="pl-8" value={filtros.termo} onChange={e => setFiltroTermo(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2" value={filtros.status} onChange={e => setFiltroStatus(e.target.value as StatusCliente | 'Todos')}>
          <option value="Todos">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Em análise">Em análise</option>
          <option value="Inativo">Inativo</option>
          <option value="A ativar">A ativar</option>
          <option value="Standby">Standby</option>
        </select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Colunas</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="space-y-4">
              <h4 className="font-medium">Propriedades Visíveis</h4>
              <div className="grid gap-2">
                {columnOptions.map(column => <div key={column.id} className="flex items-center gap-2">
                    <Checkbox id={`column-${column.id}`} checked={visibleColumns.includes(column.id)} onCheckedChange={checked => {
                  if (column.canToggle) {
                    toggleColumn(column.id, !!checked);
                  }
                }} disabled={!column.canToggle} />
                    <Label htmlFor={`column-${column.id}`}>{column.label}</Label>
                  </div>)}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columnOptions.map(column => visibleColumns.includes(column.id) && <TableHead key={column.id}>{column.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow> : clientes.map(cliente => {
              const giroSemanal = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
              return <TableRow key={cliente.id} className="cursor-pointer" onClick={() => handleSelectCliente(cliente.id)}>
                      {visibleColumns.includes("nome") && <TableCell className="font-medium">{cliente.nome}</TableCell>}
                      {visibleColumns.includes("cnpjCpf") && <TableCell>{cliente.cnpjCpf || "-"}</TableCell>}
                      {visibleColumns.includes("enderecoEntrega") && <TableCell className="max-w-[200px] truncate">
                          {cliente.enderecoEntrega || "-"}
                        </TableCell>}
                      {visibleColumns.includes("contato") && <TableCell>
                          {cliente.contatoNome || "-"}
                          {cliente.contatoTelefone && <div className="text-xs text-muted-foreground">{cliente.contatoTelefone}</div>}
                        </TableCell>}
                      {visibleColumns.includes("quantidadePadrao") && <TableCell>{cliente.quantidadePadrao}</TableCell>}
                      {visibleColumns.includes("periodicidade") && <TableCell>{formatPeriodicidade(cliente.periodicidadePadrao)}</TableCell>}
                      {visibleColumns.includes("giroSemanal") && <TableCell>
                          <Badge variant="outline" className="font-semibold bg-gray-800">
                            {giroSemanal}
                          </Badge>
                        </TableCell>}
                      {visibleColumns.includes("status") && <TableCell>
                          <StatusBadge status={cliente.statusCliente} />
                        </TableCell>}
                      {visibleColumns.includes("statusAgendamento") && <TableCell>
                          <Badge variant={
                            cliente.statusAgendamento === "Agendado" ? "success" : 
                            cliente.statusAgendamento === "Pendente" ? "warning" : "outline"
                          }>
                            {cliente.statusAgendamento || "Não Agendado"}
                          </Badge>
                        </TableCell>}
                      {visibleColumns.includes("proximaDataReposicao") && <TableCell>
                          {cliente.proximaDataReposicao ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{format(cliente.proximaDataReposicao, "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          ) : "-"}
                        </TableCell>}
                      {visibleColumns.includes("acoes") && <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={e => {
                    e.stopPropagation();
                    handleSelectCliente(cliente.id);
                  }}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Ver detalhes</span>
                          </Button>
                        </TableCell>}
                    </TableRow>;
            })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClienteFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </>;
}
