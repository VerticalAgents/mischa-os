import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Search, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useToast } from "@/hooks/use-toast";
import AgendamentoEditModal from "./AgendamentoEditModal";
import TipoPedidoBadge from "@/components/expedicao/TipoPedidoBadge";
import { AgendamentoItem } from "./types";

export default function AgendamentoRepresentantes() {
  const { agendamentos, carregarTodosAgendamentos, obterAgendamento, salvarAgendamento } = useAgendamentoClienteStore();
  const { clientes, carregarClientes } = useClienteStore();
  const { representantes, carregarRepresentantes } = useSupabaseRepresentantes();
  const { toast } = useToast();
  
  const [representanteSelecionado, setRepresentanteSelecionado] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          // Only load if data is empty or stale
          if (agendamentos.length === 0) {
            await carregarTodosAgendamentos();
          }
          if (clientes.length === 0) {
            await carregarClientes();
          }
          if (representantes.length === 0) {
            await carregarRepresentantes();
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
  }, []); // Empty dependency array to run only once

  // Filtrar agendamentos por representante
  const agendamentosFiltrados = useMemo(() => {
    let filtrados = agendamentos;

    // Filtrar por representante
    if (representanteSelecionado !== "todos") {
      const repId = parseInt(representanteSelecionado);
      filtrados = filtrados.filter(agendamento => 
        agendamento.cliente.representanteId === repId
      );
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(agendamento => 
        agendamento.cliente.nome.toLowerCase().includes(term)
      );
    }

    return filtrados;
  }, [agendamentos, representanteSelecionado, searchTerm]);

  // Separar previstos e confirmados
  const agendamentosPrevistos = useMemo(() => 
    agendamentosFiltrados.filter(a => a.statusAgendamento === "Previsto")
  , [agendamentosFiltrados]);

  const agendamentosConfirmados = useMemo(() => 
    agendamentosFiltrados.filter(a => a.statusAgendamento === "Agendado")
  , [agendamentosFiltrados]);

  const handleEditarAgendamento = (agendamento: AgendamentoItem) => {
    setSelectedAgendamento(agendamento);
    setOpen(true);
  };

  const handleSalvarAgendamento = (agendamentoAtualizado: AgendamentoItem) => {
    carregarTodosAgendamentos();
  };

  const handleConfirmarAgendamento = async (agendamento: AgendamentoItem) => {
    try {
      const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
      
      if (agendamentoAtual) {
        await salvarAgendamento(agendamento.cliente.id, {
          status_agendamento: 'Agendado',
          data_proxima_reposicao: agendamentoAtual.data_proxima_reposicao,
          quantidade_total: agendamentoAtual.quantidade_total,
          tipo_pedido: agendamentoAtual.tipo_pedido,
          itens_personalizados: agendamentoAtual.itens_personalizados
        });
      }
      
      await carregarTodosAgendamentos();
      await carregarClientes();
      
      toast({
        title: "Sucesso",
        description: `Agendamento confirmado para ${agendamento.cliente.nome}`,
      });
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar agendamento",
        variant: "destructive",
      });
    }
  };

  const representanteNome = useMemo(() => {
    if (representanteSelecionado === "todos") return "Todos os Representantes";
    const rep = representantes.find(r => r.id === parseInt(representanteSelecionado));
    return rep ? rep.nome : "Representante não encontrado";
  }, [representanteSelecionado, representantes]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={representanteSelecionado} onValueChange={setRepresentanteSelecionado}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um representante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Representantes</SelectItem>
              {representantes.map((rep) => (
                <SelectItem key={rep.id} value={rep.id.toString()}>
                  {rep.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendamentosFiltrados.length}</div>
            <p className="text-xs text-muted-foreground">{representanteNome}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Previstos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{agendamentosPrevistos.length}</div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{agendamentosConfirmados.length}</div>
            <p className="text-xs text-muted-foreground">Agendamentos confirmados</p>
          </CardContent>
        </Card>
      </div>

      {/* Agendamentos Previstos */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Previstos ({agendamentosPrevistos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {agendamentosPrevistos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PDV</TableHead>
                  <TableHead>Data Reposição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentosPrevistos.map((agendamento) => (
                  <TableRow key={agendamento.cliente.id}>
                    <TableCell>{agendamento.cliente.nome}</TableCell>
                    <TableCell>
                      {format(agendamento.dataReposicao, "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleConfirmarAgendamento(agendamento)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Confirmar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditarAgendamento(agendamento)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum agendamento previsto encontrado</p>
              <p className="text-sm">Para o representante selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agendamentos Confirmados */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Confirmados ({agendamentosConfirmados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {agendamentosConfirmados.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PDV</TableHead>
                  <TableHead>Data Reposição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentosConfirmados.map((agendamento) => (
                  <TableRow key={agendamento.cliente.id}>
                    <TableCell>{agendamento.cliente.nome}</TableCell>
                    <TableCell>
                      {format(agendamento.dataReposicao, "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditarAgendamento(agendamento)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum agendamento confirmado encontrado</p>
              <p className="text-sm">Para o representante selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AgendamentoEditModal
        open={open}
        onOpenChange={setOpen}
        agendamento={selectedAgendamento}
        onSalvar={handleSalvarAgendamento}
      />
    </div>
  );
}
