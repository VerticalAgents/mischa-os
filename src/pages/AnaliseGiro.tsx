
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  DollarSign,
  Zap,
  Settings,
  FileText,
  Lightbulb,
  Activity
} from "lucide-react";
import { useState } from "react";

interface PainelSugestao {
  id: string;
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  categoria: 'visao-geral' | 'desempenho' | 'comparativo' | 'preditivo' | 'otimizacao' | 'operacional';
  prioridade: 'alta' | 'media' | 'baixa';
  complexidade: 'simples' | 'medio' | 'complexo';
  beneficios: string[];
  metricas: string[];
}

const paineisSugeridos: PainelSugestao[] = [
  {
    id: 'visao-geral-giro',
    titulo: 'Visão Geral do Giro',
    descricao: 'Dashboard principal com indicadores consolidados de giro de todos os clientes, metas e performance geral.',
    icon: <BarChart3 className="h-5 w-5" />,
    categoria: 'visao-geral',
    prioridade: 'alta',
    complexidade: 'simples',
    beneficios: ['Visão consolidada', 'Identificação rápida de problemas', 'Monitoramento em tempo real'],
    metricas: ['Giro médio geral', 'Taxa de atingimento de metas', 'Clientes acima/abaixo da meta']
  },
  {
    id: 'ranking-clientes',
    titulo: 'Ranking de Clientes por Giro',
    descricao: 'Classificação dos clientes por performance de giro, com análise de top performers e clientes que precisam de atenção.',
    icon: <Users className="h-5 w-5" />,
    categoria: 'desempenho',
    prioridade: 'alta',
    complexidade: 'simples',
    beneficios: ['Identificação de melhores clientes', 'Foco em clientes problemáticos', 'Benchmarking interno'],
    metricas: ['Giro semanal por cliente', 'Variação vs meta', 'Consistência do giro']
  },
  {
    id: 'analise-tendencias',
    titulo: 'Análise de Tendências Temporais',
    descricao: 'Gráficos temporais mostrando evolução do giro ao longo do tempo, sazonalidade e padrões.',
    icon: <LineChart className="h-5 w-5" />,
    categoria: 'desempenho',
    prioridade: 'alta',
    complexidade: 'medio',
    beneficios: ['Identificação de sazonalidade', 'Previsão de tendências', 'Planejamento estratégico'],
    metricas: ['Evolução semanal/mensal', 'Padrões sazonais', 'Taxa de crescimento']
  },
  {
    id: 'mapa-calor-giro',
    titulo: 'Mapa de Calor por Região',
    descricao: 'Visualização geográfica do giro por região/rota de entrega, identificando áreas de alta e baixa performance.',
    icon: <MapPin className="h-5 w-5" />,
    categoria: 'comparativo',
    prioridade: 'media',
    complexidade: 'complexo',
    beneficios: ['Análise geográfica', 'Otimização de rotas', 'Identificação de oportunidades regionais'],
    metricas: ['Giro por região', 'Densidade de clientes', 'Performance por rota']
  },
  {
    id: 'analise-categoria-produto',
    titulo: 'Giro por Categoria de Produto',
    descricao: 'Análise do giro segmentado por categoria de produto, identificando quais categorias têm melhor performance.',
    icon: <PieChart className="h-5 w-5" />,
    categoria: 'comparativo',
    prioridade: 'alta',
    complexidade: 'medio',
    beneficios: ['Otimização de mix de produtos', 'Foco em categorias rentáveis', 'Estratégia de produto'],
    metricas: ['Giro por categoria', 'Faturamento por categoria', 'Margem por categoria']
  },
  {
    id: 'alertas-giro',
    titulo: 'Sistema de Alertas Inteligentes',
    descricao: 'Alertas automáticos para clientes com giro baixo, metas não atingidas ou comportamentos anômalos.',
    icon: <AlertTriangle className="h-5 w-5" />,
    categoria: 'operacional',
    prioridade: 'alta',
    complexidade: 'medio',
    beneficios: ['Ação proativa', 'Redução de perdas', 'Automação de monitoramento'],
    metricas: ['Alertas por gravidade', 'Tempo de resposta', 'Taxa de resolução']
  },
  {
    id: 'predicao-giro',
    titulo: 'Predição de Giro com IA',
    descricao: 'Modelo preditivo que antecipa o giro futuro baseado em histórico, sazonalidade e fatores externos.',
    icon: <Zap className="h-5 w-5" />,
    categoria: 'preditivo',
    prioridade: 'media',
    complexidade: 'complexo',
    beneficios: ['Planejamento avançado', 'Antecipação de problemas', 'Otimização de recursos'],
    metricas: ['Previsão de giro', 'Precisão do modelo', 'Intervalos de confiança']
  },
  {
    id: 'otimizacao-periodicidade',
    titulo: 'Otimização de Periodicidade',
    descricao: 'Análise e sugestões para ajustar periodicidade de entrega baseado no histórico real de consumo.',
    icon: <Clock className="h-5 w-5" />,
    categoria: 'otimizacao',
    prioridade: 'alta',
    complexidade: 'medio',
    beneficios: ['Melhoria da eficiência', 'Redução de custos', 'Satisfação do cliente'],
    metricas: ['Periodicidade otimizada', 'Economia potencial', 'Impacto na satisfação']
  },
  {
    id: 'analise-concorrencia',
    titulo: 'Análise Competitiva de Giro',
    descricao: 'Comparação do giro com benchmarks do setor e análise da posição competitiva.',
    icon: <Target className="h-5 w-5" />,
    categoria: 'comparativo',
    prioridade: 'media',
    complexidade: 'complexo',
    beneficios: ['Posicionamento competitivo', 'Identificação de oportunidades', 'Benchmarking externo'],
    metricas: ['Giro vs benchmark', 'Posição no mercado', 'Gap de performance']
  },
  {
    id: 'simulador-cenarios',
    titulo: 'Simulador de Cenários',
    descricao: 'Ferramenta para simular diferentes cenários de giro e seu impacto no faturamento e custos.',
    icon: <Settings className="h-5 w-5" />,
    categoria: 'preditivo',
    prioridade: 'media',
    complexidade: 'complexo',
    beneficios: ['Planejamento estratégico', 'Análise de impacto', 'Tomada de decisão'],
    metricas: ['Cenários simulados', 'Impacto no faturamento', 'Viabilidade econômica']
  },
  {
    id: 'analise-lucratividade',
    titulo: 'Análise de Lucratividade por Giro',
    descricao: 'Correlação entre giro e lucratividade, identificando clientes mais rentáveis por unidade de giro.',
    icon: <DollarSign className="h-5 w-5" />,
    categoria: 'desempenho',
    prioridade: 'alta',
    complexidade: 'medio',
    beneficios: ['Otimização de rentabilidade', 'Foco em clientes lucrativos', 'Estratégia de preços'],
    metricas: ['Lucro por unidade de giro', 'ROI por cliente', 'Margem por giro']
  },
  {
    id: 'calendario-giro',
    titulo: 'Calendário de Giro',
    descricao: 'Visualização em calendário dos picos e vales de giro, ajudando no planejamento operacional.',
    icon: <Calendar className="h-5 w-5" />,
    categoria: 'operacional',
    prioridade: 'media',
    complexidade: 'simples',
    beneficios: ['Planejamento operacional', 'Gestão de capacidade', 'Antecipação de demanda'],
    metricas: ['Picos de giro', 'Capacidade necessária', 'Distribuição temporal']
  },
  {
    id: 'health-score-giro',
    titulo: 'Health Score do Giro',
    descricao: 'Indicador consolidado de saúde do giro por cliente, combinando múltiplas métricas em um score único.',
    icon: <Activity className="h-5 w-5" />,
    categoria: 'visao-geral',
    prioridade: 'alta',
    complexidade: 'medio',
    beneficios: ['Avaliação holística', 'Priorização de ações', 'Monitoramento simplificado'],
    metricas: ['Score de saúde', 'Fatores de risco', 'Recomendações de ação']
  },
  {
    id: 'relatorio-executivo',
    titulo: 'Relatório Executivo de Giro',
    descricao: 'Relatório automatizado com insights principais, KPIs e recomendações para gestão estratégica.',
    icon: <FileText className="h-5 w-5" />,
    categoria: 'visao-geral',
    prioridade: 'media',
    complexidade: 'medio',
    beneficios: ['Comunicação executiva', 'Insights automáticos', 'Tomada de decisão'],
    metricas: ['KPIs principais', 'Insights gerados', 'Recomendações estratégicas']
  },
  {
    id: 'insights-automaticos',
    titulo: 'Insights Automáticos com IA',
    descricao: 'Sistema que identifica automaticamente padrões, anomalias e oportunidades nos dados de giro.',
    icon: <Lightbulb className="h-5 w-5" />,
    categoria: 'preditivo',
    prioridade: 'media',
    complexidade: 'complexo',
    beneficios: ['Descoberta automática', 'Insights não óbvios', 'Inteligência aumentada'],
    metricas: ['Insights descobertos', 'Precisão das análises', 'Valor dos insights']
  }
];

