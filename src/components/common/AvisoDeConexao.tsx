import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff, Wifi, RotateCw } from "lucide-react";
import { useEstadoDaRede } from "@/hooks/useEstadoDaRede";
import { cn } from "@/lib/utils";

/**
 * Aviso permanente de queda de conexão.
 *
 * Antes, a única pista de que a internet tinha caído era um toast escrito
 * "Failed to fetch" — que some sozinho e não diz o que fazer. Aqui o aviso
 * fica na tela enquanto o problema durar, e sai sozinho quando a conexão
 * voltar, com uma confirmação curta para o usuário saber que pode seguir.
 *
 * Fica flutuando embaixo porque no celular o topo já é do cabeçalho vermelho;
 * a altura acompanha a barra inferior (ver `.aviso-conexao` no index.css).
 */

const SEGUNDOS_CONFIRMANDO = 3000;

export default function AvisoDeConexao() {
  const { semConexao } = useEstadoDaRede();
  const queryClient = useQueryClient();
  const [confirmando, setConfirmando] = useState(false);
  const [tentando, setTentando] = useState(false);
  const estavaSemConexao = useRef(semConexao);

  /** Mostra "conexão restabelecida" só para quem viu a queda acontecer. */
  useEffect(() => {
    if (estavaSemConexao.current && !semConexao) {
      setConfirmando(true);
      const t = setTimeout(() => setConfirmando(false), SEGUNDOS_CONFIRMANDO);
      estavaSemConexao.current = semConexao;
      return () => clearTimeout(t);
    }
    estavaSemConexao.current = semConexao;
  }, [semConexao]);

  const tentarDeNovo = async () => {
    setTentando(true);
    try {
      // Recarrega os dados em vez de recarregar a página: o que o usuário
      // tinha digitado ou filtrado continua onde estava.
      await queryClient.refetchQueries();
    } finally {
      setTentando(false);
    }
  };

  if (!semConexao && !confirmando) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="aviso-conexao pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-bloco border px-4 py-3 shadow-lg",
          "transition-all duration-200 ease-out-expo",
          semConexao
            ? "border-destructive/30 bg-destructive text-destructive-foreground"
            : "border-emerald-600/30 bg-emerald-600 text-white"
        )}
      >
        {semConexao ? (
          <WifiOff className="h-4 w-4 shrink-0" strokeWidth={2} />
        ) : (
          <Wifi className="h-4 w-4 shrink-0" strokeWidth={2} />
        )}

        <div className="min-w-0 text-sm">
          {semConexao ? (
            <>
              <span className="font-semibold">Sem conexão com a internet.</span>{" "}
              <span className="opacity-90">
                O que está na tela pode estar desatualizado.
              </span>
            </>
          ) : (
            <span className="font-semibold">Conexão restabelecida.</span>
          )}
        </div>

        {semConexao && (
          <button
            type="button"
            onClick={tentarDeNovo}
            disabled={tentando}
            className={cn(
              "ml-1 flex shrink-0 items-center gap-1.5 rounded-controle px-3 py-1.5",
              "text-[0.7rem] font-semibold uppercase tracking-[1px]",
              "bg-white/15 transition-colors hover:bg-white/25 disabled:opacity-60"
            )}
          >
            <RotateCw className={cn("h-3 w-3", tentando && "animate-spin")} />
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  );
}
