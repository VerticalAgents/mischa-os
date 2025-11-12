-- Corrigir função de geração automática de parcelas
-- A lógica correta deve considerar:
-- 1. Se compra ANTES do fechamento → primeira parcela no próximo mês (dia vencimento)
-- 2. Se compra DEPOIS do fechamento → primeira parcela pula 2 meses (dia vencimento)
-- 3. Todas parcelas devem vencer no DIA EXATO do vencimento configurado no cartão

CREATE OR REPLACE FUNCTION public.gerar_parcelas_automaticamente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_valor_parcela NUMERIC(10,2);
  v_valor_ultima_parcela NUMERIC(10,2);
  v_data_vencimento DATE;
  v_dia_vencimento INTEGER;
  v_dia_fechamento INTEGER;
  v_contador INTEGER;
BEGIN
  -- Buscar informações do cartão
  SELECT dia_vencimento, dia_fechamento
  INTO v_dia_vencimento, v_dia_fechamento
  FROM cartoes_credito
  WHERE id = NEW.cartao_id;

  -- Calcular valor da parcela (arredondar para baixo)
  v_valor_parcela := FLOOR((NEW.valor_total / NEW.numero_parcelas) * 100) / 100;
  
  -- Calcular valor da última parcela (para compensar arredondamento)
  v_valor_ultima_parcela := NEW.valor_total - (v_valor_parcela * (NEW.numero_parcelas - 1));

  -- Calcular primeira data de vencimento
  -- Lógica: Se a compra foi DEPOIS do dia de fechamento, a primeira parcela
  -- vai para o segundo mês seguinte. Se foi ANTES, vai para o próximo mês.
  IF EXTRACT(DAY FROM NEW.data_compra) > v_dia_fechamento THEN
    -- Compra depois do fechamento: pula 2 meses
    v_data_vencimento := (DATE_TRUNC('month', NEW.data_compra) + INTERVAL '2 months')::date + (v_dia_vencimento - 1);
  ELSE
    -- Compra antes do fechamento: próximo mês
    v_data_vencimento := (DATE_TRUNC('month', NEW.data_compra) + INTERVAL '1 month')::date + (v_dia_vencimento - 1);
  END IF;

  -- Gerar as parcelas
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
      CASE WHEN v_contador = NEW.numero_parcelas 
           THEN v_valor_ultima_parcela 
           ELSE v_valor_parcela 
      END,
      v_data_vencimento,
      'pendente'
    );

    -- Avançar para o próximo mês, mantendo sempre o dia do vencimento
    v_data_vencimento := (DATE_TRUNC('month', v_data_vencimento) + INTERVAL '1 month')::date + (v_dia_vencimento - 1);
  END LOOP;

  RETURN NEW;
END;
$function$;