import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, ChevronDown, ChevronRight, Edit, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ConfirmacaoProducaoButton } from './ConfirmacaoProducaoButton';
import { cn } from '@/lib/utils';

export interface DiaProducao {
  data: string;
  dataFormatada: string;
  registros: any[];
  totalFormas: number;
  totalUnidades: number;
}

interface DiaProducaoCardProps {
  dia: DiaProducao;
  // Semana atual aparece em destaque; as anteriores, mais apagadas.
  destaque: boolean;
  // Dia que ainda nao chegou: nao oferece "Confirmar o dia".
  futuro: boolean;
  aberto: boolean;
  onAlternar: () => void;
  confirmando: boolean;
  onConfirmarDia: (ids: string[]) => void;
  onEditar: (registro: any) => void;
  onRemover: (id: string) => void;
  onMudou: () => void;
}

const statusBadge = (status?: string) => {
  switch (status) {
    case 'Confirmado':
      return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>;
    case 'Registrado':
      return <Badge variant="outline" className="border-blue-500 text-blue-700">Registrado</Badge>;
    default:
      return <Badge variant="secondary">Indefinido</Badge>;
  }
};

export function DiaProducaoCard({
  dia,
  destaque,
  futuro,
  aberto,
  onAlternar,
  confirmando,
  onConfirmarDia,
  onEditar,
  onRemover,
  onMudou,
}: DiaProducaoCardProps) {
  const pendentes = dia.registros.filter(r => (r.status || 'Registrado') === 'Registrado');
  const tom = destaque ? 'text-primary' : 'text-muted-foreground';

  return (
    <Card className={cn('border-l-4', destaque ? 'border-l-primary shadow-sm' : 'border-l-muted')}>
      <Collapsible open={aberto} onOpenChange={onAlternar}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div>
                  <h3
                    className={cn(
                      'capitalize',
                      destaque ? 'text-lg font-semibold' : 'text-base font-medium text-muted-foreground'
                    )}
                  >
                    {dia.dataFormatada}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dia.registros.length} registro(s) de produção
                    {pendentes.length > 0 && ` · ${pendentes.length} pendente(s)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                {pendentes.length > 0 && !futuro && (
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    disabled={confirmando}
                    // O cabecalho inteiro abre e fecha o dia; o clique no botao nao pode vazar.
                    onClick={e => {
                      e.stopPropagation();
                      onConfirmarDia(pendentes.map(r => r.id));
                    }}
                  >
                    {confirmando ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    Confirmar o dia
                  </Button>
                )}
                <div className="text-center">
                  <div className={cn('font-semibold tabular-nums', tom)}>{dia.totalFormas}</div>
                  <div className="text-muted-foreground">Formas</div>
                </div>
                <div className="text-center">
                  <div className={cn('font-semibold tabular-nums', tom)}>
                    {dia.totalUnidades.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-muted-foreground">Unidades</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Formas</TableHead>
                  <TableHead>Rendimento Usado</TableHead>
                  <TableHead>Unidades Previstas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dia.registros.map(registro => (
                  <TableRow key={registro.id}>
                    <TableCell className="font-medium">{registro.produto_nome}</TableCell>
                    <TableCell>{registro.formas_producidas}</TableCell>
                    <TableCell>
                      {registro.rendimento_usado ? `${registro.rendimento_usado}/forma` : '—'}
                    </TableCell>
                    <TableCell>{registro.unidades_previstas || registro.unidades_calculadas}</TableCell>
                    <TableCell>
                      {statusBadge(registro.status)}
                      {registro.confirmado_em && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(registro.confirmado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ConfirmacaoProducaoButton
                          registroId={registro.id}
                          status={registro.status || 'Registrado'}
                          onConfirmado={onMudou}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditar(registro)}
                          disabled={registro.status === 'Confirmado'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRemover(registro.id)}
                          disabled={registro.status === 'Confirmado'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
