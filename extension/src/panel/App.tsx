/**
 * Painel lateral do Mischa OS dentro do WhatsApp.
 *
 * Só lê o Mischa OS e escreve texto na caixa de digitação. Não envia mensagem,
 * não mexe na tela do WhatsApp e não grava nada no Gestão Click.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@ext/lib/supabase';
import { useChatAberto, pedirDiagnostico } from './useChatAberto';
import { normalizarTelefoneBR } from '@/utils/telefone';
import {
  resolverCliente,
  type ClienteDaConversa,
  type ClienteResumido,
  type VinculoWhatsapp,
} from '@ext/lib/resolverCliente';
import { listarClientesAtivos, listarVinculos, vincularConversa } from '@ext/lib/queries';
import PainelCliente from './PainelCliente';
import { useTema } from './useTema';
import Icone from './Icone';
import Vincular from './Vincular';
import NovoCliente from './NovoCliente';
import Filas from './Filas';
import PainelEntregador from './PainelEntregador';
import { listarContatos, criarContato, type ContatoExterno } from '@ext/lib/entregador';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntrando(true);
    setErro(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro('E-mail ou senha não conferem.');

    setEntrando(false);
  };

  return (
    <form className="campos" onSubmit={entrar}>
      <h1 className="titulo">Entrar no Mischa OS</h1>
      <div>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
      </div>
      {erro && <p className="aviso">{erro}</p>}
      <button type="submit" disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}

/**
 * A fotografia da tela do WhatsApp.
 *
 * Fica só onde ainda serve: quando o painel não reconhece a conversa. É o
 * sintoma de o WhatsApp ter mudado o site, e é aí que alguém precisa ver o que
 * a extensão está enxergando.
 */
function Diagnostico() {
  const [dados, setDados] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const rodar = async () => {
    setDados(JSON.stringify(await pedirDiagnostico(), null, 2));
    setCopiado(false);
  };

  return (
    <details className="campos">
      <summary className="apagado">Diagnóstico da tela</summary>
      <button className="secundario" onClick={rodar}>Ler a tela do WhatsApp</button>
      {dados && (
        <>
          <pre className="diagnostico">{dados}</pre>
          <button
            className="secundario"
            onClick={async () => {
              await navigator.clipboard.writeText(dados);
              setCopiado(true);
            }}
          >
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </>
      )}
    </details>
  );
}

