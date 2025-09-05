import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Payload = {
  meta: { receita_id: string | number; receita_nome: string; multiplicador: number; forms_count: number };
  base: { per_form_g?: number; total_g: number; ingredientes: any[] };
  toppings: { total_g: number; ingredientes: any[] };
  observacoes?: string | null;
};

export default function FichaPreview(){
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    console.log('🔍 [DEBUG] Buscando dados da ficha técnica com key:', key);
    if(key){
      const raw = sessionStorage.getItem(key);
      console.log('📦 [DEBUG] Dados encontrados no sessionStorage:', raw);
      if(raw) {
        try {
          const parsed = JSON.parse(raw);
          console.log('✅ [DEBUG] Dados parseados com sucesso:', parsed);
          setData(parsed);
        } catch (e) {
          console.error('❌ [DEBUG] Erro ao parsear dados:', e);
        }
      } else {
        console.warn('⚠️ [DEBUG] Nenhum dado encontrado no sessionStorage para a key:', key);
      }
    } else {
      console.warn('⚠️ [DEBUG] Nenhuma key fornecida na URL');
    }
  }, []);

  if(!data) return <div className="p-6">Carregando…</div>;

  const { meta, base, toppings, observacoes } = data;

  return (
    <div className="p-6 print:p-0">
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          html, body { width: 210mm; height: 297mm; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; border: none !important; margin: 0 !important; }
          .print-area { max-width: 186mm; }
          .no-break { break-inside: avoid; }
          .header-cards * { line-height: 1.1; }
          .fit-a4 { transform: scale(0.95); transform-origin: top left; }
        }
      `}</style>

      <div className="page mx-auto max-w-[186mm] print:max-w-[186mm] bg-white">
        <div className="flex items-center justify-between mb-4 no-print">
          <h1 className="text-xl font-semibold">Ficha técnica — {meta.receita_nome} (×{meta.multiplicador})</h1>
          <div className="flex gap-2">
            <Button onClick={() => window.print()}>Imprimir</Button>
            <Button variant="outline" onClick={() => window.close()}>Fechar</Button>
          </div>
        </div>

        <header className="mb-4 print-area header-cards no-break fit-a4">
          <div className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-2">
            <CompactStat label="Receita" value={meta.receita_nome} />
            <CompactStat label="Multiplicador" value={`${meta.multiplicador}×`} />
            <CompactStat label="Massa total (sem topping) — g" value={base.total_g} />
            <CompactStat label="Peso total de toppings — g" value={toppings.total_g} />
            <CompactStat label="Peso total (com topping) — g" value={base.total_g + toppings.total_g} />
            <CompactStat label="Nº de formas" value={meta.forms_count} />
            <CompactStat label="Massa por forma (sem topping) — g" value={meta.forms_count > 0 ? Math.round(base.total_g / meta.forms_count) : "—"} />
          </div>
        </header>

        <section className="mb-4">
          <h2 className="text-base font-semibold mb-2">Massa (batedeira) — ingredientes escalados</h2>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Ingrediente</th>
                <th className="text-center p-2">Unid</th>
                <th className="text-right p-2">Qtd base</th>
                <th className="text-right p-2">Qtd total (×{meta.multiplicador})</th>
              </tr>
            </thead>
            <tbody>
              {base.ingredientes.map((ing: any) => (
                <tr key={ing.id} className="border-t">
                  <td className="p-2">{ing.nome}</td>
                  <td className="p-2 text-center">{ing.unidade}</td>
                  <td className="p-2 text-right">{ing.quantidade}</td>
                  <td className="p-2 text-right">{ing.qtd_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-4">
          <h2 className="text-base font-semibold mb-2">Toppings — por forma e total</h2>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Ingrediente</th>
                <th className="text-center p-2">Unid</th>
                <th className="text-right p-2">Peso por forma (g)</th>
                <th className="text-right p-2">Nº formas</th>
                <th className="text-right p-2">Peso total topping (g)</th>
              </tr>
            </thead>
            <tbody>
              {toppings.ingredientes.map((ing: any) => (
                <tr key={ing.id} className="border-t">
                  <td className="p-2">{ing.nome}</td>
                  <td className="p-2 text-center">{ing.unidade}</td>
                  <td className="p-2 text-right">{ing.per_form_g ?? "—"}</td>
                  <td className="p-2 text-right">{meta.forms_count}</td>
                  <td className="p-2 text-right">{ing.total_g ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {observacoes && (
          <section className="mt-4">
            <div className="text-sm font-medium mb-1">Observações</div>
            <div className="text-sm whitespace-pre-wrap">{observacoes}</div>
          </section>
        )}
      </div>
    </div>
  );
}

function CompactStat({label, value}:{label:string; value:string|number}){
  return (
    <div className="rounded-lg border p-2 min-h-0 shrink-0">
      <div className="text-[11px] font-medium tracking-wide uppercase text-neutral-500">{label}</div>
      <div className="text-base sm:text-lg font-semibold leading-tight">{String(value)}</div>
    </div>
  );
}