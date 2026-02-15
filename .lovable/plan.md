

# Corrigir botao de excluir registros de reagendamentos

## Problema

A tabela `reagendamentos_entre_semanas` possui RLS habilitado, mas so tem politicas para SELECT e INSERT. Nao existe politica para DELETE, entao o Supabase bloqueia silenciosamente qualquer tentativa de exclusao.

## Solucao

Criar uma migracao SQL adicionando uma politica RLS de DELETE para usuarios autenticados:

```sql
CREATE POLICY "Authenticated users can delete reagendamentos"
  ON public.reagendamentos_entre_semanas
  FOR DELETE
  TO authenticated
  USING (true);
```

## Arquivo impactado

| Arquivo | Mudanca |
|---------|---------|
| Nova migracao SQL | Adicionar politica RLS de DELETE na tabela `reagendamentos_entre_semanas` |

Nenhuma alteracao de codigo frontend e necessaria -- o hook `useReagendamentosEntreSemanas` ja faz o `supabase.from(...).delete()` corretamente, so estava sendo bloqueado pela falta da politica.

