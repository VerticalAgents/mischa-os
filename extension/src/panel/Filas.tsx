/**
 * As filas de trabalho: com quem falar agora.
 *
 * O painel do cliente responde sobre a conversa aberta. Aqui é o contrário —
 * a lista manda você para a conversa. Clicar num cliente abre o WhatsApp dele
 * quando há telefone; sem telefone, escreve o nome na busca e quem escolhe o
 * resultado é o Lucca.
 *
 * Cada fila só é buscada quando aberta. A de "devendo" varre a base inteira no
 * Gestão Click e demora — não dá para carregar as seis de uma vez.
 */
import { useEffect, useState } from 'react';
import { FILAS, type ItemDaFila, type NomeDaFila } from '@ext/lib/filas';
import { listarVinculos } from '@ext/lib/queries';
import type { VinculoWhatsapp } from '@ext/lib/resolverCliente';
import { abrirConversa } from './useChatAberto';

const NIVEL = { alto: 'bom', medio: 'atencao', baixo: 'ruim' } as const;

export default function Filas() {
  const [aberta, setAberta] = useState<NomeDaFila>('semana');
  const [itens, setItens] = useState<ItemDaFila[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  const [vinculos, setVinculos] = useState<VinculoWhatsapp[]>([]);

  // O vínculo manda mais que o cadastro: é a conversa que o Lucca apontou.
  // O telefone do cadastro pode ser o do dono, e a conversa de trabalho ser
  // outra — foi o que aconteceu com a Mica (pessoa) e o Brownie da Mica (loja).
  //
  // Relê a cada troca de fila, e não só ao abrir o painel: vincular um cliente
  // e voltar para a lista sem recarregar deixava a fila com a lista velha,
  // mandando para a conversa errada.
  useEffect(() => {
    listarVinculos().then(setVinculos).catch(() => setVinculos([]));
  }, [aberta]);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setErro(null);
    setRecado(null);

    const fila = FILAS.find((f) => f.nome === aberta);
    fila
      ?.buscar()
      .then((lista) => vivo && setItens(lista))
      .catch((e) => vivo && setErro(String((e as Error).message || e)))
      .finally(() => vivo && setCarregando(false));

    return () => {
      vivo = false;
    };
  }, [aberta]);

  const ir = async (item: ItemDaFila) => {
    const vinculo = vinculos.find((v) => v.cliente_id === item.clienteId);

    // Existindo vínculo, ele manda — inclusive quando não tem telefone, que é
    // o caso de todos hoje. Cair no telefone do cadastro aqui abriria a
    // conversa errada: o cadastro do Brownie da Mica tem o número pessoal da
    // Mica, e o trabalho acontece na conversa da loja.
    const telefone = vinculo ? vinculo.telefone_e164 : item.telefone;
    const procurar = vinculo?.chat_titulo || item.nome;

    const resultado = await abrirConversa({ telefone, nome: procurar });

    setRecado(
      resultado === 'buscou'
        ? `Procurei "${procurar}" na lista do WhatsApp. Clique na conversa certa.`
        : resultado === 'nao-consegui'
          ? 'Não consegui abrir a conversa. O WhatsApp Web está aberto?'
          : vinculo
            ? null
            : `Abri pelo telefone do cadastro. Se não for essa a conversa certa, vincule em "Esta conversa".`
    );
  };

  return (
    <>
      <div className="abas">
        {FILAS.map((f) => (
          <button
            key={f.nome}
            className={`aba ${aberta === f.nome ? 'ativa' : ''}`}
            onClick={() => setAberta(f.nome)}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {recado && <p className="apagado">{recado}</p>}
      {erro && <p className="aviso">{erro}</p>}

      {carregando ? (
        <p className="apagado">Buscando…</p>
      ) : itens.length === 0 ? (
        <p className="apagado">Nada nesta fila. Bom sinal.</p>
      ) : (
        <>
          <p className="apagado">{itens.length} cliente(s)</p>
          <div className="campos">
            {itens.map((item) => (
              <button key={item.clienteId + item.detalhe} className="cartao-fila" onClick={() => ir(item)}>
                <span className="topo">
                  <strong>{item.nome}</strong>
                  {item.score && (
                    <span className={`selo selo-${NIVEL[item.score.nivel]}`}>{item.score.score}</span>
                  )}
                </span>
                <span className="apagado">{item.detalhe}</span>
                {(() => {
                  const v = vinculos.find((x) => x.cliente_id === item.clienteId);
                  if (v?.chat_titulo) return <span className="apagado">conversa: {v.chat_titulo}</span>;
                  if (!item.telefone) return <span className="apagado">sem telefone · abre pela busca</span>;
                  return null;
                })()}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
