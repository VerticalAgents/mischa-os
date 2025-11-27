import { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, CheckCircle2, MessageCircle, Clock, Trophy, 
  TrendingUp, ArrowRight 
} from 'lucide-react';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useNavigate } from 'react-router-dom';

const LoadingState = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 flex-1" />
        ))}
      </div>
    </CardContent>
  </Card>
);

interface MetricaCard {
  label: string;
  valor: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function HomeFunilLeadsResumo() {
  const navigate = useNavigate();
  const { leads, loading, carregarLeads } = useSupabaseLeads();

  useEffect(() => {
    if (leads.length === 0 && !loading) {
      carregarLeads();
    }
  }, [leads.length, loading, carregarLeads]);

  const metricas = useMemo((): MetricaCard[] => {
    const paraVisitar = leads.filter(l => l.status === 'cadastrado').length;
    const visitados = leads.filter(l => l.status !== 'cadastrado').length;
    
    const pendenciasAcao = leads.filter(l => 
      l.status === 'followup_wpp_pendente' ||
      l.status === 'followup_presencial_pendente'
    ).length;
    
    const emNegociacao = leads.filter(l => 
      l.status === 'followup_wpp_tentativa' ||
      l.status === 'followup_wpp_negociacao' ||
      l.status === 'followup_presencial_tentativa' ||
      l.status === 'followup_presencial_negociacao'
    ).length;
    
    const totalEfetivados = leads.filter(l => 
      l.status === 'efetivado_imediato' ||
      l.status === 'efetivado_wpp' ||
      l.status === 'efetivado_presencial'
    ).length;
    
    const taxaConversao = visitados > 0 
      ? Math.round((totalEfetivados / visitados) * 100)
      : 0;

    return [
      {
        label: 'Para Visitar',
        valor: paraVisitar,
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30'
      },
      {
        label: 'Pendências',
        valor: pendenciasAcao,
        icon: MessageCircle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30'
      },
      {
        label: 'Negociação',
        valor: emNegociacao,
        icon: Clock,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30'
      },
      {
        label: 'Vendas',
        valor: totalEfetivados,
        icon: Trophy,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/30'
      },
      {
        label: 'Conversão',
        valor: taxaConversao,
        icon: TrendingUp,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30'
      }
    ];
  }, [leads]);

  if (loading) return <LoadingState />;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() => navigate('/gestao-comercial?tab=funil-leads')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Funil de Leads</CardTitle>
          <Badge variant="outline" className="text-xs">
            {leads.length} leads
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum lead cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Cards horizontais */}
            <div className="grid grid-cols-5 gap-2">
              {metricas.map((metrica, index) => (
                <div 
                  key={index}
                  className={`${metrica.bgColor} rounded-lg p-2 text-center`}
                >
                  <metrica.icon className={`h-4 w-4 mx-auto mb-1 ${metrica.color}`} />
                  <div className={`text-lg font-bold ${metrica.color}`}>
                    {metrica.label === 'Conversão' ? `${metrica.valor}%` : metrica.valor}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {metrica.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Ver mais */}
            <div className="flex items-center justify-center text-xs text-primary pt-2 border-t">
              <span>Ver funil completo</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
