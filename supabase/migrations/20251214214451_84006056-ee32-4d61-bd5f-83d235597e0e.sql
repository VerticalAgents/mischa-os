-- Create table for AI usage logging
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  tokens_estimados integer DEFAULT 0,
  tipo_requisicao text DEFAULT 'chat',
  sucesso boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see and insert their own logs
CREATE POLICY "Users can view own ai_usage_logs"
ON public.ai_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_usage_logs"
ON public.ai_usage_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for efficient querying by user and date
CREATE INDEX idx_ai_usage_logs_user_created ON public.ai_usage_logs(user_id, created_at DESC);