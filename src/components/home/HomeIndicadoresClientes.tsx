import { useMemo, useState } from 'react';
import { Users, TrendingUp, Activity } from 'lucide-react';
import { useGiroMedioPorPDV } from '@/hooks/useGiroMedioPorPDV';
import { useNavigate } from 'react-router-dom';
import IndicadorCardComTooltip from '@/components/common/IndicadorCardComTooltip';
import IndicadorCardComTendencia from '@/components/common/IndicadorCardComTendencia';
import DetalheIndicador, { type ConteudoDetalhe } from '@/components/mobile/DetalheIndicador';
import { useEhCelular } from '@/hooks/useEhCelular';
import { GIRO_TOOLTIPS } from '@/data/indicadoresTooltips';

/** "2026-W34" → "Semana 34 / 2026". Número de semana ISO não se lê sozinho. */
const rotuloSemana = (chave: string) => {
  const [ano, semana] = chave.split('-W');
  return `Semana ${semana} de ${ano}`;
};

export default function HomeIndicadoresClientes() {
  const navigate = useNavigate();
  const ehCelular = useEhCelular();
  const [detalhe, setDetalhe] = useState<ConteudoDetalhe | null>(null);

  const {
    totalPDVs,
    pdvsDiretos,
    pdvsViaDistribuidores,
    giro4Semanas,
    giroMedio4Semanas,
    variacaoGiroTotal,
    variacaoGiroMedio,
    isLoading: giroLoading,
    giroPorSemana,
    giroPorPDV,
    pdvsDiretosLista,
    distribuidoresLista
  } = useGiroMedioPorPDV();

  // Construir subtítulo dinâmico
  const pdvSubtitle = pdvsViaDistribuidores > 0
    ? `${pdvsDiretos} diretos + ${pdvsViaDistribuidores} via distribuidores`
    : `${pdvsDiretos} diretos`;

  /**
   * O detalhe de cada card. Sai das listas que o próprio hook já calculou a
   * partir das entregas buscadas para os números — abrir não custa consulta.
   */
  const detalhes = useMemo<Record<string, ConteudoDetalhe>>(() => ({
    pdvs: {
      titulo: 'Total de PDVs',
      resumo: pdvSubtitle,
      linhas: [
        ...distribuidoresLista.map(d => ({
          id: `dist-${d.id}`,
          titulo: d.nome,
          subtitulo: 'Distribuidor',
          valor: `${d.expositores} expositores`
        })),
        ...pdvsDiretosLista.map(c => ({ id: c.id, titulo: c.nome, subtitulo: 'PDV direto' }))
      ],
      vazio: 'Nenhum PDV ativo.',
      acao: { rotulo: 'Ver clientes', aoClicar: () => navigate('/clientes') }
    },
    giroTotal: {
      titulo: 'Giro semanal total',
      resumo: `Média de ${giro4Semanas.toLocaleString()} nas últimas 4 semanas · aqui, semana a semana`,
      linhas: giroPorSemana.map(s => ({
        id: s.semana,
        titulo: rotuloSemana(s.semana),
        valor: `${s.quantidade.toLocaleString()} un`
      })),
      vazio: 'Sem entregas registradas nas últimas 12 semanas.',
      acao: { rotulo: 'Ver insights de PDV', aoClicar: () => navigate('/insights-pdv') }
    },
    giroMedio: {
      titulo: 'Giro médio por PDV',
      resumo: `Média de ${giroMedio4Semanas.toLocaleString()} por PDV · aqui, cada PDV por semana`,
      linhas: giroPorPDV.map(p => ({
        id: p.id,
        titulo: p.nome,
        subtitulo: `${p.total.toLocaleString()} un em 12 semanas`,
        valor: `${p.media.toLocaleString()}/sem`
      })),
      vazio: 'Sem entregas registradas nas últimas 12 semanas.',
      acao: { rotulo: 'Ver insights de PDV', aoClicar: () => navigate('/insights-pdv') }
    }
  }), [
    pdvSubtitle, distribuidoresLista, pdvsDiretosLista, giro4Semanas, giroPorSemana,
    giroMedio4Semanas, giroPorPDV, navigate
  ]);

  /** No celular a folha chega antes da tela cheia; no computador, vai direto. */
  const aoTocar = (chave: keyof typeof detalhes, rota: string) => () =>
    ehCelular ? setDetalhe(detalhes[chave]) : navigate(rota);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <IndicadorCardComTooltip
          title="Total de PDVs"
          value={totalPDVs}
          subtitle={pdvSubtitle}
          icon={Users}
          isLoading={giroLoading}
          tooltip={GIRO_TOOLTIPS.clientesAtivos}
          onClick={aoTocar('pdvs', '/clientes')}
        />

        <IndicadorCardComTendencia
          title="Giro Semanal Total"
          value={giro4Semanas.toLocaleString()}
          subtitle="Média das últimas 4 semanas"
          icon={TrendingUp}
          isLoading={giroLoading}
          tooltip={GIRO_TOOLTIPS.giroSemanalTotal}
          onClick={aoTocar('giroTotal', '/insights-pdv')}
          variacao={variacaoGiroTotal}
          variacaoLabel="vs histórico"
        />

        <IndicadorCardComTendencia
          title="Giro Médio por PDV"
          value={giroMedio4Semanas.toLocaleString()}
          subtitle="Média das últimas 4 semanas"
          icon={Activity}
          isLoading={giroLoading}
          tooltip={GIRO_TOOLTIPS.giroMedioPorPDV}
          onClick={aoTocar('giroMedio', '/insights-pdv')}
          variacao={variacaoGiroMedio}
          variacaoLabel="vs histórico"
        />
      </div>

      <DetalheIndicador conteudo={detalhe} aoFechar={() => setDetalhe(null)} />
    </>
  );
}
