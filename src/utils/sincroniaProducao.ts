// Compara a producao do unno-estoque com o historico de producao do Mischa OS.
//
// E a mesma regra de mischas/automacoes/mischaos_sync/sync.py (funcao `comparar`), que
// roda pelo terminal na /sincronizar-producao. As duas tem de dar o mesmo resultado:
// mudou a regra em uma, mude na outra. O teste ao lado espelha
// mischas/tests/test_mischaos_sync.py.
//
// Regras que o Lucca definiu (12/10/2026): so producao (entrega e agendamento ficam
// de fora), producao cheia sem descontar descarte, e nada aqui apaga registro.

export interface SessaoUnno {
  sessao: string;
  data: string; // AAAA-MM-DD
  status: string; // planejada | aberta | fechada | cancelada
  ficha: string;
  formas: number;
}

export interface ProdutoMischaOS {
  id: string;
  nome: string;
  rendimento: number | null;
}

export interface RegistroMischaOS {
  id: string;
  data: string; // AAAA-MM-DD
  produto_id: string | null;
  produto_nome: string;
  formas: number;
}

export interface ProducaoFaltando {
  data: string;
  produto_id: string;
  produto: string;
  formas: number;
  rendimento: number;
  unidades: number;
  sessoes: string[];
}

export interface PlanoSincronia {
  // Existe no unno-estoque e nao no Mischa OS.
  criar: ProducaoFaltando[];
  // Mesmo dia e produto, formas diferentes, um registro so.
  corrigir: (ProducaoFaltando & { id: string; de: number })[];
  // Formas diferentes e mais de um registro no dia: nao da para saber qual mexer.
  perguntar: (ProducaoFaltando & { noMischaOS: number[] })[];
  // Registro no Mischa OS, de produto que o unno-estoque cobre, num dia sem sessao.
  sobrando: { id: string; data: string; produto: string; formas: number; futuro: boolean }[];
  // Ficha do unno-estoque sem produto de mesmo nome no Mischa OS.
  semProduto: { ficha: string; formas: number; dias: string[] }[];
}

// Dali para tras ninguem conferiu: a regularizacao de 12/10/2026 partiu de 14/09.
export const PISO = '2026-09-14';
export const JANELA_DIAS = 45;

const iso = (d: Date) => {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

// Nomes casam sem diferenca de maiuscula nem de espaco sobrando. Acento conta.
const chave = (nome: string) => (nome || '').split(/\s+/).filter(Boolean).join(' ').toLowerCase();

export const desdePadrao = (hoje: Date) => {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - JANELA_DIAS);
  const janela = iso(inicio);
  return janela > PISO ? janela : PISO;
};

export function compararProducao(
  unno: SessaoUnno[],
  produtosMischaOS: ProdutoMischaOS[],
  producao: RegistroMischaOS[],
  hoje: Date,
  desde: string = desdePadrao(hoje)
): PlanoSincronia {
  const hojeIso = iso(hoje);
  const produtos = new Map(produtosMischaOS.map(p => [chave(p.nome), p]));

  const feito = new Map<string, { data: string; produto: ProdutoMischaOS; formas: number; sessoes: string[] }>();
  const semProduto = new Map<string, { ficha: string; formas: number; dias: string[] }>();
  const cobertos = new Set<string>();

  for (const l of unno) {
    const p = produtos.get(chave(l.ficha));
    if (p) cobertos.add(p.id);
    // Planejada ainda nao foi ao forno; cancelada nunca foi. A de hoje, aberta,
    // pode mudar de forma.
    if (l.status === 'planejada' || l.status === 'cancelada') continue;
    if (l.data < desde || l.data > hojeIso) continue;
    if (l.data === hojeIso && l.status !== 'fechada') continue;

    if (!p) {
      const s = semProduto.get(l.ficha) || { ficha: l.ficha, formas: 0, dias: [] };
      s.formas += l.formas;
      if (!s.dias.includes(l.data)) s.dias.push(l.data);
      semProduto.set(l.ficha, s);
      continue;
    }

    const k = `${l.data}|${p.id}`;
    const f = feito.get(k) || { data: l.data, produto: p, formas: 0, sessoes: [] };
    f.formas += l.formas;
    if (!f.sessoes.includes(l.sessao)) f.sessoes.push(l.sessao);
    feito.set(k, f);
  }

  const lancado = new Map<string, RegistroMischaOS[]>();
  for (const r of producao) {
    if (r.data < desde || !r.produto_id) continue;
    const k = `${r.data}|${r.produto_id}`;
    lancado.set(k, [...(lancado.get(k) || []), r]);
  }

  const plano: PlanoSincronia = {
    criar: [],
    corrigir: [],
    perguntar: [],
    sobrando: [],
    semProduto: [...semProduto.values()].sort((a, b) => a.ficha.localeCompare(b.ficha)),
  };

  const ordenados = [...feito.entries()].sort(
    ([, a], [, b]) => a.data.localeCompare(b.data) || a.produto.nome.localeCompare(b.produto.nome)
  );

  for (const [k, f] of ordenados) {
    const rendimento = Math.trunc(Number(f.produto.rendimento) || 0);
    const base: ProducaoFaltando = {
      data: f.data,
      produto_id: f.produto.id,
      produto: f.produto.nome,
      formas: f.formas,
      rendimento,
      unidades: f.formas * rendimento,
      sessoes: f.sessoes,
    };
    const regs = lancado.get(k) || [];
    if (regs.length === 0) {
      plano.criar.push(base);
    } else if (regs.reduce((s, r) => s + r.formas, 0) !== f.formas) {
      if (regs.length === 1) {
        plano.corrigir.push({ ...base, id: regs[0].id, de: regs[0].formas });
      } else {
        plano.perguntar.push({ ...base, noMischaOS: regs.map(r => r.formas) });
      }
    }
  }

  for (const [k, regs] of [...lancado.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const produtoId = k.split('|')[1];
    if (!cobertos.has(produtoId) || feito.has(k)) continue;
    for (const r of regs) {
      plano.sobrando.push({
        id: r.id,
        data: r.data,
        produto: r.produto_nome,
        formas: r.formas,
        futuro: r.data > hojeIso,
      });
    }
  }

  return plano;
}

// Mesmo formato que a skill grava, para o "desfazer" dela enxergar o que entrou pelo botao.
export const marcaDoLote = (lote: string) => `[sync-${lote}]`;

export const observacaoDoLote = (sessoes: string[], lote: string) =>
  `${sessoes.join(', ')} (unno-estoque) ${marcaDoLote(lote)}`;

// AAAAMMDD-HHMMSS, igual ao sync.py.
export const novoLote = (agora: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${agora.getFullYear()}${p(agora.getMonth() + 1)}${p(agora.getDate())}` +
    `-${p(agora.getHours())}${p(agora.getMinutes())}${p(agora.getSeconds())}`
  );
};
