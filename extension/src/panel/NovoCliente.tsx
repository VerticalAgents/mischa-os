/**
 * Cadastrar um cliente novo e já vincular à conversa.
 *
 * É o cadastro completo, como na tela de clientes do Mischa OS — o Lucca pediu
 * assim: cliente que nasce pela metade trava na hora de montar o primeiro
 * pedido, e ninguém volta para completar.
 *
 * Numa faixa de 400px, "completo" precisa de ordem: os campos vêm em blocos, e
 * os que quase nunca mudam já vêm preenchidos com o padrão da casa. Só o nome é
 * obrigatório, igual ao app.
 *
 * Quem cria é o serviço compartilhado `criarCliente`, que também cria o cliente
 * no Gestão Click. Inserir direto na tabela criaria alguém que não emite nota.
 */
import { useEffect, useState } from 'react';
import {
  criarCliente,
  type PrecoPorCategoria,
  type EntradaNovoCliente,
} from '@/services/clientes/criarCliente';
import { listarCategoriasProduto, listarRepresentantes, type Categoria } from '@ext/lib/queries';
import { PRECOS, PEDIDO_MINIMO } from '@ext/config/comercial';

interface Props {
  /** O que dá para adivinhar da conversa. */
  nomeSugerido: string | null;
  telefone: string | null;
  aoCriar: (clienteId: string) => Promise<void>;
  aoCancelar: () => void;
}

