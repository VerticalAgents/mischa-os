import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VENDA_DIRETA_ROTULO, representantesParaEscolher } from "@/utils/vendaDireta";

interface CanalVendaFieldProps {
  /** true quando o lado "Representante" esta marcado, mesmo antes de escolher quem. */
  comRepresentante: boolean;
  onComRepresentanteChange: (comRepresentante: boolean) => void;
  representanteId?: number | null;
  onRepresentanteChange: (representanteId: number | undefined) => void;
  representantes: { id: number; nome: string; ativo?: boolean }[];
}

const ITEM =
  "h-8 flex-1 rounded-sm px-3 text-muted-foreground hover:bg-background/60 hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm";

/**
 * Venda direta ou representante. Venda direta nao e um representante: e o cliente
 * sem nenhum (representante_id vazio).
 */
export default function CanalVendaField({
  comRepresentante,
  onComRepresentanteChange,
  representanteId,
  onRepresentanteChange,
  representantes,
}: CanalVendaFieldProps) {
  const opcoes = representantesParaEscolher(representantes, representanteId);

  return (
    <div className="space-y-2">
      <Label>Canal de venda</Label>
      <ToggleGroup
        type="single"
        value={comRepresentante ? "representante" : "direta"}
        onValueChange={(valor) => {
          if (!valor) return; // clicar no lado ja marcado nao desmarca
          const com = valor === "representante";
          onComRepresentanteChange(com);
          if (!com) onRepresentanteChange(undefined);
        }}
        className="h-10 w-full gap-1 rounded-md bg-muted p-1"
        aria-label="Canal de venda"
      >
        <ToggleGroupItem value="direta" className={ITEM}>{VENDA_DIRETA_ROTULO}</ToggleGroupItem>
        <ToggleGroupItem value="representante" className={ITEM}>Representante</ToggleGroupItem>
      </ToggleGroup>

      {comRepresentante && (
        representantes.length === 0 && representanteId ? (
          <Input value="Carregando..." disabled className="bg-muted" />
        ) : (
          <Select
            value={representanteId?.toString()}
            onValueChange={(valor) => onRepresentanteChange(valor ? parseInt(valor) : undefined)}
          >
            <SelectTrigger aria-label="Representante">
              <SelectValue placeholder="Selecione um representante" />
            </SelectTrigger>
            <SelectContent>
              {opcoes.map((rep) => (
                <SelectItem key={rep.id} value={rep.id.toString()}>
                  {rep.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}
    </div>
  );
}
