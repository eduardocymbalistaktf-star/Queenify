import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bot especialista em campanhas e trackeamento da Queenify.
// Tem acesso aos dados do produtor (campanhas, ROAS, vendas, eventos falhos)
// e responde via Lovable AI Gateway.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const { messages, conversation_id } = await req.json();
    const supabase = createClient(supabaseUrl, serviceKey);

    // ── Coleta contexto real do usuário ──
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sinceDate = since.slice(0, 10);

    const [campaignsRes, costsRes, salesRes, eventsRes, pixelsRes] = await Promise.all([
      supabase.from("tracking_campaigns").select("name, platform, utm_campaign, is_active, daily_budget").eq("user_id", user.id).limit(20),
      supabase.from("tracking_costs").select("amount, date, campaign_id").eq("user_id", user.id).gte("date", sinceDate),
      supabase.from("sales").select("amount, status, utm_campaign, utm_source, sold_at, external_source").eq("user_id", user.id).gte("sold_at", since).limit(500),
      supabase.from("tracking_events").select("platform, status, error_message, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("tracking_pixels").select("platform, is_active, events_sent_count, last_event_at").eq("user_id", user.id),
    ]);

    const campaigns = campaignsRes.data || [];
    const costs = costsRes.data || [];
    const sales = (salesRes.data || []).filter((s: any) => s.status === "completed");
    const events = eventsRes.data || [];
    const pixels = pixelsRes.data || [];

    // Calcula ROAS por campanha
    const roasByCampaign: Record<string, { spent: number; revenue: number; roas: number }> = {};
    for (const c of campaigns) {
      const spent = costs.filter((co: any) => true).reduce((s: number, x: any) => s + Number(x.amount || 0), 0); // simplificado
      const revenue = sales.filter((s: any) => s.utm_campaign === c.utm_campaign).reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
      roasByCampaign[c.name] = { spent, revenue, roas: spent > 0 ? revenue / spent : 0 };
    }

    const totalRevenue = sales.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalCost = costs.reduce((s, x) => s + Number(x.amount || 0), 0);
    const failedEvents = events.filter((e: any) => e.status === "failed").length;

    const contextSummary = `
DADOS REAIS DO PRODUTOR (últimos 30 dias):
- Receita total atribuída: R$ ${totalRevenue.toFixed(2)}
- Gasto total em ads: R$ ${totalCost.toFixed(2)}
- ROAS geral: ${totalCost > 0 ? (totalRevenue / totalCost).toFixed(2) : "N/A"}x
- Vendas confirmadas: ${sales.length}
- Campanhas ativas: ${campaigns.filter((c: any) => c.is_active).length} / ${campaigns.length}
- Pixels configurados: ${pixels.map((p: any) => `${p.platform} (${p.is_active ? "ativo" : "inativo"}, ${p.events_sent_count} eventos)`).join("; ") || "nenhum"}
- Eventos com falha (últimos 20): ${failedEvents}

Top campanhas (nome | gasto | receita | ROAS):
${Object.entries(roasByCampaign).slice(0, 8).map(([name, m]) => `- ${name} | R$${m.spent.toFixed(0)} | R$${m.revenue.toFixed(0)} | ${m.roas.toFixed(2)}x`).join("\n") || "- (nenhuma campanha cadastrada)"}
`.trim();

    const systemPrompt = `Você é o "Tracky", assistente CONSULTIVO especialista em trackeamento, UTMs, pixels server-side (Meta CAPI, Google Ads, TikTok Events API), ROAS e campanhas pagas dentro da plataforma Queenify.

⚠️ REGRA CRÍTICA — APENAS AVISOS, NUNCA AÇÕES:
- Você NÃO executa nenhuma ação. NÃO pausa campanhas, NÃO altera pixels, NÃO cria UTMs, NÃO modifica nada no sistema.
- Seu papel é EXCLUSIVAMENTE dar avisos, alertas, diagnósticos e recomendações textuais.
- Sempre que identificar um problema, diga "recomendo que você faça X" ou "atenção: Y está acontecendo" — NUNCA "vou fazer", "fiz", "ajustei" ou "pausei".
- Se o usuário pedir pra você executar algo (ex: "pausa essa campanha"), responda gentilmente que você só consegue avisar e oriente onde ele mesmo pode fazer no painel.

REGRAS GERAIS:
- Responda SEMPRE em português brasileiro, tom direto, prático.
- Use os DADOS REAIS abaixo para personalizar avisos. Cite números reais.
- Se ROAS < 1.5x, AVISE e sugira que o produtor reveja criativos/segmentação ou pause manualmente.
- Se houver eventos falhos, ALERTE e oriente o produtor a checar credenciais do pixel.
- Explique conceitos técnicos (UTM, CAPI, HMAC, Enhanced Conversions) em linguagem simples quando necessário.
- Foque exclusivamente em trackeamento, ads, conversões e ROI. Se perguntarem outro assunto, redirecione.
- Use formatação markdown (negrito, listas) pra deixar legível.

${contextSummary}`;

    // Salva mensagem do usuário
    const lastUserMsg = messages[messages.length - 1];
    if (conversation_id && lastUserMsg?.role === "user") {
      await supabase.from("tracking_bot_messages").insert({
        conversation_id, user_id: user.id, role: "user", content: lastUserMsg.content,
      });
    }

    // Chama Lovable AI (sem streaming pra simplificar e poder salvar resposta no DB)
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de uso atingido. Aguarde alguns segundos e tente novamente." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const reply = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui responder agora.";

    if (conversation_id) {
      await supabase.from("tracking_bot_messages").insert({
        conversation_id, user_id: user.id, role: "assistant", content: reply,
      });
      await supabase.from("tracking_bot_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation_id);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tracking-bot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