const categoriaLabels = {
  'visao-geral': 'Visão Geral',
  'desempenho': 'Desempenho',
  'comparativo': 'Comparativo',
  'preditivo': 'Preditivo',
  'otimizacao': 'Otimização',
  'operacional': 'Operacional'
};

const prioridadeColors = {
  'alta': 'bg-red-100 text-red-800',
  'media': 'bg-yellow-100 text-yellow-800',
  'baixa': 'bg-green-100 text-green-800'
};

const complexidadeColors = {
  'simples': 'bg-green-100 text-green-800',
  'medio': 'bg-yellow-100 text-yellow-800',
  'complexo': 'bg-red-100 text-red-800'
};

export default function AnaliseGiro() {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');

  const paineisFiltrados = paineisSugeridos.filter(painel => {
    const categoriaMatch = filtroCategoria === 'todas' || painel.categoria === filtroCategoria;
    const prioridadeMatch = filtroPrioridade === 'todas' || painel.prioridade === filtroPrioridade;
    return categoriaMatch && prioridadeMatch;
  });

  const categorias = Object.keys(categoriaLabels);
  const paineisPorCategoria = categorias.reduce((acc, categoria) => {
    acc[categoria] = paineisFiltrados.filter(p => p.categoria === categoria);
    return acc;
  }, {} as Record<string, PainelSugestao[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Giro</h1>
          <p className="text-gray-600 mt-2">
            Painéis estratégicos para análise e otimização do giro de clientes
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Categoria:</label>
            <select 
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="todas">Todas</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoriaLabels[categoria as keyof typeof categoriaLabels]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Prioridade:</label>
            <select 
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="todas">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Total: {paineisFiltrados.length} painéis</span>
          </div>
        </div>
      </div>

      {/* Painéis por Categoria */}
      {categorias.map(categoria => {
        const paineis = paineisPorCategoria[categoria];
        if (paineis.length === 0) return null;

        return (
          <div key={categoria} className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {categoriaLabels[categoria as keyof typeof categoriaLabels]}
              </h2>
              <Badge variant="outline">{paineis.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paineis.map(painel => (
                <Card key={painel.id} className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {painel.icon}
                        <CardTitle className="text-lg">{painel.titulo}</CardTitle>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={`text-xs ${prioridadeColors[painel.prioridade]}`}>
                          {painel.prioridade}
                        </Badge>
                        <Badge className={`text-xs ${complexidadeColors[painel.complexidade]}`}>
                          {painel.complexidade}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {painel.descricao}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Benefícios:</h4>
                      <ul className="text-xs space-y-1">
                        {painel.beneficios.map((beneficio, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Métricas principais:</h4>
                      <div className="flex flex-wrap gap-1">
                        {painel.metricas.map((metrica, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {metrica}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        disabled
                      >
                        Aguardando Seleção
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {paineisFiltrados.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum painel encontrado com os filtros selecionados.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
