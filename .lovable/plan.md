

## Plano: Cadastrar 2 clientes faltantes + vincular Yuri como representante

### Ação
Inserir via SQL (insert tool) os 2 clientes na tabela `clientes` com `representante_id = 16` (Yuri Leonardo):

| Campo | Mini Mercado Giacomolli | Mercadinho Gourmet |
|-------|------------------------|-------------------|
| nome | Mini Mercado Giacomolli | Mercadinho Gourmet |
| cnpj_cpf | 58.020.599/0001-05 | 57.677.305/0001-50 |
| inscricao_estadual | 096/4041464 | 800/4027685 |
| contato_telefone | 51 99227-5771 | 51 99884-1863 |
| contato_nome | — | Ester |
| endereco_entrega | — | Coronel Massot, 1094 |
| tipo_pessoa | PJ | PJ |
| status_cliente | ATIVO | ATIVO |
| representante_id | 16 | 16 |

Também atualizar os 3 clientes cadastrados anteriormente (Mercado Cristal, La La Mercado, Mercado Sasso) para vincular `representante_id = 16`.

### Detalhes técnicos
- 1 INSERT com 2 registros novos
- 1 UPDATE nos 3 clientes existentes para setar `representante_id = 16`

