import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useMemo } from "react";
import { TrendingUp, ChevronDown, Star, MessageSquare, ThumbsUp, ArrowRight, ShoppingCart, Users, Smile, UserCheck, Wallet, XCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useSales, useProducts, usePageViews } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useRef } from "react";

const reportTypes = ["Relatório de Vendas", "Relatório de Afiliados", "Relatório de Produtos"];
const dateRanges = ["Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias", "Este ano"];
const ratingFilters = ["Todas", "Positivas (≥7)", "Negativas (<7)"];

const PIE_COLORS = [
  "hsl(25, 95%, 53%)", "hsl(270, 70%, 60%)", "hsl(43, 96%, 56%)", "hsl(142, 71%, 45%)",
  "hsl(220, 90%, 56%)", "hsl(330, 80%, 60%)", "hsl(0, 72%, 51%)", "hsl(180, 60%, 45%)",
];

function getDaysForRange(range: string) {
  if (range === "Últimos 7 dias") return 7;
  if (range === "Últimos 30 dias") return 30;
  if (range === "Últimos 90 dias") return 90;
  return 365;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-primary">R$ {payload[0].value.toLocaleString("pt-BR")}</p>
      </div>
    );
  }
  return null;
};

const Relatorios = () => {
  const { user } = useAuth();
  const { data: salesRaw = [], isLoading: salesLoading } = useSales();
  const { data: products = [] } = useProducts();
  const { data: pageViews = [] } = usePageViews(user?.id);
  const contentRef = useRef<HTMLDivElement>(null);

  const [reportType, setReportType] = useState("Relatório de Vendas");
  const [dateRange, setDateRange] = useState("Últimos 30 dias");
  const [ratingFilter, setRatingFilter] = useState("Todas");
  const [productFilter, setProductFilter] = useState("Todos os Produtos");
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showAllVendas, setShowAllVendas] = useState(false);
  const [showAllAfiliados, setShowAllAfiliados] = useState(false);

  const days = getDaysForRange(dateRange);
  const cutoff = new Date(Date.now() - days * 86400000);

  const filteredSales = useMemo(() =>
    salesRaw.filter((s: any) => new Date(s.sold_at) >= cutoff),
  [salesRaw, cutoff]);

  const completedSales = filteredSales.filter((s: any) => s.status === "completed");
  const totalReceita = completedSales.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
  const totalVendas = completedSales.length;
  const totalClicks = pageViews.filter(pv => new Date(pv.created_at) >= cutoff).length;
  const taxaConversao = totalClicks > 0 ? ((totalVendas / totalClicks) * 100).toFixed(1) : "0";

  // Monthly revenue for bar chart
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    completedSales.forEach((s: any) => {
      const d = new Date(s.sold_at);
      const key = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
      months[key] = (months[key] || 0) + Number(s.amount);
    });
    return Object.entries(months).map(([mes, receita]) => ({ mes: mes.charAt(0).toUpperCase() + mes.slice(1), receita: Math.round(receita) }));
  }, [completedSales]);

  // Revenue by product for pie chart
  const pieData = useMemo(() => {
    const productTotals: Record<string, number> = {};
    completedSales.forEach((s: any) => {
      const name = s.products?.name || "Outros";
      productTotals[name] = (productTotals[name] || 0) + Number(s.amount);
    });
    const total = Object.values(productTotals).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(productTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value], i) => ({
        name,
        value: Math.round((value / total) * 100),
        color: PIE_COLORS[i % PIE_COLORS.length],
      }));
  }, [completedSales]);

  // Recent sales
  const vendasRecentes = completedSales.slice(0, 5).map((s: any) => ({
    id: s.id.slice(0, 8),
    produto: s.products?.name || "Produto",
    comprador: s.buyer_name || s.buyer_email,
    valor: `R$ ${Number(s.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    data: new Date(s.sold_at).toLocaleString("pt-BR"),
  }));

  // Top affiliates
  const topAfiliados = useMemo(() => {
    const afilMap: Record<string, { vendas: number; valor: number }> = {};
    completedSales.filter((s: any) => s.affiliate_name).forEach((s: any) => {
      const name = s.affiliate_name!;
      if (!afilMap[name]) afilMap[name] = { vendas: 0, valor: 0 };
      afilMap[name].vendas += 1;
      afilMap[name].valor += Number(s.commission_amount || 0);
    });
    return Object.entries(afilMap)
      .sort(([, a], [, b]) => b.valor - a.valor)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        vendas: data.vendas,
        valor: `R$ ${data.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      }));
  }, [completedSales]);

  const productFilterOptions = ["Todos os Produtos", ...products.map(p => p.name)];

  return (
    <DashboardLayout>
      <div ref={contentRef}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Relatórios</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Dados reais de vendas, produtos e tráfego.</p>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, label: "Receita de co-produção" },
            { icon: TrendingUp, label: "Receita por produto" },
            { icon: ShoppingCart, label: "Vendas abandonadas" },
            { icon: Smile, label: "Engajamento dos alunos" },
            { icon: UserCheck, label: "Receita por afiliado" },
            { icon: Wallet, label: "Saldo a receber" },
            { icon: XCircle, label: "Assinaturas canceladas" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.label.includes("afiliado")) setReportType("Relatório de Afiliados");
                else if (item.label.includes("produto")) setReportType("Relatório de Produtos");
                else setReportType("Relatório de Vendas");
              }}
              className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left"
            >
              <item.icon className="w-5 h-5 text-foreground flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <button
              onClick={() => { setShowReportDropdown(!showReportDropdown); setShowDateDropdown(false); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground"
            >
              {reportType} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showReportDropdown && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
                {reportTypes.map((t) => (
                  <button key={t} onClick={() => { setReportType(t); setShowReportDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${reportType === t ? "text-primary font-medium" : "text-foreground"}`}
                  >{t}</button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => { setShowDateDropdown(!showDateDropdown); setShowReportDropdown(false); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground"
            >
              {dateRange} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showDateDropdown && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
                {dateRanges.map((d) => (
                  <button key={d} onClick={() => { setDateRange(d); setShowDateDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${dateRange === d ? "text-primary font-medium" : "text-foreground"}`}
                  >{d}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {salesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Receita Total", value: `R$ ${totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
                { label: "Vendas", value: String(totalVendas) },
                { label: "Taxa de Conversão", value: `${taxaConversao}%` },
                { label: "Visualizações", value: String(totalClicks) },
              ].map((s) => (
                <div key={s.label} className="glass-card p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-display font-bold text-foreground mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Monthly Revenue */}
            {monthlyData.length > 0 && (
              <div className="glass-card p-4 mb-6">
                <h3 className="text-sm font-display font-semibold text-foreground mb-3">Evolução de Receita Mensal</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomBarTooltip />} cursor={false} />
                    <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Recent Sales */}
              <div className="lg:col-span-2 glass-card">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-display font-semibold text-foreground">Vendas Recentes</h3>
                </div>
                {vendasRecentes.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma venda no período.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">ID</th>
                          <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Produto</th>
                          <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2 hidden sm:table-cell">Comprador</th>
                          <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendasRecentes.map((v) => (
                          <tr key={v.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{v.id}</td>
                            <td className="px-4 py-2.5 text-sm text-foreground">{v.produto}</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{v.comprador}</td>
                            <td className="px-4 py-2.5 text-sm text-primary font-semibold text-right">{v.valor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Total: <span className="text-primary font-semibold">R$ {totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> / {totalVendas} vendas
                  </p>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Top Affiliates */}
                <div className="glass-card p-4">
                  <h3 className="text-sm font-display font-semibold text-foreground mb-3">Top Afiliados</h3>
                  {topAfiliados.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Nenhum afiliado no período.</p>
                  ) : (
                    topAfiliados.map((a) => (
                      <div key={a.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground font-bold">{a.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm text-foreground">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground">{a.vendas} vendas</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary">{a.valor}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Products Pie Chart */}
                {pieData.length > 0 && (
                  <div className="glass-card p-4">
                    <h3 className="text-sm font-display font-semibold text-foreground mb-3">Receita por Produto</h3>
                    <div className="flex items-center justify-center">
                      <PieChart width={150} height={150}>
                        <Tooltip content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                                <p className="text-xs text-foreground font-medium">{payload[0].name}</p>
                                <p className="text-xs text-muted-foreground">{payload[0].value}%</p>
                              </div>
                            );
                          }
                          return null;
                        }} />
                        <Pie data={pieData} cx={75} cy={75} innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </div>
                    <div className="mt-3 space-y-1">
                      {pieData.map((p) => (
                        <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          {p.name} ({p.value}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
