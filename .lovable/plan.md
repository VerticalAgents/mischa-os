

# Remover inativacao automatica de clientes

## Problema
A funcao `auto_standby_clientes_inativos_60dias` esta movendo clientes de STANDBY para INATIVO automaticamente apos 90 dias, e zerando seus agendamentos. Isso esta afetando clientes que nao deveriam ser inativados.

## Solucao

### 1. Migration SQL - Duas acoes

**Recriar a funcao sem a logica de 90 dias**: Remover os dois blocos que fazem STANDBY→INATIVO e que zeram agendamentos. Manter apenas as regras de ATIVO→STANDBY (60 dias) e ATIVO→A_ATIVAR (sem entregas).

**Reverter clientes afetados**: Mover todos os clientes INATIVO que possuem `ultima_data_reposicao_efetiva` (ou seja, tiveram entregas) de volta para STANDBY, ja que pela logica correta eles deveriam estar em STANDBY (60+ dias sem entrega). Clientes que ja eram INATIVO manualmente e tinham `ativo = false` antes tambem serao movidos para STANDBY - o usuario pode re-inativar manualmente os que realmente devem ser inativos.

A funcao resultante fica apenas:
```sql
BEGIN
  -- 60+ dias sem entrega -> STANDBY
  UPDATE clientes SET status_cliente = 'STANDBY'
  WHERE status_cliente = 'ATIVO'
    AND ultima_data_reposicao_efetiva < (CURRENT_DATE - INTERVAL '60 days');

  -- Sem entregas -> A_ATIVAR
  UPDATE clientes SET status_cliente = 'A_ATIVAR'
  WHERE status_cliente = 'ATIVO'
    AND ultima_data_reposicao_efetiva IS NULL
    AND NOT EXISTS (...);
END;
```

### 2. Nenhuma alteracao no frontend
O status REATIVAR e o restante da logica frontend permanecem intactos - a inativacao manual continua funcionando, so a automatica e removida.

## Arquivos alterados
1. **Nova migration SQL**: Recriar funcao + reverter clientes

