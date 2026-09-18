/**
 * Painel lateral do Mischa OS dentro do WhatsApp.
 *
 * Só lê o Mischa OS e escreve texto na caixa de digitação. Não envia mensagem,
 * não mexe na tela do WhatsApp e não grava nada no Gestão Click.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@ext/lib/supabase';
import { useChatAberto, inserirNaCaixa, pedirDiagnostico } from './useChatAberto';
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
import Vincular from './Vincular';

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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  const recarregarCadastro = useCallback(async () => {
    try {
      const [cs, vs] = await Promise.all([listarClientesAtivos(), listarVinculos()]);
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

  const vincular = async (clienteId: string) => {
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

  const testarEscrita = async () => {
    const ok = await inserirNaCaixa('Teste do painel do Mischa OS — nada foi enviado.');
    setRecado(ok ? 'Escrevi na caixa. Confira e apague.' : 'Não consegui escrever na caixa.');
  };

  if (erro) return <p className="aviso">{erro}</p>;
  if (carregando) return <p className="apagado">Carregando o cadastro…</p>;

  return (
    <>
      {achado && !trocando ? (
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
        </>
      )}

      <button className="secundario" onClick={testarEscrita}>Escrever um teste na caixa</button>
      {recado && <p className="apagado">{recado}</p>}

      <Diagnostico />
    </>
  );
}

export default function App() {
  const [logado, setLogado] = useState<boolean | null>(null);
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
        <span className="ponto" />
        Mischa OS
        <button className="secundario estreito tema" onClick={trocar} title="trocar o tema do painel">
          {tema === 'claro' ? 'escuro' : 'claro'}
        </button>
      </div>

      {logado ? <Conversa /> : <Login />}
      {logado && (
        <button className="secundario" onClick={() => supabase.auth.signOut()}>Sair</button>
      )}
    </div>
  );
}
