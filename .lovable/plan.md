## Problema

O cadastro de cliente pelo representante está falhando com:
`new row violates row-level security policy for table "clientes"`

A política de INSERT exige:
`is_representante() AND representante_id = get_my_representante_id()`

No `ClienteFormDialog.tsx`, o `representanteId` do form é preenchido com `meuRepresentanteId` (vindo do hook `useMyRepresentanteId`, que faz uma chamada RPC assíncrona). Mas isso é feito dentro de um `useEffect` cujas deps são apenas `[open, cliente?.id, dadosIniciais]`. Quando o representante abre o diálogo antes do RPC terminar, `meuRepresentanteId` ainda é `null`, o form salva com `representante_id = null`, e o RLS rejeita o insert.

Isso é um regressão recente — o fluxo funcionava quando o RPC respondia mais rápido que o usuário clicar em "Salvar" ou quando o diálogo era aberto por um caminho que já tinha o id resolvido.

## Correção

`src/components/clientes/ClienteFormDialog.tsx`

1. No `useEffect` de inicialização (linhas ~119-168), adicionar `meuRepresentanteId` e `isRep` às dependências, e só rodar a inicialização do "modo criação" quando `meuRepresentanteId` estiver resolvido (caso o usuário seja representante).

2. Como salvaguarda dentro de `handleSubmit`, se `isRep` e `formData.representanteId` estiver vazio, forçar `formData.representanteId = meuRepresentanteId` antes de chamar `adicionarCliente`. Se ainda assim estiver `null`, abortar com toast pedindo para tentar novamente.

3. Desabilitar o botão "Salvar" enquanto `isRep && !meuRepresentanteId` (loading do hook), para evitar submit prematuro.

Nada mais precisa mudar — RLS, sanitizer e store já estão corretos.

## Verificação

- Login como representante → abrir cadastro de novo cliente → salvar imediatamente → deve funcionar.
- Console deve mostrar `representante_id` preenchido no payload sanitizado.
- Admin/staff continuam podendo cadastrar normalmente (sem mudança de comportamento para esses papéis).
