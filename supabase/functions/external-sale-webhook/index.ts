import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logEdgeSecurityEvent } from "../_shared/securityLog.ts";
import { readLimitedText } from "../_shared/readLimitedBody.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-hotmart-hottok, x-webhook-token",
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

function normalizeSaleStatus(value: unknown): string {
  const status = typeof value === "string" ? value.toLowerCase() : "";
  if (/approved|paid|complete/.test(status)) return "completed";
  if (/refund/.test(status)) return "refunded";
  if (/charge.?back/.test(status)) return "chargeback";
  if (/cancel|void/.test(status)) return "cancelled";
  if (/reject|fail/.test(status)) return "failed";
  if (/expir/.test(status)) return "expired";
  return "pending";
}

function normalizeExternalReference(...values: unknown[]): string | undefined {
  const value = values.find((candidate) => (typeof candidate === "string" && candidate.trim()) || (typeof candidate === "number" && Number.isFinite(candidate)));
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const reference = String(value).trim();
  return reference && reference.length <= 255 ? reference : undefined;
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
      const status = purchase.status || body.event;
      return {
        buyer_email: buyer.email,
        buyer_name: buyer.name,
        amount: Number(purchase.price?.value || purchase.full_price?.value || 0),
        status: normalizeSaleStatus(status),
        external_reference: normalizeExternalReference(purchase.transaction, purchase.order_ref, body.id, d.id),
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
      const status = body.status || body.event;
      return {
        buyer_email: customer.email,
        buyer_name: customer.name,
        amount: Number(body.total_price ?? body.value ?? body.amount ?? 0),
        status: normalizeSaleStatus(status),
        external_reference: normalizeExternalReference(body.sale_id, body.id, body.transaction_id),
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
      amount: Number(body.amount ?? body.value ?? 0),
      status: normalizeSaleStatus(body.status),
      external_reference: normalizeExternalReference(body.external_reference, body.transaction_id, body.id, body.event_id),
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
    const token = req.headers.get("x-webhook-token") || url.searchParams.get("token");
    const hotmartHottok = req.headers.get("x-hotmart-hottok") || "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Token ausente. Use a URL gerada pela Queenify ou o header x-webhook-token." }), {
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
        metadata: { source: "unknown" },
      });
      return new Response(JSON.stringify({ error: "Token inválido ou inativo" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hotmart sends its account Hottok as X-HOTMART-HOTTOK; this is a bearer token,
    // not an HMAC signature. Other providers can use the x-signature HMAC contract.
    if (tokenRow.source === "hotmart" && (!tokenRow.webhook_secret || !safeEqual(tokenRow.webhook_secret, hotmartHottok))) {
      await logEdgeSecurityEvent({ type: "auth_failed", severity: "error", endpoint: "external-sale-webhook", reason: "Invalid or missing Hotmart Hottok", userId: tokenRow.user_id });
      return new Response(JSON.stringify({ error: "Hottok da Hotmart ausente ou inválido." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rateHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`external-sale:${tokenRow.id}`));
    const keyHash = Array.from(new Uint8Array(rateHash), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { data: allowed, error: rateError } = await supabase.rpc("consume_edge_rate_limit", {
      p_key_hash: keyHash,
      p_limit: 60,
      p_window_seconds: 60,
    });
    if (rateError) return new Response(JSON.stringify({ error: "Limite de requisições temporariamente indisponível." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!allowed) {
      await logEdgeSecurityEvent({
        type: "rate_limit_hit",
        severity: "warning",
        endpoint: "external-sale-webhook",
        reason: "Rate limit 60/min exceeded for webhook token",
        userId: tokenRow.user_id,
        metadata: { token_id: tokenRow.id, source: tokenRow.source },
      });
      return new Response(
        JSON.stringify({ error: "Limite excedido: máximo 60 requisições por minuto. Tente novamente em alguns segundos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }

    // Read raw body once (needed for HMAC + JSON parsing)
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 64_000) return new Response(JSON.stringify({ error: "Payload muito grande" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const rawBody = await readLimitedText(req, 64_000);
    if (rawBody === null) return new Response(JSON.stringify({ error: "Payload muito grande" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Optional HMAC-SHA256 validation for non-Hotmart providers.
    if (tokenRow.webhook_secret && tokenRow.source !== "hotmart") {
      const provided = (req.headers.get("x-signature") || "")
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
    if (!normalized || typeof normalized.buyer_email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.buyer_email) ||
      !Number.isFinite(normalized.amount) || normalized.amount <= 0 || normalized.amount > 1_000_000_000 ||
      typeof normalized.external_reference !== "string" || !normalized.external_reference.trim() || normalized.external_reference.length > 255) {
      return new Response(JSON.stringify({ error: "Payload inválido: buyer_email, valor positivo e identificador externo são obrigatórios." }), {
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

    const saleValues = {
      user_id: tokenRow.user_id,
      product_id: productId,
      buyer_email: normalized.buyer_email.trim().toLowerCase(),
      buyer_name: normalized.buyer_name || null,
      amount: normalized.amount,
      status: normalized.status,
      payment_method: normalized.payment_method || "external",
      external_reference: normalized.external_reference,
      external_source: tokenRow.source,
      utm_source: normalized.utm_source,
      utm_medium: normalized.utm_medium,
      utm_campaign: normalized.utm_campaign,
      utm_content: normalized.utm_content,
      utm_term: normalized.utm_term,
    };

    const { data: existingSale, error: existingSaleError } = await supabase.from("sales")
      .select("id, status").eq("user_id", tokenRow.user_id).eq("external_source", tokenRow.source)
      .eq("external_reference", normalized.external_reference).maybeSingle();
    if (existingSaleError) throw new Error("Não foi possível verificar duplicidade da venda externa");

    let sale;
    let sErr;
    if (existingSale) {
      let nextStatus = normalized.status;
      if (["refunded", "chargeback"].includes(existingSale.status) && !["refunded", "chargeback"].includes(nextStatus)) nextStatus = existingSale.status;
      if (existingSale.status === "completed" && nextStatus === "pending") nextStatus = "completed";
      const updated = await supabase.from("sales").update({ ...saleValues, status: nextStatus }).eq("id", existingSale.id).select().single();
      sale = updated.data;
      sErr = updated.error;
    } else {
      const inserted = await supabase.from("sales").insert(saleValues).select().single();
      sale = inserted.data;
      sErr = inserted.error;
    }

    if (sErr || !sale) throw new Error("Não foi possível registrar a venda externa");

    await supabase
      .from("external_webhook_tokens")
      .update({ last_received_at: new Date().toISOString(), total_received: tokenRow.total_received + 1 })
      .eq("id", tokenRow.id);

    if (sale.status === "completed" && existingSale?.status !== "completed") {
      supabase.functions.invoke("track-conversion", { body: { sale_id: sale.id } }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, sale_id: sale?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    console.error("external-sale-webhook request failed");
    return new Response(JSON.stringify({ error: "Não foi possível processar o webhook externo." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
