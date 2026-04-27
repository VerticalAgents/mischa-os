import { useState, useEffect } from "react";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  representanteNome: string;
  emailAtual: string;
  onSuccess: () => void;
}

export default function EditarAcessoRepresentanteDialog({
  open,
  onOpenChange,
  accountId,
  representanteNome,
  emailAtual,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState(emailAtual);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(emailAtual);
      setPassword("");
    }
  }, [open, emailAtual]);

  const handleSave = async () => {
    const emailMudou = email.trim() && email.trim() !== emailAtual;
    const senhaInformada = password.trim().length > 0;

    if (!emailMudou && !senhaInformada) {
      toast.error("Altere o email ou informe uma nova senha");
      return;
    }

    if (senhaInformada && password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "update-representante-access",
        {
          body: {
            account_id: accountId,
            new_email: emailMudou ? email.trim() : undefined,
            new_password: senhaInformada ? password : undefined,
          },
        }
      );

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success("Acesso atualizado com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Erro ao atualizar acesso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar acesso de {representanteNome}</DialogTitle>
          <DialogDescription>
            Atualize o email de login e/ou defina uma nova senha. Deixe a senha em branco para mantê-la.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-acesso-email">Email de login</Label>
            <Input
              id="edit-acesso-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <Label htmlFor="edit-acesso-senha">Nova senha</Label>
            <Input
              id="edit-acesso-senha"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres (opcional)"
              autoComplete="new-password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
