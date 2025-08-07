
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Settings, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HistoricoProducaoModal } from "./HistoricoProducaoModal";
import { useHistoricoProducaoStore } from "@/hooks/useHistoricoProducaoStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { HistoricoProducao as HistoricoProducaoType } from "@/types";

export default function HistoricoProducao() {
  const navigate = useNavigate();
  const { 
    historico,
    adicionarRegistroHistorico,
    editarRegistroHistorico,
    removerRegistroHistorico
  } = useHistoricoProducaoStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoricoProducaoType | null>(null);

  const handleSave = (dadosProducao: any) => {
    if (editingItem) {
      editarRegistroHistorico(editingItem.id, dadosProducao);
    } else {
      adicionarRegistroHistorico(dadosProducao);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleEdit = (item: HistoricoProducaoType) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este registro de produção?')) {
      removerRegistroHistorico(id);
    }
  };

  const handleNovoRegistro = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const filteredHistorico = historico.filter(item => 
    item.produtoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.turno && item.turno.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Produção</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/precificacao?tab=rendimentos")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Gerenciar Rendimentos
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button onClick={handleNovoRegistro} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Registro
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por produto ou turno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredHistorico.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchTerm 
                  ? "Nenhum registro encontrado com os filtros aplicados"
                  : "Nenhum registro de produção encontrado. Clique em 'Novo Registro' para começar."
                }
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Formas</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistorico.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(item.dataProducao, "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{item.produtoNome}</TableCell>
                    <TableCell>{item.formasProducidas}</TableCell>
                    <TableCell>{item.unidadesCalculadas}</TableCell>
                    <TableCell>
                      {item.turno && (
                        <Badge variant="secondary">{item.turno}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.origem === 'Manual' ? 'default' : 'outline'}>
                        {item.origem}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.observacoes}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <HistoricoProducaoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleSave}
        registro={editingItem}
      />
    </div>
  );
}
