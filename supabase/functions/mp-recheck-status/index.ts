import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getMpToken(): { token: string | undefined; env: string } {
  const env = (Deno.env.get("MERCADO_PAGO_ENV") || "test").toLowerCase();
  if (!["test", "live", "production", "prod"].includes(env)) return { token: undefined, env: "invalid" };
  const token = env === "live" || env === "production" || env === "prod"
    ? Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN_LIVE")
    : Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN_TEST");
  return { token, env };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await supabaseAuth.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    if (typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin, error: roleError } = await supabaseAuth.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token: MP_TOKEN, env: MP_ENV } = getMpToken();
    if (!MP_TOKEN) {
      return new Response(JSON.stringify({ error: "MP token ausente" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sale_id, mp_payment_id } = await req.json();
    if (typeof sale_id !== "string" || !/^[0-9a-f-]{36}$/i.test(sale_id) ||
      (typeof mp_payment_id !== "string" && typeof mp_payment_id !== "number") || !/^\d{1,24}$/.test(String(mp_payment_id))) {
      return new Response(JSON.stringify({ error: "sale_id e mp_payment_id obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(mp_payment_id))}`, {
      headers: { "Authorization": `Bearer ${MP_TOKEN}` },
      signal: AbortSignal.timeout(15_000),
    });
    const mpData = await mpResp.json();
    if (!mpResp.ok) {
      console.error("Mercado Pago status lookup failed", { status: mpResp.status });
      return new Response(JSON.stringify({ error: "Não foi possível consultar o pagamento no Mercado Pago." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusMap: Record<string, string> = {
      approved: "completed", pending: "pending", in_process: "pending",
      rejected: "failed", cancelled: "cancelled", refunded: "refunded", charged_back: "chargeback",
    };
    const newStatus = statusMap[mpData.status] || "pending";

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("id, external_reference, mp_payment_id, amount")
      .eq("id", sale_id)
      .maybeSingle();
    if (saleError || !sale || String(mpData.id) !== String(mp_payment_id) ||
      String(sale.mp_payment_id) !== String(mpData.id) || sale.external_reference !== mpData.external_reference ||
      Number(sale.amount) !== Number(mpData.transaction_amount) || mpData.currency_id !== "BRL") {
      return new Response(JSON.stringify({ error: "Pagamento não corresponde à venda informada" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await supabase.from("sales").update({
      status: newStatus,
      payment_details: {
        mp_status: mpData.status,
        mp_status_detail: mpData.status_detail,
        mp_env: MP_ENV,
        manual_recheck_at: new Date().toISOString(),
      },
    }).eq("id", sale_id);
    if (updateError) throw new Error("Não foi possível salvar o status da venda");

    return new Response(JSON.stringify({
      ok: true,
      status: newStatus,
      mp_status: mpData.status,
      mp_status_detail: mpData.status_detail,
      env: MP_ENV,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mp-recheck-status error:", e);
    return new Response(JSON.stringify({ error: "Não foi possível consultar o pagamento." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
