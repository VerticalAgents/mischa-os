import { format } from 'date-fns';

// O que a funcao lancar_producao_lote do banco espera de cada linha.
export interface ItemLancamento {
  data: string; // AAAA-MM-DD
  produto_id: string;
  formas: number;
  observacoes?: string;
}

export interface LinhaDia {
  produtoId: string;
  // Texto do campo, como a pessoa digitou. Vazio = nao produziu.
  formas: string;
  // Unidades por forma; null = produto sem rendimento cadastrado.
  rendimento: number | null;
}

// Arredonda para baixo, igual a tela de um produto so e a funcao do banco.
export const unidadesDe = (formas: number, rendimento: number) => Math.floor(formas * rendimento);

// So conta numero inteiro maior que zero: "", "0", "-2", "1,5" e "abc" viram 0.
export const lerFormas = (texto: string) => {
  const limpo = (texto || '').trim();
  if (!/^\d+$/.test(limpo)) return 0;
  return parseInt(limpo, 10);
};

export const linhaValida = (linha: LinhaDia) =>
  lerFormas(linha.formas) > 0 && linha.rendimento !== null && linha.rendimento > 0;

export const montarItens = (data: Date, linhas: LinhaDia[]): ItemLancamento[] =>
  linhas.filter(linhaValida).map(linha => ({
    data: format(data, 'yyyy-MM-dd'),
    produto_id: linha.produtoId,
    formas: lerFormas(linha.formas),
  }));

export const totaisDoDia = (linhas: LinhaDia[]) =>
  linhas.filter(linhaValida).reduce(
    (soma, linha) => {
      const formas = lerFormas(linha.formas);
      return {
        produtos: soma.produtos + 1,
        formas: soma.formas + formas,
        unidades: soma.unidades + unidadesDe(formas, linha.rendimento as number),
      };
    },
    { produtos: 0, formas: 0, unidades: 0 }
  );
