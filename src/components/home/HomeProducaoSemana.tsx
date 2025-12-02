import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Factory, Calendar, CheckCircle, Clock } from 'lucide-react';
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

    // Agrupar por dia - normalizar chave para lowercase sem ponto
    const porDia: Record<string, { formas: number; unidades: number; registros: number }> = {};
    
    registrosSemana.forEach(r => {
      const dia = format(parseISO(r.data_producao), 'EEE', { locale: ptBR })
        .toLowerCase()
        .replace('.', '');
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

    // Calcular totais separados por status
    const registrosConfirmados = registrosSemana.filter(r => r.status === 'Confirmado');
    const registrosPendentes = registrosSemana.filter(r => r.status !== 'Confirmado');

    const confirmados = {
      count: registrosConfirmados.length,
      formas: registrosConfirmados.reduce((acc, r) => acc + (r.formas_producidas || 0), 0),
      unidades: registrosConfirmados.reduce((acc, r) => acc + (r.unidades_calculadas || 0), 0)
    };

    const pendentes = {
      count: registrosPendentes.length,
      formas: registrosPendentes.reduce((acc, r) => acc + (r.formas_producidas || 0), 0),
      unidades: registrosPendentes.reduce((acc, r) => acc + (r.unidades_calculadas || 0), 0)
    };

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
            <TooltipProvider delayDuration={100}>
              <div className="flex gap-1">
                {diasOrdenados.map(dia => {
                  const dados = dadosSemana.porDia[dia];
                  const temDados = dados && dados.formas > 0;
                  return (
                    <Tooltip key={dia}>
                      <TooltipTrigger asChild>
                        <div className="flex-1 text-center cursor-default">
                          <div 
                            className={`h-2 rounded-full mb-1 transition-all ${
                              temDados ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                          <span className={`text-[10px] uppercase ${
                            temDados ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}>
                            {dia}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {temDados ? (
                          <div className="space-y-1">
                            <p className="font-medium capitalize">{dia}</p>
                            <p>{dados.formas} formas</p>
                            <p>{dados.unidades} unidades</p>
                            <p className="text-muted-foreground">{dados.registros} registro{dados.registros > 1 ? 's' : ''}</p>
                          </div>
                        ) : (
                          <p>Sem produção</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {/* Status Detalhado */}
            <div className="space-y-2 pt-2 border-t">
              {/* Confirmados */}
              {dadosSemana.confirmados.count > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-700 dark:text-green-500 font-medium">Confirmado</span>
                  </div>
                  <span className="text-muted-foreground">
                    {dadosSemana.confirmados.formas} formas · {dadosSemana.confirmados.unidades} un
                  </span>
                </div>
              )}
              
              {/* Pendentes */}
              {dadosSemana.pendentes.count > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-500 font-medium">Pendente</span>
                  </div>
                  <span className="text-muted-foreground">
                    {dadosSemana.pendentes.formas} formas · {dadosSemana.pendentes.unidades} un
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
