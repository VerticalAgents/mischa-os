import { useMemo } from 'react';
import { useSupabaseHistoricoProducao, HistoricoProducaoSupabase } from './useSupabaseHistoricoProducao';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useSupabaseCategoriasProduto } from './useSupabaseCategoriasProduto';
import { dataLocal, Janela } from '@/utils/periodoProducao';

export type UnidadeMedida = 'formas' | 'unidades' | 'peso';

export const SEM_CATEGORIA_ID = -1;

export const UNIDADE_LABEL: Record<UnidadeMedida, string> = {
  formas: 'formas',
  unidades: 'un',
  peso: 'kg',
};

// Paleta por índice de categoria (tokens HSL)
const CORES_CATEGORIA = [
  'hsl(var(--chart-1, 43 96% 56%))',
  'hsl(217 91% 60%)',
  'hsl(142 76% 36%)',
  'hsl(262 83% 58%)',
  'hsl(24 95% 53%)',
  'hsl(199 89% 48%)',
  'hsl(340 82% 52%)',
  'hsl(173 58% 39%)',
];

export interface CategoriaInfo {
  id: number;
  nome: string;
  cor: string;
  chave: string;
}

export interface ProducaoDashboardParams {
  janela: Janela;
  // Periodo clicado no grafico: os quadros de categoria e produto passam a olhar so para ele.
  foco?: { inicio: Date; fim: Date } | null;
  unidade: UnidadeMedida;
  categoriasSelecionadas: number[]; // vazio = todas
  apenasComProporcao?: boolean;
  nomesComProporcao?: Set<string>;
}

export interface QuebraItem {
  id: string;
  nome: string;
  valor: number;
  formas: number;
  unidades: number;
  pesoKg: number;
  percentual: number;
  cor?: string;
  categoriaNome?: string;
}

export interface PeriodoDestaque {
  label: string;
  labelLongo: string;
  valor: number;
}

export interface ProducaoKpis {
  total: number;
  // null = janela anterior sem producao, nao ha com o que comparar
  variacaoTotal: number | null;
  // null = a janela nao inclui periodo em andamento
  emAndamento: number | null;
  periodosFechados: number;
  media: number;
  mediaAnterior: number;
  diasComProducao: number;
  diasNoPeriodo: number;
  porDiaProduzido: number;
  melhor: PeriodoDestaque | null;
  pior: PeriodoDestaque | null;
}

export const formatarValor = (valor: number, unidade: UnidadeMedida) => {
  if (unidade === 'peso') {
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
  }
  return `${Math.round(valor).toLocaleString('pt-BR')} ${UNIDADE_LABEL[unidade]}`;
};

