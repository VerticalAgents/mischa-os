import FluxoCaixaPanel from "@/components/gestao-financeira/FluxoCaixaPanel";

export default function FluxoCaixa() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fluxo de Caixa</h1>
        <p className="text-sm text-muted-foreground">
          Saldo das contas e projeção diária com todas as entradas e saídas previstas do
          GestãoClick.
        </p>
      </div>
      <FluxoCaixaPanel />
    </div>
  );
}