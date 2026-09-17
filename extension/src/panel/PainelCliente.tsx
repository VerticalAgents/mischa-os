/**
 * O painel de um cliente reconhecido.
 *
 * Mostra sempre, no topo, **como** a extensão chegou a esse cliente, com um
 * botão de trocar do lado. Enquanto o reconhecimento depender do nome da
 * conversa, essa linha é a diferença entre uma ferramenta confiável e uma que
 * mostra o dinheiro do cliente errado.
 */
import { useEffect, useState } from 'react';
import {
  carregarCliente,
  carregarAgendamento,
  carregarUltimasEntregas,
  carregarScoreConfirmacao,
  carregarFinanceiro,
  carregarGiro,
  type ClienteDoPainel,
  type AgendamentoDoPainel,
  type EntregaDoPainel,
  type FinanceiroDoPainel,
} from '@ext/lib/queries';
import { EXPLICACAO, type ComoAchou } from '@ext/lib/resolverCliente';
import { ROTULO_CLASSIFICACAO } from '@/utils/scoreFinanceiro';
import type { ConfirmationScore } from '@/types/confirmationScore';

const dia = (iso?: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '—';

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  clienteId: string;
  comoAchou: ComoAchou;
  aoTrocarCliente: () => void;
}

export default function PainelCliente({ clienteId, comoAchou, aoTrocarCliente }: Props) {
  const [cliente, setCliente] = useState<ClienteDoPainel | null>(null);
  const [agendamento, setAgendamento] = useState<AgendamentoDoPainel | null>(null);
  const [entregas, setEntregas] = useState<EntregaDoPainel[]>([]);
  const [confirmacao, setConfirmacao] = useState<ConfirmationScore | null>(null);
  const [giro, setGiro] = useState<{ giro: number; medido: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [financeiro, setFinanceiro] = useState<FinanceiroDoPainel | null>(null);
  const [erroFinanceiro, setErroFinanceiro] = useState<string | null>(null);
  const [buscandoFinanceiro, setBuscandoFinanceiro] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCliente(null);
    setGiro(null);
    setFinanceiro(null);
    setErroFinanceiro(null);
    setErro(null);

    (async () => {
      try {
        const [dados, ag, ent] = await Promise.all([
          carregarCliente(clienteId),
          carregarAgendamento(clienteId),
          carregarUltimasEntregas(clienteId),
        ]);
        if (!vivo) return;

        setCliente(dados);
        setAgendamento(ag);
        setEntregas(ent);
        const [score, giroAtual] = await Promise.all([
          carregarScoreConfirmacao(clienteId, ag, dados.periodicidade_padrao),
          carregarGiro(clienteId, dados.giro_medio_semanal),
        ]);
        if (!vivo) return;

        setConfirmacao(score);
        setGiro(giroAtual);
      } catch (e) {
        if (vivo) setErro(String((e as Error).message || e));
      }
    })();

    return () => {
      vivo = false;
    };
  }, [clienteId]);

  // O financeiro bate no Gestão Click e demora, então só vai quando pedido.
  const buscarFinanceiro = async () => {
    if (!cliente?.gestaoclick_cliente_id) return;
    setBuscandoFinanceiro(true);
    setErroFinanceiro(null);
    try {
      setFinanceiro(await carregarFinanceiro(cliente.gestaoclick_cliente_id));
    } catch (e) {
      setErroFinanceiro(String((e as Error).message || e));
    }
    setBuscandoFinanceiro(false);
  };

  if (erro) return <p className="aviso">Não consegui carregar o cliente: {erro}</p>;
  if (!cliente) return <p className="apagado">Carregando o cliente…</p>;

  const trocas = agendamento?.trocas_pendentes || [];
  const bonificacoes = agendamento?.bonificacoes_pendentes || [];

  return (
    <>
      <div className="identificacao">
        <div>
          <strong>{cliente.nome}</strong>
          <div className="apagado">reconhecido {EXPLICACAO[comoAchou]}</div>
        </div>
        <button className="secundario estreito" onClick={aoTrocarCliente}>
          não é esse
        </button>
      </div>

      <div className="cartao">
        <h2 className="titulo">Próxima reposição</h2>
        {agendamento ? (
          <>
            <div className="linha"><span>Data</span><span>{dia(agendamento.data_proxima_reposicao)}</span></div>
            <div className="linha"><span>Status</span><span>{agendamento.status_agendamento || '—'}</span></div>
            <div className="linha"><span>Quantidade</span><span>{agendamento.quantidade_total ?? '—'}</span></div>
            <div className="linha"><span>Pedido</span><span>{agendamento.tipo_pedido || 'Padrão'}</span></div>
            {confirmacao && (
              <div className="linha">
                <span>Confirmação</span>
                <span title={confirmacao.motivo}>
                  {confirmacao.score} · {confirmacao.nivel}
                </span>
              </div>
            )}
            {agendamento.itens_personalizados?.length ? (
              <div className="linha">
                <span>Sabores</span>
                <span>
                  {agendamento.itens_personalizados
                    .map((i) => `${i.quantidade} ${i.produto}`)
                    .join(' · ')}
                </span>
              </div>
            ) : null}
            {agendamento.observacoes_agendamento && (
              <div className="linha"><span>Observação</span><span>{agendamento.observacoes_agendamento}</span></div>
            )}
          </>
        ) : (
          <p className="apagado">Sem agendamento cadastrado.</p>
        )}
      </div>

      {(trocas.length > 0 || bonificacoes.length > 0) && (
        <div className="cartao">
          <h2 className="titulo">Pendente na próxima entrega</h2>
          {trocas.map((t, i) => (
            <div className="linha" key={`t${i}`}>
              <span>Troca</span><span>{t.quantidade} {t.produto_nome}</span>
            </div>
          ))}
          {bonificacoes.map((b, i) => (
            <div className="linha" key={`b${i}`}>
              <span>Bonificação</span><span>{b.quantidade} {b.produto_nome}</span>
            </div>
          ))}
        </div>
      )}

      <div className="cartao">
        <h2 className="titulo">Financeiro</h2>
        {!financeiro && !erroFinanceiro && (
          <button className="secundario" onClick={buscarFinanceiro} disabled={buscandoFinanceiro}>
            {buscandoFinanceiro ? 'consultando o Gestão Click…' : 'Ver situação financeira'}
          </button>
        )}
        {erroFinanceiro && <p className="aviso">{erroFinanceiro}</p>}
        {financeiro && (
          <>
            <div className="linha">
              <span>Score de pagamento</span>
              <span title={`${financeiro.score.titulosPagos} título(s) pago(s)`}>
                {financeiro.score.score ?? '—'} ·{' '}
                {ROTULO_CLASSIFICACAO[financeiro.score.classificacao]}
              </span>
            </div>
            <div className="linha">
              <span>Em aberto</span><span>{dinheiro(financeiro.score.valorEmAberto)}</span>
            </div>
            {financeiro.score.valorVencido > 0 && (
              <div className="linha">
                <span>Vencido</span>
                <span className="aviso">{dinheiro(financeiro.score.valorVencido)}</span>
              </div>
            )}
            {financeiro.emAberto.slice(0, 4).map((t) => (
              <div className="linha" key={t.id}>
                <span>{dia(t.dataVencimento)}{t.formaPagamento ? ` · ${t.formaPagamento}` : ''}</span>
                <span className={t.diasAtraso > 2 ? 'aviso' : undefined}>
                  {dinheiro(t.valor)}{t.diasAtraso > 2 ? ` · ${t.diasAtraso}d` : ''}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="cartao">
        <h2 className="titulo">Últimas entregas</h2>
        {entregas.length ? (
          entregas.map((e) => (
            <div className="linha" key={e.data}>
              <span>{dia(e.data)}</span>
              <span>
                {e.quantidade ?? 0} un
                {e.itens.length ? ` · ${e.itens.map((i) => `${i.quantidade} ${i.produto}`).join(', ')}` : ''}
              </span>
            </div>
          ))
        ) : (
          <p className="apagado">Nenhuma entrega registrada.</p>
        )}
        <div className="linha">
          <span>Giro semanal</span>
          <span>
            {giro ? `${giro.giro} un` : '—'}
            {giro?.medido ? ' · medido pelas entregas' : ''}
          </span>
        </div>
        <div className="linha">
          <span>Periodicidade</span>
          <span>{cliente.periodicidade_padrao ? `${cliente.periodicidade_padrao} dias` : '—'}</span>
        </div>
      </div>
    </>
  );
}
