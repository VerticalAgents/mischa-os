// As partes do cartao (cabecalho, conteudo, rodape) tem padding de fabrica em dois
// tamanhos: um para celular e outro com "sm:" para tela maior. Quem escreve
// <CardContent className="p-4"> quer 16px em qualquer tela, mas o "p-4" solto so
// vence o padrao do celular: no computador o "sm:" de fabrica continuava mandando
// (topo em zero, laterais em 24px), e o conteudo colava na borda do cartao.
//
// Aqui cada padding escrito sem prefixo ganha o seu par "sm:", para valer nas duas
// telas. O par vai ANTES do className: se a pessoa escreveu um "sm:p-5" de proposito,
// e o dela que vence.
const PADDING = /^p[xytblrse]?-/;

export function espelharPadding(className?: string) {
  if (!className) return className;
  const pares = className
    .split(/\s+/)
    .filter(classe => PADDING.test(classe))
    .map(classe => `sm:${classe}`);
  return pares.length > 0 ? `${pares.join(' ')} ${className}` : className;
}
