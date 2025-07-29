
-- Create the pedidos table
CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  data_pedido timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Pendente',
  valor_total numeric NOT NULL DEFAULT 0,
  observacoes text,
  itens jsonb NOT NULL DEFAULT '[]',
  data_entrega timestamp with time zone,
  endereco_entrega text,
  contato_entrega text,
  numero_pedido_cliente text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage pedidos
CREATE POLICY "Authenticated users can manage pedidos" 
  ON public.pedidos 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger to update updated_at column
CREATE TRIGGER update_pedidos_updated_at 
  BEFORE UPDATE ON public.pedidos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
