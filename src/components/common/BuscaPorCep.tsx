import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import {
  buscarEnderecoPorCep,
  cepCompleto,
  enderecoEmUmaLinha,
  formatarCep,
} from "@/utils/cep";

interface BuscaPorCepProps {
  /** Recebe o endereço pronto, numa linha, para gravar no campo de texto. */
  onEndereco: (endereco: string) => void;
  disabled?: boolean;
}

/**
 * CEP + número, que juntos preenchem o campo de endereço do cadastro.
 *
 * O número mora aqui, e não como um buraco deixado no meio do texto, porque o
 * ViaCEP devolve a rua mas nunca o número: pedir os dois no mesmo lugar é o que
 * evita endereço salvo pela metade.
 */
export default function BuscaPorCep({ onEndereco, disabled }: BuscaPorCepProps) {
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const pronto = cepCompleto(cep) && !buscando && !disabled;

  const buscar = async () => {
    if (!pronto) return;
    setBuscando(true);
    setErro(null);
    try {
      const achado = await buscarEnderecoPorCep(cep);
      onEndereco(enderecoEmUmaLinha(achado, numero));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível buscar o CEP.");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 space-y-2 sm:max-w-[10rem]">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            disabled={disabled}
            onChange={(e) => {
              setCep(formatarCep(e.target.value));
              setErro(null);
            }}
            // Enter aqui buscaria o CEP e enviaria o formulário junto.
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                buscar();
              }
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2 sm:max-w-[7rem]">
          <Label htmlFor="numeroEndereco">Número</Label>
          <Input
            id="numeroEndereco"
            inputMode="numeric"
            placeholder="123"
            value={numero}
            disabled={disabled}
            onChange={(e) => setNumero(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                buscar();
              }
            }}
          />
        </div>

        <Button type="button" variant="secondary" onClick={buscar} disabled={!pronto}>
          {buscando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">Buscar</span>
        </Button>
      </div>

      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
