-- Adicionar coluna para data customizada da primeira parcela
ALTER TABLE parcelamentos 
ADD COLUMN primeira_data_vencimento DATE;

-- Função pública que centraliza a lógica de cálculo da primeira data de vencimento
CREATE OR REPLACE FUNCTION public.compute_primeira_data_vencimento(
  p_cartao_id UUID,
  p_data_compra DATE
)
RETURNS DATE
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_dia_vencimento INTEGER;
  v_dia_fechamento INTEGER;
  v_ano_compra INTEGER;
  v_mes_compra INTEGER;
  v_data_fechamento_mes DATE;
  v_meses_para_primeira INTEGER;
BEGIN
  -- Buscar configurações do cartão
  SELECT dia_vencimento, dia_fechamento
  INTO v_dia_vencimento, v_dia_fechamento
  FROM cartoes_credito
  WHERE id = p_cartao_id;

  IF v_dia_vencimento IS NULL OR v_dia_fechamento IS NULL THEN
    RAISE EXCEPTION 'Cartão não encontrado ou sem configuração de vencimento/fechamento';
  END IF;

  -- Extrair ano e mês da compra
  v_ano_compra := EXTRACT(YEAR FROM p_data_compra)::INTEGER;
  v_mes_compra := EXTRACT(MONTH FROM p_data_compra)::INTEGER;

  -- Construir data de fechamento do mês da compra
  v_data_fechamento_mes := make_date(
    v_ano_compra,
    v_mes_compra,
    LEAST(v_dia_fechamento, EXTRACT(DAY FROM (make_date(v_ano_compra, v_mes_compra, 1) + INTERVAL '1 month - 1 day')::DATE)::INTEGER)
  );

  -- Determinar quantos meses adicionar
  IF p_data_compra >= v_data_fechamento_mes THEN
    v_meses_para_primeira := 2;
  ELSE
    v_meses_para_primeira := 1;
  END IF;

  -- Retornar data calculada usando a função auxiliar
  RETURN adicionar_meses_com_dia_fixo(p_data_compra, v_meses_para_primeira, v_dia_vencimento);
END;
$$;

-- Atualizar trigger para usar a nova lógica centralizada
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
  v_contador INTEGER;
  v_default_due DATE;
  v_last_day_month INTEGER;
  v_dia_esperado INTEGER;
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
  ELSE
    -- Validar compatibilidade com o dia do cartão
    v_last_day_month := EXTRACT(DAY FROM (DATE_TRUNC('month', NEW.primeira_data_vencimento) + INTERVAL '1 month - 1 day')::DATE)::INTEGER;
    v_dia_esperado := LEAST(v_dia_vencimento, v_last_day_month);
    
    IF EXTRACT(DAY FROM NEW.primeira_data_vencimento)::INTEGER != v_dia_esperado THEN
      RAISE EXCEPTION 'A primeira parcela deve vencer no dia % (dia configurado do cartão)', v_dia_esperado;
    END IF;

    -- Validar que não está antecipando indevidamente
    IF NEW.primeira_data_vencimento < v_default_due THEN
      RAISE EXCEPTION 'A primeira parcela não pode vencer antes de % (data mínima baseada no ciclo do cartão)', v_default_due;
    END IF;

    v_data_vencimento := NEW.primeira_data_vencimento;
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

    -- Avançar para próximo mês mantendo sempre o dia do vencimento
    v_data_vencimento := adicionar_meses_com_dia_fixo(
      v_data_vencimento,
      1,
      v_dia_vencimento
    );
  END LOOP;

  RETURN NEW;
END;
$$;