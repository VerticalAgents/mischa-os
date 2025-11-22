import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RepresentantesFilter } from "./RepresentantesFilter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Download, X } from "lucide-react";

interface PedidoExpedicao {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_endereco?: string;
  cliente_telefone?: string;
  link_google_maps?: string;
  representante_id?: number;
  data_prevista_entrega: Date;
  quantidade_total: number;
  tipo_pedido: string;
  status_agendamento: string;
}

interface ExportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enderecoPartida: string;
  onEnderecoPartidaChange: (value: string) => void;
  filtroRepresentantes: number[];
  onFiltroRepresentantesChange: (ids: number[]) => void;
  entregasFiltradas: PedidoExpedicao[];
  entregasSelecionadas: Set<string>;
  onToggleEntrega: (id: string) => void;
  onToggleAll: () => void;
  onExport: () => void;
  totalSelecionadas: number;
  totalFiltradas: number;
}

export function ExportCSVDialog({
  open,
  onOpenChange,
  enderecoPartida,
  onEnderecoPartidaChange,
  filtroRepresentantes,
  onFiltroRepresentantesChange,
  entregasFiltradas,
  entregasSelecionadas,
  onToggleEntrega,
  onToggleAll,
  onExport,
  totalSelecionadas,
  totalFiltradas,
}: ExportCSVDialogProps) {
  const todasSelecionadas = totalSelecionadas === totalFiltradas && totalFiltradas > 0;
  const algumasSelecionadas = totalSelecionadas > 0 && totalSelecionadas < totalFiltradas;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Exportar Entregas para CSV</DialogTitle>
          <DialogDescription>
            Configure os filtros e selecione as entregas que deseja exportar
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6 py-4">
          {/* Endereço de Partida */}
          <div className="space-y-2">
            <Label htmlFor="endereco-partida" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço de Partida - Fábrica Mischa's Bakery
            </Label>
            <Input
              id="endereco-partida"
              value={enderecoPartida}
              onChange={(e) => onEnderecoPartidaChange(e.target.value)}
              placeholder="Digite o endereço de partida"
              className="w-full"
            />
          </div>

          {/* Filtro de Representantes */}
          <div className="space-y-2">
            <Label>Filtrar por Representante</Label>
            <RepresentantesFilter
              selectedIds={filtroRepresentantes}
              onSelectionChange={onFiltroRepresentantesChange}
            />
          </div>

          {/* Lista de Entregas */}
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <Label>Entregas para Exportar</Label>
              <span className="text-sm text-muted-foreground">
                {totalSelecionadas} de {totalFiltradas} selecionadas
              </span>
            </div>

            {entregasFiltradas.length === 0 ? (
              <div className="flex items-center justify-center h-32 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Nenhuma entrega encontrada com os filtros aplicados
                </p>
              </div>
            ) : (
              <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                {/* Cabeçalho com Select All */}
                <div className="border-b bg-muted/50 p-3 flex items-center gap-3">
                  <Checkbox
                    checked={todasSelecionadas}
                    onCheckedChange={onToggleAll}
                    className="data-[state=checked]:bg-primary"
                    ref={(el) => {
                      if (el && algumasSelecionadas) {
                        el.setAttribute('data-indeterminate', 'true');
                      }
                    }}
                  />
                  <div className="grid grid-cols-12 gap-2 flex-1 font-medium text-sm">
                    <div className="col-span-4">Cliente</div>
                    <div className="col-span-5">Endereço</div>
                    <div className="col-span-3">Telefone</div>
                  </div>
                </div>

                {/* Lista com Scroll */}
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {entregasFiltradas.map((entrega) => (
                      <div
                        key={entrega.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors"
                      >
                        <Checkbox
                          checked={entregasSelecionadas.has(entrega.id)}
                          onCheckedChange={() => onToggleEntrega(entrega.id)}
                          className="data-[state=checked]:bg-primary"
                        />
                        <div className="grid grid-cols-12 gap-2 flex-1 text-sm">
                          <div className="col-span-4 font-medium truncate">
                            {entrega.cliente_nome}
                          </div>
                          <div className="col-span-5 text-muted-foreground truncate">
                            {entrega.cliente_endereco || 'Sem endereço'}
                          </div>
                          <div className="col-span-3 text-muted-foreground truncate">
                            {entrega.cliente_telefone || 'Sem telefone'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={onExport}
            disabled={totalSelecionadas === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV ({totalSelecionadas})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
