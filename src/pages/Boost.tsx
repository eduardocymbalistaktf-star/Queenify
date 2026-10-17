import DashboardLayout from "@/layouts/DashboardLayout";
import { useMemo } from "react";
import { BarChart3, Calendar, Check, CreditCard, Eye, ShoppingCart, Star, Crown, Diamond, CircleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Plano = {
  id: string;
  nome: string;
  preco: string;
  duracao: string;
  icon: LucideIcon;
  beneficios: string[];
  destaque?: boolean;
  badge?: string;
};

const planos: Plano[] = [
  {
    id: "15d", nome: "Boost 15 dias", preco: "R$ 39,90", duracao: "15 dias", icon: Star,
    beneficios: ["Duração de 15 dias", "Aplicação em um produto", "Preço indicativo"],
  },
  {
    id: "30d", nome: "Boost 30 dias", preco: "R$ 69,90", duracao: "30 dias", icon: Crown,
    beneficios: ["Duração de 30 dias", "Aplicação em um produto", "Preço indicativo"],
    destaque: true, badge: "POPULAR",
  },
  {
    id: "90d", nome: "Boost 90 dias", preco: "R$ 179,90", duracao: "3 meses", icon: Diamond,
    beneficios: ["Duração de 90 dias", "Aplicação em um produto", "Preço indicativo"],
  },
];

const Boost = () => {
  const { user } = useAuth();
  const since = useMemo(() => new Date(Date.now() - 90 * 86_400_000).toISOString(), []);

  const salesQuery = useQuery({
    queryKey: ["boost_sales_stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("sold_at, amount")
        .eq("user_id", user!.id).eq("status", "completed").gte("sold_at", since);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const pageViewsQuery = useQuery({
    queryKey: ["boost_page_views", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("page_views").select("created_at")
        .eq("owner_id", user!.id).gte("created_at", since);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const chartData = useMemo(() => {
    const now = new Date();
    const days: Record<string, { views: number; sales: number }> = {};
    for (let i = 89; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86_400_000);
      days[date.toISOString().slice(0, 10)] = { views: 0, sales: 0 };
    }
    (pageViewsQuery.data || []).forEach((view) => {
      const key = new Date(view.created_at).toISOString().slice(0, 10);
      if (days[key]) days[key].views += 1;
    });
    (salesQuery.data || []).forEach((sale) => {
      const key = new Date(sale.sold_at).toISOString().slice(0, 10);
      if (days[key]) days[key].sales += 1;
    });
    return Object.entries(days).map(([key, values]) => ({
      date: new Date(`${key}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      ...values,
    }));
  }, [pageViewsQuery.data, salesQuery.data]);

  const totalViews = chartData.reduce((sum, day) => sum + day.views, 0);
  const totalSales = chartData.reduce((sum, day) => sum + day.sales, 0);
  const conversion = totalViews ? ((totalSales / totalViews) * 100).toFixed(1) : "0,0";
  const statsError = salesQuery.isError || pageViewsQuery.isError;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <BackButton fallbackPath="/dashboard" className="mb-4" />
        <h1 className="text-2xl font-display font-bold text-foreground">Boost</h1>
        <p className="text-sm text-muted-foreground">Planos e dados gerais dos seus produtos.</p>
      </div>

      <div className="glass-card mb-5 flex items-start gap-3 border border-primary/30 p-4">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Compras ainda indisponíveis</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Os valores abaixo são indicativos. A Queenify ainda não está conectada a uma cobrança para Boost e o marketplace ainda não aplica os destaques. Não há cobrança nem ativação neste momento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {planos.map((plano) => (
          <article key={plano.id} className={`glass-card relative flex flex-col p-5 ${plano.destaque ? "ring-1 ring-primary/70" : ""}`}>
            {plano.badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">{plano.badge}</span>}
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><plano.icon className="h-5 w-5" /></div>
            <h2 className="text-sm font-semibold text-foreground">{plano.nome}</h2>
            <p className="mb-4 text-xs text-muted-foreground">{plano.duracao}</p>
            <p className="mb-1 text-2xl font-bold text-primary">{plano.preco}</p>
            <p className="mb-4 text-[10px] text-muted-foreground">Valor proposto • sem cobrança disponível</p>
            <ul className="mb-5 flex-1 space-y-2">
              {plano.beneficios.map((beneficio) => <li key={beneficio} className="flex items-start gap-2 text-xs text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{beneficio}</li>)}
            </ul>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs font-medium text-muted-foreground" aria-disabled="true">
              <CreditCard className="h-4 w-4" /> Em preparação
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8 space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-display font-bold text-foreground"><BarChart3 className="h-5 w-5 text-primary" />Dados gerais dos últimos 90 dias</h2>
          <p className="mt-1 text-xs text-muted-foreground">As métricas abaixo são da conta e não medem resultado atribuído ao Boost.</p>
        </div>

        {statsError ? (
          <div role="alert" className="glass-card p-4 text-sm text-muted-foreground">Não foi possível carregar as estatísticas. Atualize a página ou tente novamente mais tarde.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Visualizações registradas", value: totalViews.toLocaleString("pt-BR"), icon: Eye },
                { label: "Vendas aprovadas", value: totalSales.toLocaleString("pt-BR"), icon: ShoppingCart },
                { label: "Vendas por visualização", value: `${conversion}%`, icon: Calendar },
              ].map((item) => (
                <div key={item.label} className="glass-card p-4">
                  <div className="mb-1 flex items-center gap-2"><item.icon className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">{item.label}</span></div>
                  <p className="text-xl font-display font-bold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="glass-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><Calendar className="h-4 w-4 text-primary" />Visualizações e vendas registradas</h3>
              {(salesQuery.isLoading || pageViewsQuery.isLoading) ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Carregando estatísticas…</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.filter((_, index) => index % 3 === 0)}>
                      <defs><linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={2} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Area yAxisId="left" type="monotone" dataKey="views" name="Visualizações" stroke="hsl(var(--primary))" fill="url(#viewsGradient)" strokeWidth={2} />
                      <Bar yAxisId="right" dataKey="sales" name="Vendas aprovadas" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={8} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
};

export default Boost;
