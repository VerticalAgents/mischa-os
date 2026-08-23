import { X } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * O detalhe de um card de resumo, no celular.
 *
 * Sobe de baixo com o fundo escurecido, igual ao menu — é o mesmo gesto mental:
 * uma camada por cima do que você estava vendo, que sai do mesmo jeito que
 * entrou. Aqui o bloco NÃO é vermelho: vermelho é a cor da navegação nesta
 * casa, e isto é conteúdo.
 *
 * Cada linha é um cliente. O número fica à direita, alinhado — em lista de
 * valores, o olho compara pela coluna, não pela leitura.
 */

export interface LinhaDetalhe {
  id: string;
  titulo: string;
  subtitulo?: string;
  valor?: string;
  /** Marca a linha como algo que pede atenção (atraso, pendência). */
  alerta?: boolean;
}

export interface ConteudoDetalhe {
  titulo: string;
  /** Uma linha de contexto sob o título: total, período, o que se está vendo. */
  resumo?: string;
  linhas: LinhaDetalhe[];
  /** O que dizer quando não há nada — nunca deixar a folha vazia e muda. */
  vazio: string;
}

interface DetalheIndicadorProps {
  conteudo: ConteudoDetalhe | null;
  aoFechar: () => void;
}

export default function DetalheIndicador({ conteudo, aoFechar }: DetalheIndicadorProps) {
  return (
    <Drawer open={!!conteudo} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DrawerContent className="lg:hidden max-h-[85vh] rounded-t-[28px] border-border bg-card p-0">
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
          <div className="min-w-0">
            <DrawerTitle className="text-[0.7rem] font-semibold uppercase tracking-[1px] text-foreground">
              {conteudo?.titulo}
            </DrawerTitle>
            {conteudo?.resumo && (
              <p className="mt-1 text-xs text-muted-foreground">{conteudo.resumo}</p>
            )}
          </div>
          <button
            aria-label="Fechar"
            onClick={aoFechar}
            className="-mr-1 shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain border-t border-border px-4 py-2 [-webkit-overflow-scrolling:touch]"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          {conteudo && conteudo.linhas.length === 0 && (
            <p className="px-1 py-8 text-center text-sm text-muted-foreground">{conteudo.vazio}</p>
          )}

          <ul className="divide-y divide-border">
            {conteudo?.linhas.map((linha) => (
              <li key={linha.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{linha.titulo}</p>
                  {linha.subtitulo && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {linha.subtitulo}
                    </p>
                  )}
                </div>
                {linha.valor && (
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      linha.alerta ? "text-[#d1193a]" : "text-foreground"
                    )}
                  >
                    {linha.valor}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
