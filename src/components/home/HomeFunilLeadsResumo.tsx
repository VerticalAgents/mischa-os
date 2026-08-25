import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, CheckCircle2, MessageCircle, Clock, Trophy, 
  TrendingUp, ArrowRight 
} from 'lucide-react';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS, type LeadStatus } from '@/types/lead';
import DetalheIndicador, { type ConteudoDetalhe } from '@/components/mobile/DetalheIndicador';

const LoadingState = () => (
  <Card className="flex h-full flex-col shadow-tema">
    <CardHeader>
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent className="flex-1">
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
  /** Quais leads estão por trás deste número — é o que a folha lista. */
  filtro: (status: LeadStatus) => boolean;
}

const PENDENTES: LeadStatus[] = ['followup_wpp_pendente', 'followup_presencial_pendente'];
const NEGOCIACAO: LeadStatus[] = [
  'followup_wpp_tentativa',
  'followup_wpp_negociacao',
  'followup_presencial_tentativa',
  'followup_presencial_negociacao'
];
const EFETIVADOS: LeadStatus[] = ['efetivado_imediato', 'efetivado_wpp', 'efetivado_presencial'];

export default function HomeFunilLeadsResumo() {
  const navigate = useNavigate();
  const [detalhe, setDetalhe] = useState<ConteudoDetalhe | null>(null);
  const { leads, loading, carregarLeads } = useSupabaseLeads();

  useEffect(() => {
    if (leads.length === 0 && !loading) {
      carregarLeads();
    }
  }, [leads.length, loading, carregarLeads]);

  const metricas = useMemo((): MetricaCard[] => {
    const paraVisitar = leads.filter(l => l.status === 'cadastrado').length;
    const visitados = leads.filter(l => l.status !== 'cadastrado').length;
    const pendenciasAcao = leads.filter(l => PENDENTES.includes(l.status)).length;
    const emNegociacao = leads.filter(l => NEGOCIACAO.includes(l.status)).length;
    const totalEfetivados = leads.filter(l => EFETIVADOS.includes(l.status)).length;
    
    const taxaConversao = visitados > 0 
      ? Math.round((totalEfetivados / visitados) * 100)
      : 0;

    return [
      {
        label: 'Para Visitar',
        filtro: (s) => s === 'cadastrado',
        valor: paraVisitar,
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30'
      },
      {
        label: 'Pendências',
        filtro: (s) => PENDENTES.includes(s),
        valor: pendenciasAcao,
        icon: MessageCircle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30'
      },
      {
        label: 'Negociação',
        filtro: (s) => NEGOCIACAO.includes(s),
        valor: emNegociacao,
        icon: Clock,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30'
      },
      {
        label: 'Vendas',
        filtro: (s) => EFETIVADOS.includes(s),
        valor: totalEfetivados,
        icon: Trophy,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/30'
      },
      {
        label: 'Conversão',
        filtro: (s) => EFETIVADOS.includes(s),
        valor: taxaConversao,
        icon: TrendingUp,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30'
      }
    ];
  }, [leads]);

  const abrirMetrica = (m: MetricaCard) => {
    const encontrados = leads.filter(l => m.filtro(l.status));
    setDetalhe({
      titulo: m.label === 'Conversão' ? 'Leads convertidos' : `Leads · ${m.label}`,
      resumo:
        m.label === 'Conversão'
          ? `${m.valor}% dos leads visitados viraram venda`
          : `${encontrados.length} de ${leads.length} leads`,
      linhas: encontrados.map(l => ({
        id: l.id,
        titulo: l.nome,
        subtitulo: STATUS_LABELS[l.status] ?? l.status
      })),
      vazio: 'Nenhum lead nesta etapa.',
      acao: {
        rotulo: 'Ver funil completo',
        aoClicar: () => navigate('/gestao-comercial?tab=funil-leads')
      }
    });
  };

  if (loading) return <LoadingState />;

  return (
    <>
    <Card className="flex h-full flex-col shadow-tema cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() =>
        setDetalhe({
          titulo: 'Funil de leads',
          resumo: `${leads.length} leads no funil`,
          linhas: metricas.map((m) => ({
            id: m.label,
            titulo: m.label,
            valor: m.label === 'Conversão' ? `${m.valor}%` : String(m.valor),
          })),
          vazio: 'Nenhum lead cadastrado.',
          acao: {
            rotulo: 'Ver funil completo',
            aoClicar: () => navigate('/gestao-comercial?tab=funil-leads'),
          },
        })
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Funil de Leads</CardTitle>
          <Badge variant="outline" className="text-xs">
            {leads.length} leads
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
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
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation(); // o cartao inteiro leva ao funil; o azulejo, ao detalhe
                    abrirMetrica(metrica);
                  }}
                  className={`${metrica.bgColor} rounded-controle p-2 text-center cursor-pointer transition-transform active:scale-[0.97]`}
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

    <DetalheIndicador conteudo={detalhe} aoFechar={() => setDetalhe(null)} />
    </>
  );
}
