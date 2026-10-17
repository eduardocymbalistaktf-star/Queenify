import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logEdgeSecurityEvent } from "../_shared/securityLog.ts";
import { readLimitedText } from "../_shared/readLimitedBody.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-hotmart-hottok",
};

// HMAC-SHA256 hex
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time-ish string compare
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Normalize Hotmart / Kirvano / generic payloads to a unified Sale insert
function normalizePayload(source: string, body: any): {
  buyer_email: string;
  buyer_name?: string;
  amount: number;
  status: string;
  external_reference?: string;
  payment_method?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  product_name?: string;
} | null {
  try {
    if (source === "hotmart") {
      const d = body.data || body;
      const buyer = d.buyer || {};
      const purchase = d.purchase || {};
      const tracking = purchase.tracking || {};
      const status = (purchase.status || body.event || "").toLowerCase();
      return {
        buyer_email: buyer.email,
        buyer_name: buyer.name,
        amount: Number(purchase.price?.value || purchase.full_price?.value || 0),
        status: ["approved", "complete", "completed", "purchase_approved"].some((s) => status.includes(s)) ? "completed" : status,
        external_reference: purchase.transaction || purchase.order_ref,
        payment_method: (purchase.payment?.type || "").toLowerCase(),
        utm_source: tracking.source || null,
        utm_medium: tracking.medium || null,
        utm_campaign: tracking.campaign || tracking.source_sck || null,
        utm_content: tracking.content || null,
        utm_term: tracking.term || null,
        product_name: d.product?.name,
      };
    }
    if (source === "kirvano") {
      const customer = body.customer || {};
      const utm = body.utm || {};
      const status = (body.status || body.event || "").toLowerCase();
      return {
        buyer_email: customer.email,
        buyer_name: customer.name,
        amount: Number(body.total_price ?? body.value ?? body.amount ?? 0),
        status: ["approved", "paid", "completed"].some((s) => status.includes(s)) ? "completed" : status,
        external_reference: body.sale_id || body.id || body.transaction_id,
        payment_method: (body.payment_method || "").toLowerCase(),
        utm_source: utm.utm_source || null,
        utm_medium: utm.utm_medium || null,
        utm_campaign: utm.utm_campaign || null,
        utm_content: utm.utm_content || null,
        utm_term: utm.utm_term || null,
        product_name: body.product?.name,
      };
    }
    return {
      buyer_email: body.buyer_email || body.email,
      buyer_name: body.buyer_name || body.name,
      amount: Number(body.amount || body.value || 0),
      status: (body.status || "completed").toLowerCase() === "approved" ? "completed" : (body.status || "completed").toLowerCase(),
      external_reference: body.external_reference || body.transaction_id || body.id,
      payment_method: body.payment_method,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      product_name: body.product_name,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = req.headers.get("x-webhook-token");
    if (!token) {
      return new Response(JSON.stringify({ error: "Token obrigatório no header x-webhook-token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: tokenRow, error: tErr } = await supabase
      .from("external_webhook_tokens")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();
    if (tErr || !tokenRow) {
      await logEdgeSecurityEvent({
        type: "unauthorized_access",
        severity: "warning",
        endpoint: "external-sale-webhook",
        reason: "Invalid or inactive webhook token",
        metadata: { token_prefix: token.slice(0, 6) },
      });
      return new Response(JSON.stringify({ error: "Token inválido ou inativo" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate limiting: 60 req/min por token (janela fixa de 1 minuto) ──
    const RATE_LIMIT = 60;
    const windowStart = new Date();
    windowStart.setSeconds(0, 0);
    const { data: rlRow } = await supabase
      .from("webhook_rate_limits")
      .select("id, request_count")
      .eq("token_id", tokenRow.id)
      .eq("window_start", windowStart.toISOString())
      .maybeSingle();

    if (rlRow && rlRow.request_count >= RATE_LIMIT) {
      await logEdgeSecurityEvent({
        type: "rate_limit_hit",
        severity: "warning",
        endpoint: "external-sale-webhook",
        reason: `Rate limit ${RATE_LIMIT}/min exceeded for webhook token`,
        userId: tokenRow.user_id,
        metadata: { token_id: tokenRow.id, source: tokenRow.source },
      });
      return new Response(
        JSON.stringify({ error: `Rate limit excedido: máximo ${RATE_LIMIT} requisições/minuto por token. Tente novamente em alguns segundos.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }

    if (rlRow) {
      await supabase.from("webhook_rate_limits").update({ request_count: rlRow.request_count + 1 }).eq("id", rlRow.id);
    } else {
      await supabase.from("webhook_rate_limits").insert({ token_id: tokenRow.id, window_start: windowStart.toISOString(), request_count: 1 });
    }

    // Best-effort cleanup de janelas antigas (>10min) — não bloqueia o fluxo
    const cleanupBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    supabase.from("webhook_rate_limits").delete().eq("token_id", tokenRow.id).lt("window_start", cleanupBefore).then(() => {});

    // Read raw body once (needed for HMAC + JSON parsing)
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 64_000) return new Response(JSON.stringify({ error: "Payload muito grande" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const rawBody = await readLimitedText(req, 64_000);
    if (rawBody === null) return new Response(JSON.stringify({ error: "Payload muito grande" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Optional HMAC validation: if a webhook_secret is set on the token,
    // require a matching x-signature (or x-hotmart-hottok) header.
    if (tokenRow.webhook_secret) {
      const provided = (req.headers.get("x-signature") || req.headers.get("x-hotmart-hottok") || "")
        .replace(/^sha256=/i, "")
        .trim()
        .toLowerCase();
      if (!provided) {
        await logEdgeSecurityEvent({
          type: "auth_failed", severity: "error", endpoint: "external-sale-webhook",
          reason: "Missing x-signature header on webhook with secret configured",
          userId: tokenRow.user_id, metadata: { source: tokenRow.source },
        });
        return new Response(JSON.stringify({ error: "Assinatura ausente (header x-signature obrigatório quando webhook_secret está configurado)" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const expected = await hmacSha256Hex(tokenRow.webhook_secret, rawBody);
      if (!safeEqual(provided, expected)) {
        await logEdgeSecurityEvent({
          type: "auth_failed", severity: "error", endpoint: "external-sale-webhook",
          reason: "Invalid HMAC signature on external webhook",
          userId: tokenRow.user_id, metadata: { source: tokenRow.source },
        });
        return new Response(JSON.stringify({ error: "Assinatura HMAC inválida" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let body: any;
    try { body = JSON.parse(rawBody); } catch {
      return new Response(JSON.stringify({ error: "JSON inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = normalizePayload(tokenRow.source, body);
    if (!normalized || !normalized.buyer_email || !normalized.amount) {
      return new Response(JSON.stringify({ error: "Payload inválido — buyer_email e amount obrigatórios", received: body }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let productId: string | null = null;
    const productName = normalized.product_name || `Venda externa (${tokenRow.source})`;
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", tokenRow.user_id)
      .eq("name", productName)
      .maybeSingle();
    if (existingProduct) productId = existingProduct.id;
    else {
      const { data: newProduct } = await supabase
        .from("products")
        .insert({
          user_id: tokenRow.user_id,
          name: productName,
          price: normalized.amount,
          is_active: false,
          category: "Externo",
        })
        .select("id")
        .single();
      productId = newProduct?.id || null;
    }

    if (!productId) {
      return new Response(JSON.stringify({ error: "Falha ao criar produto placeholder" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sale, error: sErr } = await supabase.from("sales").insert({
      user_id: tokenRow.user_id,
      product_id: productId,
      buyer_email: normalized.buyer_email,
      buyer_name: normalized.buyer_name || null,
      amount: normalized.amount,
      status: normalized.status,
      payment_method: normalized.payment_method || "external",
      external_reference: normalized.external_reference || null,
      external_source: tokenRow.source,
      utm_source: normalized.utm_source,
      utm_medium: normalized.utm_medium,
      utm_campaign: normalized.utm_campaign,
      utm_content: normalized.utm_content,
      utm_term: normalized.utm_term,
    }).select().single();

    if (sErr) throw sErr;

    await supabase
      .from("external_webhook_tokens")
      .update({ last_received_at: new Date().toISOString(), total_received: tokenRow.total_received + 1 })
      .eq("id", tokenRow.id);

    if (sale && sale.status === "completed") {
      supabase.functions.invoke("track-conversion", { body: { sale_id: sale.id } }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, sale_id: sale?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("external-sale-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
