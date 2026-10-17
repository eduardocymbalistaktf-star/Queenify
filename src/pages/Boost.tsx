import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useMemo } from "react";
import { Check, Crown, Star, Diamond, AlertTriangle, CreditCard, RefreshCw, Eye, ShoppingCart, BarChart3, Calendar, Crosshair } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useProducts } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Legend } from "recharts";

type Plano = {
  id: string;
  nome: string;
  preco: string;
  precoNum: number;
  precoParcela?: string;
  duracao: string;
  dias: number;
  icon: any;
  iconColor: string;
  beneficios: string[];
  destaque: boolean;
  badge?: string;
};

const planos: Plano[] = [
  {
    id: "7d", nome: "Boost 7 dias", preco: "Competição", precoNum: 0, duracao: "7 dias", dias: 7,
    icon: Star, iconColor: "text-primary", badge: "TOP 1",
    beneficios: ["Conquistado pelo Top 1 em vendas da semana", "Aparecer mais vezes no marketplace", "Selo '+ relevante' no produto de escolha", "Ganha 1 estrela (5 estrelas = placa Top 1)", "Apenas Gold e Crown podem participar"],
    destaque: false,
  },
  {
    id: "15d", nome: "Boost 15 dias", preco: "R$ 59,90", precoNum: 59.90, duracao: "15 dias", dias: 15,
    icon: Star, iconColor: "text-primary",
    beneficios: ["Aparecer mais vezes no marketplace", "Classificado como produto relevante por 15 dias", "Selo 'Em Destaque' no card do produto", "Posição prioritária nos resultados de busca"],
    destaque: false,
  },
  {
    id: "30d", nome: "Boost 30 dias", preco: "R$ 109,90", precoNum: 109.90, duracao: "30 dias", dias: 30,
    icon: Crown, iconColor: "text-primary", badge: "POPULAR",
    beneficios: ["Aparecer mais vezes no marketplace", "Classificado como produto relevante por 30 dias", "Selo 'Em Destaque' no card do produto", "Posição prioritária nos resultados de busca", "Estatísticas de impressões do destaque"],
    destaque: true,
  },
  {
    id: "90d", nome: "Boost 90 dias", preco: "R$ 299,90", precoNum: 299.90, precoParcela: "ou 3x de R$ 99,97", duracao: "3 meses", dias: 90,
    icon: Diamond, iconColor: "text-primary",
    beneficios: ["Todos os benefícios do plano de 30 dias", "Selo 'Premium' exclusivo no card do produto", "Relatório de performance do destaque", "Suporte prioritário durante o período"],
    destaque: false,
  },
];

