import { useState, useEffect } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { format, compareAsc } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Cliente, Pedido } from "@/types";
import FiltrosLocalizacao from "./FiltrosLocalizacao";
import EditarAgendamentoDialog from "./EditarAgendamentoDialog";

interface AgendamentoItem {
  cliente: Cliente;
  pedido?: Pedido;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

export default function TodosAgendamentos() {
  const { clientes } = useClienteStore();
  const { getPedidosFuturos, getPedidosUnicos, atualizarPedido } = usePedidoStore();
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<AgendamentoItem[]>([]);
  const [filtroAtivo, setFiltroAtivo] = useState<{ rota?: string }>({});
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoItem | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("todos");

  // Carregar agendamentos
  useEffect(() => {
    const pedidosFuturos = getPedidosFuturos();
    const pedidosUnicos = getPedidosUnicos();
    
    const agendamentosTemp: AgendamentoItem[] = [];
    
    // Adicionar clientes com pedidos futuros
    pedidosFuturos.forEach(pedido => {
      if (pedido.cliente) {
        agendamentosTemp.push({
          cliente: pedido.cliente,
          pedido,
          dataReposicao: new Date(pedido.dataPrevistaEntrega),
          statusAgendamento: pedido.cliente.statusAgendamento || "Agendado",
          isPedidoUnico: false
        });
      }
    });
    
    // Adicionar pedidos únicos
    pedidosUnicos.forEach(pedido => {
      const nomeMatch = pedido.observacoes?.match(/Nome: (.*?)(?:\n|$)/);
      const nome = nomeMatch ? nomeMatch[1] : `Pedido Único #${pedido.id}`;
      
      const clienteFicticio: Cliente = {
        id: 0,
        nome,
        quantidadePadrao: 0,
        periodicidadePadrao: 0,
        statusCliente: "Ativo",
        dataCadastro: new Date(),
        contabilizarGiroMedio: false,
        tipoLogistica: "Própria",
        emiteNotaFiscal: false,
        tipoCobranca: "À vista",
        formaPagamento: "Dinheiro"
      };
      
      agendamentosTemp.push({
        cliente: clienteFicticio,
        pedido,
        dataReposicao: new Date(pedido.dataPrevistaEntrega),
        statusAgendamento: "Agendado",
        isPedidoUnico: true
      });
    });
    
    // Ordenar por data e depois por status
    agendamentosTemp.sort((a, b) => {
      const dataCompare = compareAsc(a.dataReposicao, b.dataReposicao);
      if (dataCompare !== 0) return dataCompare;
      
      const statusOrder = { "Previsto": 0, "Agendado": 1, "Reagendar": 2 };
      const aOrder = statusOrder[a.statusAgendamento as keyof typeof statusOrder] ?? 3;
      const bOrder = statusOrder[b.statusAgendamento as keyof typeof statusOrder] ?? 3;
      
      return aOrder - bOrder;
    });
    
    setAgendamentos(agendamentosTemp);
  }, [clientes, getPedidosFuturos, getPedidosUnicos]);

  // Aplicar filtros
  useEffect(() => {
    let filtrados = [...agendamentos];

    // Filtro por rota (implementação básica - pode ser expandida conforme necessário)
    if (filtroAtivo.rota) {
      // Por enquanto, mantém todos os agendamentos já que não temos campo rota nos dados
      // Esta lógica pode ser expandida quando os dados incluírem informação de rota
    }

    // Filtro por aba ativa
    switch (abaAtiva) {
      case "previstos":
        filtrados = filtrados.filter(a => a.statusAgendamento === "Previsto");
        break;
      case "agendados":
        filtrados = filtrados.filter(a => a.statusAgendamento === "Agendado");
        break;
      case "pedidos-unicos":
        filtrados = filtrados.filter(a => a.isPedidoUnico);
        break;
      default:
        // "todos" - não filtra
        break;
    }

    setAgendamentosFiltrados(filtrados);
  }, [agendamentos, filtroAtivo, abaAtiva]);

  const handleFiltroChange = (novoFiltro: { rota?: string }) => {
    setFiltroAtivo(novoFiltro);
  };

  const handleEditarAgendamento = (agendamento: AgendamentoItem) => {
    setAgendamentoSelecionado(agendamento);
    setDialogAberto(true);
  };

  const handleSalvarAgendamento = (agendamentoAtualizado: AgendamentoItem) => {
    // Atualizar no store se for um pedido
    if (agendamentoAtualizado.pedido) {
      atualizarPedido(agendamentoAtualizado.pedido.id, {
        dataPrevistaEntrega: agendamentoAtualizado.dataReposicao, // Keep as Date object
        totalPedidoUnidades: agendamentoAtualizado.pedido.totalPedidoUnidades,
        observacoes: agendamentoAtualizado.pedido.observacoes
      });
    }

    // Atualizar na lista local
    setAgendamentos(prev => 
      prev.map(a => 
        a.cliente.id === agendamentoAtualizado.cliente.id && 
        a.pedido?.id === agendamentoAtualizado.pedido?.id
          ? agendamentoAtualizado 
          : a
      )
    );
  };

  const handleWhatsAppClick = (agendamento: AgendamentoItem) => {
    if (agendamento.isPedidoUnico) return;
    
    const cliente = agendamento.cliente;
    if (!cliente.contatoTelefone) return;
    
    let phone = cliente.contatoTelefone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('55')) phone = '55' + phone;
    
    const dataFormatada = format(agendamento.dataReposicao, 'dd/MM/yyyy');
    
    const message = encodeURIComponent(
      `Olá ${cliente.nome}, tudo bem? Gostaríamos de confirmar a entrega prevista para o dia ${dataFormatada}. Por favor, nos confirme a necessidade da reposição.`
    );
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Previsto": return "bg-amber-500";
      case "Agendado": return "bg-green-500";
      case "Reagendar": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getContadorAba = (aba: string) => {
    switch (aba) {
      case "previstos":
        return agendamentos.filter(a => a.statusAgendamento === "Previsto").length;
      case "agendados":
        return agendamentos.filter(a => a.statusAgendamento === "Agendado").length;
      case "pedidos-unicos":
        return agendamentos.filter(a => a.isPedidoUnico).length;
      default:
        return agendamentos.length;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos os Agendamentos</CardTitle>
        <CardDescription>
          Visão panorâmica de todos os PDVs com pedidos agendados e pedidos únicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FiltrosLocalizacao onFiltroChange={handleFiltroChange} />
        
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todos" className="flex items-center gap-2">
              Todos
              <Badge variant="secondary" className="text-xs">
                {getContadorAba("todos")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="previstos" className="flex items-center gap-2">
              Previstos
              <Badge variant="secondary" className="text-xs">
                {getContadorAba("previstos")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="agendados" className="flex items-center gap-2">
              Agendados
              <Badge variant="secondary" className="text-xs">
                {getContadorAba("agendados")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pedidos-unicos" className="flex items-center gap-2">
              Pedidos Únicos
              <Badge variant="secondary" className="text-xs">
                {getContadorAba("pedidos-unicos")}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={abaAtiva} className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PDV / Cliente</TableHead>
                  <TableHead>Data da Reposição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentosFiltrados.map((agendamento, index) => (
                  <TableRow 
                    key={`${agendamento.cliente.id}-${index}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEditarAgendamento(agendamento)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div>{agendamento.cliente.nome}</div>
                        {!agendamento.isPedidoUnico && agendamento.cliente.contatoNome && (
                          <div className="text-xs text-muted-foreground">
                            {agendamento.cliente.contatoNome}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(agendamento.dataReposicao, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(agendamento.statusAgendamento)} text-white`}>
                        {agendamento.statusAgendamento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao} un
                    </TableCell>
                    <TableCell>
                      <Badge variant={agendamento.isPedidoUnico ? "destructive" : "default"}>
                        {agendamento.isPedidoUnico ? "Pedido Único" : "PDV"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!agendamento.isPedidoUnico && agendamento.cliente.contatoTelefone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsAppClick(agendamento);
                          }}
                          className="flex items-center gap-1"
                        >
                          <MessageSquare className="h-4 w-4 text-green-500" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {agendamentosFiltrados.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum agendamento encontrado para esta categoria</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <EditarAgendamentoDialog
          agendamento={agendamentoSelecionado}
          open={dialogAberto}
          onOpenChange={setDialogAberto}
          onSave={handleSalvarAgendamento}
        />
      </CardContent>
    </Card>
  );
}
