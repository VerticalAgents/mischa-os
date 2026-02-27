

# Busca por CNPJ sem pontuacao no Dashboard e Clientes

## O que muda

Dois lugares serao ajustados para permitir busca por CNPJ (com ou sem pontuacao):

### 1. Dashboard do Agendamento (`AgendamentoDashboard.tsx`)

O filtro "Buscar cliente..." hoje so busca pelo nome. Sera adicionada busca por CNPJ com normalizacao (removendo `.`, `-`, `/`).

**Linha 195-196** - de:
```typescript
filtrados = filtrados.filter(agendamento => 
  agendamento.cliente.nome.toLowerCase().includes(termoBusca)
);
```
para:
```typescript
filtrados = filtrados.filter(agendamento => 
  agendamento.cliente.nome.toLowerCase().includes(termoBusca) ||
  (agendamento.cliente.cnpjCpf || '').replace(/[.\-\/]/g, '').toLowerCase().includes(termoBusca.replace(/[.\-\/]/g, ''))
);
```

O placeholder sera atualizado para `"Buscar cliente ou CNPJ..."`.

### 2. Menu Clientes (`useClienteStore.ts`)

A busca por CNPJ ja existe, mas nao normaliza pontuacao. Sera ajustada.

**Linha 539** - de:
```typescript
cliente.cnpjCpf.includes(filtros.termo)
```
para:
```typescript
(cliente.cnpjCpf || '').replace(/[.\-\/]/g, '').toLowerCase().includes(filtros.termo.replace(/[.\-\/]/g, '').toLowerCase())
```

## Arquivos alterados

- `src/components/agendamento/AgendamentoDashboard.tsx` - adicionar busca por CNPJ no filtro
- `src/hooks/useClienteStore.ts` - normalizar pontuacao na busca por CNPJ
