import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { Filter, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const produtos = ["Todos", "Curso de Tráfego Pago", "E-book Marketing Digital", "Mentoria VIP"];
const periodos = ["Últimos 30 dias", "Últimos 7 dias", "Hoje"];

const afiliados = [
  { name: "Maria Santos", badge: "Elite", badgeColor: "bg-primary text-primary-foreground", comissao: "R$ 4.820,50", vendas: 1245, taxa: 12.5, tendencia: "up", produto: "Curso de Tráfego Pago" },
  { name: "Lucas Andrade", badge: "Pro", badgeColor: "bg-success text-success-foreground", comissao: "R$ 2.450,30", vendas: 870, taxa: 8.2, tendencia: "up", produto: "E-book Marketing Digital" },
  { name: "Ana Souza", badge: "Avançado", badgeColor: "bg-[hsl(25,95%,53%)] text-foreground", comissao: "R$ 1.205,80", vendas: 623, taxa: -3.1, tendencia: "down", produto: "Curso de Tráfego Pago" },
  { name: "Pedro Lima", badge: "Pro", badgeColor: "bg-success text-success-foreground", comissao: "R$ 980,40", vendas: 410, taxa: 5.7, tendencia: "up", produto: "Mentoria VIP" },
  { name: "Carla Mendes", badge: "Bronze", badgeColor: "bg-muted text-muted-foreground", comissao: "R$ 875,20", vendas: 315, taxa: -1.4, tendencia: "down", produto: "E-book Marketing Digital" },
];

const performanceData = [
  { dia: "01", vendas: 12 }, { dia: "05", vendas: 18 }, { dia: "10", vendas: 25 },
  { dia: "15", vendas: 22 }, { dia: "20", vendas: 30 }, { dia: "25", vendas: 28 }, { dia: "30", vendas: 35 },
];

const AfiliadosMonitorar = () => {
  const [produtoFilter, setProdutoFilter] = useState("Todos");
  const [periodo, setPeriodo] = useState("Últimos 30 dias");
  const [selectedAfiliado, setSelectedAfiliado] = useState<typeof afiliados[0] | null>(null);

  const filtered = afiliados.filter(a => produtoFilter === "Todos" || a.produto === produtoFilter);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-foreground font-medium">{payload[0].value} vendas</p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Monitorar Afiliados</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o desempenho de cada afiliado em tempo real.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={produtoFilter}
            onChange={(e) => setProdutoFilter(e.target.value)}
            className="bg-secondary border border-border text-sm text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {produtos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {periodos.map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                periodo === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Total Afiliados</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Vendas Totais</p>
          <p className="text-2xl font-bold text-primary mt-1">{filtered.reduce((s, a) => s + a.vendas, 0).toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Comissões Pagas</p>
          <p className="text-2xl font-bold text-success mt-1">R$ {(filtered.reduce((s, a) => s + parseFloat(a.comissao.replace(/[R$\s.]/g, '').replace(',', '.')), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Afiliados Performance List */}
      <div className="space-y-3">
        {filtered.map((a) => (
          <div key={a.name} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                {a.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground font-medium">{a.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${a.badgeColor}`}>{a.badge}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.produto}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">{a.comissao}</p>
                <div className="flex items-center gap-1 justify-end">
                  {a.tendencia === "up" ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  )}
                  <span className={`text-[10px] ${a.tendencia === "up" ? "text-success" : "text-destructive"}`}>
                    {a.taxa > 0 ? "+" : ""}{a.taxa}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAfiliado(a)}
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedAfiliado} onOpenChange={() => setSelectedAfiliado(null)}>
        <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
          <SheetHeader>
            <SheetTitle className="font-display">Desempenho do Afiliado</SheetTitle>
          </SheetHeader>
          {selectedAfiliado && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {selectedAfiliado.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-medium">{selectedAfiliado.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${selectedAfiliado.badgeColor}`}>{selectedAfiliado.badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedAfiliado.produto}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-lg font-bold text-foreground">{selectedAfiliado.vendas.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Comissão</p>
                  <p className="text-lg font-bold text-primary">{selectedAfiliado.comissao}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-3">Vendas no período</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
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

export default AfiliadosMonitorar;
