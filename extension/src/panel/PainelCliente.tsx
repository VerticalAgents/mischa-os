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

/** Mesmos rótulos da tela de agendamentos do app. */
const ROTULO_CONFIRMACAO = {
  alto: 'confirmado provável',
  medio: 'atenção',
  baixo: 'alto risco',
} as const;
import Mensagens from './Mensagens';
import Icone from './Icone';
import EditarAgendamento from './EditarAgendamento';
import AcoesDoTitulo from './AcoesDoTitulo';
import Expedicao from './Expedicao';
import { confirmarAgendamento, adiarUmaSemana } from '@ext/lib/queries';

const dia = (iso?: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '—';

/** Duas letras para o círculo: "Sabor Mágico" vira SM. */
const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || nome.slice(0, 2).toUpperCase();

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Selo colorido, igual à pílula do design do app: verde, âmbar ou vermelho. */
function Selo({ valor, nivel, titulo }: { valor: string; nivel: 'bom' | 'atencao' | 'ruim'; titulo?: string }) {
  return (
    <span className={`selo selo-${nivel}`} title={titulo}>
      {valor}
    </span>
  );
}

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
  const [editando, setEditando] = useState(false);
  const [mexendo, setMexendo] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  // Muda quando algo é salvo, para as consultas rodarem de novo.
  const [rodada, setRodada] = useState(0);

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
  }, [clienteId, rodada]);

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

  if (editando) {
    return (
      <EditarAgendamento
        clienteId={clienteId}
        agendamento={agendamento}
        ultimaEntrega={entregas[0]}
        quantidadePadrao={cliente.quantidade_padrao}
        aoSalvar={() => {
          setEditando(false);
          setRodada((n) => n + 1);
        }}
        aoCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <>
      <div className="identificacao">
        <div className="quem">
          <span className="avatar">{iniciais(cliente.nome)}</span>
          <div>
            <strong>{cliente.nome}</strong>
            <div className="apagado">reconhecido {EXPLICACAO[comoAchou]}</div>
          </div>
        </div>
        <button className="secundario estreito" onClick={aoTrocarCliente}>
          não é esse
        </button>
      </div>

      <div className="destaques">
        <div className="destaque">
          <span className="valor">{agendamento?.data_proxima_reposicao ? dia(agendamento.data_proxima_reposicao).slice(0, 5) : '—'}</span>
          <span className="rotulo">próxima</span>
        </div>
        <div className="destaque">
          <span className="valor">{agendamento?.quantidade_total ?? '—'}</span>
          <span className="rotulo">unidades</span>
        </div>
        <div className="destaque">
          <span className="valor">{giro ? giro.giro : '—'}</span>
          <span className="rotulo">giro/semana</span>
        </div>
      </div>

      <div className="cartao">
        <div className="titulo-com-icone">
          <Icone nome="calendario" />
          <h2>Próxima reposição</h2>
        </div>
        {agendamento ? (
          <>
            <div className="linha"><span>Data</span><span>{dia(agendamento.data_proxima_reposicao)}</span></div>
            <div className="linha"><span>Status</span><span>{agendamento.status_agendamento || '—'}</span></div>
            <div className="linha"><span>Quantidade</span><span>{agendamento.quantidade_total ?? '—'}</span></div>
            <div className="linha"><span>Pedido</span><span>{agendamento.tipo_pedido || 'Padrão'}</span></div>
            {confirmacao && (
              <div className="linha">
                <span>Confirmação</span>
                <span>
                  <Selo
                    valor={`${confirmacao.score} · ${ROTULO_CONFIRMACAO[confirmacao.nivel]}`}
                    nivel={confirmacao.nivel === 'alto' ? 'bom' : confirmacao.nivel === 'medio' ? 'atencao' : 'ruim'}
                    titulo={confirmacao.motivo}
                  />
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
            <div className="atalhos">
              <button
                className="secundario"
                disabled={mexendo || agendamento.status_agendamento === 'Agendado'}
                title={
                  agendamento.status_agendamento === 'Agendado'
                    ? 'já está confirmado'
                    : 'passa de Previsto para Agendado'
                }
                onClick={async () => {
                  setMexendo(true);
                  setRecado(null);
                  try {
                    await confirmarAgendamento(clienteId);
                    setRecado('Confirmado.');
                    setRodada((n) => n + 1);
                  } catch (e) {
                    setRecado(String((e as Error).message || e));
                  }
                  setMexendo(false);
                }}
              >
                Confirmar
              </button>
              <button
                className="secundario"
                disabled={mexendo || !agendamento.data_proxima_reposicao}
                title="empurra a reposição em 7 dias"
                onClick={async () => {
                  setMexendo(true);
                  setRecado(null);
                  try {
                    const nova = await adiarUmaSemana(clienteId);
                    setRecado(`Adiado para ${nova}.`);
                    setRodada((n) => n + 1);
                  } catch (e) {
                    setRecado(String((e as Error).message || e));
                  }
                  setMexendo(false);
                }}
              >
                Adiar 1 semana
              </button>
            </div>
            <button className="secundario" onClick={() => setEditando(true)}>
              Editar agendamento
            </button>
            {recado && <p className="apagado">{recado}</p>}
          </>
        ) : (
          <>
            <p className="apagado">Sem agendamento cadastrado.</p>
            <button className="secundario" onClick={() => setEditando(true)}>
              Criar agendamento
            </button>
          </>
        )}
      </div>

      {(trocas.length > 0 || bonificacoes.length > 0) && (
        <div className="cartao">
          <div className="titulo-com-icone">
            <Icone nome="troca" />
            <h2>Pendente na próxima entrega</h2>
          </div>
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

      <Expedicao clienteId={clienteId} aoMudar={() => setRodada((n) => n + 1)} />

      <div className="cartao">
        <div className="titulo-com-icone">
          <Icone nome="carteira" />
          <h2>Financeiro</h2>
        </div>
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
              <span>
                <Selo
                  valor={`${financeiro.score.score ?? '—'} · ${ROTULO_CLASSIFICACAO[financeiro.score.classificacao]}`}
                  nivel={
                    financeiro.score.classificacao === 'excelente' || financeiro.score.classificacao === 'bom'
                      ? 'bom'
                      : financeiro.score.classificacao === 'atencao'
                        ? 'atencao'
                        : financeiro.score.classificacao === 'risco'
                          ? 'ruim'
                          : 'atencao'
                  }
                  titulo={`${financeiro.score.titulosPagos} título(s) pago(s)`}
                />
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
            {financeiro.emAberto.slice(0, 5).map((t) => (
              <AcoesDoTitulo
                key={t.id}
                titulo={t}
                aoMudar={() => {
                  // O que mudou está no Gestão Click: busca de novo em vez de
                  // adivinhar o novo estado na tela.
                  setFinanceiro(null);
                  buscarFinanceiro();
                }}
              />
            ))}
          </>
        )}
      </div>

      <Mensagens
        cliente={cliente}
        agendamento={agendamento}
        entregas={entregas}
        financeiro={financeiro}
        giroSemanal={giro?.giro ?? null}
      />

      <div className="cartao">
        <div className="titulo-com-icone">
          <Icone nome="caminhao" />
          <h2>Últimas entregas</h2>
        </div>
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
