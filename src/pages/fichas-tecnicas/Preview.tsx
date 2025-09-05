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
          .hover\\:scale-\\[1\\.02\\] { transform: none !important; }
          .shadow-sm { box-shadow: none !important; }
          .bg-gradient-to-br { background: #f8fafc !important; }
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

        <header className="mb-6 print-area header-cards no-break fit-a4">
          <div className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-3">
            <CompactStat label="Receita" value={meta.receita_nome} type="primary" />
            <CompactStat label="Multiplicador" value={`${meta.multiplicador}×`} type="accent" />
            <CompactStat label="Massa total (sem topping)" value={`${base.total_g}g`} type="info" />
            <CompactStat label="Peso total de toppings" value={`${toppings.total_g}g`} type="warning" />
            <CompactStat label="Peso total (com topping)" value={`${base.total_g + toppings.total_g}g`} type="success" />
            <CompactStat label="Nº de formas" value={meta.forms_count} type="default" />
            <CompactStat label="Massa por forma (sem topping)" value={meta.forms_count > 0 ? `${Math.round(base.total_g / meta.forms_count)}g` : "—"} type="secondary" />
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

function CompactStat({label, value, type = 'default'}:{label:string; value:string|number; type?: 'default' | 'primary' | 'accent' | 'info' | 'warning' | 'success' | 'secondary'}){
  const getCardStyles = () => {
    switch(type) {
      case 'primary':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm';
      case 'accent':
        return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm';
      case 'info':
        return 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 shadow-sm';
      case 'warning':
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm';
      case 'success':
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm';
      case 'secondary':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm';
      default:
        return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm';
    }
  };

  const getLabelStyles = () => {
    switch(type) {
      case 'primary':
        return 'text-blue-600';
      case 'accent':
        return 'text-purple-600';
      case 'info':
        return 'text-cyan-600';
      case 'warning':
        return 'text-amber-600';
      case 'success':
        return 'text-emerald-600';
      case 'secondary':
        return 'text-gray-600';
      default:
        return 'text-slate-600';
    }
  };

  const getValueStyles = () => {
    switch(type) {
      case 'primary':
        return 'text-blue-900';
      case 'accent':
        return 'text-purple-900';
      case 'info':
        return 'text-cyan-900';
      case 'warning':
        return 'text-amber-900';
      case 'success':
        return 'text-emerald-900';
      case 'secondary':
        return 'text-gray-900';
      default:
        return 'text-slate-900';
    }
  };

  return (
    <div className={`rounded-xl border-2 p-3 min-h-0 shrink-0 transition-all hover:scale-[1.02] ${getCardStyles()}`}>
      <div className={`text-xs font-semibold tracking-wide uppercase mb-1 ${getLabelStyles()}`}>{label}</div>
      <div className={`text-lg sm:text-xl font-bold leading-tight ${getValueStyles()}`}>{String(value)}</div>
    </div>
  );
}