import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * As páginas da barra inferior, para o carrossel do celular montar as vizinhas.
 *
 * Por que um registro separado do `App.tsx`: o React Router só entrega o
 * elemento da rota ATUAL. Para ter a página do lado já pronta na tela — meia
 * aqui, meia ali, no meio do arrasto — é preciso poder montá-la sem que ela
 * seja a rota corrente. Daí o carrossel renderizar direto destes componentes.
 *
 * O `lazy` aqui aponta para os mesmos módulos do `App.tsx`, então o pedaço de
 * código é o mesmo — não há download duplicado. O que muda é quando ele é
 * pedido: a vizinha é montada assim que a página atual assenta, e não no
 * instante em que o dedo encosta na tela.
 *
 * Consequência a ter em mente: no celular, nessas quatro rotas, quem desenha a
 * página é o carrossel, não o `element` da rota. As duas listas precisam
 * apontar para o mesmo lugar.
 */

type Registro = Record<string, LazyExoticComponent<ComponentType>>;

export const paginasBarraApp: Registro = {
  "/home": lazy(() => import("@/pages/Home")),
  "/agendamento": lazy(() => import("@/pages/Agendamento")),
  "/expedicao": lazy(() => import("@/pages/Expedicao")),
  "/pcp": lazy(() => import("@/pages/PCP")),
};

export const paginasBarraRep: Registro = {
  "/rep/home": lazy(() => import("@/pages/rep/RepHome")),
  "/rep/agendamentos": lazy(() => import("@/pages/rep/RepAgendamentos")),
  "/rep/estatisticas": lazy(() => import("@/pages/rep/RepEstatisticas")),
  "/rep/clientes": lazy(() => import("@/pages/rep/RepClientes")),
};
