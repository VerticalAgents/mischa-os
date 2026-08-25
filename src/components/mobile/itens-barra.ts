import { useMemo } from "react";
import { Home, Clipboard, Truck, Layers, Users, Calendar, BarChart3 } from "lucide-react";
import { mainMenuItems } from "@/components/layout/navigation-items";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMyPermissions } from "@/hooks/useRolePermissions";
import type { ItemBarra } from "@/components/mobile/BarraInferior";

/**
 * Os itens da barra inferior, num lugar só.
 *
 * Moram aqui, e não dentro da barra, porque quem desenha a barra não é o único
 * interessado: a área de gestos precisa da MESMA lista, na MESMA ordem, para
 * saber qual é a próxima página ao arrastar para o lado. Duas listas separadas
 * seriam duas listas que um dia divergem.
 */

const candidatosApp: ItemBarra[] = [
  { path: "/home", label: "Painel", Icon: Home },
  { path: "/agendamento", label: "Agenda", Icon: Clipboard },
  { path: "/expedicao", label: "Expedição", Icon: Truck },
  { path: "/pcp", label: "PCP", Icon: Layers },
];

/** No app completo a barra respeita a permissão: item sem acesso não aparece. */
export function useItensBarraApp(): ItemBarra[] {
  const { userRole } = useUserRoles();
  const { allowedRoutes } = useMyPermissions();

  return useMemo(() => {
    const disponiveis = new Set(
      mainMenuItems
        .filter((item) =>
          userRole === "admin"
            ? true
            : allowedRoutes.some(
                (rota) => item.path === rota || item.path.split("?")[0] === rota
              )
        )
        .map((item) => item.path.split("?")[0])
    );
    return candidatosApp.filter((item) => disponiveis.has(item.path));
  }, [userRole, allowedRoutes]);
}

/** No portal do representante todos veem os mesmos quatro. */
export const itensBarraRep: ItemBarra[] = [
  { path: "/rep/home", label: "Início", Icon: Home },
  { path: "/rep/agendamentos", label: "Agenda", Icon: Calendar },
  { path: "/rep/estatisticas", label: "Stats", Icon: BarChart3 },
  { path: "/rep/clientes", label: "Clientes", Icon: Users },
];
