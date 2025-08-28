import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type AnyScaled = any; // simplificado para V1
type Payload = { base: any; k: number; scaled: AnyScaled };

export default function FichaPreview(){
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    if(key){
      const raw = sessionStorage.getItem(key);
      if(raw) setData(JSON.parse(raw));
    }
  }, []);

  if(!data) return <div className="p-6">Carregando…</div>;

  const { base, k, scaled } = data;

  return (
    <div className="p-6 print:p-0">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h1 className="text-xl font-semibold">Ficha técnica — {base.nome} ({k}×)</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>Imprimir</Button>
          <Button variant="outline" onClick={() => window.close()}>Fechar</Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Rendimento (un)" value={scaled.rendimento_unidades_escalado} />
        <Stat label="Peso total (g)" value={scaled.peso_total_g_escalado} />
        <Stat label="Custo total (R$)" value={scaled.custo_total_escalado.toFixed(2)} />
        <Stat label="Multiplicador" value={`${k}×`} />
      </div>

      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Insumo</th>
            <th className="text-right p-2">Qtd base</th>
            <th className="text-right p-2">Qtd {k}×</th>
            <th className="text-right p-2">Unid</th>
            <th className="text-right p-2">Custo {k}× (R$)</th>
          </tr>
        </thead>
        <tbody>
          {scaled.ingredientes.map((ing:any) => (
            <tr key={ing.id} className="border-t">
              <td className="p-2">{ing.nome}</td>
              <td className="p-2 text-right">{ing.quantidade}</td>
              <td className="p-2 text-right">{ing.quantidade_escalada}</td>
              <td className="p-2 text-right">{ing.unidade}</td>
              <td className="p-2 text-right">{ing.custo_total_escalado != null ? ing.custo_total_escalado.toFixed(2) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {base.observacoes && (
        <div className="mt-4 text-sm">
          <div className="font-medium mb-1">Observações</div>
          <div className="whitespace-pre-wrap">{base.observacoes}</div>
        </div>
      )}
    </div>
  );
}

function Stat({label, value}:{label:string; value:string|number}){
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}