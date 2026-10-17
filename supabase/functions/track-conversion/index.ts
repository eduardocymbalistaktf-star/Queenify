import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s.toLowerCase().trim()));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendFacebook(pixel: any, sale: any) {
  const url = `https://graph.facebook.com/v21.0/${pixel.pixel_id}/events`;
  const userData: Record<string, unknown> = {};
  if (sale.buyer_email) userData.em = [await sha256(sale.buyer_email)];
  if (sale.fbclid) userData.fbc = `fb.1.${Date.now()}.${sale.fbclid}`;

  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(new Date(sale.sold_at || Date.now()).getTime() / 1000),
      event_id: sale.id,
      action_source: "website",
      event_source_url: sale.landing_url || undefined,
      user_data: userData,
      custom_data: {
        currency: "BRL",
        value: Number(sale.amount),
        content_ids: [sale.product_id],
        content_type: "product",
      },
    }],
    ...(pixel.test_event_code ? { test_event_code: pixel.test_event_code } : {}),
  };

  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${pixel.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const json = await res.json();
  return { ok: res.ok, response: json };
}

async function sendTiktok(pixel: any, sale: any) {
  const url = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
  const userData: Record<string, unknown> = {};
  if (sale.buyer_email) userData.email = await sha256(sale.buyer_email);
  if (sale.ttclid) userData.ttclid = sale.ttclid;

  const payload = {
    event_source: "web",
    event_source_id: pixel.pixel_id,
    data: [{
      event: "Purchase",
      event_time: Math.floor(new Date(sale.sold_at || Date.now()).getTime() / 1000),
      event_id: sale.id,
      user: userData,
      page: { url: sale.landing_url || undefined },
      properties: {
        currency: "BRL",
        value: Number(sale.amount),
        contents: [{ content_id: sale.product_id, quantity: 1, price: Number(sale.amount) }],
      },
    }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Access-Token": pixel.access_token },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return { ok: res.ok && json.code === 0, response: json };
}

async function sendGoogle(pixel: any, sale: any) {
  return {
    ok: false,
    response: { error: "O envio server-side do Google Ads foi pausado. A implementação atual usa a API antiga e não possui o fluxo OAuth e a API de conversões exigidos atualmente." },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const body = await req.json();
    const { sale_id, retry_event_id } = body;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const isInternal = authHeader === `Bearer ${serviceRoleKey}`;
    let requesterId: string | null = null;
    if (!isInternal) {
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser(token || undefined);
      if (!user) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      requesterId = user.id;
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Retry mode: re-fetch sale from a failed event and only retry that platform
    let onlyPlatform: string | null = null;
    let resolvedSaleId = sale_id;
    if (retry_event_id) {
      const { data: ev } = await supabase.from("tracking_events").select("*").eq("id", retry_event_id).single();
      if (!ev || (requesterId && ev.user_id !== requesterId)) return new Response(JSON.stringify({ error: "Evento não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      resolvedSaleId = ev.sale_id;
      onlyPlatform = ev.platform;
    }

    if (!resolvedSaleId) return new Response(JSON.stringify({ error: "sale_id ou retry_event_id obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: sale, error: sErr } = await supabase.from("sales").select("*").eq("id", resolvedSaleId).single();
    if (sErr || !sale || sale.status !== "completed" || (requesterId && sale.user_id !== requesterId)) return new Response(JSON.stringify({ error: "Venda não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let pixelsQuery = supabase.from("tracking_pixels").select("*").eq("user_id", sale.user_id).eq("is_active", true);
    if (onlyPlatform) pixelsQuery = pixelsQuery.eq("platform", onlyPlatform);
    const { data: pixels } = await pixelsQuery;

    const results: any[] = [];
    for (const pixel of pixels || []) {
      let result;
      try {
        if (pixel.platform === "facebook") result = await sendFacebook(pixel, sale);
        else if (pixel.platform === "tiktok") result = await sendTiktok(pixel, sale);
        else if (pixel.platform === "google") result = await sendGoogle(pixel, sale);
        else continue;
      } catch (e) {
        result = { ok: false, response: { error: e instanceof Error ? e.message : String(e) } };
      }

      await supabase.from("tracking_events").insert({
        user_id: sale.user_id,
        sale_id: sale.id,
        platform: pixel.platform,
        event_name: "Purchase",
        status: result.ok ? "sent" : "failed",
        response: result.response,
        error_message: result.ok ? null : JSON.stringify(result.response).slice(0, 500),
      });

      if (result.ok) {
        await supabase.from("tracking_pixels").update({
          last_event_at: new Date().toISOString(),
          events_sent_count: (pixel.events_sent_count || 0) + 1,
        }).eq("id", pixel.id);
      }

      results.push({ platform: pixel.platform, ...result });
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("track-conversion error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
