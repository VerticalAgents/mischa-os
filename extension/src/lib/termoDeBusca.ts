/**
 * Que palavra mandar para a busca do WhatsApp.
 *
 * A busca dele procura o texto inteiro dentro do nome da conversa, então
 * mandar o nome do cadastro raramente acha: o cliente é "Curtir e Celebrar
 * Cestas" e a conversa é "Jéssica - Curtir e Celebrar". Sobra a palavra
 * "Cestas", e não acha nada.
 *
 * Por isso a busca vai com **uma palavra só**, a mais distintiva do nome —
 * "Celebrar", "Santiago", "Panetteria". Palavra genérica de razão social e de
 * ramo fica de fora: procurar "mercado" traria meia lista.
 */
const GENERICAS = new Set([
  'ltda', 'me', 'epp', 'eireli', 'sa', 'cia', 'comercio', 'comércio', 'servicos',
  'serviços', 'industria', 'indústria', 'distribuidora', 'representacoes',
  'representações', 'mercado', 'mercadinho', 'super', 'supermercado', 'loja',
  'lojas', 'padaria', 'cafe', 'café', 'bar', 'restaurante', 'lanchonete',
  'cestas', 'cesta', 'store', 'shop', 'e', 'de', 'da', 'do', 'das', 'dos', 'the',
]);

export function termoDeBusca(nome: string): string {
  const palavras = nome
    .replace(/[()\-|.,]/g, ' ')
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const distintivas = palavras.filter(
    (p) => p.length >= 4 && !GENERICAS.has(p.toLowerCase())
  );

  // A mais longa costuma ser a que identifica o cliente, com uma preferência:
  // palavra sem número. "REDEVIP24H (Planetário)" é o cadastro; no WhatsApp a
  // conversa se chama "Marli Rede Vip (Planetario)", então "Planetário" acha e
  // o código não.
  const semNumero = (p: string) => !/\d/.test(p);

  const escolhida = distintivas.sort((a, b) => {
    if (semNumero(a) !== semNumero(b)) return semNumero(a) ? -1 : 1;
    return b.length - a.length;
  })[0];

  return escolhida || nome.trim();
}