function Conversa() {
  const { chat, estado } = useChatAberto();

  const [clientes, setClientes] = useState<ClienteResumido[]>([]);
  const [vinculos, setVinculos] = useState<VinculoWhatsapp[]>([]);
  const [achado, setAchado] = useState<ClienteDaConversa | null>(null);
  const [trocando, setTrocando] = useState(false);
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [contatos, setContatos] = useState<ContatoExterno[]>([]);
  const [novoEntregador, setNovoEntregador] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregarCadastro = useCallback(async () => {
    try {
      const [cs, vs, contatosExternos] = await Promise.all([
        listarClientesAtivos(),
        listarVinculos(),
        listarContatos().catch(() => [] as ContatoExterno[]),
      ]);
      setContatos(contatosExternos);
      setClientes(cs);
      setVinculos(vs);
      return { cs, vs };
    } catch (e) {
      setErro(String((e as Error).message || e));
      return { cs: [], vs: [] };
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregarCadastro();
  }, [recarregarCadastro]);

  // Trocou de conversa: refaz o reconhecimento e sai da tela de vínculo.
  useEffect(() => {
    if (!chat) {
      setAchado(null);
      return;
    }
    setTrocando(false);
    setCriandoCliente(false);
    setAchado(resolverCliente(chat, vinculos, clientes));
  }, [chat, vinculos, clientes]);

  if (estado === 'carregando') return <p className="apagado">Procurando o WhatsApp…</p>;
  if (estado === 'sem-whatsapp') return <p className="apagado">Abra o WhatsApp Web nesta aba.</p>;

  if (estado === 'sem-conversa') {
    return (
      <>
        <p className="apagado">Abra uma conversa.</p>
        <Diagnostico />
      </>
    );
  }

  const telefone = normalizarTelefoneBR(chat?.telefone).e164;

  /** A conversa é de um entregador, fornecedor, parceiro ou representante? */
  const contatoDaConversa = (() => {
    if (!chat) return null;
    const v = vinculos.find(
      (x) =>
        x.contato_id &&
        ((x.lid && x.lid === chat.lid) ||
          (x.telefone_e164 && x.telefone_e164 === telefone) ||
          (x.chat_titulo && x.chat_titulo.toLowerCase() === (chat.titulo || '').toLowerCase()))
    );
    return v ? contatos.find((c) => c.id === v.contato_id) || null : null;
  })();

  const vincularContato = async (contatoId: string) => {
    await vincularConversa({
      contatoId,
      chatTitulo: chat?.titulo ?? null,
      telefoneE164: telefone,
      lid: chat?.lid ?? null,
    });
    await recarregarCadastro();
    setNovoEntregador(false);
  };

  const vincular = async (clienteId: string) => {
    // Sem título, telefone e lid não há o que guardar: o vínculo nasceria
    // apontando para lugar nenhum e o painel nunca mais reconheceria a conversa.
    if (!chat?.titulo && !telefone && !chat?.lid) {
      throw new Error('não consegui ler nem o nome da conversa nem o telefone');
    }

    await vincularConversa({
      clienteId,
      chatTitulo: chat?.titulo ?? null,
      telefoneE164: telefone,
      lid: chat?.lid ?? null,
    });

    const { cs, vs } = await recarregarCadastro();
    setTrocando(false);
    if (chat) setAchado(resolverCliente(chat, vs, cs));
  };

  if (erro) return <p className="aviso">{erro}</p>;
  if (carregando) return <p className="apagado">Carregando o cadastro…</p>;

  return (
    <>
      {contatoDaConversa ? (
        <PainelEntregador contato={contatoDaConversa} />
      ) : criandoCliente ? (
        <NovoCliente
          nomeSugerido={chat?.titulo ?? null}
          telefone={telefone}
          aoCriar={async (clienteId) => {
            await vincular(clienteId);
            setCriandoCliente(false);
          }}
          aoCancelar={() => setCriandoCliente(false)}
        />
      ) : achado && !trocando ? (
        <PainelCliente
          clienteId={achado.clienteId}
          comoAchou={achado.comoAchou}
          aoTrocarCliente={() => setTrocando(true)}
        />
      ) : (
        <>
          {!trocando && (
            <p className="apagado">
              Não reconheci esta conversa. O WhatsApp não mostra mais o telefone, então diga
              uma vez quem é — da próxima vez o painel já sabe.
            </p>
          )}
          <Vincular
            titulo={chat?.titulo ?? null}
            clientes={clientes}
            aoVincular={vincular}
            aoCancelar={trocando ? () => setTrocando(false) : undefined}
          />
          <button className="secundario" onClick={() => setCriandoCliente(true)}>
            É um cliente novo, cadastrar
          </button>

          {/* Nem toda conversa é de cliente: entregador, fornecedor, parceiro
              e representante também passam por aqui. */}
          {!novoEntregador ? (
            <button className="secundario" onClick={() => setNovoEntregador(true)}>
              Não é cliente (entregador, fornecedor…)
            </button>
          ) : (
            <div className="cartao campos">
              <p className="apagado">Quem é nesta conversa?</p>
              {contatos.map((c) => (
                <button key={c.id} className="secundario" onClick={() => vincularContato(c.id)}>
                  {c.nome} · {c.tipo}
                </button>
              ))}
              <button
                className="secundario"
                onClick={async () => {
                  const id = await criarContato({
                    nome: chat?.titulo || 'sem nome',
                    tipo: 'entregador',
                    telefone,
                  });
                  await vincularContato(id);
                }}
              >
                Cadastrar "{chat?.titulo}" como entregador
              </button>
              <button className="secundario" onClick={() => setNovoEntregador(false)}>
                Cancelar
              </button>
            </div>
          )}
        </>
      )}

    </>
  );
}

export default function App() {
  const [logado, setLogado] = useState<boolean | null>(null);
  const [vendo, setVendo] = useState<'conversa' | 'filas'>('conversa');
  const { tema, trocar } = useTema();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogado(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => setLogado(!!sessao));
    return () => data.subscription.unsubscribe();
  }, []);

  if (logado === null) return <div className="painel"><p className="apagado">Carregando…</p></div>;

  return (
    <div className="painel">
      <div className="cabecalho-painel">
        <div className="marca">
          <span className="ponto" />
          Mischa OS
          <button
            className="tema"
            onClick={trocar}
            title={tema === 'claro' ? 'passar para o tema escuro' : 'passar para o tema claro'}
            aria-label={tema === 'claro' ? 'passar para o tema escuro' : 'passar para o tema claro'}
          >
            <Icone nome={tema === 'claro' ? 'lua' : 'sol'} tamanho={15} />
          </button>
        </div>

        {logado && (
          <div className="abas principal">
            <button
              className={`aba ${vendo === 'conversa' ? 'ativa' : ''}`}
              onClick={() => setVendo('conversa')}
            >
              Esta conversa
            </button>
            <button
              className={`aba ${vendo === 'filas' ? 'ativa' : ''}`}
              onClick={() => setVendo('filas')}
            >
              Com quem falar
            </button>
          </div>
        )}
      </div>

      {!logado && <Login />}
      {logado && vendo === 'conversa' && <Conversa />}
      {logado && vendo === 'filas' && <Filas />}

      {logado && (
        <button className="secundario" onClick={() => supabase.auth.signOut()}>Sair</button>
      )}
    </div>
  );
}
