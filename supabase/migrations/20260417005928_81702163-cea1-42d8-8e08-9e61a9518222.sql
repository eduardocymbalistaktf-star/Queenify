-- 1) Rate limiting do webhook externo (janela de 1 minuto por token)
CREATE TABLE IF NOT EXISTS public.webhook_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES public.external_webhook_tokens(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  request_count integer NOT NULL DEFAULT 0,
  UNIQUE (token_id, window_start)
);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_lookup ON public.webhook_rate_limits(token_id, window_start);
ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view their rate limits" ON public.webhook_rate_limits
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.external_webhook_tokens t
    WHERE t.id = token_id AND t.user_id = auth.uid()
  ));

-- 2) Preferências de agendamento ROAS por usuário
CREATE TABLE IF NOT EXISTS public.roas_alert_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  frequency text NOT NULL DEFAULT 'daily', -- daily | weekly
  hour_utc integer NOT NULL DEFAULT 12,    -- 0-23
  weekday integer NOT NULL DEFAULT 1,      -- 0=dom,1=seg,...6=sab (usado se weekly)
  cron_jobid bigint,                        -- id retornado pelo cron.schedule
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roas_alert_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own roas schedules" ON public.roas_alert_schedules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_roas_schedules_updated_at BEFORE UPDATE ON public.roas_alert_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Histórico de execuções do ROAS check
CREATE TABLE IF NOT EXISTS public.roas_alert_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'success', -- success | failed
  alerts_created integer NOT NULL DEFAULT 0,
  campaigns_checked integer NOT NULL DEFAULT 0,
  error_message text,
  triggered_by text NOT NULL DEFAULT 'cron', -- cron | manual
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_roas_executions_user ON public.roas_alert_executions(user_id, created_at DESC);
ALTER TABLE public.roas_alert_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own executions" ON public.roas_alert_executions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own executions" ON public.roas_alert_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4) Conversas e mensagens do bot de trackeamento
CREATE TABLE IF NOT EXISTS public.tracking_bot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_bot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bot conversations" ON public.tracking_bot_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_bot_conv_updated_at BEFORE UPDATE ON public.tracking_bot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.tracking_bot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.tracking_bot_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL, -- user | assistant
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bot_messages_conv ON public.tracking_bot_messages(conversation_id, created_at);
ALTER TABLE public.tracking_bot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bot messages" ON public.tracking_bot_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);