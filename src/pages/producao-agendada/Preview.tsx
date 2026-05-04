import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X, Loader2 } from "lucide-react";
import { exportProducaoAgendadaPDF } from "@/utils/exportProducaoAgendadaPDF";
import type { DiaProducaoAgendada } from "@/hooks/useProducaoAgendada";
import type { ValidacaoDia } from "@/hooks/useValidacaoInsumosProducaoAgendada";

export default function ProducaoAgendadaPreview() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const key = params.get("key");
      if (!key) throw new Error("Chave da pré-visualização não encontrada na URL");

      const raw = sessionStorage.getItem(key);
      if (!raw) throw new Error("Dados não encontrados. A sessão pode ter expirado.");

      const parsed = JSON.parse(raw) as {
        dias: DiaProducaoAgendada[];
        validacoes: Array<[string, ValidacaoDia]>;
      };

      const validacoesMap = new Map<string, ValidacaoDia>(parsed.validacoes);
      const url = exportProducaoAgendadaPDF(parsed.dias, validacoesMap, {
        returnBlobUrl: true,
      }) as unknown as string;
      setBlobUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar pré-visualização");
    }
  }, []);

  const handlePrint = () => {
    try {
      iframeRef.current?.contentWindow?.focus();
      iframeRef.current?.contentWindow?.print();
    } catch {
      window.print();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-destructive mb-3">
            Erro ao gerar pré-visualização
          </h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.close()}>Fechar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-background sticky top-0 z-10">
        <h1 className="text-base font-semibold">
          Planejamento de Produção Agendada
        </h1>
        <div className="flex gap-2">
          <Button onClick={handlePrint} disabled={!blobUrl} className="gap-1">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={() => window.close()} className="gap-1">
            <X className="h-4 w-4" />
            Fechar
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
        {!blobUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            title="Pré-visualização do PDF"
            className="w-full h-[calc(100vh-57px)] border-0 bg-white"
          />
        )}
      </div>
    </div>
  );
}