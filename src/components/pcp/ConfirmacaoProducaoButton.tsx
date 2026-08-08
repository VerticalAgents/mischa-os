
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useConfirmacaoProducao, type InsumoInsuficiente } from '@/hooks/useConfirmacaoProducao';
import { Checkbox } from '@/components/ui/checkbox';

interface ConfirmacaoProducaoButtonProps {
  registroId: string;
  produtoNome: string;
  formasProducidas: number;
  unidadesPrevistas?: number;
  status: string;
  onConfirmado: () => void;
}

export function ConfirmacaoProducaoButton({
  registroId,
  produtoNome,
  formasProducidas,
  unidadesPrevistas,
  status,
  onConfirmado
}: ConfirmacaoProducaoButtonProps) {
  const { confirmarProducao, loading } = useConfirmacaoProducao();
  const [showDialog, setShowDialog] = useState(false);
  const [faltantes, setFaltantes] = useState<InsumoInsuficiente[] | null>(null);
  const [cienteReposicao, setCienteReposicao] = useState(false);

  const handleConfirmar = async () => {
    const resultado = await confirmarProducao(registroId);
    if (resultado.ok) {
      onConfirmado();
      setShowDialog(false);
      return;
    }
    if (resultado.motivo === 'insumos_insuficientes') {
      setShowDialog(false);
      setCienteReposicao(false);
      setFaltantes(resultado.insumos);
    }
  };

  const handleConfirmarForcado = async () => {
    const resultado = await confirmarProducao(registroId, { reporInsumosFaltantes: true });
    if (resultado.ok) {
      onConfirmado();
      setFaltantes(null);
    }
  };

  // Só mostrar o botão se o status for "Registrado"
  if (status !== 'Registrado') {
    return null;
  }

  return (
    <>
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button 
          size="sm" 
          className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Confirmar Produção
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirmar Produção
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a confirmar a produção de:
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1">
              <p><strong>Produto:</strong> {produtoNome}</p>
              <p><strong>Formas:</strong> {formasProducidas}</p>
              <p><strong>Unidades previstas:</strong> {unidadesPrevistas || 0}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta ação irá:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Validar saldo de insumos necessários</li>
              <li>• Criar entrada no estoque de produtos</li>
              <li>• Criar saídas no estoque de insumos</li>
              <li>• Marcar o registro como "Confirmado"</li>
            </ul>
            <p className="text-sm font-medium text-amber-600">
              Esta operação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmar}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog
      open={!!faltantes}
      onOpenChange={(open) => {
        if (!open) {
          setFaltantes(null);
          setCienteReposicao(false);
        }
      }}
    >
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Saldo insuficiente de insumos
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                A produção de <strong>{produtoNome}</strong> ({formasProducidas} formas) precisa de mais
                insumos do que o disponível em estoque:
              </p>
              <div className="rounded-md border border-destructive/30 divide-y divide-border max-h-64 overflow-y-auto">
                {(faltantes || []).map((item) => (
                  <div key={item.insumo_id} className="p-3 space-y-1">
                    <p className="font-medium text-foreground">{item.nome}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span>Necessário: <strong>{item.necessario.toLocaleString('pt-BR')} {item.unidade}</strong></span>
                      <span>Disponível: <strong>{item.disponivel.toLocaleString('pt-BR')} {item.unidade}</strong></span>
                      <span className="text-destructive">Falta: <strong>{item.faltante.toLocaleString('pt-BR')} {item.unidade}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3">
                <Checkbox
                  id="ciente-reposicao"
                  checked={cienteReposicao}
                  onCheckedChange={(v) => setCienteReposicao(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="ciente-reposicao" className="text-sm text-foreground cursor-pointer">
                  Confirmar mesmo assim. O sistema irá lançar automaticamente a entrada das quantidades
                  faltantes no estoque de insumos antes de confirmar a produção.
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirmarForcado();
            }}
            disabled={!cienteReposicao || loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Confirmando...
              </>
            ) : (
              'Repor e confirmar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
