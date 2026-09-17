import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Copy, KeyRound } from "lucide-react";
import { copiarCredenciais, montarTextoCredenciais } from "@/utils/credenciaisAcesso";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  representanteId: number;
  representanteNome: string;
  emailSugerido?: string;
  onSuccess?: () => void;
}

export default function CriarAcessoRepresentanteDialog({
  open,
  onOpenChange,
  representanteId,
  representanteNome,
  emailSugerido,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState(emailSugerido ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Depois de criar, o dialog passa a mostrar as credenciais para copiar
  const [criado, setCriado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Mantém email sincronizado quando o dialog reabre para outro representante
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setEmail(emailSugerido ?? "");
      setPassword("");
      setCriado(false);
      setCopiado(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha email e senha");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "create-representante-user",
        {
          body: {
            representante_id: representanteId,
            email: email.trim(),
            password,
          },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Acesso criado para ${representanteNome}`);
      setCriado(true);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Erro ao criar acesso");
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = async () => {
    const ok = await copiarCredenciais({
      nome: representanteNome,
      email: email.trim(),
      senha: password,
    });
    if (!ok) {
      toast.error("Nao foi possivel copiar. Selecione o texto e copie na mao.");
      return;
    }
    setCopiado(true);
    toast.success("Credenciais copiadas");
  };

  if (criado) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Acesso criado para {representanteNome}
            </DialogTitle>
            <DialogDescription>
              Copie e mande para o representante agora. A senha nao fica guardada
              no sistema: depois que fechar esta janela, so definindo uma nova.
            </DialogDescription>
          </DialogHeader>

          <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
            {montarTextoCredenciais({
              nome: representanteNome,
              email: email.trim(),
              senha: password,
            })}
          </pre>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleCopiar}>
              {copiado ? (
                <><Check className="h-4 w-4 mr-2" />Copiado</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" />Copiar credenciais</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Criar acesso para {representanteNome}
          </DialogTitle>
          <DialogDescription>
            Defina o email e a senha de login. O representante poderá ver apenas
            os clientes vinculados a ele e editar status/data dos agendamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="rep-email">Email *</Label>
            <Input
              id="rep-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@representante.com"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="rep-senha">Senha *</Label>
            <Input
              id="rep-senha"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : "Criar acesso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}