const Boost = () => {
  const [selectedPlano, setSelectedPlano] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credito" | "debito">("pix");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [boostPurchasing, setBoostPurchasing] = useState(false);
  const { data: produtos } = useProducts();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: activeBoosts = [] } = useQuery({
    queryKey: ["boost_purchases", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("boost_purchases").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: salesData = [] } = useQuery({
    queryKey: ["boost_sales_stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("sales").select("sold_at, amount").eq("user_id", user!.id).gte("sold_at", new Date(Date.now() - 90 * 86400000).toISOString());
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pageViewsData = [] } = useQuery({
    queryKey: ["boost_page_views", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("page_views").select("created_at").eq("owner_id", user!.id).gte("created_at", new Date(Date.now() - 90 * 86400000).toISOString());
      return data || [];
    },
    enabled: !!user,
  });

  const selected = planos.find(p => p.id === selectedPlano);
  const canAutoRenew = paymentMethod === "credito" || paymentMethod === "debito";
  const currentBoost = activeBoosts.find((b: any) => new Date(b.ends_at) > new Date());

  const chartData = useMemo(() => {
    const now = new Date();
    const days: Record<string, { impressions: number; conversions: number }> = {};
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days[key] = { impressions: 0, conversions: 0 };
    }
    pageViewsData.forEach((pv: any) => { const key = new Date(pv.created_at).toISOString().slice(0, 10); if (days[key]) days[key].impressions++; });
    salesData.forEach((s: any) => { const key = new Date(s.sold_at).toISOString().slice(0, 10); if (days[key]) days[key].conversions++; });
    return Object.entries(days).map(([key, val]) => ({
      date: new Date(key).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      impressions: val.impressions,
      conversions: val.conversions,
    }));
  }, [pageViewsData, salesData]);

  const totalImpressions = chartData.reduce((s, d) => s + d.impressions, 0);
  const totalConversions = chartData.reduce((s, d) => s + d.conversions, 0);
  const ctr = totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(1) : "0";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <BackButton fallbackPath="/dashboard" className="mb-4" />
        <h1 className="text-2xl font-display font-bold text-foreground">Ativar Boost</h1>
        <p className="text-sm text-muted-foreground">Impulsione seus produtos e apareça no topo do marketplace.</p>
      </div>

      {/* Competition info */}
      <div className="glass-card p-4 mb-4 border-l-4 border-primary">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" /> Competição Top 1 Semanal
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          O Top 1 em vendas da semana (Gold e Crown) ganha um Boost de 7 dias + 1 estrela.
          Com 5 estrelas, receba a placa "Top 1 em Vendas".
        </p>
      </div>

      {/* Boost Plans FIRST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {planos.map(p => (
          <div
            key={p.id}
            onClick={() => p.id !== "7d" && setSelectedPlano(p.id)}
            className={`glass-card p-5 transition-all relative flex flex-col ${
              p.id === "7d" ? "opacity-75 cursor-default" : "cursor-pointer"
            } ${p.destaque ? "ring-2 ring-primary" : ""} ${
              selectedPlano === p.id ? "ring-2 ring-primary bg-primary/5" : p.id !== "7d" ? "hover:border-primary/30" : ""
            }`}
          >
            {p.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-3 py-0.5 rounded-full gradient-gold text-primary-foreground font-bold">
                {p.badge}
              </span>
            )}
            <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 ${p.iconColor}`}>
              <p.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{p.nome}</h3>
            <p className="text-xs text-muted-foreground mb-3">{p.duracao}</p>
            <p className="text-xl font-bold text-primary mb-1">{p.preco}</p>
            {p.precoParcela && <p className="text-[10px] text-muted-foreground mb-3">{p.precoParcela}</p>}
            {!p.precoParcela && <div className="mb-3" />}
            <div className="space-y-2 flex-1">
              {p.beneficios.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground leading-tight">{b}</span>
                </div>
              ))}
            </div>
            {p.id !== "7d" && (
              <button className={`mt-4 w-full py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedPlano === p.id ? "gradient-gold text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}>
                {selectedPlano === p.id ? "Selecionado" : "Selecionar"}
              </button>
            )}
            {p.id === "7d" && <p className="mt-4 text-center text-[10px] text-muted-foreground">Ganhe na competição semanal</p>}
          </div>
        ))}
      </div>

      {/* No-cancel warning */}
      <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
        <div className="text-xs text-destructive leading-relaxed space-y-1">
          <p><strong>Atenção:</strong> Após a compra, os boosts <strong>não podem ser cancelados ou reembolsados</strong>.</p>
          <p>Em caso de <strong>chargeback</strong>, o boost ativo será <strong>cancelado automaticamente</strong> e o produto perderá todos os benefícios de destaque imediatamente.</p>
        </div>
      </div>

      {/* Purchase form */}
      {selectedPlano && selected && selected.id !== "7d" && (
        <div className="mt-4 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Plano: <span className="text-primary">{selected.nome}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{selected.preco}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Aplicar boost em qual produto?</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground">
              <option value="">Selecione um produto</option>
              {(produtos || []).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Método de pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "pix" as const, label: "PIX", icon: "⚡" },
                { id: "credito" as const, label: "Crédito", icon: "💳" },
                { id: "debito" as const, label: "Débito", icon: "🏦" },
              ]).map(m => (
                <button key={m.id} onClick={() => { setPaymentMethod(m.id); if (m.id === "pix") setAutoRenew(false); }}
                  className={`p-3 rounded-xl border text-center transition-all text-xs ${paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"}`}>
                  <span className="text-base">{m.icon}</span>
                  <p className="mt-1 font-medium text-foreground">{m.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-medium text-foreground">Renovar automaticamente</p>
                <p className="text-[10px] text-muted-foreground">{canAutoRenew ? "O boost será renovado ao final do período" : "Disponível apenas para cartão de crédito/débito"}</p>
              </div>
            </div>
            <button onClick={() => canAutoRenew && setAutoRenew(!autoRenew)}
              className={`w-10 h-6 rounded-full relative transition-colors ${autoRenew && canAutoRenew ? "bg-primary" : "bg-muted"} ${!canAutoRenew ? "opacity-40 cursor-not-allowed" : ""}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-all ${autoRenew && canAutoRenew ? "right-1" : "left-1"}`} />
            </button>
          </div>
          <button disabled={!selectedProduct || boostPurchasing}
            onClick={async () => {
              if (!user || !selectedProduct || !selected) return;
              setBoostPurchasing(true);
              const endsAt = new Date(Date.now() + selected.dias * 86400000).toISOString();
              const { error } = await supabase.from("boost_purchases").insert({
                user_id: user.id,
                plan_id: selected.id,
                product_id: selectedProduct,
                price_paid: selected.precoNum,
                starts_at: new Date().toISOString(),
                ends_at: endsAt,
                auto_renew: autoRenew,
                payment_method: paymentMethod,
              });
              setBoostPurchasing(false);
              if (error) {
                toast.error("Erro ao ativar boost: " + error.message);
                return;
              }
              toast.success(`Boost de ${selected.dias} dias ativado com sucesso!`);
              queryClient.invalidateQueries({ queryKey: ["boost_purchases"] });
              setSelectedPlano(null);
              setSelectedProduct("");
            }}
            className="w-full px-6 py-2.5 rounded-xl gradient-gold text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">
            {boostPurchasing ? "Processando..." : `Confirmar e Pagar ${selected.preco}`}
          </button>
        </div>
      )}

      {/* Boost Stats BELOW the plans */}
      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Estatísticas do Boost
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Impressões", value: totalImpressions.toLocaleString("pt-BR"), icon: Eye, color: "text-blue-400" },
            { label: "Conversões", value: totalConversions.toLocaleString("pt-BR"), icon: ShoppingCart, color: "text-success" },
            { label: "Taxa Conversão", value: `${ctr}%`, icon: Crosshair, color: "text-purple-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-display font-bold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Performance do Boost
            </h3>
            {currentBoost && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-success/20 text-success font-medium">
                Boost Ativo até {new Date((currentBoost as any).ends_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.filter((_, i) => i % 3 === 0)}>
                <defs>
                  <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={2} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area yAxisId="left" type="monotone" dataKey="impressions" name="Impressões" stroke="hsl(var(--primary))" fill="url(#gradImpressions)" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="conversions" name="Conversões" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={8} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Boost;
