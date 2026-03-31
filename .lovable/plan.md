

## Plano: Cadastrar 3 novos clientes

### Dados a inserir na tabela `clientes`

| Campo | Mercado Cristal | La La Mercado | Mercado Sasso |
|-------|----------------|---------------|---------------|
| nome | Mercado Cristal | La La Mercado | Mercado Sasso |
| razao_social (campo não existe*) | Mini Mercado Bom Fim Ltda | La La Mercado Ltda | Mercado Sasso Ltda |
| cnpj_cpf | 94.296.456/0001-94 | 60.966.958/0001-63 | 11.801.558/0001-92 |
| inscricao_estadual | 087/0067710 | 096/4068834 | 096/3359541 |
| contato_telefone | 51 98231-3231 | 51 99858-7079 | 51 3241-6144 |
| contato_nome | Juliano | — | — |
| tipo_pessoa | PJ | PJ | PJ |

### Observação sobre Razão Social
A tabela `clientes` não possui coluna `razao_social`. Vou verificar como o sistema armazena essa informação (pode estar no campo `nome` ou em outro local) antes de inserir.

### Ação
- Inserir os 3 clientes via SQL INSERT na tabela `clientes`
- Campos não informados (endereço, etc.) ficam como NULL
- Status padrão: ATIVO

