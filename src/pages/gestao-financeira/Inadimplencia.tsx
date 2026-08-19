import InadimplenciaPanel from "@/components/gestao-financeira/InadimplenciaPanel";

export default function Inadimplencia() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inadimplência</h1>
        <p className="text-sm text-muted-foreground">
          Títulos em aberto e pagamentos atrasados sincronizados do GestãoClick.
        </p>
      </div>
      <InadimplenciaPanel />
    </div>
  );
}