import { useMemo, useState } from "react";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useFrequenciaRealEntregas, getCorDivergencia } from "@/hooks/useFrequenciaRealEntregas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Edit2, Package, Search, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import EditarPeriodicidadeModal from "./EditarPeriodicidadeModal";
import { Cliente } from "@/types";

interface ClientePeriodicidade {
  clienteId: string;
  cliente: Cliente;
  nome: string;
  periodicidadePadrao: number;
  quantidadePadrao: number;
  ultimaReposicao?: Date;
  proximaReposicao: Date;
  statusAgendamento: "Previsto" | "Agendado";
}

type FaixaPeriodicidade = "todos" | "semanal" | "quinzenal" | "mensal" | "outros";
type OrdenacaoOpcao = "nome" | "periodicidade" | "proxima";

export default function AgendamentosPeriodicidade() {
  const { agendamentos } = useAgendamentoClienteStore();
  
  const [termoBusca, setTermoBusca] = useState("");
  const [faixaPeriodicidade, setFaixaPeriodicidade] = useState<FaixaPeriodicidade>("todos");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoOpcao>("nome");
  const [clienteEditando, setClienteEditando] = useState<ClientePeriodicidade | null>(null);

  // Extrair IDs dos clientes para buscar frequência real
  const clienteIds = useMemo(() => {
    return agendamentos
      .filter(a => 
        (a.statusAgendamento === "Previsto" || a.statusAgendamento === "Agendado") &&
        a.cliente.ativo === true
      )
      .map(a => a.cliente.id);
  }, [agendamentos]);

  // Buscar frequência real de entregas
  const { data: frequenciasReais, isLoading: loadingFrequencias } = useFrequenciaRealEntregas(clienteIds);

  // Filtrar apenas agendamentos ativos (Previsto ou Agendado) de clientes ativos
  const clientesComPeriodicidade = useMemo(() => {
    return agendamentos
      .filter(a => 
        (a.statusAgendamento === "Previsto" || a.statusAgendamento === "Agendado") &&
        a.cliente.ativo === true
      )
      .map(a => ({
        clienteId: a.cliente.id,
        cliente: a.cliente,
        nome: a.cliente.nome,
        periodicidadePadrao: a.cliente.periodicidadePadrao || 7,
        quantidadePadrao: a.cliente.quantidadePadrao || 0,
        ultimaReposicao: a.cliente.ultimaDataReposicaoEfetiva || undefined,
        proximaReposicao: a.dataReposicao,
        statusAgendamento: a.statusAgendamento as "Previsto" | "Agendado"
      }));
  }, [agendamentos]);

  // Aplicar filtros
  const clientesFiltrados = useMemo(() => {
    let resultado = [...clientesComPeriodicidade];

    // Filtro por nome
    if (termoBusca) {
      const termoLower = termoBusca.toLowerCase();
      resultado = resultado.filter(c => c.nome.toLowerCase().includes(termoLower));
    }

    // Filtro por faixa de periodicidade
    if (faixaPeriodicidade !== "todos") {
      resultado = resultado.filter(c => {
        const dias = c.periodicidadePadrao;
        switch (faixaPeriodicidade) {
          case "semanal": return dias <= 7;
          case "quinzenal": return dias > 7 && dias <= 14;
          case "mensal": return dias > 14 && dias <= 30;
          case "outros": return dias > 30;
          default: return true;
        }
      });
    }

    // Ordenação
    resultado.sort((a, b) => {
      switch (ordenacao) {
        case "nome":
          return a.nome.localeCompare(b.nome);
        case "periodicidade":
          return a.periodicidadePadrao - b.periodicidadePadrao;
        case "proxima":
          return new Date(a.proximaReposicao).getTime() - new Date(b.proximaReposicao).getTime();
        default:
          return 0;
      }
    });

    return resultado;
  }, [clientesComPeriodicidade, termoBusca, faixaPeriodicidade, ordenacao]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const total = clientesComPeriodicidade.length;
    
    const somaPeriodicidade = clientesComPeriodicidade.reduce(
      (acc, c) => acc + c.periodicidadePadrao, 0
    );
    const media = total > 0 ? Math.round(somaPeriodicidade / total) : 0;

    const distribuicao = {
      semanal: clientesComPeriodicidade.filter(c => c.periodicidadePadrao <= 7).length,
      quinzenal: clientesComPeriodicidade.filter(c => c.periodicidadePadrao > 7 && c.periodicidadePadrao <= 14).length,
      mensal: clientesComPeriodicidade.filter(c => c.periodicidadePadrao > 14 && c.periodicidadePadrao <= 30).length,
      outros: clientesComPeriodicidade.filter(c => c.periodicidadePadrao > 30).length
    };

    return { total, media, distribuicao };
  }, [clientesComPeriodicidade]);

  const formatarData = (data: Date | undefined) => {
    if (!data) return "-";
    return format(new Date(data), "dd/MM", { locale: ptBR });
  };

  const getFaixaLabel = (dias: number) => {
    if (dias <= 7) return "Semanal";
    if (dias <= 14) return "Quinzenal";
    if (dias <= 30) return "Mensal";
    return "Personalizado";
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <p className="text-xs text-muted-foreground">
              clientes com agendamento ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Periodicidade Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.media} dias</div>
            <p className="text-xs text-muted-foreground">
              média entre clientes ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Faixa</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Semanal: {estatisticas.distribuicao.semanal}</Badge>
              <Badge variant="secondary">Quinzenal: {estatisticas.distribuicao.quinzenal}</Badge>
              <Badge variant="secondary">Mensal: {estatisticas.distribuicao.mensal}</Badge>
              {estatisticas.distribuicao.outros > 0 && (
                <Badge variant="outline">Outros: {estatisticas.distribuicao.outros}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-4 items-center">
              <Select value={faixaPeriodicidade} onValueChange={(v) => setFaixaPeriodicidade(v as FaixaPeriodicidade)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por faixa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as faixas</SelectItem>
                  <SelectItem value="semanal">Semanal (≤7 dias)</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal (8-14 dias)</SelectItem>
                  <SelectItem value="mensal">Mensal (15-30 dias)</SelectItem>
                  <SelectItem value="outros">Outros (&gt;30 dias)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ordenacao} onValueChange={(v) => setOrdenacao(v as OrdenacaoOpcao)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="periodicidade">Periodicidade</SelectItem>
                  <SelectItem value="proxima">Próxima Reposição</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {clientesFiltrados.length} PDVs
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Clientes */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PDV</TableHead>
                <TableHead className="text-center">Periodicidade</TableHead>
                <TableHead className="text-center">Qtd Padrão</TableHead>
                <TableHead className="text-center">Última</TableHead>
                <TableHead className="text-center">Próxima</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="text-muted-foreground">
                      Nenhum cliente encontrado com os filtros aplicados.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.clienteId}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const freqInfo = frequenciasReais?.get(cliente.clienteId);
                        const frequenciaReal = freqInfo?.frequenciaReal ?? null;
                        const { cor, direcao, classe } = getCorDivergencia(cliente.periodicidadePadrao, frequenciaReal);
                        
                        const DirecaoIcon = direcao === 'up' ? TrendingUp : direcao === 'down' ? TrendingDown : Minus;
                        
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold">{cliente.periodicidadePadrao} dias</span>
                            <Badge variant="outline" className="text-xs">
                              {getFaixaLabel(cliente.periodicidadePadrao)}
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`flex items-center gap-1 text-xs ${classe}`}>
                                    <span className="text-muted-foreground">Real:</span>
                                    {loadingFrequencias ? (
                                      <span className="text-muted-foreground">...</span>
                                    ) : frequenciaReal !== null ? (
                                      <>
                                        <span className="font-medium">{frequenciaReal} dias</span>
                                        <DirecaoIcon className="h-3 w-3" />
                                      </>
                                    ) : (
                                      <span className="text-muted-foreground">N/A</span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {freqInfo ? (
                                    <div className="text-xs">
                                      <p>Entregas nos últimos 84 dias: {freqInfo.numeroEntregas}</p>
                                      {frequenciaReal !== null ? (
                                        <p>Intervalo médio real: {frequenciaReal} dias</p>
                                      ) : (
                                        <p>Dados insuficientes (mín. 2 entregas)</p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs">Sem entregas no período</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{cliente.quantidadePadrao} un</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {formatarData(cliente.ultimaReposicao)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatarData(cliente.proximaReposicao)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={cliente.statusAgendamento === "Agendado" ? "default" : "secondary"}
                      >
                        {cliente.statusAgendamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setClienteEditando(cliente)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {clienteEditando && (
        <EditarPeriodicidadeModal
          cliente={clienteEditando.cliente}
          periodicidadeAtual={clienteEditando.periodicidadePadrao}
          quantidadeAtual={clienteEditando.quantidadePadrao}
          open={!!clienteEditando}
          onClose={() => setClienteEditando(null)}
        />
      )}
    </div>
  );
}
