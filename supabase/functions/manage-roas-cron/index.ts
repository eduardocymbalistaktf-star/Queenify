import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gera/atualiza/desliga um pg_cron job individual por usuário pra rodar
// o roas-alert-check no horário e frequência escolhidos.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { is_enabled, frequency, hour_utc, weekday } = await req.json();
    if (typeof is_enabled !== "boolean" || (frequency !== "daily" && frequency !== "weekly") ||
      !Number.isInteger(hour_utc) || hour_utc < 0 || hour_utc > 23 ||
      !Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return new Response(JSON.stringify({ error: "Configuração de frequência inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, serviceKey);
    const jobName = `roas_alert_user_${user.id.replace(/-/g, "")}`;

    // Pega prefs anterior pra remover o job antigo (se houver)
    const { data: prevPref } = await supabase
      .from("roas_alert_schedules")
      .select("cron_jobid")
      .eq("user_id", user.id)
      .maybeSingle();

    if (prevPref?.cron_jobid) {
      const { error: unscheduleError } = await supabase.rpc("unschedule_user_roas_cron", {
        p_job_name: jobName,
      });
      if (unscheduleError) throw new Error("Não foi possível atualizar o agendamento anterior");
    }

    let newJobId: number | null = null;

    if (is_enabled) {
      const cronExpr = frequency === "weekly"
        ? `0 ${hour_utc} * * ${weekday}`
        : `0 ${hour_utc} * * *`;

      const fnUrl = `${supabaseUrl}/functions/v1/roas-alert-check`;
      const { data: jobIdData, error: rpcErr } = await supabase.rpc("schedule_user_roas_cron", {
        p_job_name: jobName,
        p_cron_expr: cronExpr,
        p_fn_url: fnUrl,
        p_service_key: serviceKey,
        p_user_id: user.id,
      });

      if (rpcErr) {
        console.error("schedule_user_roas_cron error");
        return new Response(JSON.stringify({ error: "Não foi possível agendar os alertas." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      newJobId = jobIdData as number;
    }

    // Salva prefs
    await supabase.from("roas_alert_schedules").upsert({
      user_id: user.id,
      is_enabled,
      frequency,
      hour_utc,
      weekday,
      cron_jobid: newJobId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ success: true, cron_jobid: newJobId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("manage-roas-cron error:", e);
    return new Response(JSON.stringify({ error: "Não foi possível atualizar o agendamento." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
