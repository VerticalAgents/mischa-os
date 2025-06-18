
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
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
import { useClienteStore } from "@/hooks/useClienteStore";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import SortDropdown, { SortField, SortDirection } from "./SortDropdown";
import AgendamentoEditModal from "./AgendamentoEditModal";
import { AgendamentoItem } from "./types";

export default function AgendamentosPendentes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const { toast } = useToast();
  const { clientes, carregarClientes } = useClienteStore();
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();

  // Ordenação padrão por nome
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filtrar clientes que não possuem agendamento
  const clientesSemAgendamento = useMemo(() => {
    const clientesComAgendamento = new Set(agendamentos.map(a => a.cliente.id));
    return clientes.filter(cliente => 
      cliente.ativo && !clientesComAgendamento.has(cliente.id)
    );
  }, [clientes, agendamentos]);

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Filtrar clientes com base no termo de pesquisa
  const filteredClientes = useMemo(() => {
    if (!searchTerm.trim()) return clientesSemAgendamento;
    
    const term = searchTerm.toLowerCase();
    return clientesSemAgendamento.filter(cliente => 
      cliente.nome.toLowerCase().includes(term) ||
      (cliente.cnpjCpf && cliente.cnpjCpf.toLowerCase().includes(term))
    );
  }, [clientesSemAgendamento, searchTerm]);

  const sortedClientes = useMemo(() => {
    return [...filteredClientes].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'nome':
          valueA = a.nome.toLowerCase();
          valueB = b.nome.toLowerCase();
          break;
        case 'data':
          // Para clientes sem agendamento, usar data de cadastro
          valueA = new Date(a.dataCadastro).getTime();
          valueB = new Date(b.dataCadastro).getTime();
          break;
        case 'status':
          valueA = a.statusCliente.toLowerCase();
          valueB = b.statusCliente.toLowerCase();
          break;
        case 'tipo':
          // Todos são considerados "padrão" já que não têm agendamento
          valueA = 'padrão';
          valueB = 'padrão';
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
  }, [filteredClientes, sortField, sortDirection]);

  useEffect(() => {
    carregarClientes();
    carregarTodosAgendamentos();
  }, [carregarClientes, carregarTodosAgendamentos]);

  const handleCriarAgendamento = (cliente: any) => {
    // Criar um agendamento fictício para abrir o modal de edição
    const agendamentoFicticio: AgendamentoItem = {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cnpjCpf: cliente.cnpjCpf || '',
        statusCliente: cliente.statusCliente,
        quantidadePadrao: cliente.quantidadePadrao || 0,
        periodicidadePadrao: cliente.periodicidadePadrao || 7,
        categoriasHabilitadas: cliente.categoriasHabilitadas || []
      },
      statusAgendamento: 'Agendar',
      dataReposicao: new Date(),
      isPedidoUnico: false,
      pedido: {
        id: 0,
        idCliente: cliente.id,
        dataPedido: new Date(),
        dataPrevistaEntrega: new Date(),
        statusPedido: 'Agendado',
        totalPedidoUnidades: cliente.quantidadePadrao || 0,
        tipoPedido: 'Padrão',
        itensPedido: [],
        historicoAlteracoesStatus: []
      }
    };
    
    setSelectedCliente(agendamentoFicticio);
    setOpen(true);
  };

  const handleSalvarAgendamento = () => {
    // Recarregar dados após salvar
    carregarTodosAgendamentos();
    carregarClientes();
    setOpen(false);
    setSelectedCliente(null);
  };

  // Se não há clientes sem agendamento, não renderizar nada
  if (sortedClientes.length === 0) {
    return null;
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
          {sortedClientes.length} cliente(s) sem agendamento
        </div>
      </div>

      <Table>
        <TableCaption>Lista de clientes que não possuem agendamento.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>PDV</TableHead>
            <TableHead>CNPJ/CPF</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Qp Padrão</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedClientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell>{cliente.nome}</TableCell>
              <TableCell>{cliente.cnpjCpf || '-'}</TableCell>
              <TableCell>
                <Badge variant="secondary">{cliente.statusCliente}</Badge>
              </TableCell>
              <TableCell>{cliente.quantidadePadrao}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleCriarAgendamento(cliente)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Agendamento
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AgendamentoEditModal
        open={open}
        onOpenChange={setOpen}
        agendamento={selectedCliente}
        onSalvar={handleSalvarAgendamento}
      />
    </div>
  );
}
