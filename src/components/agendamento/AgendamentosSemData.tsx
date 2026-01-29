
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AgendamentoItem } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Calendar, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import AgendamentoEditModal from "./AgendamentoEditModal";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import SortDropdown, { SortField, SortDirection } from "./SortDropdown";

export default function AgendamentosSemData() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { carregarClientes } = useClienteStore();

  // Ordenação padrão por nome
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Filtrar agendamentos com status "Agendar" (sem data definida) e clientes ativos
  const agendamentosSemData = useMemo(() => {
    return agendamentos.filter(agendamento => 
      agendamento.statusAgendamento === "Agendar" &&
      agendamento.cliente.ativo === true
    );
  }, [agendamentos]);

  // Filtrar agendamentos com base no termo de pesquisa
  const filteredAgendamentos = useMemo(() => {
    if (!searchTerm.trim()) return agendamentosSemData;
    
    const term = searchTerm.toLowerCase();
    return agendamentosSemData.filter(agendamento => 
      agendamento.cliente.nome.toLowerCase().includes(term) ||
      (agendamento.cliente.cnpjCpf && agendamento.cliente.cnpjCpf.toLowerCase().includes(term))
    );
  }, [agendamentosSemData, searchTerm]);

  const sortedAgendamentos = useMemo(() => {
    return [...filteredAgendamentos].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'nome':
          valueA = a.cliente.nome.toLowerCase();
          valueB = b.cliente.nome.toLowerCase();
          break;
        case 'data':
          // Como não têm data, usar data de cadastro
          valueA = new Date(a.cliente.dataCadastro).getTime();
          valueB = new Date(b.cliente.dataCadastro).getTime();
          break;
        case 'status':
          valueA = a.statusAgendamento.toLowerCase();
          valueB = b.statusAgendamento.toLowerCase();
          break;
        case 'tipo':
          valueA = a.isPedidoUnico ? 'único' : 'pdv';
          valueB = b.isPedidoUnico ? 'único' : 'pdv';
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredAgendamentos, sortField, sortDirection]);

  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  const handleEditarAgendamento = (agendamento: AgendamentoItem) => {
    setSelectedAgendamento(agendamento);
    setOpen(true);
  };

  const handleSalvarAgendamento = () => {
    carregarTodosAgendamentos();
    carregarClientes();
  };

  // Se não há agendamentos sem data, não renderizar nada
  if (sortedAgendamentos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Nenhum agendamento sem data</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Todos os clientes possuem datas de reposição definidas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtro de Pesquisa */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por cliente ou CNPJ/CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Controles de Ordenação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
          <SortDropdown
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedAgendamentos.length} agendamento(s) sem data definida
        </div>
      </div>

      <Table>
        <TableCaption>Lista de agendamentos sem data de reposição definida.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>PDV</TableHead>
            <TableHead>CNPJ/CPF</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgendamentos.map((agendamento) => (
            <TableRow key={agendamento.cliente.id}>
              <TableCell>{agendamento.cliente.nome}</TableCell>
              <TableCell>{agendamento.cliente.cnpjCpf || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {agendamento.statusAgendamento}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(agendamento.cliente.dataCadastro), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEditarAgendamento(agendamento)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Definir Data
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AgendamentoEditModal
        open={open}
        onOpenChange={setOpen}
        agendamento={selectedAgendamento}
        onSalvar={handleSalvarAgendamento}
      />
    </div>
  );
}
