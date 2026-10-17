import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

function isSafeWebhookUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    // Reject IPv4 and IPv6 literals; destinations must use a public DNS hostname.
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":")) return false;
    return host.includes(".");
  } catch {
    return false;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 4_000) {
      return new Response(JSON.stringify({ error: "Solicitação muito grande" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > 4_000) {
      return new Response(JSON.stringify({ error: "Solicitação muito grande" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let body: Record<string, unknown>;
    try { body = JSON.parse(rawBody); }
    catch { return new Response(JSON.stringify({ error: "Solicitação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
    const { sale_id } = body;
    if (typeof sale_id !== "string" || !/^[0-9a-f-]{36}$/i.test(sale_id)) {
      return new Response(JSON.stringify({ error: "sale_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*, products(name, user_id, tracking_pixel)")
      .eq("id", sale_id)
      .single();

    if (saleError || !sale) {
      return new Response(JSON.stringify({ error: "Sale not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (sale.status !== "completed") {
      return new Response(JSON.stringify({ error: "A venda ainda não foi confirmada pelo pagamento." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user webhooks that listen for sale events
    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("*")
      .eq("user_id", sale.user_id)
      .eq("is_active", true)
      .contains("events", ["venda_aprovada"]);

    const webhookPayload = {
      event: "purchase",
      sale_id: sale.id,
      product_id: sale.product_id,
      product_name: sale.products?.name || "",
      amount: sale.amount,
      buyer_email: sale.buyer_email,
      buyer_name: sale.buyer_name,
      payment_method: sale.payment_method,
      sold_at: sale.sold_at,
      pixel_data: {
        event_name: "Purchase",
        value: sale.amount,
        currency: "BRL",
        content_name: sale.products?.name || "",
        content_ids: [sale.product_id],
        content_type: "product",
      },
    };

    // Fire webhooks
    const results: { url: string; status: number | string }[] = [];
    if (webhooks && webhooks.length > 0) {
      for (const wh of webhooks) {
        if (!isSafeWebhookUrl(wh.url)) {
          results.push({ url: "[invalid webhook URL]", status: "rejected" });
          continue;
        }
        try {
          const resp = await fetch(wh.url, {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.timeout(8_000),
            headers: {
              "Content-Type": "application/json",
              "X-Queenify-Signature": wh.secret_key || "",
              "X-Queenify-Event": "purchase",
            },
            body: JSON.stringify(webhookPayload),
          });
          results.push({ url: new URL(wh.url).origin, status: resp.status });

          // Update last_triggered_at
          await supabase
            .from("webhooks")
            .update({ last_triggered_at: new Date().toISOString() })
            .eq("id", wh.id);
        } catch (err) {
          results.push({ url: new URL(wh.url).origin, status: "error" });
        }
      }
    }

    // Insert a notification for the seller
    await supabase.from("notifications").insert({
      user_id: sale.user_id,
      type: "sale",
      title: "Nova venda confirmada! 🎉",
      message: `Venda de R$${Number(sale.amount).toFixed(2)} - ${sale.products?.name || "Produto"} por ${sale.buyer_name || sale.buyer_email}`,
      related_entity_type: "sale",
      related_entity_id: sale.id,
    });

    return new Response(JSON.stringify({
      success: true,
      webhooks_fired: results.length,
      pixel_event: webhookPayload.pixel_data,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("purchase-webhook failed");
    return new Response(JSON.stringify({ error: "Não foi possível processar a venda." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
