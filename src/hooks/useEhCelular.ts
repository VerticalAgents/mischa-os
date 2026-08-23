import { useEffect, useState } from "react";

/**
 * Verdadeiro abaixo de `lg` — o mesmo corte que o Tailwind usa em `lg:hidden`.
 *
 * Existe separado do `useIsMobile` (768px) de propósito: a barra inferior, o
 * cabeçalho compacto e os gestos aparecem juntos abaixo de 1024px, e um corte
 * diferente faria o gesto valer numa largura em que a barra já sumiu.
 */
const CORTE_LG = 1024;

export function useEhCelular() {
  const [ehCelular, setEhCelular] = useState(
    () => typeof window !== "undefined" && window.innerWidth < CORTE_LG
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${CORTE_LG - 1}px)`);
    const aoMudar = () => setEhCelular(mq.matches);
    aoMudar();
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  return ehCelular;
}
