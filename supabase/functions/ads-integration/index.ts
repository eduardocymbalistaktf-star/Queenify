import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { readLimitedText } from "../_shared/readLimitedBody.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function htmlRes(html: string, status = 200) {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(18));
  const nonce = btoa(String.fromCharCode(...nonceBytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const safeHtml = html.replaceAll("__SCRIPT_NONCE__", nonce);
  return new Response(safeHtml, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
    },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function oauthResultHtml(title: string, detail: string, status: number, platform?: string, origin?: string) {
  const safeTitle = escapeHtml(title);
  const safeDetail = escapeHtml(detail);
  const payload = platform && origin
    ? `window.opener?.postMessage({type:"oauth_success",platform:${JSON.stringify(platform)}},${JSON.stringify(origin)});`
    : "";
  return htmlRes(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Queenify</title><style>body{font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#0b1018;color:#e8f1f7}.card{max-width:28rem;padding:2rem;border:1px solid #344250;border-radius:1rem;background:#141d27;text-align:center}p{color:#aab7c4;line-height:1.5}</style></head><body><main class="card"><h1>${safeTitle}</h1><p>${safeDetail}</p></main><script nonce="__SCRIPT_NONCE__">${payload}setTimeout(()=>window.close(),1800)</script></body></html>`, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);

  // ─── OAUTH CALLBACK (GET — redirect from Facebook/Google) ───
  if (req.method === "GET" && url.searchParams.get("action") === "oauth_callback") {
    try {
      const platform = url.searchParams.get("platform");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");
      if (platform !== "facebook" && platform !== "google") return oauthResultHtml("Plataforma inválida", "Feche esta janela e tente novamente pela Queenify.", 400);
      if (!state || !/^[A-Za-z0-9_-]{40,60}$/.test(state)) return oauthResultHtml("Autorização inválida", "Feche esta janela e inicie a conexão novamente pela Queenify.", 400);

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const stateHash = await sha256Hex(state);
      const { data: stateRecord, error: stateError } = await supabase.from("ads_oauth_states")
        .delete().eq("state_hash", stateHash).eq("platform", platform).gt("expires_at", new Date().toISOString())
        .select("user_id, frontend_origin").maybeSingle();
      if (stateError || !stateRecord) return oauthResultHtml("Autorização expirada", "Feche esta janela e inicie a conexão novamente pela Queenify.", 400);
      if (errorParam) return oauthResultHtml("Autorização cancelada", "A conexão foi cancelada no provedor. Você pode fechar esta janela.", 400);
      if (!code || code.length > 4096) return oauthResultHtml("Resposta inválida", "Feche esta janela e tente conectar novamente.", 400);

      const redirectUri = `${supabaseUrl}/functions/v1/ads-integration?action=oauth_callback&platform=${encodeURIComponent(platform)}`;

      let accessToken = "";
      let accountName = "";

      if (platform === "facebook") {
        const appId = Deno.env.get("FACEBOOK_APP_ID");
        const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");
        if (!appId || !appSecret) return oauthResultHtml("Integração não configurada", "As credenciais do Facebook ainda não foram configuradas.", 503);

        // Exchange code for access token
        const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.error || typeof tokenData.access_token !== "string") return oauthResultHtml("Falha ao autorizar", "O Facebook não concluiu a conexão. Tente novamente.", 502);

        const shortLivedToken = tokenData.access_token;

        // Exchange for long-lived token
        const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
        const longRes = await fetch(longLivedUrl);
        const longData = await longRes.json();

        accessToken = longData.access_token || shortLivedToken;

        // Get account name
        const meRes = await fetch("https://graph.facebook.com/v21.0/me", { headers: { Authorization: `Bearer ${accessToken}` } });
        const meData = await meRes.json();
        accountName = meData.name || "Facebook Ads";
      } else if (platform === "google") {
        const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
        const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
        if (!clientId || !clientSecret) return oauthResultHtml("Integração não configurada", "As credenciais do Google Ads ainda não foram configuradas.", 503);

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });
        const tokenData = await tokenRes.json();

        if (tokenData.error || typeof tokenData.access_token !== "string") return oauthResultHtml("Falha ao autorizar", "O Google não concluiu a conexão. Tente novamente.", 502);

        accessToken = tokenData.access_token;
        accountName = "Google Ads Account";
      }

      if (!accessToken) return oauthResultHtml("Falha na autorização", "O provedor não retornou uma credencial válida.", 502);

      // Save token to ad_integrations
      const { error: upsertError } = await supabase.from("ad_integrations").upsert({
        user_id: stateRecord.user_id,
        platform,
        access_token: accessToken,
        is_connected: true,
      }, { onConflict: "user_id,platform" });
      if (upsertError) return oauthResultHtml("Não foi possível salvar", "A conta foi autorizada, mas não foi possível registrar a integração. Tente novamente.", 500);

      return oauthResultHtml("Conta conectada", `${accountName || "Sua conta"} foi vinculada à Queenify. Esta janela será fechada automaticamente.`, 200, platform, stateRecord.frontend_origin);
    } catch {
      console.error("OAuth callback failed");
      return oauthResultHtml("Falha na conexão", "Ocorreu um erro ao concluir a autorização. Tente novamente pela Queenify.", 500);
    }
  }

  // ─── ALL OTHER ACTIONS (POST, authenticated) ───
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonRes({ error: "Sessão inválida" }, 401);

    // Persistent per-user limiter (survives function cold starts).
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) return jsonRes({ error: "Integrações temporariamente indisponíveis." }, 503);
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: allowed, error: rateLimitError } = await admin.rpc("consume_edge_rate_limit", {
      p_key_hash: await sha256Hex(`ads-integration:${user.id}`),
      p_limit: 30,
      p_window_seconds: 60,
    });
    if (rateLimitError) return jsonRes({ error: "Integrações temporariamente indisponíveis." }, 503);
    if (!allowed) {
      return jsonRes({ error: "Muitas requisições. Aguarde 1 minuto e tente novamente." }, 429);
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 16_000) return jsonRes({ error: "Solicitação muito grande." }, 413);
    let body: Record<string, unknown>;
    const rawBody = await readLimitedText(req, 16_000);
    if (rawBody === null) return jsonRes({ error: "Solicitação muito grande." }, 413);
    try { body = JSON.parse(rawBody); }
    catch { return jsonRes({ error: "Corpo JSON inválido." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return jsonRes({ error: "Corpo da solicitação inválido." }, 400);
    const { action, platform, access_token, account_id } = body;

    // ─── CONNECT ───
    if (action === "connect") {
      if (!platform || !access_token) {
        return jsonRes({ error: "Platform e access_token são obrigatórios" }, 400);
      }

      let valid = false;
      let accountName = "";

      if (platform === "facebook") {
        const res = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${access_token}`);
        const d = await res.json();
        if (res.ok && d.name) { valid = true; accountName = d.name; }
      } else if (platform === "google") {
        const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${access_token}`);
        const d = await res.json();
        if (res.ok) { valid = true; accountName = d.email || "Google Ads Account"; }
      }

      if (!valid) {
        return jsonRes({ error: `Token inválido para ${platform}. Verifique suas credenciais.` }, 400);
      }

      const { error: upsertError } = await supabase.from("ad_integrations").upsert({
        user_id: user.id, platform, access_token, account_id: account_id || null, is_connected: true,
      }, { onConflict: "user_id,platform" });

      if (upsertError) return jsonRes({ error: upsertError.message }, 500);
      return jsonRes({ success: true, account_name: accountName });
    }

    // ─── DISCONNECT ───
    if (action === "disconnect") {
      await supabase.from("ad_integrations").delete().eq("user_id", user.id).eq("platform", platform);
      return jsonRes({ success: true });
    }

    // ─── FETCH CAMPAIGNS ───
    if (action === "fetch_campaigns") {
      const { data: integration } = await supabase
        .from("ad_integrations").select("*")
        .eq("user_id", user.id).eq("platform", platform).single();

      if (!integration) return jsonRes({ error: `Conta ${platform} não conectada` }, 400);

      const campaigns: unknown[] = [];

      if (platform === "facebook") {
        const adAccountId = integration.account_id || "act_me";
        const apiUrl = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns?fields=name,status,daily_budget,lifetime_budget,insights.date_preset(last_30d){impressions,clicks,ctr,conversions,spend}&limit=50&access_token=${integration.access_token}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.data) {
          for (const c of data.data) {
            const ins = c.insights?.data?.[0] || {};
            campaigns.push({
              id: c.id, name: c.name, source: "facebook",
              status: c.status === "ACTIVE" ? "Ativa" : c.status === "PAUSED" ? "Pausada" : "Finalizada",
              budget: parseFloat(c.daily_budget || c.lifetime_budget || 0) / 100,
              spent: parseFloat(ins.spend || 0), impressions: parseInt(ins.impressions || 0),
              clicks: parseInt(ins.clicks || 0), conversions: parseInt(ins.conversions || 0),
              ctr: parseFloat(ins.ctr || 0),
              cpa: ins.spend && ins.conversions ? parseFloat(ins.spend) / parseInt(ins.conversions) : 0,
            });
          }
        } else if (data.error) {
          return jsonRes({ error: data.error.message }, 400);
        }
      }

      if (platform === "google") {
        return jsonRes({
          error: "A API do Google Ads requer um Developer Token e conta MCC. Configure em console.cloud.google.com.",
          requires_setup: true,
        }, 400);
      }

      return jsonRes({ campaigns });
    }

    // ─── OAUTH INIT ───
    if (action === "oauth_init") {
      if (platform !== "facebook" && platform !== "google") return jsonRes({ error: "Plataforma não suportada para OAuth" }, 400);
      const origin = req.headers.get("origin");
      const allowedOrigins = (Deno.env.get("QUEENIFY_ALLOWED_ORIGINS") || "https://eduardocymbalistaktf-star.github.io,http://localhost:8080,http://127.0.0.1:8080")
        .split(",").map((value) => value.trim()).filter(Boolean);
      if (!origin || !allowedOrigins.includes(origin)) return jsonRes({ error: "Origem da Queenify não permitida." }, 403);

      const serviceClient = admin;
      await serviceClient.from("ads_oauth_states").delete().lt("expires_at", new Date().toISOString());
      const stateBytes = crypto.getRandomValues(new Uint8Array(32));
      const oauthState = btoa(String.fromCharCode(...stateBytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      const { error: stateInsertError } = await serviceClient.from("ads_oauth_states").insert({
        user_id: user.id,
        platform,
        state_hash: await sha256Hex(oauthState),
        frontend_origin: origin,
      });
      if (stateInsertError) {
        console.error("Could not create OAuth state");
        return jsonRes({ error: "Não foi possível iniciar a conexão. Tente novamente." }, 503);
      }

      if (platform === "facebook") {
        const appId = Deno.env.get("FACEBOOK_APP_ID");
        if (!appId) return jsonRes({ error: "Facebook App ID não configurado. Adicione o secret FACEBOOK_APP_ID." }, 400);
        const redirectUri = `${supabaseUrl}/functions/v1/ads-integration?action=oauth_callback&platform=facebook`;
        const params = new URLSearchParams({ client_id: appId, redirect_uri: redirectUri, scope: "ads_read,ads_management", response_type: "code", state: oauthState });
        return jsonRes({ auth_url: `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}` });
      } else {
        const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
        if (!clientId) return jsonRes({ error: "Google Ads Client ID não configurado. Adicione o secret GOOGLE_ADS_CLIENT_ID." }, 400);
        const redirectUri = `${supabaseUrl}/functions/v1/ads-integration?action=oauth_callback&platform=google`;
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: "https://www.googleapis.com/auth/adwords",
          response_type: "code",
          access_type: "offline",
          prompt: "consent",
          state: oauthState,
        });
        return jsonRes({ auth_url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
      }
    }

    // ─── CHECK CONNECTION STATUS ───
    if (action === "check_status") {
      const { data } = await supabase
        .from("ad_integrations").select("platform, is_connected")
        .eq("user_id", user.id);
      return jsonRes({ integrations: data || [] });
    }

    return jsonRes({ error: "Ação inválida" }, 400);
  } catch {
    console.error("ads-integration request failed");
    return jsonRes({ error: "Não foi possível concluir a solicitação de integração." }, 500);
  }
});
