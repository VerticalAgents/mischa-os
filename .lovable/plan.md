
# Plano: Cadastrar 5 Novos Clientes

## Dados dos Clientes

| Nome | CNPJ | Email | Pagamento | Prazo |
|------|------|-------|-----------|-------|
| Bar do Darci | 97.174.130/0001-82 | anapaula.didomenico@outlook.com | BOLETO | 7 dias |
| 087 Hamburgueria | 58.418.863/0001-63 | andiaracps@gmail.com | BOLETO | 14 dias |
| Clóvis Coser | 40.476.286/034 | hiago.tqmc1500@gemail.com | BOLETO | 7 dias |
| Cleunice Bueno Tonial | 44.789.823/0001-13 | cleonicebueno72@gmail.com | BOLETO | 7 dias |
| Luan Renato | 50.786.667/0001-30 | luanlange@hotmail.com | BOLETO | 7 dias |

## Configuração Padrão

- **Representante**: Ítalo Bergenthal (ID: 14)
- **Tipo Pessoa**: PJ
- **Status**: Ativo
- **Forma de Pagamento**: BOLETO (exceto Luan Renato que não informou)

## Ação

Executar INSERT na tabela `clientes` com os 5 registros usando os dados fornecidos.

## Observações

- O CNPJ "40.476.286/034" (Clóvis Coser) parece incompleto - será cadastrado como informado
- Luan Renato não informou condição de pagamento - será cadastrado como BOLETO 7 dias por padrão
- Após cadastro, usar "Sincronizar com Gestão Click" para criar no GC automaticamente
