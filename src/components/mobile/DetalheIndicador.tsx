import { ReactNode } from "react";
import { ArrowRight, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEhCelular } from "@/hooks/useEhCelular";
import { cn } from "@/lib/utils";

/**
 * O detalhe de um card de resumo.
 *
 * Muda de forma conforme a tela, porque a mesma forma não serve para as duas:
 * no celular **sobe de baixo**, igual ao menu — é o mesmo gesto mental, uma
 * camada que entra e sai pelo mesmo lugar. No computador **aparece no centro**,
 * que é onde o olho já está; uma gaveta subindo numa tela de 27" faz o
 * conteúdo nascer longe de onde se clicou.
 *
 * Nos dois casos o fundo escurece: o painel é uma parada, não uma navegação.
 * Voltar é fechar, não é dar meia-volta.
 *
 * O bloco NÃO é vermelho: vermelho é a cor da navegação nesta casa, e isto é
 * conteúdo.
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
  /**
   * Saída para a tela inteira. Existe porque, no app completo, esses cards já
   * levavam a algum lugar ao serem tocados — a folha não pode fechar essa porta,
   * só chegar antes dela.
   */
  acao?: { rotulo: string; aoClicar: () => void };
}

interface DetalheIndicadorProps {
  conteudo: ConteudoDetalhe | null;
  aoFechar: () => void;
}

export default function DetalheIndicador({ conteudo, aoFechar }: DetalheIndicadorProps) {
  const ehCelular = useEhCelular();

  const cabecalho = (Titulo: typeof DrawerTitle | typeof DialogTitle) => (
    <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
      <div className="min-w-0">
        <Titulo className="text-[0.7rem] font-semibold uppercase tracking-[1px] text-foreground">
          {conteudo?.titulo}
        </Titulo>
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
  );

  const lista = (
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
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{linha.subtitulo}</p>
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
  );

  const rodape = conteudo?.acao ? (
    <div
      className="border-t border-border px-4 py-3"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <button
        onClick={() => {
          aoFechar();
          conteudo.acao!.aoClicar();
        }}
        className="flex w-full items-center justify-center gap-2 rounded-controle bg-muted px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[1.5px] text-foreground transition-colors hover:bg-accent active:bg-accent"
      >
        {conteudo.acao.rotulo}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  if (ehCelular) {
    return (
      <Drawer open={!!conteudo} onOpenChange={(aberto) => !aberto && aoFechar()}>
        <DrawerContent className="max-h-[85vh] rounded-t-[28px] border-border bg-card p-0">
          {cabecalho(DrawerTitle)}
          {lista}
          {rodape}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={!!conteudo} onOpenChange={(aberto) => !aberto && aoFechar()}>
      {/* p-0 e sem o X padrao do Dialog: o cabecalho aqui ja tem o seu, e o
          respiro e dado por cada faixa (cabecalho, lista, rodape). */}
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-lg [&>button]:hidden">
        {cabecalho(DialogTitle)}
        {lista}
        {rodape}
      </DialogContent>
    </Dialog>
  );
}
