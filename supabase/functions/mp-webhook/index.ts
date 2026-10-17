import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logEdgeSecurityEvent } from "../_shared/securityLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

function getMpToken(): { token: string | undefined; env: string } {
  const env = (Deno.env.get("MERCADO_PAGO_ENV") || "test").toLowerCase();
  if (!["test", "live", "production", "prod"].includes(env)) return { token: undefined, env: "invalid" };
  const token = env === "live" || env === "production" || env === "prod"
    ? Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN_LIVE")
    : Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN_TEST");
  return { token, env };
}

// Validação de assinatura HMAC SHA256 conforme docs MP
// Header x-signature: ts=...,v1=<hash>
// Hash = HMAC_SHA256(secret, `id:${dataId};request-id:${xRequestId};ts:${ts};`)
async function verifyMpSignature(
  secret: string,
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null,
): Promise<boolean> {
  if (!xSignature || !xRequestId || !dataId) return false;
  try {
    const parts = Object.fromEntries(
      xSignature.split(",").map(p => p.trim().split("=").map(s => s.trim())) as [string, string][],
    );
    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) return false;

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(manifest));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return hex === v1;
  } catch (e) {
    console.error("verifyMpSignature error:", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { token: MP_TOKEN, env: MP_ENV } = getMpToken();
    const WEBHOOK_SECRET = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
    if (!WEBHOOK_SECRET) {
      console.error("Mercado Pago webhook secret is not configured");
      return new Response(JSON.stringify({ error: "Webhook de pagamento não configurado" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    let paymentId: string | null = url.searchParams.get("id") || url.searchParams.get("data.id");

    let bodyJson: any = null;
    if (req.method === "POST") {
      try {
        bodyJson = await req.json();
        if (bodyJson?.data?.id) paymentId = String(bodyJson.data.id);
        if (bodyJson?.type) console.log("MP webhook type:", bodyJson.type);
      } catch { /* sem body json */ }
    }

    console.log("MP Webhook recebido:", { topic, paymentId, env: MP_ENV });

    const xReqId = req.headers.get("x-request-id");
    const valid = await verifyMpSignature(WEBHOOK_SECRET, req.headers.get("x-signature"), xReqId, paymentId);
    if (!valid) {
      console.warn("Mercado Pago webhook signature was rejected", { requestId: xReqId });
      await logEdgeSecurityEvent({
        type: "auth_failed",
        severity: "error",
        endpoint: "mp-webhook",
        reason: "Invalid HMAC signature on Mercado Pago webhook",
        requestId: xReqId,
      });
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paymentId || (topic && topic !== "payment")) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!MP_TOKEN) {
      return new Response(JSON.stringify({ error: "MP token ausente" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { "Authorization": `Bearer ${MP_TOKEN}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!mpResp.ok) {
      console.error("Mercado Pago payment lookup failed", { status: mpResp.status });
      return new Response(JSON.stringify({ error: "MP fetch error" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mpData = await mpResp.json();

    const statusMap: Record<string, string> = {
      approved: "completed",
      pending: "pending",
      in_process: "pending",
      rejected: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "chargeback",
    };
    const newStatus = statusMap[mpData.status] || "pending";

    const { data: sale } = await supabase
      .from("sales")
      .select("id, status, user_id, product_id, amount, external_reference")
      .eq("mp_payment_id", String(paymentId))
      .maybeSingle();

    if (!sale) {
      console.warn("Venda não encontrada para payment_id:", paymentId);
      return new Response(JSON.stringify({ ok: true, sale_not_found: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (String(mpData.id) !== String(paymentId) || mpData.external_reference !== sale.external_reference ||
      Number(mpData.transaction_amount) !== Number(sale.amount) || mpData.currency_id !== "BRL") {
      console.error("Mercado Pago payment data did not match its sale record", { paymentId });
      return new Response(JSON.stringify({ error: "payment mismatch" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previousStatus = sale.status;

    await supabase.from("sales").update({
      status: newStatus,
      payment_details: {
        mp_status: mpData.status,
        mp_status_detail: mpData.status_detail,
        mp_env: MP_ENV,
        updated_via_webhook: new Date().toISOString(),
      },
    }).eq("id", sale.id);

    if (newStatus === "completed" && previousStatus !== "completed") {
      try {
        await supabase.functions.invoke("purchase-webhook", { body: { sale_id: sale.id } });
      } catch (e) { console.error("purchase-webhook fail:", e); }
      try {
        await supabase.functions.invoke("track-conversion", { body: { sale_id: sale.id } });
      } catch (e) { console.error("track-conversion fail:", e); }
    }

    if (newStatus === "chargeback" && previousStatus !== "chargeback") {
      await supabase.from("chargebacks").insert({
        user_id: sale.user_id,
        product_id: sale.product_id,
        sale_id: sale.id,
        amount: sale.amount,
        reason: mpData.status_detail || "Chargeback Mercado Pago",
        status: "open",
      }).then(({ error }) => { if (error) console.error("Chargeback insert:", error); });
    }

    return new Response(JSON.stringify({ ok: true, status: newStatus, env: MP_ENV }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mp-webhook error:", e);
    return new Response(JSON.stringify({ ok: false, error: "Webhook processing failed" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
