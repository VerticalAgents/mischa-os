/**
 * Criar cliente — no Mischa OS e, junto, no Gestão Click.
 *
 * A sincronia com o Gestão Click **não é do banco**: ela mora no código. Quem
 * inserir direto na tabela `clientes` cria um cliente que não emite nota nem
 * boleto, e ninguém percebe até a primeira venda. Por isso a regra vive aqui, e
 * tanto a tela de clientes quanto a extensão do WhatsApp passam por este
 * arquivo.
 *
 * A sincronia é **não bloqueante**, como sempre foi: se o Gestão Click estiver
 * fora do ar, o cliente é criado assim mesmo e o retorno diz que faltou o ERP.
 * Perder o cadastro porque um sistema de fora caiu seria pior.
 */
import { supabase } from '@/integrations/supabase/client';

export interface DadosParaGestaoClick {
  nome: string;
  tipo_pessoa?: string;
  cnpj_cpf?: string | null;
  inscricao_estadual?: string | null;
  endereco?: string | null;
  contato_nome?: string | null;
  contato_telefone?: string | null;
  contato_email?: string | null;
  observacoes?: string | null;
}

export interface ResultadoDaSincronia {
  /** O id do cliente no Gestão Click, quando deu certo. */
  gestaoclickClienteId: string | null;
  /** Por que não deu, quando não deu. Null quando deu certo. */
  motivo: string | null;
}

/**
 * Cria o cliente correspondente no Gestão Click e guarda o id no cadastro.
 *
 * Quando a integração não está configurada nesta conta, devolve o motivo em vez
 * de estourar: é situação normal para quem não é o dono.
 */
export async function sincronizarClienteComGestaoClick(
  clienteId: string,
  dados: DadosParaGestaoClick
): Promise<ResultadoDaSincronia> {
  try {
    const { data: configData } = await supabase
      .from('integracoes_config')
      .select('config')
      .eq('integracao', 'gestaoclick')
      .maybeSingle();

    const config = (configData?.config || {}) as { access_token?: string };
    if (!config.access_token) {
      return { gestaoclickClienteId: null, motivo: 'Gestão Click não configurado nesta conta' };
    }

    const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
      body: {
        action: 'criar_cliente_gc',
        nome: dados.nome,
        tipo_pessoa: dados.tipo_pessoa || 'PJ',
        cnpj_cpf: dados.cnpj_cpf,
        inscricao_estadual: dados.tipo_pessoa === 'PJ' ? dados.inscricao_estadual : undefined,
        endereco: dados.endereco,
        contato_nome: dados.contato_nome,
        contato_telefone: dados.contato_telefone,
        contato_email: dados.contato_email,
        observacoes: dados.observacoes,
      },
    });

    if (error) return { gestaoclickClienteId: null, motivo: error.message };
    if (!data?.success || !data?.gestaoclick_cliente_id) {
      return { gestaoclickClienteId: null, motivo: data?.error || 'o Gestão Click não devolveu o id' };
    }

    const gestaoclickClienteId = String(data.gestaoclick_cliente_id);

    await supabase
      .from('clientes')
      .update({ gestaoclick_cliente_id: gestaoclickClienteId })
      .eq('id', clienteId);

    return { gestaoclickClienteId, motivo: null };
  } catch (e) {
    return { gestaoclickClienteId: null, motivo: String((e as Error).message || e) };
  }
}

export interface PrecoPorCategoria {
  categoria_id: number;
  preco_unitario: number;
}

