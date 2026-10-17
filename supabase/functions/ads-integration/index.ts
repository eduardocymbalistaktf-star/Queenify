import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiter (per isolate — resets on cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function htmlRes(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);

  // ─── OAUTH CALLBACK (GET — redirect from Facebook/Google) ───
  if (req.method === "GET" && url.searchParams.get("action") === "oauth_callback") {
    try {
      const platform = url.searchParams.get("platform");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state"); // user_id
      const errorParam = url.searchParams.get("error");

      if (errorParam) {
        return htmlRes(`<html><body><h2>Autorização cancelada</h2><p>${errorParam}</p><script>window.close();</script></body></html>`);
      }

      if (!code || !state || !platform) {
        return htmlRes(`<html><body><h2>Parâmetros inválidos</h2><script>window.close();</script></body></html>`, 400);
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const redirectUri = `${supabaseUrl}/functions/v1/ads-integration?action=oauth_callback&platform=${platform}`;

      let accessToken = "";
      let accountName = "";

      if (platform === "facebook") {
        const appId = Deno.env.get("FACEBOOK_APP_ID");
        const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");
        if (!appId || !appSecret) {
          return htmlRes(`<html><body><h2>Erro de configuração</h2><p>FACEBOOK_APP_ID ou FACEBOOK_APP_SECRET não configurados.</p></body></html>`, 500);
        }

        // Exchange code for access token
        const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
          return htmlRes(`<html><body><h2>Erro ao obter token</h2><p>${tokenData.error.message}</p><script>setTimeout(()=>window.close(),3000);</script></body></html>`);
        }

        const shortLivedToken = tokenData.access_token;

        // Exchange for long-lived token
        const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
        const longRes = await fetch(longLivedUrl);
        const longData = await longRes.json();

        accessToken = longData.access_token || shortLivedToken;

        // Get account name
        const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
        const meData = await meRes.json();
        accountName = meData.name || "Facebook Ads";
      } else if (platform === "google") {
        const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
        const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
        if (!clientId || !clientSecret) {
          return htmlRes(`<html><body><h2>Erro de configuração</h2><p>Google Ads credentials não configurados.</p></body></html>`, 500);
        }

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

        if (tokenData.error) {
          return htmlRes(`<html><body><h2>Erro ao obter token</h2><p>${tokenData.error_description || tokenData.error}</p><script>setTimeout(()=>window.close(),3000);</script></body></html>`);
        }

        accessToken = tokenData.access_token;
        accountName = "Google Ads Account";
      }

      if (!accessToken) {
        return htmlRes(`<html><body><h2>Plataforma não suportada</h2><script>window.close();</script></body></html>`, 400);
      }

      // Save token to ad_integrations
      await supabase.from("ad_integrations").upsert({
        user_id: state,
        platform,
        access_token: accessToken,
        is_connected: true,
      }, { onConflict: "user_id,platform" });

      return htmlRes(`
        <html>
        <head><style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fff;}
        .card{text-align:center;padding:2rem;border-radius:12px;background:#1a1a1a;border:1px solid #333;}
        .success{color:#4ade80;font-size:2rem;margin-bottom:1rem;}
        </style></head>
        <body>
          <div class="card">
            <div class="success">✅</div>
            <h2>Conta conectada com sucesso!</h2>
            <p><strong>${accountName}</strong> vinculada ao Queenify.</p>
            <p style="color:#888;margin-top:1rem;">Esta janela será fechada automaticamente...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "oauth_success", platform: "${platform}" }, "*");
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      console.error("OAuth callback error:", err);
      return htmlRes(`<html><body><h2>Erro interno</h2><p>${err instanceof Error ? err.message : "Erro desconhecido"}</p><script>setTimeout(()=>window.close(),3000);</script></body></html>`, 500);
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

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return jsonRes({ error: "Muitas requisições. Aguarde 1 minuto e tente novamente." }, 429);
    }

    const body = await req.json();
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
      if (platform === "facebook") {
        const appId = Deno.env.get("FACEBOOK_APP_ID");
        if (!appId) return jsonRes({ error: "Facebook App ID não configurado. Adicione o secret FACEBOOK_APP_ID." }, 400);
        const redirectUri = `${supabaseUrl}/functions/v1/ads-integration?action=oauth_callback&platform=facebook`;
        const scopes = "ads_read,ads_management";
        const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${user.id}`;
        return jsonRes({ auth_url: authUrl });
      }
      if (platform === "google") {
        const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
        if (!clientId) return jsonRes({ error: "Google Ads Client ID não configurado. Adicione o secret GOOGLE_ADS_CLIENT_ID." }, 400);
        const redirectUri = `${supabaseUrl}/functions/v1/ads-integration?action=oauth_callback&platform=google`;
        const scopes = "https://www.googleapis.com/auth/adwords";
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent&state=${user.id}`;
        return jsonRes({ auth_url: authUrl });
      }
      return jsonRes({ error: "Plataforma não suportada para OAuth" }, 400);
    }

    // ─── CHECK CONNECTION STATUS ───
    if (action === "check_status") {
      const { data } = await supabase
        .from("ad_integrations").select("platform, is_connected")
        .eq("user_id", user.id);
      return jsonRes({ integrations: data || [] });
    }

    return jsonRes({ error: "Ação inválida" }, 400);
  } catch (err) {
    return jsonRes({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
