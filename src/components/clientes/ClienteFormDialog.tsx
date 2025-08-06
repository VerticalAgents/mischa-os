import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useClienteStore } from "@/hooks/useClienteStore";
import { Cliente, StatusCliente } from "@/types";
import { toast } from "@/hooks/use-toast";
import { CategoriasProdutoSelector } from "./CategoriasProdutoSelector";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useSupabaseRotasEntrega } from "@/hooks/useSupabaseRotasEntrega";
import { useSupabaseCategoriasEstabelecimento } from "@/hooks/useSupabaseCategoriasEstabelecimento";
import { useSupabaseTiposLogistica } from "@/hooks/useSupabaseTiposLogistica";
import { useSupabaseFormasPagamento } from "@/hooks/useSupabaseFormasPagamento";
import { useSupabaseTiposCobranca } from "@/hooks/useSupabaseTiposCobranca";

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId?: string;
  onClienteUpdate?: () => void;
}

export default function ClienteFormDialog({
  open,
  onOpenChange,
  clienteId,
  onClienteUpdate
}: ClienteFormDialogProps) {
  const {
    adicionarCliente,
    atualizarCliente,
    getClientePorId,
    loading
  } = useClienteStore();

  const { representantes } = useSupabaseRepresentantes();
  const { rotasEntrega } = useSupabaseRotasEntrega();
  const { categoriasEstabelecimento } = useSupabaseCategoriasEstabelecimento();
  const { tiposLogistica } = useSupabaseTiposLogistica();
  const { formasPagamento } = useSupabaseFormasPagamento();
  const { tiposCobranca } = useSupabaseTiposCobranca();
  
  const [formData, setFormData] = useState({
    nome: "",
    cnpjCpf: "",
    enderecoEntrega: "",
    linkGoogleMaps: "",
    contatoNome: "",
    contatoTelefone: "",
    contatoEmail: "",
    quantidadePadrao: 0,
    periodicidadePadrao: 7,
    statusCliente: "Ativo" as StatusCliente,
    metaGiroSemanal: 0,
    representanteId: undefined as number | undefined,
    rotaEntregaId: undefined as number | undefined,
    categoriaEstabelecimentoId: undefined as number | undefined,
    instrucoesEntrega: "",
    contabilizarGiroMedio: true,
    tipoLogistica: "Própria",
    emiteNotaFiscal: true,
    tipoCobranca: "À vista",
    formaPagamento: "Boleto",
    observacoes: "",
    categoriasHabilitadas: [] as number[]
  });

  useEffect(() => {
    if (clienteId && open) {
      const cliente = getClientePorId(clienteId);
      if (cliente) {
        setFormData({
          nome: cliente.nome || "",
          cnpjCpf: cliente.cnpjCpf || "",
          enderecoEntrega: cliente.enderecoEntrega || "",
          linkGoogleMaps: cliente.linkGoogleMaps || "",
          contatoNome: cliente.contatoNome || "",
          contatoTelefone: cliente.contatoTelefone || "",
          contatoEmail: cliente.contatoEmail || "",
          quantidadePadrao: cliente.quantidadePadrao || 0,
          periodicidadePadrao: cliente.periodicidadePadrao || 7,
          statusCliente: cliente.statusCliente || "Ativo",
          metaGiroSemanal: cliente.metaGiroSemanal || 0,
          representanteId: cliente.representanteId,
          rotaEntregaId: cliente.rotaEntregaId,
          categoriaEstabelecimentoId: cliente.categoriaEstabelecimentoId,
          instrucoesEntrega: cliente.instrucoesEntrega || "",
          contabilizarGiroMedio: cliente.contabilizarGiroMedio ?? true,
          tipoLogistica: cliente.tipoLogistica || "Própria",
          emiteNotaFiscal: cliente.emiteNotaFiscal ?? true,
          tipoCobranca: cliente.tipoCobranca || "À vista",
          formaPagamento: cliente.formaPagamento || "Boleto",
          observacoes: cliente.observacoes || "",
          categoriasHabilitadas: cliente.categoriasHabilitadas || []
        });
      }
    } else if (!clienteId) {
      // Reset form for new client
      setFormData({
        nome: "",
        cnpjCpf: "",
        enderecoEntrega: "",
        linkGoogleMaps: "",
        contatoNome: "",
        contatoTelefone: "",
        contatoEmail: "",
        quantidadePadrao: 0,
        periodicidadePadrao: 7,
        statusCliente: "Ativo",
        metaGiroSemanal: 0,
        representanteId: undefined,
        rotaEntregaId: undefined,
        categoriaEstabelecimentoId: undefined,
        instrucoesEntrega: "",
        contabilizarGiroMedio: true,
        tipoLogistica: "Própria",
        emiteNotaFiscal: true,
        tipoCobranca: "À vista",
        formaPagamento: "Boleto",
        observacoes: "",
        categoriasHabilitadas: []
      });
    }
  }, [clienteId, open, getClientePorId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleNumberChange = (id: string, value: number) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    setFormData({ ...formData, [id]: checked });
  };

  const handleCategoriasChange = (categorias: number[]) => {
    setFormData({ ...formData, categoriasHabilitadas: categorias });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      const clienteData = {
        nome: formData.nome,
        cnpjCpf: formData.cnpjCpf || undefined,
        enderecoEntrega: formData.enderecoEntrega || undefined,
        linkGoogleMaps: formData.linkGoogleMaps || undefined,
        contatoNome: formData.contatoNome || undefined,
        contatoTelefone: formData.contatoTelefone || undefined,
        contatoEmail: formData.contatoEmail || undefined,
        quantidadePadrao: formData.quantidadePadrao,
        periodicidadePadrao: formData.periodicidadePadrao,
        statusCliente: formData.statusCliente,
        metaGiroSemanal: formData.metaGiroSemanal,
        representanteId: formData.representanteId,
        rotaEntregaId: formData.rotaEntregaId,
        categoriaEstabelecimentoId: formData.categoriaEstabelecimentoId,
        instrucoesEntrega: formData.instrucoesEntrega || undefined,
        contabilizarGiroMedio: formData.contabilizarGiroMedio,
        tipoLogistica: formData.tipoLogistica,
        emiteNotaFiscal: formData.emiteNotaFiscal,
        tipoCobranca: formData.tipoCobranca,
        formaPagamento: formData.formaPagamento,
        observacoes: formData.observacoes || undefined,
        categoriasHabilitadas: formData.categoriasHabilitadas,
        ativo: formData.statusCliente === "Ativo",
        giroMedioSemanal: Math.round(formData.quantidadePadrao / (formData.periodicidadePadrao / 7))
      };

      if (clienteId) {
        await atualizarCliente(clienteId, clienteData);
      } else {
        await adicionarCliente(clienteData);
      }
      
      onOpenChange(false);
      onClienteUpdate?.();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {clienteId ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados Básicos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
                <Input
                  id="cnpjCpf"
                  type="text"
                  value={formData.cnpjCpf}
                  onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                  placeholder="CNPJ ou CPF"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enderecoEntrega">Endereço de Entrega</Label>
              <Textarea
                id="enderecoEntrega"
                value={formData.enderecoEntrega}
                onChange={(e) => setFormData({ ...formData, enderecoEntrega: e.target.value })}
                placeholder="Endereço completo para entrega"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkGoogleMaps">Link Google Maps</Label>
              <Input
                id="linkGoogleMaps"
                type="url"
                value={formData.linkGoogleMaps}
                onChange={(e) => setFormData({ ...formData, linkGoogleMaps: e.target.value })}
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contatoNome">Nome do Contato</Label>
                <Input
                  id="contatoNome"
                  type="text"
                  value={formData.contatoNome}
                  onChange={(e) => setFormData({ ...formData, contatoNome: e.target.value })}
                  placeholder="Nome da pessoa de contato"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contatoTelefone">Telefone do Contato</Label>
                <Input
                  id="contatoTelefone"
                  type="tel"
                  value={formData.contatoTelefone}
                  onChange={(e) => setFormData({ ...formData, contatoTelefone: e.target.value })}
                  placeholder="Telefone para contato"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contatoEmail">Email do Contato</Label>
                <Input
                  id="contatoEmail"
                  type="email"
                  value={formData.contatoEmail}
                  onChange={(e) => setFormData({ ...formData, contatoEmail: e.target.value })}
                  placeholder="Email para contato"
                />
              </div>
            </div>
          </div>

          {/* Configurações Comerciais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurações Comerciais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidadePadrao">Quantidade Padrão</Label>
                <Input
                  id="quantidadePadrao"
                  type="number"
                  value={formData.quantidadePadrao}
                  onChange={(e) => handleNumberChange("quantidadePadrao", Number(e.target.value))}
                  placeholder="Quantidade padrão de produtos"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="periodicidadePadrao">Periodicidade (dias)</Label>
                <Input
                  id="periodicidadePadrao"
                  type="number"
                  value={formData.periodicidadePadrao}
                  onChange={(e) => handleNumberChange("periodicidadePadrao", Number(e.target.value))}
                  placeholder="Frequência de reposição"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="statusCliente">Status do Cliente</Label>
                <Select onValueChange={(value) => handleSelectChange("statusCliente", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Entrega e Logística */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Entrega e Logística</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {representantes && representantes.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="representanteId">Representante</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, representanteId: Number(value) })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o representante" />
                    </SelectTrigger>
                    <SelectContent>
                      {representantes.map((rep) => (
                        <SelectItem key={rep.id} value={String(rep.id)}>
                          {rep.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {rotasEntrega && rotasEntrega.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="rotaEntregaId">Rota de Entrega</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, rotaEntregaId: Number(value) })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a rota" />
                    </SelectTrigger>
                    <SelectContent>
                      {rotasEntrega.map((rota) => (
                        <SelectItem key={rota.id} value={String(rota.id)}>
                          {rota.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {categoriasEstabelecimento && categoriasEstabelecimento.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="categoriaEstabelecimentoId">Categoria Estabelecimento</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, categoriaEstabelecimentoId: Number(value) })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasEstabelecimento.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tiposLogistica && tiposLogistica.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="tipoLogistica">Tipo de Logística</Label>
                  <Select onValueChange={(value) => handleSelectChange("tipoLogistica", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposLogistica.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nome}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrucoesEntrega">Instruções de Entrega</Label>
              <Textarea
                id="instrucoesEntrega"
                value={formData.instrucoesEntrega}
                onChange={handleInputChange}
                placeholder="Instruções adicionais para a entrega"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="contabilizarGiroMedio">Contabilizar no Giro Médio</Label>
              <Switch
                id="contabilizarGiroMedio"
                checked={formData.contabilizarGiroMedio}
                onCheckedChange={(checked) => handleSwitchChange("contabilizarGiroMedio", checked)}
              />
            </div>
          </div>

          {/* Configurações Financeiras e Fiscais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Financeiro e Fiscal</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiposCobranca && tiposCobranca.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
                  <Select onValueChange={(value) => handleSelectChange("tipoCobranca", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposCobranca.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nome}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formasPagamento && formasPagamento.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                  <Select onValueChange={(value) => handleSelectChange("formaPagamento", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map((forma) => (
                        <SelectItem key={forma.id} value={forma.nome}>
                          {forma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Label htmlFor="emiteNotaFiscal">Emitir Nota Fiscal</Label>
                <Switch
                  id="emiteNotaFiscal"
                  checked={formData.emiteNotaFiscal}
                  onCheckedChange={(checked) => handleSwitchChange("emiteNotaFiscal", checked)}
                />
              </div>
            </div>
          </div>

          {/* Observações e Categorias */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Observações e Categorias</h3>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                placeholder="Observações adicionais sobre o cliente"
                rows={2}
              />
            </div>

            <CategoriasProdutoSelector
              selectedCategorias={formData.categoriasHabilitadas}
              onChange={handleCategoriasChange}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {clienteId ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
