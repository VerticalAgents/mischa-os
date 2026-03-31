INSERT INTO public.clientes (nome, cnpj_cpf, inscricao_estadual, contato_telefone, tipo_pessoa, status_cliente, representante_id)
VALUES ('Mini Mercado Giacomolli', '58.020.599/0001-05', '096/4041464', '51 99227-5771', 'PJ', 'ATIVO', 16);

INSERT INTO public.clientes (nome, cnpj_cpf, inscricao_estadual, contato_telefone, contato_nome, endereco_entrega, tipo_pessoa, status_cliente, representante_id)
VALUES ('Mercadinho Gourmet', '57.677.305/0001-50', '800/4027685', '51 99884-1863', 'Ester', 'Coronel Massot, 1094', 'PJ', 'ATIVO', 16);

UPDATE public.clientes SET representante_id = 16 WHERE id IN ('c834e92c-e0a5-45bc-9e7d-1910881c725b', '5ebc48d5-1c58-4c17-81e8-330912cb6f1d', '04fb989d-49dc-4226-8696-33bfadb9fe83');