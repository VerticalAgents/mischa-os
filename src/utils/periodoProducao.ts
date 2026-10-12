import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type Granularidade = 'dia' | 'semana' | 'mes';

// Semana comeca na segunda.
const SEMANA = { weekStartsOn: 1 as const };

// Quantos periodos mostrar em cada granularidade. O primeiro e o padrao ao trocar.
export const OPCOES_QUANTIDADE: Record<Granularidade, number[]> = {
  dia: [30, 7, 14, 60],
  semana: [12, 4, 8, 26],
  mes: [6, 3, 12, 24],
};

export const GRANULARIDADE_LABEL: Record<Granularidade, { singular: string; plural: string }> = {
  dia: { singular: 'dia', plural: 'dias' },
  semana: { singular: 'semana', plural: 'semanas' },
  mes: { singular: 'mês', plural: 'meses' },
};

export interface Bucket {
  inicio: Date;
  fim: Date;
  label: string;
  labelLongo: string;
  // Periodo em andamento (contem hoje): aparece no grafico, fica fora das contas.
  parcial: boolean;
}

export interface Janela {
  granularidade: Granularidade;
  buckets: Bucket[];
  fechados: Bucket[];
  inicio: Date;
  fim: Date;
  // Janela imediatamente anterior, com o mesmo numero de periodos fechados.
  anterior: { inicio: Date; fim: Date };
}

// A coluna data_producao e "date" (AAAA-MM-DD, sem hora). new Date() le isso como
// meia-noite em UTC, que no Brasil cai as 21h do dia anterior: a producao do dia 1
// ia parar no mes passado. parseISO le como data local.
export const dataLocal = (valor: string) => startOfDay(parseISO(valor.slice(0, 10)));

const inicioDe = (g: Granularidade, d: Date) =>
  g === 'dia' ? startOfDay(d) : g === 'semana' ? startOfWeek(d, SEMANA) : startOfMonth(d);

const fimDe = (g: Granularidade, d: Date) =>
  g === 'dia' ? endOfDay(d) : g === 'semana' ? endOfWeek(d, SEMANA) : endOfMonth(d);

const somar = (g: Granularidade, d: Date, n: number) =>
  g === 'dia' ? addDays(d, n) : g === 'semana' ? addWeeks(d, n) : addMonths(d, n);

const rotular = (g: Granularidade, inicio: Date, fim: Date) => {
  if (g === 'dia') {
    return {
      label: format(inicio, 'dd/MM', { locale: ptBR }),
      labelLongo: format(inicio, "EEE, dd/MM/yyyy", { locale: ptBR }),
    };
  }
  if (g === 'semana') {
    return {
      label: format(inicio, 'dd/MM', { locale: ptBR }),
      labelLongo: `${format(inicio, 'dd/MM')} a ${format(fim, 'dd/MM/yyyy')}`,
    };
  }
  return {
    label: format(inicio, 'MMM/yy', { locale: ptBR }),
    labelLongo: format(inicio, "MMMM 'de' yyyy", { locale: ptBR }),
  };
};

export interface MontarJanelaParams {
  granularidade: Granularidade;
  quantidade: number;
  // 0 termina no ultimo periodo fechado; +1 inclui o em andamento; negativo volta no tempo.
  deslocamento: number;
  hoje: Date;
}

export const montarJanela = ({
  granularidade,
  quantidade,
  deslocamento,
  hoje,
}: MontarJanelaParams): Janela => {
  const atual = inicioDe(granularidade, hoje);
  const ultimo = somar(granularidade, atual, deslocamento - 1);

  const buckets: Bucket[] = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const inicio = somar(granularidade, ultimo, -i);
    const fim = fimDe(granularidade, inicio);
    buckets.push({
      inicio,
      fim,
      ...rotular(granularidade, inicio, fim),
      parcial: fim >= hoje,
    });
  }

  const fechados = buckets.filter(b => !b.parcial);
  const inicio = buckets[0].inicio;
  const fim = buckets[buckets.length - 1].fim;
  const fimAnterior = fimDe(granularidade, somar(granularidade, inicio, -1));
  const inicioAnterior = somar(granularidade, inicio, -fechados.length);

  return {
    granularidade,
    buckets,
    fechados,
    inicio,
    fim,
    anterior: { inicio: inicioAnterior, fim: fimAnterior },
  };
};

// Ate onde a seta de voltar pode ir: o ultimo periodo da janela nao passa para antes
// do periodo em que esta o primeiro registro.
export const deslocamentoMinimo = (
  granularidade: Granularidade,
  hoje: Date,
  primeiraData: Date | null
) => {
  if (!primeiraData) return 0;
  const diferenca =
    granularidade === 'dia'
      ? differenceInCalendarDays(primeiraData, hoje)
      : granularidade === 'semana'
        ? differenceInCalendarWeeks(primeiraData, hoje, SEMANA)
        : differenceInCalendarMonths(primeiraData, hoje);
  return Math.min(diferenca + 1, 0);
};

// A seta de avancar para no periodo em andamento.
export const DESLOCAMENTO_MAXIMO = 1;

// "abr/26 — set/26" no mes, "29/09 — 05/10/26" em dia e semana.
export const rotuloNavegacao = (janela: Janela) => {
  if (janela.granularidade === 'mes') {
    const primeiro = janela.buckets[0].label;
    const ultimo = janela.buckets[janela.buckets.length - 1].label;
    return primeiro === ultimo ? primeiro : `${primeiro} — ${ultimo}`;
  }
  return `${format(janela.inicio, 'dd/MM')} — ${format(janela.fim, 'dd/MM/yy')}`;
};

// Intervalo que entra nas contas (so os periodos fechados): "01/04 a 30/09/2026".
export const rotuloIntervalo = (janela: Janela) => {
  if (janela.fechados.length === 0) return 'sem período fechado';
  const inicio = janela.fechados[0].inicio;
  const fim = janela.fechados[janela.fechados.length - 1].fim;
  return `${format(inicio, 'dd/MM')} a ${format(fim, 'dd/MM/yyyy')}`;
};