export interface EntradaNovoCliente {
  nome: string;
  tipoPessoa?: 'PJ' | 'PF';
  cnpjCpf?: string | null;
  inscricaoEstadual?: string | null;
  enderecoEntrega?: string | null;
  linkGoogleMaps?: string | null;
  instrucoesEntrega?: string | null;
  contatoNome?: string | null;
  contatoTelefone?: string | null;
  contatoEmail?: string | null;
  quantidadePadrao?: number;
  periodicidadePadrao?: number;
  categoriasHabilitadas?: number[];
  precos?: PrecoPorCategoria[];
  tipoLogistica?: string;
  tipoCobranca?: string;
  formaPagamento?: string;
  prazoPagamentoDias?: number;
  emiteNotaFiscal?: boolean;
  representanteId?: number | null;
  observacoes?: string | null;
}

export interface ResultadoNovoCliente {
  clienteId: string;
  gestaoclickClienteId: string | null;
  /** Preenchido quando o cliente nasceu sem o Gestão Click. */
  avisoGestaoClick: string | null;
}

/**
 * Os padrões do cadastro, iguais aos da tela de clientes
 * (`createSafeClienteDefaults`): cliente novo nasce ativo, entrega própria,
 * à vista no boleto com 7 dias, e contando para o giro médio.
 */
export async function criarCliente(entrada: EntradaNovoCliente): Promise<ResultadoNovoCliente> {
  const nome = entrada.nome?.trim();
  if (!nome) throw new Error('O cliente precisa de um nome.');

  const linha = {
    nome,
    tipo_pessoa: entrada.tipoPessoa || 'PJ',
    cnpj_cpf: entrada.cnpjCpf || null,
    inscricao_estadual: entrada.inscricaoEstadual || null,
    endereco_entrega: entrada.enderecoEntrega || null,
    link_google_maps: entrada.linkGoogleMaps || null,
    instrucoes_entrega: entrada.instrucoesEntrega || null,
    contato_nome: entrada.contatoNome || null,
    contato_telefone: entrada.contatoTelefone || null,
    contato_email: entrada.contatoEmail || null,
    quantidade_padrao: entrada.quantidadePadrao ?? 0,
    periodicidade_padrao: entrada.periodicidadePadrao ?? 7,
    categorias_habilitadas: (entrada.categoriasHabilitadas || []) as never,
    tipo_logistica: entrada.tipoLogistica || 'Própria',
    tipo_cobranca: entrada.tipoCobranca || 'À vista',
    forma_pagamento: entrada.formaPagamento || 'Boleto',
    prazo_pagamento_dias: entrada.prazoPagamentoDias ?? 7,
    emite_nota_fiscal: entrada.emiteNotaFiscal ?? true,
    representante_id: entrada.representanteId ?? null,
    observacoes: entrada.observacoes || null,
    status_cliente: 'Ativo',
    ativo: true,
    contabilizar_giro_medio: true,
    meta_giro_semanal: 0,
    giro_medio_semanal: 0,
  };

  const { data, error } = await supabase.from('clientes').insert(linha).select('id').single();
  if (error) throw error;

  const clienteId = data.id as string;

  // Preço por categoria. Sem ele, a venda cai num valor de reserva que não é o
  // preço combinado — por isso vale gravar junto com o cadastro.
  if (entrada.precos?.length) {
    const { error: erroPreco } = await supabase.from('precos_categoria_cliente').insert(
      entrada.precos.map((p) => ({
        cliente_id: clienteId,
        categoria_id: p.categoria_id,
        preco_unitario: p.preco_unitario,
      }))
    );
    if (erroPreco) throw erroPreco;
  }

  const sincronia = await sincronizarClienteComGestaoClick(clienteId, {
    nome,
    tipo_pessoa: linha.tipo_pessoa,
    cnpj_cpf: linha.cnpj_cpf,
    inscricao_estadual: linha.inscricao_estadual,
    endereco: linha.endereco_entrega,
    contato_nome: linha.contato_nome,
    contato_telefone: linha.contato_telefone,
    contato_email: linha.contato_email,
    observacoes: linha.observacoes,
  });

  return {
    clienteId,
    gestaoclickClienteId: sincronia.gestaoclickClienteId,
    avisoGestaoClick: sincronia.motivo,
  };
}
