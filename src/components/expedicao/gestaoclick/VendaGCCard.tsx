import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, FileCheck, Check, Calendar, MapPin, Phone, CreditCard } from "lucide-react";
import { VendaGC, DocumentosStatus } from "./types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VendaGCCardProps {
  venda: VendaGC;
  documentosStatus: DocumentosStatus;
  onGerarA4: () => void;
  onGerarBoleto: () => void;
  onGerarNF: () => void;
}

export function VendaGCCard({
  venda,
  documentosStatus,
  onGerarA4,
  onGerarBoleto,
  onGerarNF
}: VendaGCCardProps) {
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const isBoleto = venda.forma_pagamento === 'BOLETO';
  const todosGerados = documentosStatus.a4 && documentosStatus.nf && (!isBoleto || documentosStatus.boleto);

  return (
    <Card className={`transition-all ${todosGerados ? 'border-green-500/50 bg-green-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="text-muted-foreground text-sm">#{venda.gestaoclick_venda_id}</span>
              {venda.cliente_nome}
            </CardTitle>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(parseISO(venda.data_proxima_reposicao), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                {venda.forma_pagamento}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {formatarMoeda(venda.valor_total)}
            </div>
            <div className="text-xs text-muted-foreground">
              {venda.quantidade_total} un.
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Info do Cliente */}
        <div className="text-sm space-y-1 text-muted-foreground">
          {venda.cliente_endereco && (
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{venda.cliente_endereco}</span>
            </div>
          )}
          {venda.cliente_telefone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span>{venda.cliente_telefone}</span>
            </div>
          )}
        </div>

        {/* Status dos Documentos */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={documentosStatus.a4 ? "default" : "outline"} className="gap-1">
            {documentosStatus.a4 ? <Check className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            Doc A4
          </Badge>
          {isBoleto && (
            <Badge variant={documentosStatus.boleto ? "default" : "outline"} className="gap-1">
              {documentosStatus.boleto ? <Check className="h-3 w-3" /> : <Receipt className="h-3 w-3" />}
              Boleto
            </Badge>
          )}
          <Badge variant={documentosStatus.nf ? "default" : "outline"} className="gap-1">
            {documentosStatus.nf ? <Check className="h-3 w-3" /> : <FileCheck className="h-3 w-3" />}
            NF
          </Badge>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={documentosStatus.a4 ? "outline" : "default"}
            size="sm"
            onClick={onGerarA4}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" />
            {documentosStatus.a4 ? "Reimprimir A4" : "Gerar Doc A4"}
          </Button>
          
          {isBoleto && (
            <Button
              variant={documentosStatus.boleto ? "outline" : "secondary"}
              size="sm"
              onClick={onGerarBoleto}
              className="gap-1.5"
            >
              <Receipt className="h-4 w-4" />
              {documentosStatus.boleto ? "Ver Boleto" : "Gerar Boleto"}
            </Button>
          )}
          
          <Button
            variant={documentosStatus.nf ? "outline" : "secondary"}
            size="sm"
            onClick={onGerarNF}
            className="gap-1.5"
          >
            <FileCheck className="h-4 w-4" />
            {documentosStatus.nf ? "Ver NF" : "Gerar NF"}
          </Button>
        </div>

        {/* Lista de Itens Resumida */}
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Itens ({venda.itens.length})
          </div>
          <div className="space-y-1">
            {venda.itens.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="truncate flex-1">{item.produto_nome}</span>
                <span className="text-muted-foreground ml-2">{item.quantidade}x</span>
              </div>
            ))}
            {venda.itens.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{venda.itens.length - 3} mais itens...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
