/**
 * Tema do painel.
 *
 * Claro por padrão, **de propósito**: o Lucca quer ver as cores da Mischa's
 * mesmo com o navegador no escuro. Quem manda é a escolha feita aqui, não o
 * sistema, e ela fica guardada no navegador.
 */
import { useEffect, useState } from 'react';

export type Tema = 'claro' | 'escuro';

const CHAVE = 'tema-do-painel';

function aplicar(tema: Tema) {
  document.documentElement.dataset.tema = tema;
}

export function useTema() {
  const [tema, setTema] = useState<Tema>('claro');

  useEffect(() => {
    aplicar('claro');
    chrome.storage.local.get(CHAVE).then((guardado) => {
      const salvo = guardado?.[CHAVE] as Tema | undefined;
      if (salvo === 'escuro' || salvo === 'claro') {
        setTema(salvo);
        aplicar(salvo);
      }
    });
  }, []);

  const trocar = () => {
    const novo: Tema = tema === 'claro' ? 'escuro' : 'claro';
    setTema(novo);
    aplicar(novo);
    chrome.storage.local.set({ [CHAVE]: novo });
  };

  return { tema, trocar };
}
