import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { readLimitedText } from "../_shared/readLimitedBody.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Resolve only the token explicitly configured for this environment. Falling
// back between test and live can silently charge real cards during setup.
function getMpToken(): { token: string | undefined; env: string } {
    const envRaw = (Deno.env.get("MERCADO_PAGO_ENV") || "test").toLowerCase().trim();
    if (!["test", "live", "production", "prod"].includes(envRaw)) {
      return { token: undefined, env: "invalid" };
    }
  const isLive = envRaw === "live" || envRaw === "production" || envRaw === "prod";
  const live = (Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN_LIVE") || "").trim();
  const test = (Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN_TEST") || "").trim();
  const token = isLive ? live : test;
  const env = isLive ? "live" : "test";
  console.log(`[mp-create-payment] env=${env} token_present=${!!token} token_len=${token?.length || 0}`);
  return { token: token || undefined, env };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { token: MP_TOKEN, env: MP_ENV } = getMpToken();
    if (!MP_TOKEN) {
      return new Response(JSON.stringify({ error: `Mercado Pago não configurado (env=${MP_ENV})` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const declaredLength = Number(req.headers.get("content-length") || 0);
    if (declaredLength > 32_000) {
      return new Response(JSON.stringify({ error: "Solicitação muito grande" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rawBody = await readLimitedText(req, 32_000);
    if (rawBody === null) {
      return new Response(JSON.stringify({ error: "Solicitação muito grande" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try { body = JSON.parse(rawBody); }
    catch { return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new Response(JSON.stringify({ error: "Formato de solicitação inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const {
      product_id,
      buyer_email,
      buyer_name,
      buyer_doc, // CPF
      payment_method, // 'pix' | 'credit_card' | 'debit_card' | 'boleto'
      idempotency_key,
      // Cartão (tokenizado no front via SDK MP)
      card_token,
      installments,
      payment_method_id,
      issuer_id,
      utms,
    } = body;

    if (typeof product_id !== "string" || typeof buyer_email !== "string" || typeof payment_method !== "string" ||
      typeof idempotency_key !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotency_key)) {
      return new Response(JSON.stringify({ error: "Dados obrigatórios ausentes" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = buyer_email.trim().toLowerCase();
    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return new Response(JSON.stringify({ error: "E-mail inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof buyer_name !== "string" || buyer_name.trim().length < 3 || buyer_name.trim().length > 120) {
      return new Response(JSON.stringify({ error: "Nome inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const normalizedName = buyer_name.trim();
    if (typeof buyer_doc !== "string" || buyer_doc.replace(/\D/g, "").length !== 11) {
      return new Response(JSON.stringify({ error: "CPF inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    const hashLimitKey = async (value: string) => {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    };
    const rateLimitKeys = [
      { key: await hashLimitKey(`payment-ip:${ip}`), limit: 30, window: 300 },
      { key: await hashLimitKey(`payment-buyer:${product_id}:${normalizedEmail}`), limit: 3, window: 900 },
    ];
    for (const limit of rateLimitKeys) {
      const { data: allowed, error: rateError } = await supabase.rpc("consume_edge_rate_limit", {
        p_key_hash: limit.key,
        p_limit: limit.limit,
        p_window_seconds: limit.window,
      });
      if (rateError) {
        console.error("Payment rate limit service is unavailable");
        return new Response(JSON.stringify({ error: "Pagamento temporariamente indisponível." }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!allowed) {
        return new Response(JSON.stringify({ error: "Muitas tentativas. Aguarde antes de tentar novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: product, error: pErr } = await supabase
      .from("products").select("id, name, user_id, price, is_active").eq("id", product_id).single();
    if (pErr || !product || !product.is_active) {
      return new Response(JSON.stringify({ error: "Produto não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The amount is always read from the database. A browser-supplied price is
    // untrusted and must never determine the Mercado Pago charge or sale record.
    const verifiedAmount = Number(product.price);
    if (!Number.isFinite(verifiedAmount) || verifiedAmount <= 0 || verifiedAmount > 9_999_999.99) {
      return new Response(JSON.stringify({ error: "Produto sem preço válido para pagamento" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalRef = idempotency_key;
    const projectId = Deno.env.get("SUPABASE_URL")!.split(".")[0].split("//")[1];
    const notificationUrl = `https://${projectId}.supabase.co/functions/v1/mp-webhook`;

    let mpPayload: Record<string, unknown> = {
      transaction_amount: verifiedAmount,
      description: product.name,
      external_reference: externalRef,
      notification_url: notificationUrl,
      payer: {
        email: normalizedEmail,
        first_name: normalizedName.split(" ")[0] || "Cliente",
        last_name: normalizedName.split(" ").slice(1).join(" ") || "",
        identification: buyer_doc ? { type: "CPF", number: buyer_doc.replace(/\D/g, "") } : undefined,
      },
      metadata: {
        product_id,
        seller_id: product.user_id,
        mp_env: MP_ENV,
      },
    };

    if (payment_method === "pix") {
      mpPayload.payment_method_id = "pix";
    } else if (payment_method === "boleto") {
      mpPayload.payment_method_id = "bolbradesco";
    } else if (payment_method === "credit_card" || payment_method === "debit_card") {
      if (typeof card_token !== "string" || card_token.length > 512 ||
        typeof payment_method_id !== "string" || payment_method_id.length > 80 ||
        typeof installments !== "number" || !Number.isInteger(installments) || installments < 1 || installments > 12) {
        return new Response(JSON.stringify({ error: "card_token obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      mpPayload = {
        ...mpPayload,
        token: card_token,
        installments: installments || 1,
        payment_method_id,
        issuer_id,
        capture: true,
      };
    } else {
      return new Response(JSON.stringify({ error: "Método de pagamento inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpResp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_TOKEN}`,
        "X-Idempotency-Key": idempotency_key,
      },
      body: JSON.stringify(mpPayload),
      signal: AbortSignal.timeout(15_000),
    });

    const mpData = await mpResp.json();

    if (!mpResp.ok) {
      console.error("Mercado Pago recusou a criação do pagamento", { status: mpResp.status, code: mpData?.cause?.[0]?.code });
      return new Response(JSON.stringify({
        error: "Não foi possível criar o pagamento. Confira os dados e tente novamente.",
        retryable: mpResp.status >= 500 || mpResp.status === 429,
      }), {
        status: mpResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusMap: Record<string, string> = {
      approved: "completed",
      pending: "pending",
      in_process: "pending",
      rejected: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
    };
    const saleStatus = statusMap[mpData.status] || "pending";

    const u = (utms && typeof utms === "object" ? utms : {}) as Record<string, string>;
    const { data: sale, error: sErr } = await supabase.from("sales").insert({
      user_id: product.user_id,
      product_id,
      amount: verifiedAmount,
      buyer_email: normalizedEmail,
      buyer_name: normalizedName,
      payment_method,
      status: saleStatus,
      mp_payment_id: String(mpData.id),
      external_reference: externalRef,
      utm_source: u.utm_source || null,
      utm_medium: u.utm_medium || null,
      utm_campaign: u.utm_campaign || null,
      utm_content: u.utm_content || null,
      utm_term: u.utm_term || null,
      fbclid: u.fbclid || null,
      gclid: u.gclid || null,
      ttclid: u.ttclid || null,
      landing_url: u.landing_url || null,
      payment_details: {
        mp_status: mpData.status,
        mp_status_detail: mpData.status_detail,
        mp_env: MP_ENV,
      },
    }).select().single();

    if (sErr || !sale) {
      console.error("Sale record could not be saved after Mercado Pago created a payment");
      return new Response(JSON.stringify({ error: "Pagamento iniciado. Atualize a página em instantes para consultar o status.", retryable: true }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (saleStatus === "completed" && sale) {
      try {
        await supabase.functions.invoke("purchase-webhook", { body: { sale_id: sale.id } });
      } catch (e) { console.error("purchase-webhook fail:", e); }
      try {
        await supabase.functions.invoke("track-conversion", { body: { sale_id: sale.id } });
      } catch (e) { console.error("track-conversion fail:", e); }
    }

    const response: Record<string, unknown> = {
      success: true,
      sale_id: sale?.id,
      payment_id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
      mp_env: MP_ENV,
    };

    if (payment_method === "pix") {
      response.pix = {
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
      };
    } else if (payment_method === "boleto") {
      response.boleto = {
        barcode: mpData.barcode?.content,
        pdf_url: mpData.transaction_details?.external_resource_url,
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mp-create-payment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
