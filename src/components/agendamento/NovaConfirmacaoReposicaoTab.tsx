
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { format, addBusinessDays, isToday, isBefore, startOfDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Edit, Calendar, AlertTriangle } from "lucide-react";
import StatusConfirmacaoBadge from "./StatusConfirmacaoBadge";
import TipoPedidoBadge from "@/components/expedicao/TipoPedidoBadge";
import AgendamentoEditModal from "./AgendamentoEditModal";
import { AgendamentoItem } from "./types";
import { toast } from "sonner";
import { PEDIDO_MINIMO_UNIDADES } from "@/utils/constants";

interface AgendamentoComConfirmacao {
  cliente: {
    id: string;
    nome: string;
    quantidadePadrao: number;
  };
  dataReposicao: Date;
  statusAgendamento: string;
  tipoPedido: string;
  quantidadeTotal: number;
}

const getNextBusinessDayName = () => {
  const today = new Date();
  const tomorrow = addBusinessDays(today, 1);
  
  // Se for sexta ou sábado, próximo dia útil é segunda
  if (today.getDay() === 5 || today.getDay() === 6) {
    return "Próxima Segunda-feira";
  }
  
  return "Amanhã";
};

const getTwoBusinessDaysName = () => {
  const today = new Date();
  const twoDaysAhead = addBusinessDays(today, 2);
  
  const dayName = format(twoDaysAhead, "EEEE", { locale: ptBR });
  return `Próxima ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}-feira`;
};

export default function NovaConfirmacaoReposicaoTab() {
  const { agendamentos, carregarTodosAgendamentos, salvarAgendamento } = useAgendamentoClienteStore();
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  // Converter agendamentos para formato compatível
  const agendamentosFormatados: AgendamentoComConfirmacao[] = useMemo(() => {
    return agendamentos
      .filter(agendamento => agendamento.statusAgendamento === 'Previsto')
      .map(agendamento => ({
        cliente: {
          id: agendamento.cliente.id,
          nome: agendamento.cliente.nome,
          quantidadePadrao: PEDIDO_MINIMO_UNIDADES
        },
        dataReposicao: agendamento.dataReposicao,
        statusAgendamento: agendamento.statusAgendamento,
        tipoPedido: agendamento.pedido?.tipoPedido || 'Padrão',
        quantidadeTotal: agendamento.pedido?.totalPedidoUnidades || PEDIDO_MINIMO_UNIDADES
      }));
  }, [agendamentos]);

  // Separar agendamentos por categorias
  const { paraHoje, proximoDiaUtil, doisDiasUteis, atrasados } = useMemo(() => {
    const hoje = startOfDay(new Date());
    const proximoDia = addBusinessDays(hoje, 1);
    const doisDias = addBusinessDays(hoje, 2);

    return {
      paraHoje: agendamentosFormatados.filter(ag => 
        isToday(ag.dataReposicao)
      ),
      proximoDiaUtil: agendamentosFormatados.filter(ag => 
        format(ag.dataReposicao, 'yyyy-MM-dd') === format(proximoDia, 'yyyy-MM-dd')
      ),
      doisDiasUteis: agendamentosFormatados.filter(ag => 
        format(ag.dataReposicao, 'yyyy-MM-dd') === format(doisDias, 'yyyy-MM-dd')
      ),
      atrasados: agendamentosFormatados.filter(ag => 
        isBefore(ag.dataReposicao, hoje)
      )
    };
  }, [agendamentosFormatados]);

  const handleConfirmarAgendamento = async (clienteId: string) => {
    try {
      await salvarAgendamento(clienteId, {
        status_agendamento: 'Agendado'
      });
      
      await carregarTodosAgendamentos();
      toast.success('Agendamento confirmado com sucesso!');
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      toast.error('Erro ao confirmar agendamento');
    }
  };

  const handleReagendar = (agendamento: AgendamentoComConfirmacao) => {
    // Encontrar o agendamento completo para edição
    const agendamentoCompleto = agendamentos.find(ag => ag.cliente.id === agendamento.cliente.id);
    if (agendamentoCompleto) {
      setSelectedAgendamento(agendamentoCompleto);
      setModalOpen(true);
    }
  };

  const renderAgendamentosTable = (agendamentos: AgendamentoComConfirmacao[], title: string, variant: "default" | "secondary" | "destructive" = "default") => {
    if (agendamentos.length === 0) return null;

    const getCardStyle = () => {
      switch (variant) {
        case "destructive":
          return "border-red-200 bg-red-50";
        case "secondary":
          return "border-amber-200 bg-amber-50";
        default:
          return "border-green-200 bg-green-50";
      }
    };

    return (
      <Card className={getCardStyle()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {variant === "destructive" && <AlertTriangle className="h-5 w-5 text-red-600" />}
            {variant === "secondary" && <Calendar className="h-5 w-5 text-amber-600" />}
            {variant === "default" && <Check className="h-5 w-5 text-green-600" />}
            {title} ({agendamentos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Tipo Pedido</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentos.map((agendamento) => (
                <TableRow key={agendamento.cliente.id}>
                  <TableCell className="font-medium">{agendamento.cliente.nome}</TableCell>
                  <TableCell>
                    {format(agendamento.dataReposicao, "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <TipoPedidoBadge tipo={agendamento.tipoPedido} />
                  </TableCell>
                  <TableCell>{agendamento.quantidadeTotal} un</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => handleConfirmarAgendamento(agendamento.cliente.id)}
                        size="sm"
                        variant="success"
                        className="flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Confirmar
                      </Button>
                      <Button
                        onClick={() => handleReagendar(agendamento)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Reagendar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Confirmação de Reposições</h2>
        <p className="text-muted-foreground">
          Confirme ou reagende os agendamentos previstos para os próximos dias
        </p>
      </div>

      <div className="space-y-6">
        {/* Para Hoje */}
        {renderAgendamentosTable(paraHoje, "Para Hoje", "default")}

        {/* Próximo Dia Útil */}
        {renderAgendamentosTable(proximoDiaUtil, getNextBusinessDayName(), "secondary")}

        {/* 2 Dias Úteis */}
        {renderAgendamentosTable(doisDiasUteis, getTwoBusinessDaysName(), "secondary")}

        {/* Atrasados */}
        {renderAgendamentosTable(atrasados, "Atrasados", "destructive")}

        {/* Mensagem quando não há agendamentos */}
        {paraHoje.length === 0 && proximoDiaUtil.length === 0 && doisDiasUteis.length === 0 && atrasados.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Check className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma confirmação pendente!</h3>
              <p className="text-muted-foreground text-center">
                Não há agendamentos previstos que precisam de confirmação.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AgendamentoEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        agendamento={selectedAgendamento}
        onSalvar={() => {
          carregarTodosAgendamentos();
          setModalOpen(false);
        }}
      />
    </div>
  );
}
