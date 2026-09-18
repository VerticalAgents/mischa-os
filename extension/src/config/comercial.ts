/**
 * As regras comerciais que a extensão repete para o cliente.
 *
 * **Isto é uma cópia.** A origem é `mischas/contexto/prospeccao.md`, escrita e
 * confirmada pelo Lucca em 17/09/2026. Se o preço, o pedido mínimo ou o prazo
 * mudar: muda lá primeiro, e só depois aqui. Nenhum componente e nenhum texto
 * pode ter número solto — tudo sai daqui.
 *
 * A mesma regra vale para a IA da Meta que atende o WhatsApp: são duas bocas
 * repetindo o mesmo combinado, e elas não podem divergir.
 */

export const REGRAS_ATUALIZADAS_EM = '2026-09-17';

export const PRECOS = {
  pontoDeVenda: {
    rotulo: 'Ponto de venda',
    valorUnitario: 4.8,
    pagamentoAntecipado: false,
    temTroca: true,
  },
  ambulante: {
    rotulo: 'Revendedor ambulante',
    valorUnitario: 4.2,
    pagamentoAntecipado: true,
    temTroca: false,
  },
} as const;

export const PEDIDO_MINIMO = { unidades: 30, multiploDe: 5 } as const;

export const SABORES = [
  'Tradicional',
  'Meio Amargo',
  'Choco Duo',
  'Stikadinho',
  'Avelã',
] as const;

export const PRODUTO = {
  validadeDias: 60,
  cacau: '50% cacau',
  observacaoMeioAmargo: 'O Meio Amargo é dark, com cobertura meio amargo.',
} as const;

export const ENTREGA = {
  cidade: 'Porto Alegre',
  dias: ['quarta', 'sexta'],
  freteGratis: true,
  antecedenciaDias: 2,
} as const;

export const PAGAMENTO = {
  pedidosAntecipadosIniciais: 4,
  boletoDiasApos: 7,
  formas: ['Pix', 'boleto', 'link de cartão'],
} as const;

export const TROCA = {
  vale: 'unidade que vencer no ponto de venda',
  naoVale: ['revendedor ambulante', 'marca própria de terceiro'],
} as const;

export const EXPOSITOR = { semCusto: true, reporQuandoRestar: 10 } as const;
