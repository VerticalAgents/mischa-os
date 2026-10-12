import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Check, DownloadCloud, Eye, EyeOff, ListPlus, Loader2 } from 'lucide-react';
import { useSupabaseHistoricoProducao } from '@/hooks/useSupabaseHistoricoProducao';
import { useConfirmacaoProducao } from '@/hooks/useConfirmacaoProducao';
import { HistoricoProducaoModal } from './HistoricoProducaoModal';
import { LancarDiaDialog } from './LancarDiaDialog';
import { PuxarUnnoEstoqueDialog } from './PuxarUnnoEstoqueDialog';
import { DiaProducaoCard, type DiaProducao } from './DiaProducaoCard';
import ProducoesAtrasadasCard from './ProducoesAtrasadasCard';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { dataLocal } from '@/utils/periodoProducao';

export default function HistoricoProducao() {
  const { historico, loading, adicionarRegistro, editarRegistro, removerRegistro, carregarHistorico } = useSupabaseHistoricoProducao();
  const { confirmarLote, loading: confirmando } = useConfirmacaoProducao();
  const [modalAberto, setModalAberto] = useState(false);
  const [lancarDiaAberto, setLancarDiaAberto] = useState(false);
  const [puxarAberto, setPuxarAberto] = useState(false);
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
      // dataLocal e nao new Date(): a data vem sem hora, e new Date() a le em UTC,
      // o que no Brasil cai no dia anterior.
      dataProducao: dataLocal(registro.data_producao)
    });
    setModalAberto(true);
  };

  const handleSalvarRegistro = async (dados: any) => {
    const registro = {
      data_producao: format(dados.dataProducao, 'yyyy-MM-dd'),
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

  const handleConfirmarLote = async (ids: string[]) => {
    const resultado = await confirmarLote(ids);
    if (resultado.ok) await carregarHistorico();
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

  // Separar dias por semana
  const agora = new Date();
  const inicioSemanaAtual = startOfWeek(agora, { weekStartsOn: 1 }); // Segunda-feira
  const fimSemanaAtual = endOfWeek(agora, { weekStartsOn: 1 }); // Domingo

  const naSemanaAtual = (dia: DiaProducao) =>
    isWithinInterval(new Date(dia.data + 'T12:00:00'), { start: inicioSemanaAtual, end: fimSemanaAtual });

  const diasSemanaAtual = diasProducao.filter(naSemanaAtual);
  const diasSemanasPassadas = diasProducao.filter(dia => !naSemanaAtual(dia));

  // Producao agendada para um dia que ainda nao chegou nao se confirma em lote:
  // confirmar da entrada no estoque, e ela ainda nao foi feita.
  const hojeIso = format(agora, 'yyyy-MM-dd');
  const idsPendentes = historico
    .filter(r => (r.status || 'Registrado') === 'Registrado' && r.data_producao <= hojeIso)
    .map(r => r.id);

  const renderDia = (dia: DiaProducao, destaque: boolean) => (
    <DiaProducaoCard
      key={dia.data}
      dia={dia}
      destaque={destaque}
      futuro={dia.data > hojeIso}
      aberto={diasExpandidos.has(dia.data)}
      onAlternar={() => toggleDiaExpandido(dia.data)}
      confirmando={confirmando}
      onConfirmarDia={handleConfirmarLote}
      onEditar={handleEditarRegistro}
      onRemover={handleRemoverRegistro}
      onMudou={carregarHistorico}
    />
  );

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
      <ProducoesAtrasadasCard onChange={carregarHistorico} />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registros de Produção
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {idsPendentes.length > 0 && (
              <Button
                variant="outline"
                onClick={() => handleConfirmarLote(idsPendentes)}
                disabled={confirmando}
                className="flex items-center gap-2 border-green-500/50 text-green-700 hover:bg-green-500/10 hover:text-green-800"
              >
                {confirmando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirmar todos os pendentes ({idsPendentes.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => setPuxarAberto(true)} className="flex items-center gap-2">
              <DownloadCloud className="h-4 w-4" />
              Puxar do unno-estoque
            </Button>
            <Button variant="outline" onClick={handleNovoRegistro} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Um produto só
            </Button>
            <Button onClick={() => setLancarDiaAberto(true)} className="flex items-center gap-2">
              <ListPlus className="h-4 w-4" />
              Lançar o dia
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {diasProducao.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
              <p>Comece lançando a produção de um dia.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {diasSemanaAtual.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-primary">Semana Atual</h2>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {diasSemanaAtual.length} {diasSemanaAtual.length === 1 ? 'dia' : 'dias'}
                    </Badge>
                  </div>
                  <div className="space-y-4">{diasSemanaAtual.map(dia => renderDia(dia, true))}</div>
                </div>
              )}

              {diasSemanasPassadas.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-t border-muted">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <h2 className="text-lg font-medium text-muted-foreground">Semanas Anteriores</h2>
                      <Badge variant="secondary">
                        {diasSemanasPassadas.length} {diasSemanasPassadas.length === 1 ? 'dia' : 'dias'}
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
                      {diasSemanasPassadas.map(dia => renderDia(dia, false))}
                    </div>
                  )}
                </div>
              )}
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

      <LancarDiaDialog
        isOpen={lancarDiaAberto}
        onClose={() => setLancarDiaAberto(false)}
        onGravado={carregarHistorico}
        historico={historico}
      />

      <PuxarUnnoEstoqueDialog
        isOpen={puxarAberto}
        onClose={() => setPuxarAberto(false)}
        onGravado={carregarHistorico}
        historico={historico}
      />
    </div>
  );
}
