
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DashboardComercial() {
  const { toast } = useToast();
  const [taxaConversao, setTaxaConversao] = useState(15); // Taxa padrão de 15%
  const [metaMensal, setMetaMensal] = useState(20); // Meta de 20 leads por mês

  // Dados simulados - em produção viriam de uma API/store
  const dadosLeads = {
    totalLeads: 47,
    leadsConvertidos: 7,
    leadsEmAndamento: 28,
    leadsPerdidos: 12,
    valorPipeline: 250000,
    ticketMedio: 18750
  };

  const calcularLeadsNecessarios = () => {
    const conversaoAtual = (dadosLeads.leadsConvertidos / dadosLeads.totalLeads) * 100;
    const leadsParaMeta = Math.ceil(metaMensal / (taxaConversao / 100));
    const leadsFaltantes = Math.max(0, leadsParaMeta - dadosLeads.totalLeads);
    
    return {
      conversaoAtual: conversaoAtual.toFixed(1),
      leadsParaMeta,
      leadsFaltantes,
      statusMeta: leadsFaltantes === 0 ? 'atingida' : 'pendente'
    };
  };

  const salvarConfiguracoes = () => {
    // Aqui salvaria no backend/store
    toast({
      title: "Configurações salvas",
      description: "Taxa de conversão e meta foram atualizadas com sucesso."
    });
  };

  const metricas = calcularLeadsNecessarios();

  return (
    <div className="space-y-6">
      {/* Header com configurações */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Comercial</h2>
          <p className="text-muted-foreground">
            Acompanhe métricas, defina metas e monitore a performance
          </p>
        </div>
        
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taxaConversao">Taxa de Conversão (%)</Label>
              <Input
                id="taxaConversao"
                type="number"
                min="1"
                max="100"
                value={taxaConversao}
                onChange={(e) => setTaxaConversao(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="metaMensal">Meta Mensal (clientes)</Label>
              <Input
                id="metaMensal"
                type="number"
                min="1"
                value={metaMensal}
                onChange={(e) => setMetaMensal(Number(e.target.value))}
              />
            </div>
            <Button onClick={salvarConfiguracoes} size="sm" className="w-full">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dadosLeads.totalLeads}</div>
            <p className="text-xs text-muted-foreground">no pipeline atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.conversaoAtual}%</div>
            <p className="text-xs text-muted-foreground">
              Meta: {taxaConversao}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {dadosLeads.valorPipeline.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Ticket médio: R$ {dadosLeads.ticketMedio.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status da Meta</CardTitle>
            {metricas.statusMeta === 'atingida' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricas.statusMeta === 'atingida' ? 'Atingida' : `${metricas.leadsFaltantes}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricas.statusMeta === 'atingida' ? 'Meta alcançada!' : 'leads faltantes'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise Detalhada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Análise da Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análise da Meta Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Meta de conversões:</span>
              <Badge variant="outline">{metaMensal} clientes/mês</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Taxa esperada:</span>
              <Badge variant="outline">{taxaConversao}%</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Leads necessários:</span>
              <Badge>{metricas.leadsParaMeta} leads/mês</Badge>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Leads atuais:</span>
              <Badge variant="secondary">{dadosLeads.totalLeads}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              {metricas.statusMeta === 'atingida' ? (
                <Badge className="bg-green-500">Meta Atingida</Badge>
              ) : (
                <Badge variant="destructive">
                  Faltam {metricas.leadsFaltantes} leads
                </Badge>
              )}
            </div>

            {metricas.statusMeta === 'pendente' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">
                      Ação Necessária
                    </p>
                    <p className="text-xs text-orange-700">
                      Cadastre mais {metricas.leadsFaltantes} leads para atingir a meta mensal
                      com a taxa de conversão de {taxaConversao}%.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição dos Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Distribuição do Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Em andamento</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(dadosLeads.leadsEmAndamento / dadosLeads.totalLeads) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{dadosLeads.leadsEmAndamento}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Convertidos</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(dadosLeads.leadsConvertidos / dadosLeads.totalLeads) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{dadosLeads.leadsConvertidos}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Perdidos</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(dadosLeads.leadsPerdidos / dadosLeads.totalLeads) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{dadosLeads.leadsPerdidos}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-500">59%</div>
                <div className="text-xs text-muted-foreground">Ativo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">15%</div>
                <div className="text-xs text-muted-foreground">Sucesso</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">26%</div>
                <div className="text-xs text-muted-foreground">Perda</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recomendações Estratégicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parseFloat(metricas.conversaoAtual) < taxaConversao && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Melhorar Taxa de Conversão
                    </p>
                    <p className="text-xs text-blue-700">
                      A taxa atual ({metricas.conversaoAtual}%) está abaixo da meta ({taxaConversao}%). 
                      Revise o processo de qualificação e follow-up dos leads.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metricas.leadsFaltantes > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">
                      Intensificar Prospecção
                    </p>
                    <p className="text-xs text-orange-700">
                      Cadastre {metricas.leadsFaltantes} leads adicionais para atingir a meta mensal.
                      Considere campanhas de marketing ou prospecção ativa.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Acompanhamento Regular
                  </p>
                  <p className="text-xs text-green-700">
                    Mantenha o follow-up consistente com os {dadosLeads.leadsEmAndamento} leads 
                    ativos para maximizar as conversões.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Oportunidade no Pipeline
                  </p>
                  <p className="text-xs text-purple-700">
                    R$ {dadosLeads.valorPipeline.toLocaleString('pt-BR')} em oportunidades ativas. 
                    Foque nos leads de maior valor para maximizar o resultado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
