import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NovaRotaInlineProps {
  onCriar: (rota: { nome: string; descricao?: string }) => Promise<{ id: number } | null>;
  onPronto: (id: number) => void;
  onCancelar: () => void;
}

/**
 * Cadastro de rota sem sair do cadastro de cliente.
 *
 * É uma linha que aparece no lugar do seletor, e não um segundo Dialog: um modal
 * aberto por cima de outro briga por foco no Radix e, pior, o representante
 * perderia de vista o cadastro que estava preenchendo — que é justamente o que
 * esta tela existe para evitar.
 */
export default function NovaRotaInline({ onCriar, onPronto, onCancelar }: NovaRotaInlineProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const limpo = nome.trim();
    if (!limpo || salvando) return;
    setSalvando(true);
    try {
      const criada = await onCriar({ nome: limpo, descricao: descricao.trim() || undefined });
      if (criada) onPronto(criada.id);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-dashed p-3">
      <Input
        autoFocus
        placeholder="Nome da rota (ex: Centro)"
        value={nome}
        disabled={salvando}
        onChange={(e) => setNome(e.target.value)}
        // Enter dentro de um form submete; aqui ele salva a rota, não o cliente.
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            salvar();
          } else if (e.key === "Escape") {
            onCancelar();
          }
        }}
      />
      <Input
        placeholder="Descrição (opcional)"
        value={descricao}
        disabled={salvando}
        onChange={(e) => setDescricao(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            salvar();
          }
        }}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={salvar} disabled={!nome.trim() || salvando}>
          {salvando && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Salvar rota
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
