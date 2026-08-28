/**
 * Datas no fuso de quem está usando o sistema.
 *
 * `new Date().toISOString()` converte para UTC antes de recortar a data. No
 * Brasil (UTC-3) isso significa que, das 21h em diante, "hoje" já vira a data
 * de amanhã — e a partir daí toda tela que pergunta "o que é de hoje?" olha
 * para o dia errado. O erro é silencioso: só aparece à noite, e some de manhã.
 *
 * Aqui a data é montada a partir dos componentes locais do relógio, que é o
 * que o usuário enxerga no calendário dele.
 */

/** Hoje em `yyyy-mm-dd`, pelo relógio local. */
export const hojeISO = (): string => isoLocal(new Date());

/** Converte uma data em `yyyy-mm-dd` sem passar por UTC. */
export const isoLocal = (d: Date): string => {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

/**
 * Lê `yyyy-mm-dd` como meia-noite LOCAL.
 *
 * `new Date("2026-08-27")` é interpretado como meia-noite em UTC — que no
 * Brasil é 21h do dia 26. Daí um vencimento de hoje parecer de ontem. Com o
 * `T00:00:00` explícito, o navegador lê como hora local.
 */
export const dataLocalDeISO = (iso: string): Date => new Date(`${iso}T00:00:00`);
