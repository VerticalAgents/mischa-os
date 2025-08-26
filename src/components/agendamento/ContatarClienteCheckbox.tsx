
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { toast } from "sonner";

interface ContatarClienteCheckboxProps {
  clienteId: string;
  initialValue?: boolean;
  disabled?: boolean;
}

export default function ContatarClienteCheckbox({ 
  clienteId, 
  initialValue = false,
  disabled = false 
}: ContatarClienteCheckboxProps) {
  const [isChecked, setIsChecked] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const { atualizarContatarCliente } = useAgendamentoClienteStore();

  const handleChange = async (checked: boolean) => {
    if (disabled || isUpdating) return;

    setIsUpdating(true);
    try {
      await atualizarContatarCliente(clienteId, checked);
      setIsChecked(checked);
      
      if (checked) {
        toast.success("Cliente marcado para contato");
      } else {
        toast.success("Cliente desmarcado para contato");
      }
    } catch (error) {
      console.error('Erro ao atualizar contatar_cliente:', error);
      toast.error("Erro ao atualizar status de contato");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`contatar-${clienteId}`}
        checked={isChecked}
        onCheckedChange={handleChange}
        disabled={disabled || isUpdating}
      />
      <label
        htmlFor={`contatar-${clienteId}`}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Contatar cliente
      </label>
    </div>
  );
}
