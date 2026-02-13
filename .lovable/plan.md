
# Excluir log de reagendamento

## O que sera feito

Adicionar um botao de exclusao em cada linha da tabela de reagendamentos, com confirmacao via AlertDialog antes de deletar.

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useReagendamentosEntreSemanas.ts` | Adicionar funcao `excluir(id)` que deleta o registro do banco e recarrega a lista |
| `src/components/reagendamentos/ReagendamentosTable.tsx` | Adicionar coluna "Acoes" com botao de lixeira + AlertDialog de confirmacao |
| `src/pages/Reagendamentos.tsx` | Passar a funcao `excluir` do hook para a tabela |

## Detalhes tecnicos

### Hook - `useReagendamentosEntreSemanas.ts`

Adicionar funcao `excluir`:

```typescript
const excluir = useCallback(async (id: string) => {
  const { error } = await supabase
    .from('reagendamentos_entre_semanas')
    .delete()
    .eq('id', id);
  if (error) throw error;
  await carregar(); // recarrega lista e resumo
}, [carregar]);
```

Retornar `excluir` junto com os demais valores.

### Tabela - `ReagendamentosTable.tsx`

- Receber prop `onExcluir: (id: string) => Promise<void>`
- Adicionar coluna "Acoes" no header
- Em cada linha, botao com icone `Trash2` que abre um `AlertDialog` perguntando "Tem certeza que deseja excluir este registro?"
- Ao confirmar, chamar `onExcluir(r.id)` e exibir toast de sucesso/erro

### Pagina - `Reagendamentos.tsx`

Passar a funcao `excluir` do hook como prop `onExcluir` para `ReagendamentosTable`.
