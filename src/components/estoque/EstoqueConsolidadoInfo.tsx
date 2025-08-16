
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EstoqueInfo {
  produto_id: string;
  produto_nome: string;
  saldoContabil: number;
  reservadoAtivo: number;
  saldoReal: number;
}

interface EstoqueConsolidadoInfoProps {
  estoque: EstoqueInfo;
  compact?: boolean;
}

export const EstoqueConsolidadoInfo = ({ estoque, compact = false }: EstoqueConsolidadoInfoProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="px-1 py-0">
          Real: {estoque.saldoReal}
        </Badge>
        {estoque.reservadoAtivo > 0 && (
          <Badge variant="secondary" className="px-1 py-0">
            Reservado: {estoque.reservadoAtivo}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="font-medium text-foreground">
        {estoque.produto_nome}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Contábil</div>
          <Badge variant="outline" className="w-full justify-center">
            {estoque.saldoContabil}
          </Badge>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Reservado</div>
          <Badge 
            variant={estoque.reservadoAtivo > 0 ? "secondary" : "outline"} 
            className="w-full justify-center"
          >
            {estoque.reservadoAtivo}
          </Badge>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Real</div>
          <Badge 
            variant={estoque.saldoReal > 0 ? "default" : "destructive"} 
            className="w-full justify-center"
          >
            {estoque.saldoReal}
          </Badge>
        </div>
      </div>
      
      {estoque.reservadoAtivo > 0 && (
        <>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Disponível para separação:</span> {estoque.saldoReal}
          </div>
        </>
      )}
    </div>
  );
};
