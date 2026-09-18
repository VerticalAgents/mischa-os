/**
 * As duas ações possíveis num título a receber.
 *
 * Toda ação aqui **escreve no Gestão Click**. Por isso nenhuma acontece num
 * clique só: abre um formulário, mostra o que vai ser feito, e o botão final diz
 * exatamente o quê. É a mesma regra da tela de inadimplência, e o motivo é o de
 * sempre — dinheiro lançado errado em silêncio é o pior erro possível.
 */
import { useEffect, useState } from 'react';
import {
  alterarVencimento,
  marcarComoRecebido,
  listarFormasDePagamento,
  type FormaDePagamento,
} from '@ext/lib/recebimentos';

export interface TituloEmAberto {
  id: string;
  valor: number;
  dataVencimento: string;
  formaPagamento?: string;
  diasAtraso: number;
}

const dinheiro = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const brasileira = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');

const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type Aberto = 'vencimento' | 'recebido' | null;

export default function AcoesDoTitulo({
  titulo,
  aoMudar,
}: {
  titulo: TituloEmAberto;
  aoMudar: () => void;
}) {
  const [aberto, setAberto] = useState<Aberto>(null);
  const [novaData, setNovaData] = useState(titulo.dataVencimento);
  const [dataLiquidacao, setDataLiquidacao] = useState(hojeISO());
  const [formas, setFormas] = useState<FormaDePagamento[]>([]);
  const [forma, setForma] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // A lista de formas só é buscada quando a baixa vai mesmo acontecer.
  useEffect(() => {
    if (aberto !== 'recebido' || formas.length) return;

    listarFormasDePagamento()
      .then((lista) => {
        setFormas(lista);
        const igual = lista.find(
          (f) => f.nome.toLowerCase() === (titulo.formaPagamento || '').toLowerCase()
        );
        if (igual) setForma(igual.id);
      })
      .catch((e) => setErro(String((e as Error).message || e)));
  }, [aberto, formas.length, titulo.formaPagamento]);

  const executar = async (o_que: () => Promise<unknown>) => {
    setSalvando(true);
    setErro(null);
    try {
      await o_que();
      setAberto(null);
      aoMudar();
    } catch (e) {
      setErro(String((e as Error).message || e));
    }
    setSalvando(false);
  };

  return (
    <div className="titulo-aberto">
      <div className="linha">
        <span>
          {brasileira(titulo.dataVencimento)}
          {titulo.formaPagamento ? ` · ${titulo.formaPagamento}` : ''}
        </span>
        <span className={titulo.diasAtraso > 2 ? 'aviso' : undefined}>
          {dinheiro(titulo.valor)}
          {titulo.diasAtraso > 2 ? ` · ${titulo.diasAtraso}d` : ''}
        </span>
      </div>

      {!aberto && (
        <div className="atalhos">
          <button className="secundario estreito" onClick={() => setAberto('vencimento')}>
            Mudar vencimento
          </button>
          <button className="secundario estreito" onClick={() => setAberto('recebido')}>
            Marcar recebido
          </button>
        </div>
      )}

      {aberto === 'vencimento' && (
        <div className="campos caixa-acao">
          <div>
            <label htmlFor={`venc-${titulo.id}`}>Novo vencimento</label>
            <input
              id={`venc-${titulo.id}`}
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
          <p className="apagado">O valor de {dinheiro(titulo.valor)} não muda.</p>
          {erro && <p className="aviso">{erro}</p>}
          <button
            disabled={salvando || !novaData || novaData === titulo.dataVencimento}
            onClick={() => executar(() => alterarVencimento(titulo.id, novaData))}
          >
            {salvando ? 'Gravando no Gestão Click…' : `Passar para ${brasileira(novaData)}`}
          </button>
          <button className="secundario" onClick={() => setAberto(null)} disabled={salvando}>
            Cancelar
          </button>
        </div>
      )}

      {aberto === 'recebido' && (
        <div className="campos caixa-acao">
          <div>
            <label htmlFor={`liq-${titulo.id}`}>Data do recebimento</label>
            <input
              id={`liq-${titulo.id}`}
              type="date"
              value={dataLiquidacao}
              onChange={(e) => setDataLiquidacao(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`forma-${titulo.id}`}>Forma de pagamento</label>
            <select
              id={`forma-${titulo.id}`}
              value={forma}
              onChange={(e) => setForma(e.target.value)}
              disabled={!formas.length}
            >
              <option value="">{formas.length ? 'manter a do título' : 'carregando…'}</option>
              {formas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          {erro && <p className="aviso">{erro}</p>}
          <button
            disabled={salvando || !dataLiquidacao}
            onClick={() =>
              executar(() => marcarComoRecebido(titulo.id, dataLiquidacao, forma || undefined))
            }
          >
            {salvando
              ? 'Gravando no Gestão Click…'
              : `Dar baixa de ${dinheiro(titulo.valor)}`}
          </button>
          <button className="secundario" onClick={() => setAberto(null)} disabled={salvando}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
