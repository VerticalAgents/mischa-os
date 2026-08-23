import { create } from "zustand";

/**
 * Estado do menu lateral — expandido ou recolhido.
 *
 * Mora aqui, e não dentro de um dos menus, porque os dois portais usam o mesmo:
 * o app completo (`sidebar-next.tsx`) e o portal do representante (`RepSidebar`).
 * A preferência é uma só, guardada no navegador de quem usa.
 */

const CHAVE_ESTADO = "sidebar_expandido";

type EstadoSidebar = { expandido: boolean; alternar: () => void };

export const useSidebarStore = create<EstadoSidebar>((set) => ({
  expandido: (() => {
    try {
      return localStorage.getItem(CHAVE_ESTADO) !== "false";
    } catch {
      return true;
    }
  })(),
  alternar: () =>
    set((s) => {
      const proximo = !s.expandido;
      try {
        localStorage.setItem(CHAVE_ESTADO, String(proximo));
      } catch {
        /* modo privado do Safari */
      }
      return { expandido: proximo };
    }),
}));
