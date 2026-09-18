/**
 * Editar o agendamento sem sair da conversa.
 *
 * É o mesmo miolo da tela de edição do Mischa OS, num painel de 400px: status,
 * data, quantidade, tipo do pedido e a divisão por sabor. Quem salva é o serviço
 * compartilhado `atualizarAgendamento`, então as travas e os efeitos colaterais
 * (pulo de semana, liberar a NF) são exatamente os mesmos — não existe uma
 * segunda versão da regra aqui.
 *
 * O que ficou de fora de propósito: trocas, bonificações e observações, que
 * exigem listas de motivos e dois campos de texto longos. Numa faixa estreita,
 * isso vira formulário de rolar sem fim — e continua a um clique de distância no
 * Mischa OS.
 */
import { useEffect, useState } from 'react';
import {
  atualizarAgendamento,
  ErroDeValidacaoDoAgendamento,
  type StatusAgendamento,
  type TipoPedido,
  type ItemPersonalizado,
} from '@/services/agendamento/atualizarAgendamento';
import {
  listarProdutosDoCliente,
  proporcaoPadrao,
  type ProdutoDoCliente,
} from '@ext/lib/queries';
import type { AgendamentoDoPainel, EntregaDoPainel } from '@ext/lib/queries';

interface Props {
  clienteId: string;
  agendamento: AgendamentoDoPainel | null;
  ultimaEntrega?: EntregaDoPainel;
  quantidadePadrao: number | null;
  aoSalvar: () => void;
  aoCancelar: () => void;
}

const STATUS: { valor: StatusAgendamento; rotulo: string }[] = [
  { valor: 'Agendar', rotulo: 'Pendente' },
  { valor: 'Previsto', rotulo: 'Previsto' },
  { valor: 'Agendado', rotulo: 'Agendado' },
];

export default function EditarAgendamento({
  clienteId,
  agendamento,
  ultimaEntrega,
  quantidadePadrao,
  aoSalvar,
  aoCancelar,
}: Props) {
  const [status, setStatus] = useState<StatusAgendamento>(
    (agendamento?.status_agendamento as StatusAgendamento) || 'Previsto'
  );
  const [data, setData] = useState(agendamento?.data_proxima_reposicao?.slice(0, 10) || '');
  const [quantidade, setQuantidade] = useState(
    agendamento?.quantidade_total ?? quantidadePadrao ?? 0
  );
  const [tipo, setTipo] = useState<TipoPedido>(
    (agendamento?.tipo_pedido as TipoPedido) === 'Alterado' ? 'Alterado' : 'Padrão'
  );
  const [itens, setItens] = useState<ItemPersonalizado[]>(
    (agendamento?.itens_personalizados as ItemPersonalizado[]) || []
  );

  const [produtos, setProdutos] = useState<ProdutoDoCliente[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    listarProdutosDoCliente(clienteId).then(setProdutos).catch(() => setProdutos([]));
  }, [clienteId]);

  const soma = itens.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
  const somaNaoBate = tipo === 'Alterado' && soma !== quantidade;

  const mudarItem = (indice: number, mudanca: Partial<ItemPersonalizado>) =>
    setItens((atuais) => atuais.map((i, n) => (n === indice ? { ...i, ...mudanca } : i)));

  const repetirUltimoPedido = () => {
    if (!ultimaEntrega) return;
    setTipo('Alterado');
    setItens(ultimaEntrega.itens.map((i) => ({ produto: i.produto, quantidade: i.quantidade })));
    setQuantidade(ultimaEntrega.itens.reduce((s, i) => s + i.quantidade, 0));
  };

  const preencherPelasProporcoes = async () => {
    const sugestao = await proporcaoPadrao(quantidade);
    if (!sugestao.length) {
      setAviso('As proporções padrão não estão configuradas no Mischa OS.');
      return;
    }
    setTipo('Alterado');
    setItens(sugestao);
    setAviso(null);
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);

    try {
      const resultado = await atualizarAgendamento({
        clienteId,
        statusAgendamento: status,
        dataProximaReposicao: data ? new Date(`${data}T00:00:00`) : null,
        tipoPedido: tipo,
        quantidadeTotal: quantidade,
        itensPersonalizados: tipo === 'Alterado' ? itens : null,
      });

      if (resultado.vendaGcPendente) {
        // Recriar a venda a partir daqui duplicaria regra de faturamento. O
        // painel avisa; quem refaz é a tela de expedição.
        setAviso(
          `Salvo. A venda #${resultado.vendaGcPendente} no Gestão Click ficou desatualizada: refaça pela Expedição.`
        );
      }

      aoSalvar();
    } catch (e) {
      setErro(
        e instanceof ErroDeValidacaoDoAgendamento
          ? e.message
          : `Não consegui salvar: ${String((e as Error).message || e)}`
      );
    }

    setSalvando(false);
  };

  return (
    <div className="cartao campos">
      <div className="titulo-com-icone">
        <h2>Editar agendamento</h2>
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusAgendamento)}
        >
          {STATUS.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </select>
      </div>

      {status !== 'Agendar' && (
        <>
          <div>
            <label htmlFor="data">Data da reposição</label>
            <input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div>
            <label htmlFor="quantidade">Quantidade total</label>
            <input
              id="quantidade"
              type="number"
              min={0}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="tipo">Tipo do pedido</label>
            <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoPedido)}>
              <option value="Padrão">Padrão</option>
              <option value="Alterado">Alterado</option>
            </select>
          </div>
        </>
      )}

      {status !== 'Agendar' && tipo === 'Alterado' && (
        <div className="campos">
          <div className="atalhos">
            <button className="secundario" onClick={repetirUltimoPedido} disabled={!ultimaEntrega}>
              Repetir último
            </button>
            <button className="secundario" onClick={preencherPelasProporcoes}>
              Usar proporções
            </button>
          </div>

          {itens.map((item, indice) => (
            <div className="item-sabor" key={indice}>
              <select
                value={item.produto}
                onChange={(e) => mudarItem(indice, { produto: e.target.value })}
              >
                <option value="">escolha o sabor</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.nome}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={item.quantidade}
                onChange={(e) => mudarItem(indice, { quantidade: Number(e.target.value) })}
              />
              <button
                className="secundario estreito"
                onClick={() => setItens((atuais) => atuais.filter((_, n) => n !== indice))}
                title="tirar este sabor"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            className="secundario"
            onClick={() => setItens((atuais) => [...atuais, { produto: '', quantidade: 0 }])}
          >
            Adicionar sabor
          </button>

          <p className={somaNaoBate ? 'aviso' : 'apagado'}>
            Soma dos sabores: {soma} de {quantidade}
          </p>
        </div>
      )}

      {erro && <p className="aviso">{erro}</p>}
      {aviso && <p className="apagado">{aviso}</p>}

      <button onClick={salvar} disabled={salvando || somaNaoBate}>
        {salvando ? 'Salvando…' : 'Salvar agendamento'}
      </button>
      <button className="secundario" onClick={aoCancelar} disabled={salvando}>
        Cancelar
      </button>
    </div>
  );
}
