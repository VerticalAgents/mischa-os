import InadimplenciaPanel from "@/components/gestao-financeira/InadimplenciaPanel";

export default function RepInadimplencia() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Cobrança</h1>
        <p className="text-sm text-muted-foreground">
          Tudo o que os seus clientes têm a pagar: o que ainda vai vencer e o que está atrasado.
        </p>
      </div>
      <InadimplenciaPanel />
    </div>
  );
}