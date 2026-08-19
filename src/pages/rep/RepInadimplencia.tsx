import InadimplenciaPanel from "@/components/gestao-financeira/InadimplenciaPanel";

export default function RepInadimplencia() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Inadimplência</h1>
        <p className="text-sm text-muted-foreground">
          Pagamentos em aberto e atrasados dos seus clientes.
        </p>
      </div>
      <InadimplenciaPanel />
    </div>
  );
}