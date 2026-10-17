-- Habilita extensões necessárias (idempotente)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função SECURITY DEFINER que (re)agenda o cron individual do user
CREATE OR REPLACE FUNCTION public.schedule_user_roas_cron(
  p_job_name text,
  p_cron_expr text,
  p_fn_url text,
  p_service_key text,
  p_user_id uuid
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_jobid bigint;
  v_cmd text;
BEGIN
  -- Remove job antigo com mesmo nome (idempotente)
  BEGIN
    PERFORM cron.unschedule(p_job_name);
  EXCEPTION WHEN OTHERS THEN
    -- ignore se não existir
    NULL;
  END;

  v_cmd := format(
    $cmd$ select net.http_post(
      url := %L,
      headers := %L::jsonb,
      body := %L::jsonb
    ) $cmd$,
    p_fn_url,
    json_build_object('Content-Type','application/json','Authorization','Bearer '||p_service_key)::text,
    json_build_object('user_id', p_user_id, 'triggered_by', 'cron')::text
  );

  v_jobid := cron.schedule(p_job_name, p_cron_expr, v_cmd);
  RETURN v_jobid;
END;
$$;

-- Função pra remover job (usada quando user desliga)
CREATE OR REPLACE FUNCTION public.unschedule_user_roas_cron(p_job_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  BEGIN
    PERFORM cron.unschedule(p_job_name);
    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_user_roas_cron(text,text,text,text,uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.unschedule_user_roas_cron(text) FROM public, anon, authenticated;