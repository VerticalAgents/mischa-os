import type { DiaSemana } from '@/types';

/**
 * Horário de recebimento do cliente (Lucca, 15/10/2026), no estilo do Google Meu Negócio:
 * por dia da semana, uma ou mais faixas. Fica em `clientes.horarios_recebimento`.
 *
 * - dia com faixas: recebe só nelas;
 * - dia com lista vazia: recebe o dia todo;
 * - dia que não aparece: não recebe;
 * - null: sem informação (vale o `janelas_entrega`, que só tem os dias).
 *
 * Hora em texto "HH:MM". A ficha do entregador vai ler daqui.
 */

export interface Faixa {
  de: string;
  ate: string;
}

export type HorariosRecebimento = Partial<Record<DiaSemana, Faixa[]>>;

export const DIAS: DiaSemana[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const MAX_FAIXAS = 3;

const NOMES_LONGOS: Record<string, DiaSemana> = {
  domingo: 'Dom',
  segunda: 'Seg',
  terca: 'Ter',
  terça: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
  sábado: 'Sáb',
  sab: 'Sáb',
};

/** "Seg", "segunda", "sexta" → DiaSemana (o janelas_entrega antigo tem os dois jeitos). */
export function normalizarDia(d: string): DiaSemana | null {
  const t = String(d || '').trim();
  if ((DIAS as string[]).includes(t)) return t as DiaSemana;
  return NOMES_LONGOS[t.toLowerCase()] ?? null;
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Lê o que veio do banco; o que não for válido vira null (sem informação). */
export function lerHorarios(valor: unknown): HorariosRecebimento | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
  const saida: HorariosRecebimento = {};
  for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
    const dia = normalizarDia(k);
    if (!dia || !Array.isArray(v)) continue;
    saida[dia] = v
      .filter((f: any) => f && HORA.test(f.de) && HORA.test(f.ate))
      .map((f: any) => ({ de: f.de, ate: f.ate }));
  }
  return Object.keys(saida).length ? saida : null;
}

/** Para começar a editar quem ainda não tem horário: os dias do janelas_entrega, o dia todo. */
export function horariosDosDias(dias: string[] | null | undefined): HorariosRecebimento {
  const saida: HorariosRecebimento = {};
  for (const d of dias || []) {
    const dia = normalizarDia(d);
    if (dia) saida[dia] = [];
  }
  return saida;
}

/** Os dias que recebem, na ordem da semana — para manter o janelas_entrega em dia. */
export function diasQueRecebem(h: HorariosRecebimento | null): DiaSemana[] {
  if (!h) return [];
  return DIAS.filter((d) => Array.isArray(h[d]));
}

export function validarHorarios(h: HorariosRecebimento): string | null {
  for (const dia of DIAS) {
    const faixas = h[dia];
    if (!faixas) continue;
    if (faixas.length > MAX_FAIXAS) return `${dia}: no máximo ${MAX_FAIXAS} faixas.`;
    for (const f of faixas) {
      if (!HORA.test(f.de) || !HORA.test(f.ate)) return `${dia}: preencha as horas.`;
      if (f.de >= f.ate) return `${dia}: o início tem que ser antes do fim (${f.de}–${f.ate}).`;
    }
    const ordenadas = [...faixas].sort((a, b) => a.de.localeCompare(b.de));
    for (let i = 1; i < ordenadas.length; i++) {
      if (ordenadas[i].de < ordenadas[i - 1].ate) return `${dia}: as faixas se sobrepõem.`;
    }
  }
  return null;
}

/** "09:00" → "9h", "14:30" → "14h30". */
export function hora(h: string): string {
  const [hh, mm] = h.split(':');
  return `${Number(hh)}h${mm === '00' ? '' : mm}`;
}

/** Começa 00:00 = "até 12h"; termina 23:59 = "a partir das 14h" (sem hora certa na outra ponta). */
function textoDaFaixa(f: Faixa): string {
  if (f.de === '00:00' && f.ate === '23:59') return 'o dia todo';
  if (f.de === '00:00') return `até ${hora(f.ate)}`;
  if (f.ate === '23:59') return `a partir das ${hora(f.de)}`;
  return `${hora(f.de)}–${hora(f.ate)}`;
}

/** Faixas de um dia em texto: "9h–12h e 14h–16h", "o dia todo". */
export function textoDoDia(faixas: Faixa[] | undefined): string {
  if (!faixas) return 'não recebe';
  if (!faixas.length) return 'o dia todo';
  const partes = [...faixas].sort((a, b) => a.de.localeCompare(b.de)).map(textoDaFaixa);
  return partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

/** Resumo da semana, juntando dias seguidos iguais: "Seg a Sex 9h–12h e 14h–16h · Sáb 9h–12h". */
export function resumoHorarios(h: HorariosRecebimento | null): string {
  if (!h) return '';
  const grupos: { dias: DiaSemana[]; texto: string }[] = [];
  for (const dia of DIAS) {
    if (!h[dia]) continue;
    const texto = textoDoDia(h[dia]);
    const ultimo = grupos[grupos.length - 1];
    const seguido = ultimo && DIAS.indexOf(ultimo.dias[ultimo.dias.length - 1]) === DIAS.indexOf(dia) - 1;
    if (ultimo && seguido && ultimo.texto === texto) ultimo.dias.push(dia);
    else grupos.push({ dias: [dia], texto });
  }
  return grupos
    .map((g) => {
      const nome =
        g.dias.length === 1
          ? g.dias[0]
          : g.dias.length === 2
            ? `${g.dias[0]} e ${g.dias[1]}`
            : `${g.dias[0]} a ${g.dias[g.dias.length - 1]}`;
      return `${nome} ${g.texto}`;
    })
    .join(' · ');
}

const DIA_DA_DATA: DiaSemana[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** O dia da semana de uma data AAAA-MM-DD (sem fuso). */
export function diaDaData(data: string): DiaSemana {
  const [a, m, d] = data.slice(0, 10).split('-').map(Number);
  return DIA_DA_DATA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}

/** O que mostrar no cartão da entrega: "recebe 9h–12h", "não recebe sexta!" ou null sem informação. */
export function horarioNaData(h: HorariosRecebimento | null, data: string | null | undefined): string | null {
  if (!h || !data) return null;
  const faixas = h[diaDaData(data)];
  if (!faixas) return `não recebe ${diaDaData(data)}`;
  if (!faixas.length) return null;
  return `recebe ${textoDoDia(faixas)}`;
}
