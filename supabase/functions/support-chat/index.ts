import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { readLimitedText } from "../_shared/readLimitedBody.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Configure a production webhook URL as a Supabase Function secret. The URL
// embedded in the Lovable export was a test endpoint and must be rotated.

// Extrai a string de resposta do payload do n8n, que pode vir em vários formatos.
function extractReply(data: unknown): string {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    // n8n costuma devolver [{ output: "..." }] ou [{ json: {...} }]
    for (const item of data) {
      const r = extractReply(item);
      if (r) return r;
    }
    return "";
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Chaves comuns do n8n / langchain / ai agents
    const keys = ["output", "reply", "message", "response", "text", "answer", "content", "result"];
    for (const k of keys) {
      if (typeof obj[k] === "string" && (obj[k] as string).trim()) return obj[k] as string;
    }
    if (obj.json) return extractReply(obj.json);
    if (obj.data) return extractReply(obj.data);
  }
  return "";
}

// Empacota uma string em um único "chunk" SSE no formato OpenAI
// para manter compatibilidade com o frontend que já consome stream.
function toSSE(text: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const chunk = { choices: [{ delta: { content: text } }] };
      controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const configuredWebhook = Deno.env.get("N8N_SUPPORT_WEBHOOK_URL");
    if (!configuredWebhook) {
      return new Response(JSON.stringify({ error: "O suporte está em configuração." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const webhookUrl = new URL(configuredWebhook);
    if (webhookUrl.protocol !== "https:" || !webhookUrl.hostname.endsWith(".n8n.cloud")) {
      return new Response(JSON.stringify({ error: "Webhook de suporte inválido." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 24_000) {
      return new Response(JSON.stringify({ error: "Mensagem muito grande." }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Support service is not configured");
    const supabase = createClient(supabaseUrl, serviceKey);
    const clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`support-ip:${clientIp}`));
    const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { data: allowed, error: rateError } = await supabase.rpc("consume_edge_rate_limit", {
      p_key_hash: ipHash,
      p_limit: 8,
      p_window_seconds: 60,
    });
    if (rateError) throw new Error("Support rate limiter is unavailable");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde 1 minuto e tente novamente." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await readLimitedText(req, 24_000);
    if (rawBody === null) {
      return new Response(JSON.stringify({ error: "Mensagem muito grande." }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let requestBody: { messages?: unknown };
    try { requestBody = JSON.parse(rawBody); }
    catch { return new Response(JSON.stringify({ error: "Formato de mensagem inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
    const { messages } = requestBody;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeMessages = messages.filter((message: any) =>
      message && (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" && message.content.trim().length > 0 && message.content.length <= 4_000
    ).map((message: any) => ({ role: message.role, content: message.content.trim() }));
    if (safeMessages.length === 0) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUser = [...safeMessages].reverse().find((m: any) => m.role === "user");
    const userMessage = lastUser?.content || "";

    // Encaminha pro webhook do n8n (bot QueenIA hospedado lá)
    const n8nResp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        history: safeMessages,
        source: "queenify-support-chat",
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!n8nResp.ok) {
      console.error("n8n webhook error:", n8nResp.status);
      return new Response(JSON.stringify({ error: "O bot de suporte está indisponível no momento. Tente novamente em instantes." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let reply = "";
    const ct = n8nResp.headers.get("content-type") || "";
    const n8nBody = await n8nResp.text();
    if (new TextEncoder().encode(n8nBody).byteLength > 16_000) {
      return new Response(JSON.stringify({ error: "A resposta do suporte excedeu o limite." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ct.includes("application/json")) {
      let data: unknown = null;
      try { data = JSON.parse(n8nBody); } catch { /* invalid upstream JSON */ }
      reply = extractReply(data);
    } else {
      reply = n8nBody.trim();
    }

    if (!reply) {
      reply = "Recebi sua mensagem, mas o bot não retornou resposta. Tente reformular a pergunta ou fale com um atendente humano.";
    }

    return new Response(toSSE(reply.slice(0, 8_000)), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat request failed");
    return new Response(JSON.stringify({ error: "O suporte está temporariamente indisponível." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
