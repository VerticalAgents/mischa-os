import { useState, useEffect } from 'react';

/**
 * Quais colunas da tabela estão à vista, lembrado no navegador.
 *
 * O detalhe que já causou confusão: a escolha fica salva por usuário. Quando uma
 * coluna NOVA entra no padrão, quem nunca usou a tela a vê — e quem usa todo dia
 * não, porque tem uma lista antiga gravada. Ou seja, a coluna some justamente
 * para quem mais precisa dela.
 *
 * Por isso guardamos também quais colunas o usuário JÁ CONHECEU. Coluna que ele
 * nunca viu entra ligada; coluna que ele desligou de propósito continua
 * desligada. Sem isso, ou a novidade não aparece, ou a escolha dele é
 * atropelada a cada atualização.
 */

interface Guardado {
  visiveis: string[];
  conhecidas: string[];
}

/** Aceita também o formato antigo, que era só a lista de visíveis. */
function ler(chave: string): Guardado | null {
  try {
    const cru = localStorage.getItem(chave);
    if (!cru) return null;

    const dados = JSON.parse(cru);
    if (Array.isArray(dados)) return { visiveis: dados, conhecidas: dados };
    if (Array.isArray(dados?.visiveis) && Array.isArray(dados?.conhecidas)) return dados;

    return null;
  } catch {
    return null;
  }
}

export function useColumnVisibility(storageKey: string, defaultColumns: string[]) {
  const [estado, setEstado] = useState<Guardado>(() => {
    const guardado = ler(storageKey);
    if (!guardado) return { visiveis: defaultColumns, conhecidas: defaultColumns };

    const novas = defaultColumns.filter((id) => !guardado.conhecidas.includes(id));

    return {
      visiveis: [...guardado.visiveis, ...novas],
      conhecidas: [...new Set([...guardado.conhecidas, ...defaultColumns])],
    };
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(estado));
  }, [estado, storageKey]);

  const setVisibleColumns = (visiveis: string[]) =>
    setEstado((atual) => ({
      visiveis,
      // Desligar uma coluna não a torna "desconhecida": ela continua conhecida,
      // senão a próxima carga a ligaria de novo.
      conhecidas: [...new Set([...atual.conhecidas, ...visiveis])],
    }));

  return { visibleColumns: estado.visiveis, setVisibleColumns };
}
