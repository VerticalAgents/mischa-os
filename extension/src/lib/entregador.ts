/**
 * A conversa com o entregador.
 *
 * O WhatsApp da empresa não fala só com cliente: fala com entregador,
 * fornecedor, parceiro e representante. Quando a conversa é de um entregador, o
 * painel não tem ficha de cliente para mostrar — tem a **rota do dia**.
 *
 * O que ele precisa responder, na ordem em que a conversa acontece: o que sai
 * hoje, o que já foi entregue, e quanto se deve a ele na semana.
 */
import { supabase } from './supabase';
import { confirmarEntrega } from '@/services/expedicao/etapasDoPedido';

/**
 * `contatos_externos` é tabela nova e o `types.ts` do app é gerado pelo Lovable
 * — até ele regerar, o TypeScript não conhece o nome dela. Este atalho vale só
 * para esta tabela; o resto do arquivo continua tipado.
 */
const semTipos = supabase as unknown as {
  from: (tabela: string) => {
    select: (colunas: string, opcoes?: unknown) => any;
    insert: (linha: unknown) => any;
    eq: (coluna: string, valor: unknown) => any;
  };
};

export interface ContatoExterno {
  id: string;
  nome: string;
  tipo: 'entregador' | 'fornecedor' | 'parceiro' | 'representante';
  telefone: string | null;
  valor_por_entrega: number | null;
}

export interface ParadaDaRota {
  agendamentoId: string;
  clienteId: string;
  cliente: string;
  endereco: string | null;
  instrucoes: string | null;
  maps: string | null;
  quantidade: number;
  etapa: 'Agendado' | 'Separado' | 'Despachado';
  entregue: boolean;
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function listarContatos(tipo?: ContatoExterno['tipo']): Promise<ContatoExterno[]> {
  let consulta = semTipos
    .from('contatos_externos')
    .select('id, nome, tipo, telefone, valor_por_entrega')
    .eq('ativo', true)
    .order('nome');

  if (tipo) consulta = consulta.eq('tipo', tipo);

  const { data, error } = await consulta;
  if (error) throw error;
  return (data || []) as ContatoExterno[];
}

export async function criarContato(dados: {
  nome: string;
  tipo: ContatoExterno['tipo'];
  telefone?: string | null;
}): Promise<string> {
  const { data, error } = await semTipos
    .from('contatos_externos')
    .insert({ nome: dados.nome.trim(), tipo: dados.tipo, telefone: dados.telefone || null })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

/**
 * As entregas de hoje.
 *
 * Só o que está confirmado (status Agendado): previsto não confirmado não entra
 * em rota — o cliente ainda não disse que quer.
 */
export async function rotaDoDia(dia = iso(new Date())): Promise<ParadaDaRota[]> {
  const { data, error } = await supabase
    .from('agendamentos_clientes')
    .select(
      'id, cliente_id, quantidade_total, substatus_pedido, clientes!inner(nome, endereco_entrega, instrucoes_entrega, link_google_maps, ativo)'
    )
    .eq('status_agendamento', 'Agendado')
    .eq('data_proxima_reposicao', dia)
    .eq('clientes.ativo', true);

  if (error) throw error;

  const linhas = (data || []) as unknown as {
    id: string;
    cliente_id: string;
    quantidade_total: number | null;
    substatus_pedido: ParadaDaRota['etapa'] | null;
    clientes: {
      nome: string;
      endereco_entrega: string | null;
      instrucoes_entrega: string | null;
      link_google_maps: string | null;
    };
  }[];

  // Quem já foi entregue hoje sai do "falta" e entra no "feito". A entrega
  // confirmada some do agendamento do dia (o ciclo reinicia), então o que conta
  // é o histórico.
  const { data: entregasHoje } = await supabase
    .from('historico_entregas')
    .select('cliente_id')
    .eq('tipo', 'entrega')
    .gte('data', `${dia}T00:00:00`)
    .lte('data', `${dia}T23:59:59`);

  const jaEntregues = new Set(
    ((entregasHoje || []) as { cliente_id: string }[]).map((e) => e.cliente_id)
  );

  return linhas
    .map((l) => ({
      agendamentoId: l.id,
      clienteId: l.cliente_id,
      cliente: l.clientes.nome,
      endereco: l.clientes.endereco_entrega,
      instrucoes: l.clientes.instrucoes_entrega,
      maps: l.clientes.link_google_maps,
      quantidade: l.quantidade_total ?? 0,
      etapa: l.substatus_pedido || 'Agendado',
      entregue: jaEntregues.has(l.cliente_id),
    }))
    .sort((a, b) => a.cliente.localeCompare(b.cliente));
}

/** O texto da rota, para mandar no WhatsApp. */
export function textoDaRota(paradas: ParadaDaRota[], dia = new Date()): string {
  if (!paradas.length) return 'Hoje não tem entrega';

  const data = dia.toLocaleDateString('pt-BR');
  const total = paradas.reduce((s, p) => s + p.quantidade, 0);

  const blocos = paradas.map((p, i) => {
    const linhas = [`*${i + 1}. ${p.cliente}* · ${p.quantidade} un`];
    if (p.endereco) linhas.push(p.endereco);
    if (p.instrucoes) linhas.push(p.instrucoes);
    if (p.maps) linhas.push(p.maps);
    return linhas.join('\n');
  });

  return [
    `*Rota de ${data}* · ${paradas.length} parada(s) · ${total} un`,
    '',
    blocos.join('\n\n'),
  ].join('\n');
}

/** Confirma a entrega de uma parada. Mesmo caminho da expedição do app. */
export async function confirmarParada(agendamentoId: string, observacao?: string) {
  await confirmarEntrega({ agendamentoId, dataEntrega: new Date(), observacao });
}

export interface ContaDoEntregador {
  entregas: number;
  valor: number | null;
  desde: string;
}

/**
 * Quanto se deve ao entregador na semana.
 *
 * Conta as entregas confirmadas desde segunda. O valor por entrega vem do
 * cadastro do contato — se estiver em branco, o painel mostra só a contagem, em
 * vez de inventar um preço.
 */
export async function contaDaSemana(contato: ContatoExterno): Promise<ContaDoEntregador> {
  const segunda = new Date();
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));
  const desde = iso(segunda);

  const { count } = await supabase
    .from('historico_entregas')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'entrega')
    .gte('data', `${desde}T00:00:00`);

  const entregas = count ?? 0;

  return {
    entregas,
    valor: contato.valor_por_entrega ? entregas * Number(contato.valor_por_entrega) : null,
    desde,
  };
}
