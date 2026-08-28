import { useEffect, useState } from "react";
import { assinarEstadoDaRede, estaSemConexao } from "@/utils/rede";

/**
 * "Estamos sem internet agora?" — para a tela reagir.
 *
 * A fonte é o `utils/rede`, que junta duas coisas: o aviso do sistema
 * operacional (`online`/`offline`) e as falhas reais de requisição. A segunda
 * é a que importa no dia a dia — Wi-Fi conectado sem internet continua se
 * anunciando como online.
 */
export const useEstadoDaRede = () => {
  const [semConexao, setSemConexao] = useState(estaSemConexao);

  useEffect(() => assinarEstadoDaRede(setSemConexao), []);

  return { semConexao };
};
