
# Plano: Adicionar prazo de 28 dias para Boleto

## Objetivo
Adicionar a opção de prazo de pagamento de 28 dias no seletor de "Prazo de Pagamento" que aparece quando a forma de pagamento é Boleto.

## Alteração Necessária

### Arquivo: `src/components/clientes/ClienteFormDialog.tsx`

**Local:** Linhas 649-653

**Antes:**
```tsx
<SelectContent>
  <SelectItem value="7">7 dias</SelectItem>
  <SelectItem value="14">14 dias</SelectItem>
  <SelectItem value="21">21 dias</SelectItem>
</SelectContent>
```

**Depois:**
```tsx
<SelectContent>
  <SelectItem value="7">7 dias</SelectItem>
  <SelectItem value="14">14 dias</SelectItem>
  <SelectItem value="21">21 dias</SelectItem>
  <SelectItem value="28">28 dias</SelectItem>
</SelectContent>
```

## Resultado

O seletor de prazo de pagamento para clientes com forma de pagamento "Boleto" passará a ter 4 opções:
- 7 dias
- 14 dias  
- 21 dias
- **28 dias** (nova opção)

## Impacto
- Nenhuma alteração de banco de dados necessária (o campo `prazo_pagamento_dias` já aceita qualquer número inteiro)
- Nenhuma alteração de tipos necessária
- Compatível com a integração GestaoClick existente
