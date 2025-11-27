import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Factory, Calendar } from 'lucide-react';
import { useSupabaseHistoricoProducao } from '@/hooks/useSupabaseHistoricoProducao';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, format, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LoadingState = memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[150px] w-full" />
    </CardContent>
  </Card>
));

LoadingState.displayName = 'LoadingState';

export default function HomeProducaoSemana() {
  const navigate = useNavigate();
  const { historico, loading } = useSupabaseHistoricoProducao();

  const dadosSemana = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

    // Filtrar registros desta semana
    const registrosSemana = historico.filter(r => {
      const dataProducao = parseISO(r.data_producao);
      return isWithinInterval(dataProducao, { start: inicioSemana, end: fimSemana });
    });

    // Agrupar por dia
    const porDia: Record<string, { formas: number; unidades: number; registros: number }> = {};
    
    registrosSemana.forEach(r => {
      const dia = format(parseISO(r.data_producao), 'EEE', { locale: ptBR });
      if (!porDia[dia]) {
        porDia[dia] = { formas: 0, unidades: 0, registros: 0 };
      }
      porDia[dia].formas += r.formas_producidas || 0;
      porDia[dia].unidades += r.unidades_calculadas || 0;
      porDia[dia].registros += 1;
    });

    const totalFormas = registrosSemana.reduce((acc, r) => acc + (r.formas_producidas || 0), 0);
    const totalUnidades = registrosSemana.reduce((acc, r) => acc + (r.unidades_calculadas || 0), 0);
    const totalRegistros = registrosSemana.length;
    const confirmados = registrosSemana.filter(r => r.status === 'Confirmado').length;
    const pendentes = registrosSemana.filter(r => r.status !== 'Confirmado').length;

    return {
      porDia,
      totalFormas,
      totalUnidades,
      totalRegistros,
      confirmados,
      pendentes,
      periodo: `${format(inicioSemana, 'dd/MM')} - ${format(fimSemana, 'dd/MM')}`
    };
  }, [historico]);

  const diasOrdenados = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

  if (loading) return <LoadingState />;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() => navigate('/pcp?tab=historico')}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Produção da Semana
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {dadosSemana.periodo}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {dadosSemana.totalRegistros === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Factory className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum registro esta semana</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{dadosSemana.totalFormas}</div>
                <div className="text-xs text-muted-foreground">Formas</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-lg font-bold">{dadosSemana.totalUnidades}</div>
                <div className="text-xs text-muted-foreground">Unidades</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-lg font-bold">{dadosSemana.totalRegistros}</div>
                <div className="text-xs text-muted-foreground">Registros</div>
              </div>
            </div>

            {/* Barra por dia */}
            <div className="flex gap-1">
              {diasOrdenados.map(dia => {
                const dados = dadosSemana.porDia[dia];
                const temDados = dados && dados.formas > 0;
                return (
                  <div 
                    key={dia} 
                    className="flex-1 text-center"
                  >
                    <div 
                      className={`h-2 rounded-full mb-1 ${
                        temDados ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {dia}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status */}
            {dadosSemana.pendentes > 0 && (
              <div className="flex items-center justify-between text-xs pt-2 border-t">
                <span className="text-muted-foreground">
                  {dadosSemana.confirmados} confirmados
                </span>
                <Badge variant="secondary" className="text-xs">
                  {dadosSemana.pendentes} pendentes
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
