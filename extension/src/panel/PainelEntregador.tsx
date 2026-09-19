/**
 * A conversa com o entregador.
 *
 * Aqui não tem ficha de cliente: tem a rota do dia. As quatro coisas que o
 * Lucca faz por essa conversa, na ordem em que acontecem — mandar a rota, ver o
 * andamento, confirmar as entregas e saber quanto deve no fim da semana.
 */
import { useEffect, useState } from 'react';
import {
  rotaDoDia,
  textoDaRota,
  confirmarParada,
  contaDaSemana,
  type ContatoExterno,
  type ParadaDaRota,
  type ContaDoEntregador,
  listarCarteiras,
  carteiraDaParada,
  lerCarteirasEscolhidas,
  guardarCarteirasEscolhidas,
  entregasDaSemana,
  type EntregaFeita,
} from '@ext/lib/entregador';
import { inserirNaCaixa } from './useChatAberto';
import { ErroDeEtapa } from '@/services/expedicao/etapasDoPedido';
import Icone from './Icone';

const dinheiro = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PainelEntregador({ contato }: { contato: ContatoExterno }) {
  const [paradas, setParadas] = useState<ParadaDaRota[]>([]);
  const [conta, setConta] = useState<ContaDoEntregador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  // De quais carteiras este entregador leva: a da Mischa's e as dos
  // representantes marcados. Null significa "ainda não escolheu": aí leva tudo.
  const [carteiras, setCarteiras] = useState<{ chave: string; nome: string }[]>([]);
  const [escolhidas, setEscolhidas] = useState<string[] | null>(null);
  const [escolhendo, setEscolhendo] = useState(false);
  const [feitasNaSemana, setFeitasNaSemana] = useState<EntregaFeita[]>([]);

  const buscar = async () => {
    setCarregando(true);
    try {
      const [rota, semana, lista, salvas, daSemana] = await Promise.all([
        rotaDoDia(),
        contaDaSemana(contato),
        listarCarteiras(),
        lerCarteirasEscolhidas(contato.id),
        entregasDaSemana(),
      ]);
      setParadas(rota);
      setConta(semana);
      setFeitasNaSemana(daSemana);
      setCarteiras(lista);
      setEscolhidas(salvas);
      setErro(null);
    } catch (e) {
      setErro(String((e as Error).message || e));
    }
    setCarregando(false);
  };

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contato.id]);

  if (carregando) return <div className="cartao"><p className="apagado">Montando a rota…</p></div>;

  // Sem escolha feita, leva tudo — é o comportamento de antes.
  const daCarteira = (p: ParadaDaRota) =>
    !escolhidas || escolhidas.length === 0 || escolhidas.includes(carteiraDaParada(p));

  const doEntregador = paradas.filter(daCarteira);
  const feitas = doEntregador.filter((p) => p.entregue).length;
  const faltam = doEntregador.filter((p) => !p.entregue);
  const totalUn = faltam.reduce((s, p) => s + p.quantidade, 0);

  const mandarRota = async () => {
    const ok = await inserirNaCaixa(textoDaRota(faltam), true);
    setRecado(
      ok ? 'Rota na caixa. Confira e envie.' : 'Não consegui escrever na caixa do WhatsApp.'
    );
  };

  return (
    <>
      <div className="identificacao">
        <div className="quem">
          <span className="avatar">{contato.nome.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{contato.nome}</strong>
            <div className="apagado">entregador</div>
          </div>
        </div>
      </div>

      <div className="destaques">
        <div className="destaque">
          <span className="valor">{faltam.length}</span>
          <span className="rotulo">a entregar</span>
        </div>
        <div className="destaque informacao">
          <span className="valor">{totalUn}</span>
          <span className="rotulo">unidades</span>
        </div>
        <div className="destaque informacao">
          <span className="valor">{feitas}</span>
          <span className="rotulo">feitas hoje</span>
        </div>
      </div>

      {erro && <p className="aviso">{erro}</p>}
      {recado && <p className="apagado">{recado}</p>}

      <div className="cartao">
        <div className="titulo-com-icone">
          <Icone nome="caminhao" />
          <h2>Rota de hoje</h2>
        </div>

        <div className="abas">
          <button className="aba" onClick={() => setEscolhendo((v) => !v)}>
            {escolhidas?.length
              ? `${escolhidas.length} carteira(s)`
              : 'todas as carteiras'}
          </button>
          {paradas.length !== doEntregador.length && (
            <span className="apagado">
              {paradas.length - doEntregador.length} fora da seleção
            </span>
          )}
        </div>

        {escolhendo && (
          <div className="campos caixa-acao">
            <p className="apagado">Quais carteiras o {contato.nome.split(' ')[0]} leva?</p>
            {carteiras.map((c) => {
              const marcada = !escolhidas?.length || escolhidas.includes(c.chave);
              return (
                <label className="escolha" key={c.chave}>
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={async () => {
                      const atuais = escolhidas?.length
                        ? escolhidas
                        : carteiras.map((x) => x.chave);
                      const novas = marcada
                        ? atuais.filter((x) => x !== c.chave)
                        : [...atuais, c.chave];

                      setEscolhidas(novas);
                      await guardarCarteirasEscolhidas(contato.id, novas);
                    }}
                  />
                  {c.nome}
                </label>
              );
            })}
            <button className="secundario" onClick={() => setEscolhendo(false)}>
              Pronto
            </button>
          </div>
        )}

        {doEntregador.length === 0 && (
          <p className="apagado">
            {paradas.length
              ? 'Nenhuma entrega de hoje é das carteiras escolhidas.'
              : 'Hoje não tem entrega confirmada.'}
          </p>
        )}

        {doEntregador.map((p) => (
          <div className="parada" key={p.agendamentoId}>
            <div className="linha">
              <span className={p.entregue ? 'entregue' : undefined}>
                {p.entregue ? '✓ ' : ''}
                {p.cliente}
              </span>
              <span>{p.quantidade} un</span>
            </div>
            {p.endereco && <p className="apagado">{p.endereco}</p>}

            {!p.entregue && (
              <button
                className="secundario estreito"
                disabled={ocupado === p.agendamentoId}
                onClick={async () => {
                  setOcupado(p.agendamentoId);
                  setErro(null);
                  try {
                    await confirmarParada(p.agendamentoId);

                    // Marca na hora, sem refazer a busca: recarregar a cada
                    // clique tirava a parada da tela no meio da conferência e
                    // atrapalhava quem está confirmando várias seguidas.
                    setParadas((atuais) =>
                      atuais.map((x) =>
                        x.agendamentoId === p.agendamentoId ? { ...x, entregue: true } : x
                      )
                    );
                    // Recalcular a conta na mão aqui daria divergência com a
                    // regra (valor por cliente + coleta por dia). Uma consulta
                    // só, sem refazer a rota, mantém o número certo.
                    setFeitasNaSemana((atuais) => [
                      {
                        id: p.agendamentoId,
                        clienteId: p.clienteId,
                        cliente: p.cliente,
                        data: new Date().toISOString(),
                        valor: null,
                      },
                      ...atuais,
                    ]);
                    contaDaSemana(contato).then(setConta).catch(() => {});
                  } catch (e) {
                    setErro(
                      e instanceof ErroDeEtapa
                        ? e.message
                        : String((e as Error).message || e)
                    );
                  }
                  setOcupado(null);
                }}
              >
                {ocupado === p.agendamentoId ? 'registrando…' : 'Confirmar entrega'}
              </button>
            )}
          </div>
        ))}

        {faltam.length > 0 && (
          <button className="secundario acao-boa" onClick={mandarRota}>
            Mandar a rota ({faltam.length} paradas)
          </button>
        )}

        <button className="secundario estreito" onClick={buscar}>
          Atualizar a rota
        </button>
      </div>

      <div className="cartao">
        <div className="titulo-com-icone">
          <Icone nome="troca" />
          <h2>Entregues nesta semana</h2>
        </div>

        {feitasNaSemana.length === 0 ? (
          <p className="apagado">Nenhuma entrega registrada desde segunda.</p>
        ) : (
          feitasNaSemana.map((e) => (
            <div className="linha" key={e.id}>
              <span>{new Date(e.data).toLocaleDateString('pt-BR')}</span>
              <span>{e.cliente}</span>
            </div>
          ))
        )}
      </div>

      <div className="cartao">
        <div className="titulo-com-icone">
          <Icone nome="carteira" />
          <h2>A pagar nesta semana</h2>
        </div>
        <div className="linha">
          <span>Entregas desde segunda</span>
          <span>
            {conta?.entregas ?? 0}
            {conta?.valorEntregas != null ? ` · ${dinheiro(conta.valorEntregas)}` : ''}
          </span>
        </div>
        <div className="linha">
          <span>Coletas na fábrica</span>
          <span>
            {conta?.diasComColeta ?? 0} dia(s)
            {conta?.valorColetas != null ? ` · ${dinheiro(conta.valorColetas)}` : ''}
          </span>
        </div>
        <div className="linha">
          <span>
            <strong>Total</strong>
          </span>
          <span>
            <strong>{conta?.total != null ? dinheiro(conta.total) : 'falta cadastrar valor'}</strong>
          </span>
        </div>
        {conta?.total == null && (
          <p className="apagado">
            Falta o valor por entrega no cadastro do {contato.nome.split(' ')[0]}.
          </p>
        )}
      </div>
    </>
  );
}
