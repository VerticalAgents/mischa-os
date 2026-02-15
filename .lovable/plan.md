

# Correcao: Constraint do banco rejeita tipos de logistica customizados

## Problema

O erro `new row for relation "clientes" violates check constraint "ck_tipo_logistica_canonical"` acontece porque existe uma constraint no banco de dados que so aceita dois valores:

```text
CHECK (tipo_logistica IN ('PROPRIA', 'TERCEIRIZADA'))
```

A correcao anterior no sanitizador passou a aceitar valores customizados, mas o banco continua rejeitando qualquer valor fora dessa lista.

## Solucao

Remover a constraint `ck_tipo_logistica_canonical` da tabela `clientes`, ja que os tipos de logistica sao dinamicos (cadastrados pelo usuario na tabela `tipos_logistica`).

Tambem verificar e remover constraints equivalentes para `tipo_cobranca` e `forma_pagamento`, que tem o mesmo problema potencial.

## Alteracoes

| Local | Mudanca |
|-------|---------|
| Banco de dados (SQL) | `ALTER TABLE clientes DROP CONSTRAINT ck_tipo_logistica_canonical;` |
| Banco de dados (SQL) | Verificar e remover constraints similares para `tipo_cobranca` e `forma_pagamento` se existirem |

## Detalhes tecnicos

Sera executado via migracao SQL:

```sql
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_tipo_logistica_canonical;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_tipo_cobranca_canonical;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_forma_pagamento_canonical;
```

A validacao dos valores continua sendo feita no frontend (dropdown so mostra tipos cadastrados na tabela `tipos_logistica`), tornando a constraint do banco desnecessaria e restritiva.

