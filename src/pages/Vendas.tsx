import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useRef, useMemo } from "react";
import { ChevronDown, CalendarDays, Search, ShoppingCart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSales } from "@/hooks/useSupabaseData";

const statusMap: Record<string, string> = {
  completed: "Pago",
  refunded: "Reembolsado",
  pending: "Pendente",
  approved: "Aprovado",
};

const statusOptions = ["Pago", "Reembolsado", "Pendente", "Aprovado"];
const periodFilterOptions = ["Últimos 30 dias", "Últimos 7 dias", "Hoje"];

function getDaysForPeriod(period: string) {
  if (period === "Hoje") return 1;
  if (period === "Últimos 7 dias") return 7;
  return 30;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-primary">
          R$ {payload[0].value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const Vendas = () => {
  const { data: salesRaw = [], isLoading } = useSales();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState("Últimos 30 dias");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Últimos 30 dias");
  const periodRef = useRef<HTMLDivElement>(null);

  const vendas = useMemo(() => {
    const days = getDaysForPeriod(selectedPeriod);
    const cutoff = new Date(Date.now() - days * 86400000);
    return salesRaw
      .filter((s: any) => new Date(s.sold_at) >= cutoff)
      .map((s: any) => ({
        id: s.id.slice(0, 8),
        produto: s.products?.name || "Produto",
        categoria: s.products?.category || "",
        comprador: s.buyer_name || s.buyer_email,
        tipo: s.affiliate_name ? `Afiliado: ${s.affiliate_name}` : "Direto",
        valor: `R$ ${Number(s.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        valorNum: Number(s.amount),
        status: statusMap[s.status] || s.status,
        data: new Date(s.sold_at).toLocaleString("pt-BR"),
        email: s.buyer_email,
        metodo: s.payment_method?.toUpperCase() || "PIX",
      }));
  }, [salesRaw, selectedPeriod]);

  const filtered = statusFilter === "Todos" ? vendas : vendas.filter(v => v.status === statusFilter);
  const totalVendas = filtered.filter(v => v.status === "Pago").reduce((acc, v) => acc + v.valorNum, 0);

  const revenueData = useMemo(() => {
    const days = getDaysForPeriod(revenuePeriod);
    const result: { dia: string; valor: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const dayTotal = salesRaw
        .filter((s: any) => {
          const sd = new Date(s.sold_at);
          return sd.toDateString() === d.toDateString() && s.status === "completed";
        })
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      result.push({ dia: key, valor: dayTotal });
    }
    return result;
  }, [salesRaw, revenuePeriod]);

  const totalRevenue = revenueData.reduce((a, b) => a + b.valor, 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Vendas</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Visualize e gerencie suas vendas e comissões.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {["Todos", ...statusOptions].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto relative" ref={periodRef}>
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground"
          >
            <CalendarDays className="w-3.5 h-3.5" /> {selectedPeriod} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {periodOpen && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[160px]">
              {periodFilterOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => { setSelectedPeriod(p); setPeriodOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary/50 transition-colors ${
                    selectedPeriod === p ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">Nenhuma venda encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">As vendas aparecerão aqui quando forem realizadas.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">ID</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Produto</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">Comprador</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 hidden md:table-cell">Tipo</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Status</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{v.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground font-medium">{v.produto}</p>
                      <p className="text-xs text-muted-foreground">{v.categoria}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground hidden sm:table-cell">{v.comprador}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{v.tipo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        v.status === "Pago" ? "bg-success/20 text-success" :
                        v.status === "Reembolsado" ? "bg-destructive/20 text-destructive" :
                        "bg-primary/20 text-primary"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-semibold text-right">{v.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Total: <span className="text-primary font-semibold">R$ {totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> / {filtered.filter(v => v.status === "Pago").length} vendas</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setRevenueOpen(true)}
        className="mt-6 flex items-center gap-3 mx-auto text-muted-foreground hover:text-foreground transition-colors group"
      >
        <Search className="w-5 h-5 group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium">Ver receita</span>
      </button>

      <Sheet open={revenueOpen} onOpenChange={setRevenueOpen}>
        <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground">Receita Total</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total ganho</p>
              <p className="text-3xl font-display font-bold text-primary mt-1">
                R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex gap-2">
              {periodFilterOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => setRevenuePeriod(p)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    revenuePeriod === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="glass-card p-4">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis dataKey="dia" tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="valor" stroke="hsl(43, 96%, 56%)" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Vendas;
