import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Calendar, ChevronDown, ChevronRight, Eye, EyeOff, TrendingUp, Package } from 'lucide-react';
import { useSupabaseHistoricoProducao } from '@/hooks/useSupabaseHistoricoProducao';
import { HistoricoProducaoModal } from './HistoricoProducaoModal';
import { ConfirmacaoProducaoButton } from './ConfirmacaoProducaoButton';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DiaProducao {
  data: string;
  dataFormatada: string;
  registros: any[];
  totalFormas: number;
  totalUnidades: number;
}

interface SemanaProducao {
  tipo: 'atual' | 'passada';
  titulo: string;
  dias: DiaProducao[];
}

export default function HistoricoProducao() {
  const { historico, loading, adicionarRegistro, editarRegistro, removerRegistro, carregarHistorico } = useSupabaseHistoricoProducao();
  const [modalAberto, setModalAberto] = useState(false);
  const [registroEditando, setRegistroEditando] = useState<any>(null);
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());
  const [semanasPassadasVisiveis, setSemanasPassadasVisiveis] = useState(false);

  const handleNovoRegistro = () => {
    setRegistroEditando(null);
    setModalAberto(true);
  };

  const handleEditarRegistro = (registro: any) => {
    setRegistroEditando({
      ...registro,
      dataProducao: new Date(registro.data_producao)
    });
    setModalAberto(true);
  };

  const handleSalvarRegistro = async (dados: any) => {
    const registro = {
      data_producao: dados.dataProducao.toISOString().split('T')[0],
      produto_id: dados.produtoId,
      produto_nome: dados.produtoNome,
      formas_producidas: dados.formasProducidas,
      unidades_calculadas: dados.unidadesCalculadas || dados.unidadesPrevistas,
      turno: dados.turno || 'Matutino',
      observacoes: dados.observacoes,
      origem: dados.origem,
      
      rendimento_usado: dados.rendimentoUsado,
      unidades_previstas: dados.unidadesPrevistas,
      status: dados.status
    };

    if (registroEditando) {
      await editarRegistro(registroEditando.id, registro);
    } else {
      await adicionarRegistro(registro);
    }
  };

  const handleRemoverRegistro = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este registro?')) {
      await removerRegistro(id);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Confirmado':
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>;
      case 'Registrado':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Registrado</Badge>;
      default:
        return <Badge variant="secondary">Indefinido</Badge>;
    }
  };

  const toggleDiaExpandido = (data: string) => {
    const novosDiasExpandidos = new Set(diasExpandidos);
    if (novosDiasExpandidos.has(data)) {
      novosDiasExpandidos.delete(data);
    } else {
      novosDiasExpandidos.add(data);
    }
    setDiasExpandidos(novosDiasExpandidos);
  };

  // Agrupar registros por data
  const diasProducao: DiaProducao[] = historico.reduce((acc: DiaProducao[], registro) => {
    const data = registro.data_producao;
    const dataObj = new Date(data + 'T12:00:00');
    const dataFormatada = format(dataObj, "EEEE, dd/MM/yyyy", { locale: ptBR });
    
    let dia = acc.find(d => d.data === data);
    
    if (!dia) {
      dia = {
        data,
        dataFormatada,
        registros: [],
        totalFormas: 0,
        totalUnidades: 0
      };
      acc.push(dia);
    }
    
    dia.registros.push(registro);
    dia.totalFormas += registro.formas_producidas || 0;
    dia.totalUnidades += registro.unidades_previstas || registro.unidades_calculadas || 0;
    
    return acc;
  }, []).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Calcular estatísticas dos últimos 90 dias
  const estatisticas90Dias = useMemo(() => {
    const agora = new Date();
    const inicio90Dias = subDays(agora, 90);
    
    const registrosUltimos90Dias = historico.filter(registro => {
      const dataRegistro = new Date(registro.data_producao + 'T12:00:00');
      return dataRegistro >= inicio90Dias && dataRegistro <= agora;
    });

    const totalFormas = registrosUltimos90Dias.reduce((sum, r) => sum + (r.formas_producidas || 0), 0);
    
    // Agrupar por produto
    const porProduto = registrosUltimos90Dias.reduce((acc, registro) => {
      const nome = registro.produto_nome;
      if (!acc[nome]) {
        acc[nome] = {
          nome,
          formas: 0,
          unidades: 0
        };
      }
      acc[nome].formas += registro.formas_producidas || 0;
      acc[nome].unidades += registro.unidades_previstas || registro.unidades_calculadas || 0;
      return acc;
    }, {} as Record<string, { nome: string; formas: number; unidades: number }>);

    const produtosComPercentual = Object.values(porProduto)
      .map(produto => ({
        ...produto,
        percentual: totalFormas > 0 ? (produto.formas / totalFormas) * 100 : 0
      }))
      .sort((a, b) => b.formas - a.formas);

    return {
      totalFormas,
      produtos: produtosComPercentual
    };
  }, [historico]);

  // Separar dias por semana
  const agora = new Date();
  const inicioSemanaAtual = startOfWeek(agora, { weekStartsOn: 1 }); // Segunda-feira
  const fimSemanaAtual = endOfWeek(agora, { weekStartsOn: 1 }); // Domingo

  const semanasProducao: SemanaProducao[] = [];
  
  // Dias da semana atual
  const diasSemanaAtual = diasProducao.filter(dia => {
    const dataObj = new Date(dia.data + 'T12:00:00');
    return isWithinInterval(dataObj, { start: inicioSemanaAtual, end: fimSemanaAtual });
  });

  if (diasSemanaAtual.length > 0) {
    semanasProducao.push({
      tipo: 'atual',
      titulo: 'Semana Atual',
      dias: diasSemanaAtual
    });
  }

  // Dias de semanas passadas
  const diasSemanasPassadas = diasProducao.filter(dia => {
    const dataObj = new Date(dia.data + 'T12:00:00');
    return !isWithinInterval(dataObj, { start: inicioSemanaAtual, end: fimSemanaAtual });
  });

  if (diasSemanasPassadas.length > 0) {
    semanasProducao.push({
      tipo: 'passada',
      titulo: 'Semanas Anteriores',
      dias: diasSemanasPassadas
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">Carregando histórico...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas dos últimos 90 dias */}
      {estatisticas90Dias.produtos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Total de Formas - Últimos 90 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {estatisticas90Dias.totalFormas}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Formas produzidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Produção por Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estatisticas90Dias.produtos.map((produto) => (
                  <div key={produto.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{produto.nome}</span>
                      <span className="text-muted-foreground">
                        {produto.formas} formas ({produto.percentual.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${produto.percentual}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registros de Produção
            </CardTitle>
          </div>
          <Button onClick={handleNovoRegistro} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Registro
          </Button>
        </CardHeader>

        <CardContent>
          {diasProducao.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
              <p>Comece criando seu primeiro registro de produção.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {semanasProducao.map((semana) => (
                <div key={semana.tipo} className="space-y-4">
                  {semana.tipo === 'atual' ? (
                    // Semana atual - sempre visível
                    <>
                      <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold text-primary">{semana.titulo}</h2>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {semana.dias.length} {semana.dias.length === 1 ? 'dia' : 'dias'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        {semana.dias.map((dia) => (
                          <Card key={dia.data} className="border-l-4 border-l-primary shadow-sm">
                            <Collapsible 
                              open={diasExpandidos.has(dia.data)} 
                              onOpenChange={() => toggleDiaExpandido(dia.data)}
                            >
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {diasExpandidos.has(dia.data) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                      <div>
                                        <h3 className="text-lg font-semibold capitalize">
                                          {dia.dataFormatada}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                          {dia.registros.length} registro(s) de produção
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                      <div className="text-center">
                                        <div className="font-semibold text-primary">{dia.totalFormas}</div>
                                        <div className="text-muted-foreground">Formas</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-semibold text-primary">{dia.totalUnidades}</div>
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
                                      {dia.registros.map((registro) => (
                                        <TableRow key={registro.id}>
                                          <TableCell className="font-medium">
                                            {registro.produto_nome}
                                          </TableCell>
                                          <TableCell>{registro.formas_producidas}</TableCell>
                                          <TableCell>
                                            {registro.rendimento_usado ? `${registro.rendimento_usado}/forma` : '—'}
                                          </TableCell>
                                          <TableCell>
                                            {registro.unidades_previstas || registro.unidades_calculadas}
                                          </TableCell>
                                          <TableCell>
                                            {getStatusBadge(registro.status)}
                                            {registro.confirmado_em && (
                                              <div className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(registro.confirmado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              <ConfirmacaoProducaoButton
                                                registroId={registro.id}
                                                produtoNome={registro.produto_nome}
                                                formasProducidas={registro.formas_producidas}
                                                unidadesPrevistas={registro.unidades_previstas || registro.unidades_calculadas}
                                                status={registro.status || 'Registrado'}
                                                onConfirmado={carregarHistorico}
                                              />
                                              
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditarRegistro(registro)}
                                                disabled={registro.status === 'Confirmado'}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRemoverRegistro(registro.id)}
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
                        ))}
                      </div>
                    </>
                  ) : (
                    // Semanas passadas - ocultas por padrão
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-t border-muted">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <h2 className="text-lg font-medium text-muted-foreground">{semana.titulo}</h2>
                          <Badge variant="secondary">
                            {semana.dias.length} {semana.dias.length === 1 ? 'dia' : 'dias'}
                          </Badge>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSemanasPassadasVisiveis(!semanasPassadasVisiveis)}
                          className="flex items-center gap-2"
                        >
                          {semanasPassadasVisiveis ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Mostrar
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {semanasPassadasVisiveis && (
                        <div className="space-y-4 opacity-75">
                          {semana.dias.map((dia) => (
                            <Card key={dia.data} className="border-l-4 border-l-muted">
                              <Collapsible 
                                open={diasExpandidos.has(dia.data)} 
                                onOpenChange={() => toggleDiaExpandido(dia.data)}
                              >
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {diasExpandidos.has(dia.data) ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                        <div>
                                          <h3 className="text-base font-medium capitalize text-muted-foreground">
                                            {dia.dataFormatada}
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {dia.registros.length} registro(s) de produção
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-6 text-sm">
                                        <div className="text-center">
                                          <div className="font-semibold text-muted-foreground">{dia.totalFormas}</div>
                                          <div className="text-muted-foreground">Formas</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="font-semibold text-muted-foreground">{dia.totalUnidades}</div>
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
                                        {dia.registros.map((registro) => (
                                          <TableRow key={registro.id}>
                                            <TableCell className="font-medium">
                                              {registro.produto_nome}
                                            </TableCell>
                                            <TableCell>{registro.formas_producidas}</TableCell>
                                            <TableCell>
                                              {registro.rendimento_usado ? `${registro.rendimento_usado}/forma` : '—'}
                                            </TableCell>
                                            <TableCell>
                                              {registro.unidades_previstas || registro.unidades_calculadas}
                                            </TableCell>
                                            <TableCell>
                                              {getStatusBadge(registro.status)}
                                              {registro.confirmado_em && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                  {format(new Date(registro.confirmado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex items-center justify-end gap-2">
                                                <ConfirmacaoProducaoButton
                                                  registroId={registro.id}
                                                  produtoNome={registro.produto_nome}
                                                  formasProducidas={registro.formas_producidas}
                                                  unidadesPrevistas={registro.unidades_previstas || registro.unidades_calculadas}
                                                  status={registro.status || 'Registrado'}
                                                  onConfirmado={carregarHistorico}
                                                />
                                                
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleEditarRegistro(registro)}
                                                  disabled={registro.status === 'Confirmado'}
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                                
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleRemoverRegistro(registro.id)}
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
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <HistoricoProducaoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={handleSalvarRegistro}
        registro={registroEditando}
      />
    </div>
  );
}
