import { useMemo } from 'react';
import { startOfDay, startOfMonth, endOfMonth, subDays, subMonths, subYears, format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSupabaseHistoricoProducao, HistoricoProducaoSupabase } from './useSupabaseHistoricoProducao';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useSupabaseCategoriasProduto } from './useSupabaseCategoriasProduto';

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
  dias: number;
  meses: number;
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

export const formatarValor = (valor: number, unidade: UnidadeMedida) => {
  if (unidade === 'peso') {
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
  }
  return `${Math.round(valor).toLocaleString('pt-BR')} ${UNIDADE_LABEL[unidade]}`;
};

export const useProducaoDashboard = ({
  dias,
  meses,
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
        data: startOfDay(new Date(record.data_producao)),
        categoriaId,
        categoriaNome,
        formas: record.formas_producidas || 0,
        unidades,
        pesoKg: (unidades * pesoUnit) / 1000,
        temPeso: pesoUnit > 0,
      };
    });
  }, [historico, categoriasDisponiveis, produtoInfo]);

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

  const hoje = useMemo(() => new Date(), [historico]);

  const somaPeriodo = (inicio: Date, fim: Date) =>
    registros
      .filter(r => passaFiltros(r) && r.data >= startOfDay(inicio) && r.data <= fim)
      .reduce((s, r) => s + valorDe(r), 0);

  const registrosPeriodo = useMemo(() => {
    const inicio = startOfDay(subDays(hoje, dias));
    return registros.filter(r => passaFiltros(r) && r.data >= inicio && r.data <= hoje);
  }, [registros, dias, hoje, unidade, categoriasSelecionadas, apenasComProporcao, nomesComProporcao]);

  const kpis = useMemo(() => {
    const total = registrosPeriodo.reduce((s, r) => s + valorDe(r), 0);
    const totalAnterior = somaPeriodo(subDays(hoje, dias * 2), subDays(hoje, dias));
    const variacaoPeriodo = totalAnterior > 0 ? ((total - totalAnterior) / totalAnterior) * 100 : 0;

    const mesAtual = somaPeriodo(startOfMonth(hoje), endOfMonth(hoje));
    const mesAnterior = somaPeriodo(startOfMonth(subMonths(hoje, 1)), endOfMonth(subMonths(hoje, 1)));
    const variacaoMes = mesAnterior > 0 ? ((mesAtual - mesAnterior) / mesAnterior) * 100 : 0;

    const anoPassado = subYears(hoje, 1);
    const mesmoMesAnoPassado = somaPeriodo(startOfMonth(anoPassado), endOfMonth(anoPassado));
    const variacaoAno =
      mesmoMesAnoPassado > 0 ? ((mesAtual - mesmoMesAnoPassado) / mesmoMesAnoPassado) * 100 : 0;

    const semanas = Math.max(dias / 7, 1);
    const mediaSemanal = total / semanas;

    const confirmados = registrosPeriodo.filter(r => r.record.status === 'Confirmado').length;
    const taxaConfirmacao =
      registrosPeriodo.length > 0 ? (confirmados / registrosPeriodo.length) * 100 : 0;

    const comRendimento = registrosPeriodo.filter(
      r => r.record.rendimento_usado && r.record.rendimento_usado > 0
    );
    const rendimentoMedio =
      comRendimento.length > 0
        ? comRendimento.reduce((s, r) => s + (r.record.rendimento_usado || 0), 0) / comRendimento.length
        : 0;

    return {
      total,
      variacaoPeriodo,
      mesAtual,
      variacaoMes,
      mesmoMesAnoPassado,
      variacaoAno,
      mediaSemanal,
      taxaConfirmacao,
      rendimentoMedio,
      totalRegistros: registrosPeriodo.length,
      mesAnoPassadoLabel: format(anoPassado, 'MMM/yy', { locale: ptBR }),
    };
  }, [registrosPeriodo, registros, dias, hoje, unidade]);

  // Série mensal empilhada por categoria
  const serieMensal = useMemo(() => {
    const mesesArr: Date[] = [];
    for (let i = meses - 1; i >= 0; i--) mesesArr.push(startOfMonth(subMonths(hoje, i)));

    return mesesArr.map(mesInicio => {
      const mesFim = endOfMonth(mesInicio);
      const linha: Record<string, any> = {
        mes: format(mesInicio, 'MMM/yy', { locale: ptBR }),
        total: 0,
      };
      categoriasDisponiveis.forEach(c => {
        if (categoriaAtiva(c.id)) linha[c.chave] = 0;
      });

      registros.forEach(r => {
        if (!passaFiltros(r)) return;
        if (!isWithinInterval(r.data, { start: mesInicio, end: mesFim })) return;
        const cat = categoriasDisponiveis.find(c => c.id === r.categoriaId);
        if (!cat) return;
        const valor = valorDe(r);
        linha[cat.chave] = (linha[cat.chave] || 0) + valor;
        linha.total += valor;
      });

      if (unidade === 'peso') {
        Object.keys(linha).forEach(k => {
          if (k !== 'mes' && typeof linha[k] === 'number') {
            linha[k] = Number(linha[k].toFixed(1));
          }
        });
      }

      return linha;
    });
  }, [registros, meses, hoje, unidade, categoriasDisponiveis, categoriasSelecionadas, apenasComProporcao, nomesComProporcao]);

  // Quebra por categoria
  const porCategoria = useMemo<QuebraItem[]>(() => {
    const mapa = new Map<number, QuebraItem>();
    registrosPeriodo.forEach(r => {
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
  }, [registrosPeriodo, categoriasDisponiveis, unidade]);

  // Quebra por produto
  const porProduto = useMemo<QuebraItem[]>(() => {
    const mapa = new Map<string, QuebraItem>();
    registrosPeriodo.forEach(r => {
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
  }, [registrosPeriodo, categoriasDisponiveis, unidade]);

  // Produtos sem peso cadastrado (ignorados no modo peso)
  const produtosSemPeso = useMemo(() => {
    if (unidade !== 'peso') return [];
    const nomes = new Set<string>();
    const inicio = startOfDay(subDays(hoje, dias));
    registros.forEach(r => {
      if (r.temPeso) return;
      if (!categoriaAtiva(r.categoriaId)) return;
      if (r.data < inicio || r.data > hoje) return;
      nomes.add(r.record.produto_nome);
    });
    return Array.from(nomes);
  }, [registros, unidade, dias, hoje, categoriasSelecionadas]);

  return {
    loading: loadingHistorico || loadingProdutos,
    categoriasDisponiveis,
    kpis,
    serieMensal,
    porCategoria,
    porProduto,
    produtosSemPeso,
  };
};
