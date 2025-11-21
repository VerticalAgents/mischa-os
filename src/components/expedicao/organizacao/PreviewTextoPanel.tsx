import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PreviewTextoPanelProps {
  texto: string;
}

export const PreviewTextoPanel = ({ texto }: PreviewTextoPanelProps) => {
  const [copiado, setCopiado] = useState(false);

  const copiarTexto = async () => {
    if (!texto) return;

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success('Texto copiado para a área de transferência!');
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar texto');
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Preview do Texto</h2>
            <p className="text-sm text-muted-foreground">
              {texto ? 'Pronto para copiar' : 'Selecione entregas para gerar o texto'}
            </p>
          </div>
          <Button
            onClick={copiarTexto}
            disabled={!texto}
            variant={copiado ? "default" : "outline"}
          >
            {copiado ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Texto
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {texto ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-background p-4 rounded-lg border">
              {texto}
            </pre>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma entrega selecionada</p>
              <p className="text-sm mt-2">Selecione entregas no painel ao lado para gerar o texto</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
