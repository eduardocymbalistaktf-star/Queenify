import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROAS_THRESHOLD = 1.5;
const LOOKBACK_DAYS = 7;
const ALERT_COOLDOWN_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { user_id, triggered_by } = await req.json().catch(() => ({}));
    const triggerSource = triggered_by || "manual";

    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const cooldownSince = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();

    let campaignsQuery = supabase
      .from("tracking_campaigns")
      .select("id, user_id, name, utm_campaign, tracking_costs(amount, date)")
      .eq("is_active", true);
    if (user_id) campaignsQuery = campaignsQuery.eq("user_id", user_id);
    const { data: campaigns } = await campaignsQuery;

    const alerts: any[] = [];

    for (const c of campaigns || []) {
      const recentCosts = (c.tracking_costs || []).filter((co: any) => co.date >= since.slice(0, 10));
      const spent = recentCosts.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
      if (spent < 50) continue; // ignore tiny spend

      const { data: sales } = await supabase
        .from("sales")
        .select("amount")
        .eq("user_id", c.user_id)
        .eq("status", "completed")
        .eq("utm_campaign", c.utm_campaign)
        .gte("sold_at", since);

      const revenue = (sales || []).reduce((s, x) => s + Number(x.amount || 0), 0);
      const roas = spent > 0 ? revenue / spent : 0;

      if (roas < ROAS_THRESHOLD) {
        // Check cooldown — don't spam the same alert
        const { data: recentAlert } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", c.user_id)
          .eq("type", "warning")
          .eq("related_entity_id", c.id)
          .eq("related_entity_type", "tracking_campaign_roas")
          .gte("created_at", cooldownSince)
          .maybeSingle();
        if (recentAlert) continue;

        await supabase.from("notifications").insert({
          user_id: c.user_id,
          type: "warning",
          title: `⚠️ ROAS baixo: ${c.name}`,
          message: `A campanha "${c.name}" está com ROAS de ${roas.toFixed(2)}x nos últimos ${LOOKBACK_DAYS} dias (gasto R$ ${spent.toFixed(2)}, receita R$ ${revenue.toFixed(2)}). Revise criativos, segmentação ou pause a campanha.`,
          related_entity_id: c.id,
          related_entity_type: "tracking_campaign_roas",
        });

        alerts.push({ campaign_id: c.id, name: c.name, roas, spent, revenue });
      }
    }

    // Registra execução por user (pra histórico de Automações)
    const usersChecked = new Set<string>((campaigns || []).map((c: any) => c.user_id));
    if (user_id) usersChecked.add(user_id);
    for (const uid of usersChecked) {
      await supabase.from("roas_alert_executions").insert({
        user_id: uid,
        status: "success",
        alerts_created: alerts.filter((a) => (campaigns || []).find((c: any) => c.id === a.campaign_id)?.user_id === uid).length,
        campaigns_checked: (campaigns || []).filter((c: any) => c.user_id === uid).length,
        triggered_by: triggerSource,
      });
    }

    return new Response(JSON.stringify({ success: true, alerts_created: alerts.length, alerts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("roas-alert-check error:", e);
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const body = await req.clone().json().catch(() => ({} as any));
      if (body?.user_id) {
        await sb.from("roas_alert_executions").insert({
          user_id: body.user_id,
          status: "failed",
          error_message: e instanceof Error ? e.message : "Erro",
          triggered_by: body?.triggered_by || "manual",
        });
      }
    } catch {}
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
