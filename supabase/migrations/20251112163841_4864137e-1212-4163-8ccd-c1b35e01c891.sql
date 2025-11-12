-- Remove validação restritiva que impede datas personalizadas
CREATE OR REPLACE FUNCTION public.gerar_parcelas_automaticamente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valor_parcela NUMERIC(10,2);
  v_valor_ultima_parcela NUMERIC(10,2);
  v_data_vencimento DATE;
  v_dia_vencimento INTEGER;
  v_dia_para_usar INTEGER;
  v_contador INTEGER;
  v_default_due DATE;
BEGIN
  -- Buscar dia de vencimento do cartão
  SELECT dia_vencimento
  INTO v_dia_vencimento
  FROM cartoes_credito
  WHERE id = NEW.cartao_id;

  IF v_dia_vencimento IS NULL THEN
    RAISE EXCEPTION 'Cartão não encontrado ou sem dia de vencimento configurado';
  END IF;

  -- Calcular valores das parcelas
  v_valor_parcela := FLOOR((NEW.valor_total / NEW.numero_parcelas) * 100) / 100;
  v_valor_ultima_parcela := NEW.valor_total - (v_valor_parcela * (NEW.numero_parcelas - 1));

  -- Obter data de vencimento padrão usando a função centralizada
  v_default_due := public.compute_primeira_data_vencimento(NEW.cartao_id, NEW.data_compra);

  -- Determinar data inicial de vencimento
  IF NEW.primeira_data_vencimento IS NULL THEN
    v_data_vencimento := v_default_due;
    v_dia_para_usar := v_dia_vencimento; -- Usa dia do cartão
  ELSE
    -- Validar apenas que não está antecipando indevidamente
    IF NEW.primeira_data_vencimento < v_default_due THEN
      RAISE EXCEPTION 'A primeira parcela não pode vencer antes de % (data mínima baseada no ciclo do cartão)', v_default_due;
    END IF;

    v_data_vencimento := NEW.primeira_data_vencimento;
    -- Usa o dia da data personalizada para todas as parcelas
    v_dia_para_usar := EXTRACT(DAY FROM NEW.primeira_data_vencimento)::INTEGER;
  END IF;

  -- Gerar todas as parcelas
  FOR v_contador IN 1..NEW.numero_parcelas LOOP
    INSERT INTO parcelas (
      parcelamento_id,
      numero_parcela,
      valor_parcela,
      data_vencimento,
      status
    ) VALUES (
      NEW.id,
      v_contador,
      CASE 
        WHEN v_contador = NEW.numero_parcelas THEN v_valor_ultima_parcela 
        ELSE v_valor_parcela 
      END,
      v_data_vencimento,
      'pendente'
    );

    -- Avançar para próximo mês usando o dia determinado
    v_data_vencimento := adicionar_meses_com_dia_fixo(
      v_data_vencimento,
      1,
      v_dia_para_usar
    );
  END LOOP;

  RETURN NEW;
END;
$$;