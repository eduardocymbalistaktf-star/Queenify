import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useMemo } from "react";
import { Search, Filter, CheckCircle, XCircle, Clock, Users, TrendingUp, TrendingDown, Eye, Link2, Copy, DollarSign, BarChart3, Settings2, RefreshCw, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSales, useProducts } from "@/hooks/useSupabaseData";

const periodos = ["Últimos 30 dias", "Últimos 7 dias", "Hoje"];

interface AfiliadoData {
  name: string;
  comissao: number;
  vendas: number;
  produtos: string[];
}

const Afiliados = () => {
  const { user } = useAuth();
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const [activeView, setActiveView] = useState<"afiliados" | "pedidos" | "links">("afiliados");
  const [produtoFilter, setProdutoFilter] = useState("Todos");
  const [periodo, setPeriodo] = useState("Últimos 30 dias");
  const [search, setSearch] = useState("");
  const [selectedAfiliado, setSelectedAfiliado] = useState<AfiliadoData | null>(null);
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [payDay, setPayDay] = useState(15);

  const isLoading = salesLoading || productsLoading;

  // Filter sales by period
  const filteredSales = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    if (periodo === "Hoje") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (periodo === "Últimos 7 dias") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return sales.filter((s: any) => new Date(s.sold_at) >= cutoff);
  }, [sales, periodo]);

  // Build affiliate data from real sales
  const afiliados = useMemo(() => {
    const map: Record<string, AfiliadoData> = {};
    filteredSales
      .filter((s: any) => s.affiliate_name && s.status === "completed")
      .forEach((s: any) => {
        const name = s.affiliate_name!;
        if (!map[name]) map[name] = { name, comissao: 0, vendas: 0, produtos: [] };
        map[name].vendas += 1;
        map[name].comissao += Number(s.commission_amount || 0);
        const prodName = (s as any).products?.name;
        if (prodName && !map[name].produtos.includes(prodName)) {
          map[name].produtos.push(prodName);
        }
      });
    return Object.values(map).sort((a, b) => b.comissao - a.comissao);
  }, [filteredSales]);

  // Product names for filter
  const productNames = useMemo(() => {
    const names = new Set<string>();
    afiliados.forEach(a => a.produtos.forEach(p => names.add(p)));
    return ["Todos", ...Array.from(names)];
  }, [afiliados]);

  const filtered = afiliados.filter(a => {
    const matchProduto = produtoFilter === "Todos" || a.produtos.includes(produtoFilter);
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    return matchProduto && matchSearch;
  });

  const totalComissoes = filtered.reduce((s, a) => s + a.comissao, 0);
  const totalVendas = filtered.reduce((s, a) => s + a.vendas, 0);

  // Performance chart data from real sales
  const performanceData = useMemo(() => {
    const days = periodo === "Hoje" ? 1 : periodo === "Últimos 7 dias" ? 7 : 30;
    const data: { dia: string; vendas: number; comissao: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const daySales = filteredSales.filter((s: any) =>
        s.affiliate_name && s.status === "completed" && s.sold_at?.slice(0, 10) === dateStr
      );
      data.push({
        dia: label,
        vendas: daySales.length,
        comissao: daySales.reduce((sum: number, s: any) => sum + Number(s.commission_amount || 0), 0),
      });
    }
    return data;
  }, [filteredSales, periodo]);

  // Commission history by month (real) - used in performance chart
  const commissionHistory = useMemo(() => {
    const map: Record<string, { pago: number; pendente: number }> = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    sales.filter((s: any) => s.affiliate_name).forEach((s: any) => {
      const d = new Date(s.sold_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { pago: 0, pendente: 0 };
      if (s.status === "completed") {
        map[key].pago += Number(s.commission_amount || 0);
      } else {
        map[key].pendente += Number(s.commission_amount || 0);
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => {
        const month = parseInt(key.split("-")[1]);
        return { mes: monthNames[month], ...val };
      });
  }, [sales]);

  const copyLink = (name: string) => {
    const code = name.replace(/\s+/g, "-").toUpperCase();
    navigator.clipboard.writeText(`https://queenify.com.br/ref/${code}`);
    toast.success("Link de rastreamento copiado!");
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-xs text-foreground font-medium">
              {p.name}: {typeof p.value === 'number' ? `R$ ${p.value.toFixed(2)}` : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Afiliados</h1>
        <p className="text-sm text-muted-foreground">Gerencie afiliados, links de rastreamento e pagamento de comissões.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "afiliados", icon: Users, label: "Afiliados Ativos" },
          { key: "pedidos", icon: Clock, label: "Pedidos" },
          { key: "links", icon: Link2, label: "Links de Rastreamento" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as any)}
            className={`text-xs px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
              activeView === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {activeView === "afiliados" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Afiliados</p>
              <p className="text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Vendas via Afiliados</p>
              <p className="text-2xl font-bold text-primary mt-1">{totalVendas.toLocaleString()}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Comissões</p>
              <p className="text-2xl font-bold text-success mt-1">R$ {totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Comissão Média</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                R$ {filtered.length ? (totalComissoes / filtered.length).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Buscar afiliado..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select value={produtoFilter} onChange={(e) => setProdutoFilter(e.target.value)}
                className="bg-secondary border border-border text-sm text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                {productNames.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              {periodos.map(p => (
                <button key={p} onClick={() => setPeriodo(p)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${periodo === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Afiliados List */}
          <div className="space-y-3">
            {filtered.map((a) => (
              <div key={a.name} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">{a.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm text-foreground font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.produtos.join(", ") || "—"} · {a.vendas} vendas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">R$ {a.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <span className="text-[10px] text-muted-foreground">{a.vendas} vendas</span>
                  </div>
                  <button onClick={() => copyLink(a.name)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors" title="Copiar link">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => setSelectedAfiliado(a)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Nenhum afiliado encontrado.</div>}
          </div>
        </>
      )}

      {activeView === "pedidos" && (
        <PedidosAfiliacao products={products} />
      )}

      {/* Links de Rastreamento */}
      {activeView === "links" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">Links de Rastreamento</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Cada afiliado recebe um link exclusivo de rastreamento. Todos os cliques, conversões e vendas são registrados automaticamente.
            </p>
            <div className="space-y-3">
              {afiliados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum afiliado com vendas registradas.</p>
              ) : afiliados.map(a => {
                const code = a.name.replace(/\s+/g, "-").toUpperCase();
                return (
                  <div key={a.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">queenify.com.br/ref/{code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">{a.vendas} vendas</p>
                        <p className="text-xs text-success">R$ {a.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <button onClick={() => copyLink(a.name)} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copiar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Performance de Vendas via Afiliados ({periodo})</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="comissao" name="R$ Comissão" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                  <Area type="monotone" dataKey="vendas" name="Vendas" stroke="hsl(142,76%,36%)" fill="hsl(142,76%,36%,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}


      {/* Afiliado Detail Sheet */}
      <Sheet open={!!selectedAfiliado} onOpenChange={() => setSelectedAfiliado(null)}>
        <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
          <SheetHeader>
            <SheetTitle className="font-display">Desempenho do Afiliado</SheetTitle>
          </SheetHeader>
          {selectedAfiliado && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground">{selectedAfiliado.name.charAt(0)}</div>
                <div>
                  <p className="text-foreground font-medium">{selectedAfiliado.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedAfiliado.produtos.join(", ")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-lg font-bold text-foreground">{selectedAfiliado.vendas.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Comissão</p>
                  <p className="text-lg font-bold text-primary">R$ {selectedAfiliado.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-3">Vendas no período</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="vendas" name="Vendas" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

// ── Pedidos de Afiliação ──
function PedidosAfiliacao({ products }: { products: any[] }) {
  const { user } = useAuth();

  // Sales where affiliate_name matches a pending request pattern
  // In a real system this would be a dedicated affiliation_requests table
  // For now we check if there are any products with commission_rate > 0 that the user owns
  const productsWithAffiliation = products.filter(p => (p.commission_rate || 0) > 0);

  if (productsWithAffiliation.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium">Nenhum pedido de afiliação pendente</p>
        <p className="text-sm text-muted-foreground mt-1">
          Quando alguém solicitar afiliação a um dos seus produtos, aparecerá aqui.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Para receber pedidos, certifique-se de que seus produtos tenham uma comissão configurada e estejam ativos no Marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 border-l-4 border-primary">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Produtos com afiliação habilitada:</strong> {productsWithAffiliation.length} produto(s) aceitam afiliados.
          Os pedidos de afiliação aparecerão automaticamente quando um afiliado solicitar via Marketplace.
        </p>
      </div>
      {productsWithAffiliation.map((p: any) => (
        <div key={p.id} className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full rounded-lg object-cover" /> : <Users className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">Comissão: {p.commission_rate}% · R$ {Number(p.price).toFixed(2)}</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-success/20 text-success font-medium">Aceitando afiliados</span>
        </div>
      ))}
    </div>
  );
}

export default Afiliados;
