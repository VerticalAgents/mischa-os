/**
 * Onde o pedido deste cliente está, e como empurrar ele adiante.
 *
 * É o módulo de expedição recortado num cliente só. As transições vêm do
 * serviço compartilhado com o app — a extensão não tem regra própria de
 * expedição, e não pode ter: baixa de estoque errada não se desfaz.
 */
import { useEffect, useState } from 'react';
import {
  pedidoDoCliente,
  itensDaEntrega,
  acoesPossiveis,
  marcarSeparado,
  desfazerSeparacao,
  marcarDespachado,
  desfazerDespacho,
  confirmarEntrega,
  ErroDeEtapa,
  type PedidoNaExpedicao,
  type ItemDaEntrega,
} from '@/services/expedicao/etapasDoPedido';
import Icone from './Icone';

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** "18/09 às 14h32" — o suficiente para saber quando foi, sem virar relatório. */
const quando = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} às ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
};

const dia = (iso: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '—';

interface Props {
  clienteId: string;
  /** Some quando o pedido vira outro ciclo, para o painel inteiro se atualizar. */
  aoMudar: () => void;
}

export default function Expedicao({ clienteId, aoMudar }: Props) {
  const [pedido, setPedido] = useState<PedidoNaExpedicao | null>(null);
  const [itens, setItens] = useState<ItemDaEntrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [dataEntrega, setDataEntrega] = useState(hoje());
  const [observacao, setObservacao] = useState('');

  const buscar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const atual = await pedidoDoCliente(clienteId);
      setPedido(atual);
      setItens(atual ? await itensDaEntrega(atual.id).catch(() => []) : []);
    } catch (e) {
      setErro(String((e as Error).message || e));
    }
    setCarregando(false);
  };

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const fazer = async (acao: () => Promise<unknown>, recarregarPainel = false) => {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
      await buscar();
      if (recarregarPainel) aoMudar();
    } catch (e) {
      setErro(
        e instanceof ErroDeEtapa ? e.message : `Não consegui: ${String((e as Error).message || e)}`
      );
    }
    setOcupado(false);
  };

  if (carregando) return <div className="cartao"><p className="apagado">Vendo a expedição…</p></div>;
  if (!pedido) return null;

  const podem = acoesPossiveis(pedido);
  const etapa = pedido.substatus_pedido || 'Agendado';
  const confirmado = pedido.status_agendamento === 'Agendado';

  const passos = [
    { nome: 'Previsto', feito: true, em: null as string | null },
    { nome: 'Confirmado', feito: confirmado, em: quando(pedido.confirmado_em) },
    { nome: 'Separado', feito: etapa === 'Separado' || etapa === 'Despachado', em: quando(pedido.separado_em) },
    { nome: 'Despachado', feito: etapa === 'Despachado', em: quando(pedido.despachado_em) },
  ];

  const totalDaEntrega = itens.reduce((s, i) => s + i.quantidade, 0);

  return (
    <div className="cartao">
      <div className="titulo-com-icone">
        <Icone nome="caminhao" />
        <h2>Expedição</h2>
      </div>

      <ol className="etapas">
        {passos.map((p) => (
          <li key={p.nome} className={p.feito ? 'feito' : ''}>
            <span className="bolinha" />
            <span className="nome">{p.nome}</span>
            <span className="quando">{p.em || (p.feito ? '' : 'ainda não')}</span>
          </li>
        ))}
      </ol>

      {itens.length > 0 && (
        <div className="itens-da-entrega">
          <p className="apagado">O que vai nesta entrega ({totalDaEntrega} un)</p>
          {itens.map((i) => (
            <div className="linha" key={i.produto_id}>
              <span>{i.produto_nome}</span>
              <span>{i.quantidade}</span>
            </div>
          ))}
        </div>
      )}

      {erro && <p className="aviso">{erro}</p>}

      {!confirmando && (
        <div className="campos">
          {podem.podeSeparar && (
            <button className="secundario" disabled={ocupado} onClick={() => fazer(() => marcarSeparado(pedido.id))}>
              Marcar separado
            </button>
          )}
          {podem.podeDespachar && (
            <button className="secundario" disabled={ocupado} onClick={() => fazer(() => marcarDespachado(pedido.id))}>
              Confirmar despacho
            </button>
          )}
          {podem.podeConfirmarEntrega && (
            <button disabled={ocupado} onClick={() => setConfirmando(true)}>
              Confirmar entrega
            </button>
          )}
          {podem.podeDesfazerDespacho && (
            <button className="secundario" disabled={ocupado} onClick={() => fazer(() => desfazerDespacho(pedido.id))}>
              Desfazer despacho
            </button>
          )}
          {podem.podeDesfazerSeparacao && (
            <button className="secundario" disabled={ocupado} onClick={() => fazer(() => desfazerSeparacao(pedido.id))}>
              Voltar para agendado
            </button>
          )}

          {podem.podeSeparar && (
            <p className="apagado">
              Marcar como separado já reserva essas unidades no estoque e tira o pedido da
              projeção de produção.
            </p>
          )}
          {!confirmado && (
            <p className="apagado">
              O cliente ainda não confirmou a reposição de {dia(pedido.data_proxima_reposicao)}.
            </p>
          )}
        </div>
      )}

      {confirmando && (
        <div className="campos caixa-acao">
          <p>
            Isso dá baixa de <strong>{totalDaEntrega} unidades</strong> no estoque, registra a
            entrega e marca a próxima reposição contando a partir da data abaixo.
          </p>
          <p className="apagado">Não dá para desfazer pelo painel.</p>

          <div>
            <label htmlFor="data-entrega">Quando foi entregue</label>
            <input
              id="data-entrega"
              type="date"
              value={dataEntrega}
              max={hoje()}
              onChange={(e) => setDataEntrega(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="obs-entrega">Observação</label>
            <textarea
              id="obs-entrega"
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="opcional"
            />
          </div>

          <button
            disabled={ocupado}
            onClick={() =>
              fazer(
                () =>
                  confirmarEntrega({
                    agendamentoId: pedido.id,
                    dataEntrega: new Date(`${dataEntrega}T12:00:00`),
                    observacao: observacao.trim() || null,
                  }).then(() => {
                    setConfirmando(false);
                    setObservacao('');
                  }),
                true
              )
            }
          >
            {ocupado ? 'Registrando a entrega…' : 'Confirmar entrega'}
          </button>
          <button className="secundario" disabled={ocupado} onClick={() => setConfirmando(false)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
