import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSales } from "@/hooks/useSupabaseData";

const periodOptions = ["Últimos 30 dias", "Últimos 7 dias", "Hoje"];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">Dia {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-sm font-semibold text-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: p.stroke }} />
          {p.dataKey === "faturamento" ? "Faturamento" : "Vendas (qtd)"}: {p.dataKey === "faturamento" ? `R$ ${p.value.toLocaleString("pt-BR")}` : p.value}
        </p>
      ))}
    </div>
  );
};

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary">
        R$ {payload[0].value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

const SalesChart = () => {
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState("Últimos 30 dias");
  const { data: sales = [] } = useSales();

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - 29 + i);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");

      const daySales = sales.filter((s: any) => {
        const sd = new Date(s.sold_at);
        return sd.getDate() === date.getDate() && sd.getMonth() === date.getMonth() && sd.getFullYear() === date.getFullYear() && s.status === "completed";
      });

      return {
        day: `${day}/${month}`,
        faturamento: daySales.reduce((sum: number, s: any) => sum + Number(s.amount), 0),
        vendas: daySales.length,
      };
    });
  }, [sales]);

  const totalRevenue = chartData.reduce((a, b) => a + b.faturamento, 0);

  const filteredRevenue = revenuePeriod === "Hoje" ? chartData.slice(-1) : revenuePeriod === "Últimos 7 dias" ? chartData.slice(-7) : chartData;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Evolução de Vendas</h3>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142, 71%, 45%)" }} />
                Faturamento
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: "hsl(25, 95%, 53%)" }} />
                Vendas
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRevenueOpen(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium">Ver receita</span>
            </button>
            <div className="glass-card px-4 py-2">
              <span className="text-sm font-semibold text-foreground">
                R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" />
            <XAxis dataKey="day" stroke="hsl(0, 0%, 40%)" fontSize={12} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(0, 0%, 30%)", strokeDasharray: "4 4" }} />
            <Area type="natural" dataKey="faturamento" stroke="hsl(142, 71%, 45%)" fill="url(#gradGreen)" strokeWidth={2} animationDuration={800} />
            <Area type="natural" dataKey="vendas" stroke="hsl(25, 95%, 53%)" fill="url(#gradOrange)" strokeWidth={2} animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <Sheet open={revenueOpen} onOpenChange={setRevenueOpen}>
        <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground">Receita Total</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total ganho (30 dias)</p>
              <p className="text-3xl font-display font-bold text-primary mt-1">
                R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex gap-2">
              {periodOptions.map((p) => (
                <button key={p} onClick={() => setRevenuePeriod(p)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${revenuePeriod === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >{p}</button>
              ))}
            </div>
            <div className="glass-card p-4">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={filteredRevenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="natural" dataKey="faturamento" stroke="hsl(43, 96%, 56%)" fill="url(#revGrad)" strokeWidth={2} animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SalesChart;
