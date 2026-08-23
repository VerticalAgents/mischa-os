import { useEffect } from "react";

/**
 * Marca no `<html>` quando a barra de endereço do navegador está à vista.
 *
 * O problema que isso resolve: a barra inferior do app usa
 * `bottom: max(env(safe-area-inset-bottom), 10px)` para escapar da faixa do
 * gesto de home do iPhone. Só que, com a barra do Safari aparecendo, essa faixa
 * fica ATRÁS dela — o `env()` continua reportando os ~34px e o resultado é um
 * vão morto entre a barra do app e a do navegador.
 *
 * Como detectar: no iOS o `window.innerHeight` encolhe junto com a área visível,
 * então comparar os dois não diz nada. O que funciona é guardar a MAIOR altura
 * visual já vista (barra do navegador recolhida) e considerar que ela está à
 * vista sempre que a altura atual estiver abaixo disso.
 *
 * O teclado também encolhe a área visível, e muito mais — daí o teto de 240px.
 * Sem `visualViewport` (navegador antigo), nada é marcado e vale o `env()` puro.
 */

const TOLERANCIA = 8; // px — ruído de arredondamento do próprio navegador
const TETO_BARRA = 240; // acima disso é teclado, não barra de endereço

export function useBarraDoNavegador() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let alturaMaxima = vv.height;

    const avaliar = () => {
      if (vv.height > alturaMaxima) alturaMaxima = vv.height;
      const encolhimento = alturaMaxima - vv.height;
      const barraAVista = encolhimento > TOLERANCIA && encolhimento < TETO_BARRA;
      document.documentElement.dataset.barraNavegador = barraAVista ? "1" : "0";
    };

    // Girar o aparelho troca a altura de referência inteira.
    const rearmar = () => {
      alturaMaxima = vv.height;
      avaliar();
    };

    avaliar();
    vv.addEventListener("resize", avaliar);
    vv.addEventListener("scroll", avaliar);
    window.addEventListener("orientationchange", rearmar);

    return () => {
      vv.removeEventListener("resize", avaliar);
      vv.removeEventListener("scroll", avaliar);
      window.removeEventListener("orientationchange", rearmar);
      delete document.documentElement.dataset.barraNavegador;
    };
  }, []);
}