export default function NovoCliente({ nomeSugerido, telefone, aoCriar, aoCancelar }: Props) {
  const [dados, setDados] = useState<EntradaNovoCliente>({
    nome: nomeSugerido || '',
    tipoPessoa: 'PJ',
    contatoTelefone: telefone,
    quantidadePadrao: PEDIDO_MINIMO.unidades,
    periodicidadePadrao: 7,
    categoriasHabilitadas: [],
    tipoLogistica: 'Própria',
    tipoCobranca: 'À vista',
    formaPagamento: 'Boleto',
    prazoPagamentoDias: 7,
    emiteNotaFiscal: true,
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [representantes, setRepresentantes] = useState<{ id: number; nome: string }[]>([]);
  const [precos, setPrecos] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarCategoriasProduto().then(setCategorias).catch(() => setCategorias([]));
    listarRepresentantes().then(setRepresentantes).catch(() => setRepresentantes([]));
  }, []);

  const mudar = (mudanca: Partial<EntradaNovoCliente>) =>
    setDados((atual) => ({ ...atual, ...mudanca }));

  const alternarCategoria = (id: number) => {
    const atuais = dados.categoriasHabilitadas || [];
    const tem = atuais.includes(id);

    mudar({ categoriasHabilitadas: tem ? atuais.filter((c) => c !== id) : [...atuais, id] });

    // Categoria recém-marcada já entra com o preço de entrada da tabela de
    // prospecção, que é o valor que o Lucca combinou com quem está chegando.
    if (!tem && !precos[id]) {
      setPrecos((p) => ({ ...p, [id]: String(PRECOS.pontoDeVenda.valorUnitario).replace('.', ',') }));
    }
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);

    try {
      const precosEscolhidos: PrecoPorCategoria[] = (dados.categoriasHabilitadas || [])
        .map((id) => ({
          categoria_id: id,
          preco_unitario: Number(String(precos[id] ?? '').replace(',', '.')),
        }))
        .filter((p) => p.preco_unitario > 0);

      const resultado = await criarCliente({ ...dados, precos: precosEscolhidos });

      if (resultado.avisoGestaoClick) {
        // Não é motivo para desfazer o cadastro: é motivo para o Lucca saber
        // que esse cliente ainda não emite nota.
        setErro(
          `Cliente criado, mas não entrou no Gestão Click (${resultado.avisoGestaoClick}). Confira lá antes de faturar.`
        );
      }

      await aoCriar(resultado.clienteId);
    } catch (e) {
      setErro(String((e as Error).message || e));
      setSalvando(false);
    }
  };

  return (
    <div className="cartao campos">
      <div className="titulo-com-icone">
        <h2>Cliente novo</h2>
      </div>

      <div>
        <label htmlFor="nome">Nome</label>
        <input
          id="nome"
          value={dados.nome}
          onChange={(e) => mudar({ nome: e.target.value })}
          placeholder="como aparece na nota"
          autoFocus
        />
      </div>

      <div className="atalhos">
        <div>
          <label htmlFor="tipo-pessoa">Tipo</label>
          <select
            id="tipo-pessoa"
            value={dados.tipoPessoa}
            onChange={(e) => mudar({ tipoPessoa: e.target.value as 'PJ' | 'PF' })}
          >
            <option value="PJ">Empresa</option>
            <option value="PF">Pessoa</option>
          </select>
        </div>
        <div>
          <label htmlFor="doc">{dados.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}</label>
          <input id="doc" value={dados.cnpjCpf || ''} onChange={(e) => mudar({ cnpjCpf: e.target.value })} />
        </div>
      </div>

      {dados.tipoPessoa === 'PJ' && (
        <div>
          <label htmlFor="ie">Inscrição estadual</label>
          <input
            id="ie"
            value={dados.inscricaoEstadual || ''}
            onChange={(e) => mudar({ inscricaoEstadual: e.target.value })}
            placeholder="ou ISENTO"
          />
        </div>
      )}

      <div>
        <label htmlFor="contato">Nome do contato</label>
        <input
          id="contato"
          value={dados.contatoNome || ''}
          onChange={(e) => mudar({ contatoNome: e.target.value })}
          placeholder="com quem você fala"
        />
      </div>

      <div>
        <label htmlFor="telefone">Telefone</label>
        <input
          id="telefone"
          value={dados.contatoTelefone || ''}
          onChange={(e) => mudar({ contatoTelefone: e.target.value })}
          placeholder={telefone ? undefined : 'o WhatsApp não mostrou o número'}
        />
      </div>

      <div>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={dados.contatoEmail || ''}
          onChange={(e) => mudar({ contatoEmail: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="endereco">Endereço de entrega</label>
        <input
          id="endereco"
          value={dados.enderecoEntrega || ''}
          onChange={(e) => mudar({ enderecoEntrega: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="maps">Link do Google Maps</label>
        <input
          id="maps"
          value={dados.linkGoogleMaps || ''}
          onChange={(e) => mudar({ linkGoogleMaps: e.target.value })}
          placeholder="ajuda o Guilherme na rota"
        />
      </div>

      <div>
        <label htmlFor="instrucoes">Instruções de entrega</label>
        <input
          id="instrucoes"
          value={dados.instrucoesEntrega || ''}
          onChange={(e) => mudar({ instrucoesEntrega: e.target.value })}
          placeholder="portaria, horário, com quem deixar"
        />
      </div>

      <div className="atalhos">
        <div>
          <label htmlFor="qtd">Quantidade padrão</label>
          <input
            id="qtd"
            type="number"
            min={0}
            value={dados.quantidadePadrao ?? 0}
            onChange={(e) => mudar({ quantidadePadrao: Number(e.target.value) })}
          />
        </div>
        <div>
          <label htmlFor="periodicidade">A cada (dias)</label>
          <input
            id="periodicidade"
            type="number"
            min={1}
            value={dados.periodicidadePadrao ?? 7}
            onChange={(e) => mudar({ periodicidadePadrao: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label>Categorias e preço</label>
        <p className="apagado">Sem categoria, este cliente não consegue montar pedido.</p>
        {categorias.map((c) => {
          const marcada = (dados.categoriasHabilitadas || []).includes(c.id);
          return (
            <div className="categoria" key={c.id}>
              <label className="escolha">
                <input type="checkbox" checked={marcada} onChange={() => alternarCategoria(c.id)} />
                {c.nome}
              </label>
              {marcada && (
                <input
                  className="preco"
                  inputMode="decimal"
                  value={precos[c.id] ?? ''}
                  onChange={(e) => setPrecos((p) => ({ ...p, [c.id]: e.target.value }))}
                  placeholder="4,80"
                  aria-label={`preço da categoria ${c.nome}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="atalhos">
        <div>
          <label htmlFor="cobranca">Cobrança</label>
          <select
            id="cobranca"
            value={dados.tipoCobranca}
            onChange={(e) => mudar({ tipoCobranca: e.target.value })}
          >
            <option value="À vista">À vista</option>
            <option value="A prazo">A prazo</option>
          </select>
        </div>
        <div>
          <label htmlFor="pagamento">Pagamento</label>
          <select
            id="pagamento"
            value={dados.formaPagamento}
            onChange={(e) => mudar({ formaPagamento: e.target.value })}
          >
            <option value="Boleto">Boleto</option>
            <option value="PIX">PIX</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão">Cartão</option>
          </select>
        </div>
      </div>

      <div className="atalhos">
        <div>
          <label htmlFor="prazo">Prazo (dias)</label>
          <input
            id="prazo"
            type="number"
            min={0}
            value={dados.prazoPagamentoDias ?? 7}
            onChange={(e) => mudar({ prazoPagamentoDias: Number(e.target.value) })}
          />
        </div>
        <div>
          <label htmlFor="nf">Emite nota</label>
          <select
            id="nf"
            value={dados.emiteNotaFiscal ? 'sim' : 'nao'}
            onChange={(e) => mudar({ emiteNotaFiscal: e.target.value === 'sim' })}
          >
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="logistica">Logística</label>
        <select
          id="logistica"
          value={dados.tipoLogistica}
          onChange={(e) => mudar({ tipoLogistica: e.target.value })}
        >
          <option value="Própria">Própria</option>
          <option value="Cliente retira">Cliente retira</option>
          <option value="Transportadora">Transportadora</option>
        </select>
      </div>

      {representantes.length > 0 && (
        <div>
          <label htmlFor="representante">Representante</label>
          <select
            id="representante"
            value={dados.representanteId ?? ''}
            onChange={(e) =>
              mudar({ representanteId: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">sem representante</option>
            {representantes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="observacoes">Observações</label>
        <textarea
          id="observacoes"
          rows={3}
          value={dados.observacoes || ''}
          onChange={(e) => mudar({ observacoes: e.target.value })}
        />
      </div>

      {erro && <p className="aviso">{erro}</p>}

      <button onClick={salvar} disabled={salvando || !dados.nome.trim()}>
        {salvando ? 'Criando…' : 'Criar cliente e vincular'}
      </button>
      <button className="secundario" onClick={aoCancelar} disabled={salvando}>
        Cancelar
      </button>
      <p className="apagado">
        O cliente também é criado no Gestão Click, como na tela de clientes do Mischa OS.
      </p>
    </div>
  );
}
