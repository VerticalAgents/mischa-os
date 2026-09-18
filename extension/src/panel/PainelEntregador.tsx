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
} from '@ext/lib/entregador';
import { inserirNaCaixa } from './useChatAberto';
import { ErroDeEtapa } from '@/services/expedicao/etapasDoPedido';
import Icone from './Icone';

export default function PainelEntregador({ contato }: { contato: ContatoExterno }) {
  const [paradas, setParadas] = useState<ParadaDaRota[]>([]);
  const [conta, setConta] = useState<ContaDoEntregador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  const buscar = async () => {
    setCarregando(true);
    try {
      const [rota, semana] = await Promise.all([rotaDoDia(), contaDaSemana(contato)]);
      setParadas(rota);
      setConta(semana);
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

  const feitas = paradas.filter((p) => p.entregue).length;
  const faltam = paradas.filter((p) => !p.entregue);
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

        {paradas.length === 0 && <p className="apagado">Hoje não tem entrega confirmada.</p>}

        {paradas.map((p) => (
          <div className="parada" key={p.agendamentoId}>
            <div className="linha">
              <span>
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
                    await buscar();
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
      </div>

      <div className="cartao">
        <div className="titulo-com-icone">
          <Icone nome="carteira" />
          <h2>A pagar nesta semana</h2>
        </div>
        <div className="linha">
          <span>Entregas desde segunda</span>
          <span>{conta?.entregas ?? 0}</span>
        </div>
        <div className="linha">
          <span>Valor</span>
          <span>
            {conta?.valor != null
              ? conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : 'falta o valor por entrega'}
          </span>
        </div>
        {conta?.valor == null && (
          <p className="apagado">
            Cadastre quanto vale cada entrega no contato dele e o valor passa a ser calculado.
          </p>
        )}
      </div>
    </>
  );
}
