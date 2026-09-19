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
  valor_coleta: number | null;
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
  /** Null quando é cliente da Mischa's, sem representante. */
  representanteId: number | null;
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function listarContatos(tipo?: ContatoExterno['tipo']): Promise<ContatoExterno[]> {
  let consulta = semTipos
    .from('contatos_externos')
    .select('id, nome, tipo, telefone, valor_por_entrega, valor_coleta')
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
      'id, cliente_id, quantidade_total, substatus_pedido, clientes!inner(nome, endereco_entrega, instrucoes_entrega, link_google_maps, representante_id, ativo)'
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
      representante_id: number | null;
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
      representanteId: l.clientes.representante_id ?? null,
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
  /** Dias com entrega: cada um tem uma coleta na fábrica, paga à parte. */
  diasComColeta: number;
  valorEntregas: number | null;
  valorColetas: number | null;
  total: number | null;
  desde: string;
}

/**
 * Quanto se deve ao entregador na semana.
 *
 * A conta tem duas partes, combinadas com o Lucca em 18/09/2026:
 *   - cada entrega vale o valor do cliente, ou o padrão do entregador;
 *   - cada DIA em que houve entrega soma uma coleta na fábrica.
 *
 * Valor em branco no cadastro vira `null` em vez de zero: dizer "R$ 0,00" a
 * pagar seria pior do que dizer que falta cadastrar.
 */
export async function contaDaSemana(contato: ContatoExterno): Promise<ContaDoEntregador> {
  const segunda = new Date();
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));
  const desde = iso(segunda);

  const feitas = await entregasDaSemana(contato.valor_por_entrega);

  const dias = new Set(feitas.map((e) => e.data.slice(0, 10)));
  const valorColeta = contato.valor_coleta ?? contato.valor_por_entrega;

  const temTodosOsValores = feitas.every((e) => e.valor != null);
  const valorEntregas = temTodosOsValores
    ? feitas.reduce((s, e) => s + (e.valor || 0), 0)
    : null;
  const valorColetas = valorColeta != null ? dias.size * Number(valorColeta) : null;

  return {
    entregas: feitas.length,
    diasComColeta: dias.size,
    valorEntregas,
    valorColetas,
    total: valorEntregas != null && valorColetas != null ? valorEntregas + valorColetas : null,
    desde,
  };
}

export interface EntregaFeita {
  id: string;
  clienteId: string;
  cliente: string;
  data: string;
  /** O que essa entrega vale para o entregador. */
  valor: number | null;
}

/**
 * O que já foi entregue desde segunda.
 *
 * É a lista que sustenta o pagamento da semana — e é ela que o Lucca confere
 * quando vai acertar com o entregador.
 */
export async function entregasDaSemana(padrao?: number | null): Promise<EntregaFeita[]> {
  const segunda = new Date();
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));

  // `historico_entregas` não tem chave estrangeira para `clientes`, então o
  // nome do cliente não vem junto: são duas consultas mesmo.
  const { data, error } = await supabase
    .from('historico_entregas')
    .select('id, cliente_id, data')
    .eq('tipo', 'entrega')
    .gte('data', `${iso(segunda)}T00:00:00`)
    .order('data', { ascending: false });

  if (error) throw error;

  const linhas = (data || []) as { id: string; cliente_id: string; data: string }[];
  if (!linhas.length) return [];

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, valor_entrega_personalizado')
    .in('id', [...new Set(linhas.map((l) => l.cliente_id))]);

  // `valor_entrega_personalizado` é coluna nova; o types.ts gerado ainda não a
  // conhece até o Lovable regerar.
  const porId = new Map(
    ((clientes || []) as unknown as {
      id: string;
      nome: string;
      valor_entrega_personalizado: number | null;
    }[]).map((c) => [c.id, c])
  );

  return linhas.map((l) => {
    const cliente = porId.get(l.cliente_id);
    // O cliente manda quando tem valor próprio: Griffe da Beleza é mais barato,
    // The Brothers é bem mais caro por ser longe.
    const personalizado = cliente?.valor_entrega_personalizado;

    return {
      id: l.id,
      clienteId: l.cliente_id,
      cliente: cliente?.nome || 'cliente',
      data: l.data,
      valor:
        personalizado != null
          ? Number(personalizado)
          : padrao != null
            ? Number(padrao)
            : null,
    };
  });
}

/**
 * Quem entrega o quê.
 *
 * A rota do entregador não é necessariamente a base inteira: o Lucca escolhe de
 * quais carteiras ele leva — a da Mischa's (cliente sem representante) e as dos
 * representantes marcados. A escolha fica guardada por entregador no navegador,
 * porque é preferência de uso, não regra de negócio.
 */
export const MISCHAS = 'mischas';

export async function listarCarteiras(): Promise<{ chave: string; nome: string }[]> {
  const { data } = await supabase.from('representantes').select('id, nome').order('nome');

  return [
    { chave: MISCHAS, nome: "Mischa's (direto)" },
    ...((data || []) as { id: number; nome: string }[]).map((r) => ({
      chave: String(r.id),
      nome: r.nome,
    })),
  ];
}

export const carteiraDaParada = (p: ParadaDaRota) =>
  p.representanteId === null ? MISCHAS : String(p.representanteId);

export async function lerCarteirasEscolhidas(contatoId: string): Promise<string[] | null> {
  const chave = `carteiras-${contatoId}`;
  const guardado = await chrome.storage.local.get(chave);
  return (guardado?.[chave] as string[]) ?? null;
}

export async function guardarCarteirasEscolhidas(contatoId: string, carteiras: string[]) {
  await chrome.storage.local.set({ [`carteiras-${contatoId}`]: carteiras });
}
