
import { useState, useEffect } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { format, compareAsc } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface AgendamentoItem {
  cliente: Cliente;
  pedido?: Pedido;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

export default function TodosAgendamentos() {
  const { clientes } = useClienteStore();
  const { getPedidosFuturos, getPedidosUnicos } = usePedidoStore();
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);

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
      // Extrair nome do pedido único das observações
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
      
      // Dentro da mesma data, ordenar por status (Previsto antes de Agendado)
      const statusOrder = { "Previsto": 0, "Agendado": 1, "Reagendar": 2 };
      const aOrder = statusOrder[a.statusAgendamento as keyof typeof statusOrder] ?? 3;
      const bOrder = statusOrder[b.statusAgendamento as keyof typeof statusOrder] ?? 3;
      
      return aOrder - bOrder;
    });
    
    setAgendamentos(agendamentosTemp);
  }, [clientes, getPedidosFuturos, getPedidosUnicos]);

  const handleWhatsAppClick = (agendamento: AgendamentoItem) => {
    if (agendamento.isPedidoUnico) return; // Não aplicável para pedidos únicos
    
    const cliente = agendamento.cliente;
    if (!cliente.contatoTelefone) return;
    
    // Formatar telefone para WhatsApp
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos os Agendamentos</CardTitle>
        <CardDescription>
          Visão panorâmica de todos os PDVs com pedidos agendados e pedidos únicos
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            {agendamentos.map((agendamento, index) => (
              <TableRow key={`${agendamento.cliente.id}-${index}`}>
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
                      onClick={() => handleWhatsAppClick(agendamento)}
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
        
        {agendamentos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum agendamento encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
