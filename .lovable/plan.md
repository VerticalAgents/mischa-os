

# Rota de entrega automatica para tipo de logistica "Retirada"

## Comportamento

Quando o tipo de logistica selecionado for "Retirada" (case-insensitive):
- O campo "Rota de Entrega" sera automaticamente preenchido com o texto **"Retirada"** e ficara **desabilitado** (nao editavel)
- O valor `rotaEntregaId` sera setado como `undefined` (nao aponta para nenhuma rota real do banco)
- Internamente, o nome da rota sera salvo como "Retirada" no campo `rotaEntregaId` ou tratado de forma especial

Quando o tipo de logistica for alterado para qualquer outro valor:
- O campo "Rota de Entrega" volta a ser editavel normalmente
- O valor "Retirada" e limpo e o usuario pode selecionar uma rota real

## Alteracoes

| Arquivo | Mudanca |
|---------|---------|
| `ClienteFormDialog.tsx` | Quando `tipoLogistica` = "retirada", desabilitar o Select de rota e mostrar "Retirada" como valor fixo. Ao mudar para "retirada", limpar `rotaEntregaId` e setar um valor sentinela. Ao sair de "retirada", limpar o valor sentinela |

## Detalhes tecnicos

No `ClienteFormDialog.tsx`:

1. **No handler de `tipoLogistica`**: quando o valor mudar para "retirada", setar `rotaEntregaId` como `undefined` (sem rota real). Quando mudar para outro valor, manter o `rotaEntregaId` atual.

2. **No campo de Rota de Entrega**: verificar se `formData.tipoLogistica?.toLowerCase() === 'retirada'`. Se sim, renderizar um Input desabilitado com valor "Retirada" em vez do Select. Se nao, renderizar o Select normal.

```typescript
// No bloco de rota de entrega
{formData.tipoLogistica?.toLowerCase() === 'retirada' ? (
  <Input value="Retirada" disabled />
) : (
  <Select ...> {/* select normal */} </Select>
)}
```

3. **No handleInputChange de tipoLogistica**: limpar a rota quando mudar para "retirada":

```typescript
if (field === 'tipoLogistica') {
  if (value?.toString().toLowerCase() === 'retirada') {
    setFormData(prev => ({ ...prev, tipoLogistica: value, rotaEntregaId: undefined }));
  }
}
```

4. **No salvamento**: o campo `rotaEntregaId` sera `null` para clientes de retirada (sem rota real associada). A identificacao de que e "retirada" vem do `tipoLogistica`.