export const useProducaoDashboard = ({
  janela,
  foco = null,
  unidade,
  categoriasSelecionadas,
  apenasComProporcao = false,
  nomesComProporcao,
}: ProducaoDashboardParams) => {
  const { historico, loading: loadingHistorico } = useSupabaseHistoricoProducao();
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();

  // Mapa produto (por id e por nome) -> { categoria_id, peso_unitario, cliente_id }
  const produtoInfo = useMemo(() => {
    const porId = new Map<string, any>();
    const porNome = new Map<string, any>();
    (produtos || []).forEach((p: any) => {
      porId.set(p.id, p);
      if (p.nome) porNome.set(p.nome, p);
    });
    return { porId, porNome };
  }, [produtos]);

  const resolveProduto = (record: HistoricoProducaoSupabase) =>
    (record.produto_id ? produtoInfo.porId.get(record.produto_id) : undefined) ||
    produtoInfo.porNome.get(record.produto_nome);

  // Categorias presentes no histórico (para o filtro), sempre por categoria_id
  const categoriasDisponiveis = useMemo<CategoriaInfo[]>(() => {
    const idsPresentes = new Set<number>();
    (historico || []).forEach(record => {
      const produto = resolveProduto(record);
      idsPresentes.add(produto?.categoria_id ?? SEM_CATEGORIA_ID);
    });

    const lista: CategoriaInfo[] = (categorias || [])
      .filter(c => idsPresentes.has(c.id))
      .map((c, index) => ({
        id: c.id,
        nome: c.nome,
        cor: CORES_CATEGORIA[index % CORES_CATEGORIA.length],
        chave: `cat_${c.id}`,
      }));

    if (idsPresentes.has(SEM_CATEGORIA_ID)) {
      lista.push({
        id: SEM_CATEGORIA_ID,
        nome: 'Sem categoria',
        cor: 'hsl(var(--muted-foreground))',
        chave: `cat_${SEM_CATEGORIA_ID}`,
      });
    }

    return lista;
  }, [historico, categorias, produtoInfo]);

  const categoriaAtiva = (id: number) =>
    categoriasSelecionadas.length === 0 || categoriasSelecionadas.includes(id);

  // Enriquecimento dos registros
  interface RegistroEnriquecido {
    record: HistoricoProducaoSupabase;
    data: Date;
    categoriaId: number;
    categoriaNome: string;
    formas: number;
    unidades: number;
    pesoKg: number;
    temPeso: boolean;
    agendado: boolean;
  }

  const registros = useMemo<RegistroEnriquecido[]>(() => {
    return (historico || []).map(record => {
      const produto = resolveProduto(record);
      const categoriaId = produto?.categoria_id ?? SEM_CATEGORIA_ID;
      const categoriaNome =
        categoriasDisponiveis.find(c => c.id === categoriaId)?.nome || 'Sem categoria';
      const unidades = record.unidades_calculadas || 0;
      const pesoUnit = Number(produto?.peso_unitario) || 0;
      return {
        record,
        data: dataLocal(record.data_producao),
        categoriaId,
        categoriaNome,
        formas: record.formas_producidas || 0,
        unidades,
        pesoKg: (unidades * pesoUnit) / 1000,
        temPeso: pesoUnit > 0,
        agendado: (record.status || 'Registrado') !== 'Confirmado',
      };
    });
  }, [historico, categoriasDisponiveis, produtoInfo]);

  // Primeiro dia com registro: e ate onde a seta de voltar pode ir.
  const primeiraData = useMemo(() => {
    if (registros.length === 0) return null;
    return registros.reduce((min, r) => (r.data < min ? r.data : min), registros[0].data);
  }, [registros]);

  // Ultimo dia com registro: a tela avisa ate quando os dados vao.
  const ultimaData = useMemo(() => {
    if (registros.length === 0) return null;
    return registros.reduce((max, r) => (r.data > max ? r.data : max), registros[0].data);
  }, [registros]);

  const valorDe = (r: RegistroEnriquecido) => {
    if (unidade === 'formas') return r.formas;
    if (unidade === 'unidades') return r.unidades;
    return r.pesoKg;
  };

  const passaFiltros = (r: RegistroEnriquecido) => {
    if (!categoriaAtiva(r.categoriaId)) return false;
    if (unidade === 'peso' && !r.temPeso) return false;
    if (apenasComProporcao && nomesComProporcao && !nomesComProporcao.has(r.record.produto_nome)) {
      return false;
    }
    return true;
  };

  const somaPeriodo = (inicio: Date, fim: Date) =>
    registros
      .filter(r => passaFiltros(r) && r.data >= inicio && r.data <= fim)
      .reduce((s, r) => s + valorDe(r), 0);

  // Intervalo que entra nas contas: so os periodos fechados da janela.
  const intervaloFechado = useMemo(() => {
    if (janela.fechados.length === 0) return null;
    return {
      inicio: janela.fechados[0].inicio,
      fim: janela.fechados[janela.fechados.length - 1].fim,
    };
  }, [janela]);

  const registrosPeriodo = useMemo(() => {
    if (!intervaloFechado) return [];
    return registros.filter(
      r => passaFiltros(r) && r.data >= intervaloFechado.inicio && r.data <= intervaloFechado.fim
    );
  }, [registros, intervaloFechado, unidade, categoriasSelecionadas, apenasComProporcao, nomesComProporcao]);

  // De onde saem os quadros de categoria e produto: do periodo clicado, se houver.
  const registrosQuebra = useMemo(() => {
    if (!foco) return registrosPeriodo;
    return registros.filter(r => passaFiltros(r) && r.data >= foco.inicio && r.data <= foco.fim);
  }, [registros, registrosPeriodo, foco, unidade, categoriasSelecionadas, apenasComProporcao, nomesComProporcao]);

  // Série temporal empilhada por categoria, uma linha por período da janela
  const serie = useMemo(() => {
    return janela.buckets.map(({ inicio, fim, label, labelLongo, parcial }) => {
      const linha: Record<string, any> = { mes: label, labelLongo, total: 0, parcial, agendado: 0 };
      categoriasDisponiveis.forEach(c => {
        if (categoriaAtiva(c.id)) linha[c.chave] = 0;
      });

      registros.forEach(r => {
        if (!passaFiltros(r)) return;
        if (r.data < inicio || r.data > fim) return;
        const cat = categoriasDisponiveis.find(c => c.id === r.categoriaId);
        if (!cat) return;
        const valor = valorDe(r);
        linha[cat.chave] = (linha[cat.chave] || 0) + valor;
        linha.total += valor;
        if (r.agendado) linha.agendado += valor;
      });

      if (unidade === 'peso') {
        Object.keys(linha).forEach(k => {
          if (typeof linha[k] === 'number') linha[k] = Number(linha[k].toFixed(1));
        });
      }

      return linha;
    });
  }, [registros, janela, unidade, categoriasDisponiveis, categoriasSelecionadas, apenasComProporcao, nomesComProporcao]);

  const kpis = useMemo<ProducaoKpis>(() => {
    const periodosFechados = janela.fechados.length;
    const total = registrosPeriodo.reduce((s, r) => s + valorDe(r), 0);
    const totalAnterior =
      periodosFechados > 0 ? somaPeriodo(janela.anterior.inicio, janela.anterior.fim) : 0;
    const variacaoTotal = totalAnterior > 0 ? ((total - totalAnterior) / totalAnterior) * 100 : null;

    const linhasParciais = serie.filter(l => l.parcial);
    const emAndamento =
      linhasParciais.length > 0 ? linhasParciais.reduce((s, l) => s + l.total, 0) : null;

    const diasComProducao = new Set(
      registrosPeriodo.filter(r => valorDe(r) > 0).map(r => r.data.getTime())
    ).size;
    const diasNoPeriodo = intervaloFechado
      ? Math.round((intervaloFechado.fim.getTime() - intervaloFechado.inicio.getTime()) / 86400000)
      : 0;

    // Melhor e pior so entre periodos em que houve producao: fim de semana e
    // feriado zerados nao sao "o pior dia".
    const comProducao = serie.filter(l => !l.parcial && l.total > 0);
    const destaque = (l: Record<string, any>): PeriodoDestaque => ({
      label: l.mes,
      labelLongo: l.labelLongo,
      valor: l.total,
    });
    const melhor = comProducao.length
      ? destaque(comProducao.reduce((a, b) => (b.total > a.total ? b : a)))
      : null;
    const pior =
      comProducao.length > 1
        ? destaque(comProducao.reduce((a, b) => (b.total < a.total ? b : a)))
        : null;

    return {
      total,
      variacaoTotal,
      emAndamento,
      periodosFechados,
      media: periodosFechados > 0 ? total / periodosFechados : 0,
      mediaAnterior: periodosFechados > 0 ? totalAnterior / periodosFechados : 0,
      diasComProducao,
      diasNoPeriodo,
      porDiaProduzido: diasComProducao > 0 ? total / diasComProducao : 0,
      melhor,
      pior,
    };
  }, [registrosPeriodo, registros, serie, janela, intervaloFechado, unidade]);

  // Quebra por categoria
  const porCategoria = useMemo<QuebraItem[]>(() => {
    const mapa = new Map<number, QuebraItem>();
    registrosQuebra.forEach(r => {
      const atual =
        mapa.get(r.categoriaId) ||
        ({
          id: String(r.categoriaId),
          nome: r.categoriaNome,
          valor: 0,
          formas: 0,
          unidades: 0,
          pesoKg: 0,
          percentual: 0,
          cor: categoriasDisponiveis.find(c => c.id === r.categoriaId)?.cor,
        } as QuebraItem);
      atual.valor += valorDe(r);
      atual.formas += r.formas;
      atual.unidades += r.unidades;
      atual.pesoKg += r.pesoKg;
      mapa.set(r.categoriaId, atual);
    });

    const total = Array.from(mapa.values()).reduce((s, c) => s + c.valor, 0);
    return Array.from(mapa.values())
      .map(c => ({ ...c, percentual: total > 0 ? (c.valor / total) * 100 : 0 }))
      .sort((a, b) => b.valor - a.valor);
  }, [registrosQuebra, categoriasDisponiveis, unidade]);

  // Quebra por produto
  const porProduto = useMemo<QuebraItem[]>(() => {
    const mapa = new Map<string, QuebraItem>();
    registrosQuebra.forEach(r => {
      const nome = r.record.produto_nome;
      const atual =
        mapa.get(nome) ||
        ({
          id: nome,
          nome,
          valor: 0,
          formas: 0,
          unidades: 0,
          pesoKg: 0,
          percentual: 0,
          categoriaNome: r.categoriaNome,
          cor: categoriasDisponiveis.find(c => c.id === r.categoriaId)?.cor,
        } as QuebraItem);
      atual.valor += valorDe(r);
      atual.formas += r.formas;
      atual.unidades += r.unidades;
      atual.pesoKg += r.pesoKg;
      mapa.set(nome, atual);
    });

    const total = Array.from(mapa.values()).reduce((s, p) => s + p.valor, 0);
    return Array.from(mapa.values())
      .map(p => ({ ...p, percentual: total > 0 ? (p.valor / total) * 100 : 0 }))
      .sort((a, b) => b.valor - a.valor);
  }, [registrosQuebra, categoriasDisponiveis, unidade]);

  // Produtos sem peso cadastrado (ignorados no modo peso)
  const produtosSemPeso = useMemo(() => {
    if (unidade !== 'peso') return [];
    const nomes = new Set<string>();
    registros.forEach(r => {
      if (r.temPeso) return;
      if (!categoriaAtiva(r.categoriaId)) return;
      if (r.data < janela.inicio || r.data > janela.fim) return;
      nomes.add(r.record.produto_nome);
    });
    return Array.from(nomes);
  }, [registros, unidade, janela, categoriasSelecionadas]);

  return {
    loading: loadingHistorico || loadingProdutos,
    categoriasDisponiveis,
    primeiraData,
    ultimaData,
    kpis,
    serie,
    porCategoria,
    porProduto,
    produtosSemPeso,
  };
};
