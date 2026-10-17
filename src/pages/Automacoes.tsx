import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { RefreshCw, Mail, Code, Zap, Eye, Copy, CheckCircle2, Shield, Bell, Globe, BarChart3, Webhook } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Automacoes = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"smartpay" | "pixel" | "api">("smartpay");
  const [pixelEnabled, setPixelEnabled] = useState(true);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Real SmartPay stats from abandoned_carts
  const { data: carts = [] } = useQuery({
    queryKey: ["smartpay-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("abandoned_carts").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Real pixel ID from user_pixels
  const { data: userPixel } = useQuery({
    queryKey: ["user-pixel", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_pixels").select("pixel_id").eq("user_id", user!.id).maybeSingle();
      if (data) return data.pixel_id;
      // Auto-create if none exists
      const { data: created } = await supabase.from("user_pixels").insert({ user_id: user!.id, pixel_id: "" }).select("pixel_id").single();
      return created?.pixel_id || null;
    },
    enabled: !!user,
  });

  // Real Pixel stats from page_views
  const { data: pageViews = [] } = useQuery({
    queryKey: ["pixel-stats", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("page_views").select("*").eq("owner_id", user!.id).gte("created_at", thirtyDaysAgo);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: sales30d = [] } = useQuery({
    queryKey: ["pixel-conversions", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("sales").select("id").eq("user_id", user!.id).gte("sold_at", thirtyDaysAgo);
      return data || [];
    },
    enabled: !!user,
  });

  const recoveredCarts = carts.filter((c: any) => c.recovery_status === "recovered");
  const recoveryRate = carts.length > 0 ? Math.round((recoveredCarts.length / carts.length) * 100) : 0;
  const recoveredValue = recoveredCarts.reduce((s: number, c: any) => s + Number(c.cart_value || 0), 0);
  const totalAttempts = carts.reduce((s: number, c: any) => s + (c.recovery_attempts || 0), 0);

  const pixelId = userPixel || "Carregando...";
  const mockApiKey = user?.id ? `qn_live_sk_${user.id.replace(/-/g, "").slice(0, 32)}` : "qn_live_sk_demo";

  const copyApiKey = () => {
    navigator.clipboard.writeText(mockApiKey);
    setApiKeyCopied(true);
    toast.success("Chave API copiada!");
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const tabs = [
    { id: "smartpay" as const, label: "SmartPay", icon: RefreshCw },
    { id: "pixel" as const, label: "Pixel Queenify", icon: Eye },
    { id: "api" as const, label: "API Pública", icon: Code },
  ];

  const apiEndpoints = [
    { method: "GET", path: "/v1/products", desc: "Listar todos os produtos" },
    { method: "GET", path: "/v1/products/:id", desc: "Obter detalhes de um produto" },
    { method: "GET", path: "/v1/sales", desc: "Listar vendas" },
    { method: "GET", path: "/v1/sales/:id", desc: "Obter detalhes de uma venda" },
    { method: "POST", path: "/v1/checkout/create", desc: "Criar sessão de checkout" },
    { method: "GET", path: "/v1/affiliates", desc: "Listar afiliados" },
    { method: "GET", path: "/v1/coupons", desc: "Listar cupons" },
    { method: "POST", path: "/v1/coupons", desc: "Criar cupom" },
    { method: "GET", path: "/v1/subscriptions", desc: "Listar assinaturas" },
    { method: "POST", path: "/v1/refunds", desc: "Processar reembolso" },
  ];

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400",
    POST: "bg-blue-500/20 text-blue-400",
    PUT: "bg-amber-500/20 text-amber-400",
    DELETE: "bg-destructive/20 text-destructive",
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Automações & Integrações</h1>
          <p className="text-sm text-muted-foreground">SmartPay, Pixel de rastreamento e API pública para integrações.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* SmartPay */}
        {tab === "smartpay" && (
          <div className="space-y-4">
            <div className="glass-card p-5 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-foreground">SmartPay - Recuperação Inteligente</h3>
                  <p className="text-sm text-muted-foreground mt-1">Recuperação automática de pagamentos recusados com inteligência artificial.</p>
                </div>
                <span className="px-4 py-1.5 bg-success/20 text-success text-sm font-bold rounded-full">Ativo</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card p-4">
                <p className="text-xs text-muted-foreground">Taxa de Recuperação</p>
                <p className="text-2xl font-display font-bold text-success mt-1">{recoveryRate}%</p>
                <p className="text-[10px] text-muted-foreground">de {carts.length} carrinhos abandonados</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-muted-foreground">Valor Recuperado (total)</p>
                <p className="text-2xl font-display font-bold text-foreground mt-1">R$ {recoveredValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-muted-foreground">Tentativas Automáticas</p>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{totalAttempts}</p>
              </div>
            </div>

            <div className="glass-card p-5">
              <h4 className="text-sm font-display font-bold text-foreground mb-4">Como funciona o SmartPay</h4>
              <div className="space-y-3">
                {[
                  { icon: Zap, title: "Detecção automática", desc: "Identifica pagamentos recusados em tempo real (cartão recusado, saldo insuficiente, etc.)" },
                  { icon: RefreshCw, title: "Recobrança inteligente", desc: "Tenta novamente em horários estratégicos (manhã, tarde, noite) para maximizar aprovação." },
                  { icon: Mail, title: "Notificação ao cliente", desc: "Envia emails automáticos pedindo atualização dos dados de pagamento." },
                  { icon: Bell, title: "Alertas para o produtor", desc: "Você recebe notificações sobre recuperações bem-sucedidas e falhas persistentes." },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pixel */}
        {tab === "pixel" && (
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">Pixel Queenify</h3>
                  <p className="text-sm text-muted-foreground">Rastreie conversões, visitantes e comportamento dos compradores.</p>
                </div>
                <button
                  onClick={() => { setPixelEnabled(!pixelEnabled); toast.success(pixelEnabled ? "Pixel desativado" : "Pixel ativado"); }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${pixelEnabled ? "bg-primary" : "bg-secondary"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${pixelEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="p-4 bg-secondary rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Seu ID do Pixel</p>
                  <button onClick={() => { navigator.clipboard.writeText(pixelId); toast.success("ID copiado!"); }} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
                <code className="block text-sm font-mono text-foreground bg-card px-3 py-2 rounded-lg border border-border">{pixelId}</code>
              </div>
            </div>

            <div className="glass-card p-5">
              <h4 className="text-sm font-display font-bold text-foreground mb-3">Código de instalação</h4>
              <p className="text-xs text-muted-foreground mb-3">Cole este código no &lt;head&gt; do seu site para rastrear conversões.</p>
              <div className="relative">
                <pre className="bg-card border border-border rounded-xl p-4 text-xs font-mono text-foreground overflow-x-auto">
{`<script>
  !function(q,e,n){q.QueenifyPixel=n;
  var s=e.createElement('script');
  s.async=1;s.src='https://pixel.queenify.com/q.js';
  e.head.appendChild(s);
  q[n]=q[n]||function(){(q[n].q=q[n].q||[]).push(arguments)};
  q[n]('init','${pixelId}');
  q[n]('track','PageView');
  }(window,document,'qpx');
</script>`}
                </pre>
                <button
                  onClick={() => { navigator.clipboard.writeText(`<!-- Queenify Pixel -->\n<script>...</script>`); toast.success("Código copiado!"); }}
                  className="absolute top-3 right-3 px-2 py-1 bg-primary/20 text-primary rounded text-[10px] font-medium hover:bg-primary/30"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Eventos rastreados</p></div>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{pageViews.length.toLocaleString()}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" /><p className="text-xs text-muted-foreground">Visitantes únicos (30d)</p></div>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{new Set(pageViews.map((v: any) => v.visitor_id)).size.toLocaleString()}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /><p className="text-xs text-muted-foreground">Conversões (30d)</p></div>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{sales30d.length}</p>
              </div>
            </div>

            <div className="glass-card p-5">
              <h4 className="text-sm font-display font-bold text-foreground mb-3">Eventos disponíveis</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "Lead", "CompleteRegistration", "Subscribe", "StartTrial"].map(evt => (
                  <div key={evt} className="flex items-center gap-2 p-2.5 bg-secondary rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <code className="text-xs font-mono text-foreground">{evt}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API */}
        {tab === "api" && (
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">API Pública Queenify</h3>
                  <p className="text-sm text-muted-foreground">Integre a Queenify com qualquer sistema externo.</p>
                </div>
              </div>

              <div className="p-4 bg-secondary rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="text-xs font-medium text-foreground">Chave de API (Live)</p>
                  </div>
                  <button onClick={copyApiKey} className="text-xs text-primary hover:underline flex items-center gap-1">
                    {apiKeyCopied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {apiKeyCopied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <code className="block text-xs font-mono text-foreground bg-card px-3 py-2 rounded-lg border border-border">
                  {mockApiKey.slice(0, 20)}{"•".repeat(16)}
                </code>
                <p className="text-[10px] text-muted-foreground">⚠️ Nunca compartilhe sua chave API. Ela dá acesso total à sua conta.</p>
              </div>
            </div>

            <div className="glass-card p-5">
              <h4 className="text-sm font-display font-bold text-foreground mb-1">Base URL</h4>
              <code className="text-xs font-mono text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 inline-block">
                https://api.queenify.com/v1
              </code>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h4 className="text-sm font-display font-bold text-foreground">Endpoints Disponíveis</h4>
              </div>
              <div className="divide-y divide-border">
                {apiEndpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${methodColors[ep.method]}`}>{ep.method}</span>
                    <code className="text-xs font-mono text-foreground flex-1">{ep.path}</code>
                    <p className="text-xs text-muted-foreground hidden sm:block">{ep.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h4 className="text-sm font-display font-bold text-foreground mb-3">Exemplo de requisição</h4>
              <pre className="bg-card border border-border rounded-xl p-4 text-xs font-mono text-foreground overflow-x-auto">
{`curl -X GET https://api.queenify.com/v1/products \\
  -H "Authorization: Bearer ${mockApiKey.slice(0, 20)}..." \\
  -H "Content-Type: application/json"

# Resposta:
{
  "data": [
    {
      "id": "prod_abc123",
      "name": "Curso Digital",
      "price": 197.00,
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1
}`}
              </pre>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <Webhook className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Precisa de webhooks?</p>
                  <p className="text-xs text-muted-foreground">Configure notificações em tempo real para eventos da sua conta.</p>
                </div>
                <a href={`${import.meta.env.BASE_URL}webhooks`} className="ml-auto text-xs text-primary font-medium hover:underline">Ir para Webhooks →</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Automacoes;
