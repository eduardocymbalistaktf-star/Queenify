import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useMemo } from "react";
import { Search, Wallet, Users, Plus, Trash2, Percent, Clock, Zap, ArrowRight, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import SolicitarSaqueSheet from "@/components/SolicitarSaqueSheet";
import { useSales, useProducts } from "@/hooks/useSupabaseData";

const tabOptions = ["Extrato Financeiro", "Escrow custódia", "Split de Pagamento", "Antecipação"];
const periodOptions = ["Últimos 30 dias", "Últimos 7 dias", "Hoje"];

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

const Financeiro = () => {
  const { data: salesRaw = [], isLoading } = useSales();
  const { data: products = [] } = useProducts();
  const [activeTab, setActiveTab] = useState("Extrato Financeiro");
  const [saqueOpen, setSaqueOpen] = useState(false);
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState("Últimos 30 dias");

  const transacoes = useMemo(() =>
    salesRaw.map((s: any) => ({
      id: s.id.slice(0, 8),
      produto: s.products?.name || "Produto",
      comprador: s.buyer_email,
      data: new Date(s.sold_at).toLocaleString("pt-BR"),
      valor: `R$ ${Number(s.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      valorNum: Number(s.amount),
      status: s.status === "completed" ? "Pago" : s.status === "refunded" ? "Reembolsado" : "Pendente",
    })),
  [salesRaw]);

  const totalExtrato = transacoes.filter(t => t.status === "Pago").reduce((sum, t) => sum + t.valorNum, 0);

  // Escrow: sales within guarantee period (last 7-15 days) grouped by product
  const escrowItems = useMemo(() => {
    const now = Date.now();
    const productMap = new Map<string, { name: string; total: number; count: number; guaranteeDays: number; minDaysLeft: number }>();
    
    salesRaw.filter((s: any) => s.status === "completed").forEach((s: any) => {
      const product = products.find(p => p.id === s.product_id);
      const guaranteeDays = product?.guarantee_days || 7;
      const soldDate = new Date(s.sold_at).getTime();
      const expiresAt = soldDate + guaranteeDays * 86400000;
      const daysLeft = Math.ceil((expiresAt - now) / 86400000);
      
      if (daysLeft > 0) {
        const key = s.product_id;
        const existing = productMap.get(key);
        if (existing) {
          existing.total += Number(s.amount);
          existing.count += 1;
          existing.minDaysLeft = Math.min(existing.minDaysLeft, daysLeft);
        } else {
          productMap.set(key, {
            name: product?.name || s.products?.name || "Produto",
            total: Number(s.amount),
            count: 1,
            guaranteeDays,
            minDaysLeft: daysLeft,
          });
        }
      }
    });
    
    return Array.from(productMap.values());
  }, [salesRaw, products]);

  const totalEscrow = escrowItems.reduce((sum, e) => sum + e.total, 0);
  const saldoDisponivel = totalExtrato - totalEscrow;

  const revenueData = useMemo(() => {
    const days = revenuePeriod === "Hoje" ? 1 : revenuePeriod === "Últimos 7 dias" ? 7 : 30;
    const result: { dia: string; valor: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const dayTotal = salesRaw
        .filter((s: any) => new Date(s.sold_at).toDateString() === d.toDateString() && s.status === "completed")
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      result.push({ dia: key, valor: dayTotal });
    }
    return result;
  }, [salesRaw, revenuePeriod]);

  const totalRevenue = revenueData.reduce((a, b) => a + b.valor, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Financeiro</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Visualize e gerencie suas finanças.</p>
        </div>
        <button onClick={() => setSaqueOpen(true)} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          Solicitar Saque
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-6">
          <p className="text-sm text-muted-foreground">Saldo disponível</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground mt-1">
            R$ {saldoDisponivel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-muted-foreground">Saldo em custódia</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-muted-foreground mt-1">
            R$ {totalEscrow.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border overflow-x-auto no-scrollbar">
          {tabOptions.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {activeTab === "Extrato Financeiro" && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transacoes.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">Nenhuma transação</p>
                <p className="text-sm text-muted-foreground mt-1">Suas transações aparecerão aqui.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">ID</th>
                        <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Entradas</th>
                        <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">Comprador</th>
                        <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 hidden md:table-cell">Data</th>
                        <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Valor</th>
                        <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacoes.map((t) => (
                        <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 text-xs text-muted-foreground">{t.id}</td>
                          <td className="px-4 py-3 text-sm text-foreground font-medium">{t.produto}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{t.comprador}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{t.data}</td>
                          <td className="px-4 py-3 text-sm text-foreground font-semibold text-right">{t.valor}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "Pago" ? "bg-success/20 text-success" : t.status === "Reembolsado" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>{t.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Total: <span className="text-primary font-semibold">R$ {totalExtrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></p>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "Escrow custódia" && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">Valores em custódia por produto. O saque fica disponível após o período de garantia.</p>
            {escrowItems.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Nenhum valor em custódia no momento.</div>
            ) : (
              escrowItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                  <div>
                    <p className="text-sm text-foreground font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.count} vendas · Garantia: {item.guaranteeDays} dias</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-muted-foreground">{item.minDaysLeft} dias restantes</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "Split de Pagamento" && (
          <SplitPaymentTab />
        )}

        {activeTab === "Antecipação" && (
          <AntecipacaoTab saldoDisponivel={saldoDisponivel} totalEscrow={totalEscrow} />
        )}
      </div>

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
              {periodOptions.map((p) => (
                <button key={p} onClick={() => setRevenuePeriod(p)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${revenuePeriod === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >{p}</button>
              ))}
            </div>
            <div className="glass-card p-4">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="finRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis dataKey="dia" tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="monotone" dataKey="valor" stroke="hsl(43, 96%, 56%)" fill="url(#finRevGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <SolicitarSaqueSheet open={saqueOpen} onOpenChange={setSaqueOpen} />
    </DashboardLayout>
  );
};

// ── Split de Pagamento ──
function SplitPaymentTab() {
  const [splits, setSplits] = useState([
    { name: "Produtor principal", email: "voce@email.com", percentage: 70, role: "Produtor" },
    { name: "Co-produtor", email: "coprod@email.com", percentage: 20, role: "Co-produtor" },
    { name: "Afiliado fixo", email: "afiliado@email.com", percentage: 10, role: "Afiliado" },
  ]);

  const totalPercent = splits.reduce((s, x) => s + x.percentage, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Divisão automática de receita</h3>
          <p className="text-xs text-muted-foreground">Configure como a receita de cada venda é dividida entre os participantes.</p>
        </div>
        <button onClick={() => setSplits([...splits, { name: "", email: "", percentage: 0, role: "Parceiro" }])}
          className="flex items-center gap-1.5 px-3 py-1.5 gradient-gold rounded-lg text-xs font-semibold text-primary-foreground">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      <div className="space-y-3">
        {splits.map((s, i) => (
          <div key={i} className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Users className="w-5 h-5 text-primary flex-shrink-0 hidden sm:block" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
              <input value={s.name} onChange={e => { const n = [...splits]; n[i].name = e.target.value; setSplits(n); }}
                placeholder="Nome" className="px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
              <input value={s.email} onChange={e => { const n = [...splits]; n[i].email = e.target.value; setSplits(n); }}
                placeholder="Email" className="px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
              <select value={s.role} onChange={e => { const n = [...splits]; n[i].role = e.target.value; setSplits(n); }}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground">
                <option>Produtor</option><option>Co-produtor</option><option>Afiliado</option><option>Parceiro</option>
              </select>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={s.percentage}
                  onChange={e => { const n = [...splits]; n[i].percentage = Number(e.target.value); setSplits(n); }}
                  className="w-20 px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
                <Percent className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
            {i > 0 && (
              <button onClick={() => setSplits(splits.filter((_, j) => j !== i))} className="p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
        <span className="text-xs text-muted-foreground">Total alocado</span>
        <span className={`text-sm font-bold ${totalPercent === 100 ? "text-emerald-400" : "text-destructive"}`}>
          {totalPercent}%
          {totalPercent !== 100 && <span className="text-xs font-normal ml-1">(deve ser 100%)</span>}
        </span>
      </div>

      <button disabled={totalPercent !== 100} onClick={() => {
        import("sonner").then(m => m.toast.success("Configuração de split salva!"));
      }}
        className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">
        Salvar configuração de Split
      </button>
    </div>
  );
}

// ── Antecipação de Recebíveis ──
function AntecipacaoTab({ saldoDisponivel, totalEscrow }: { saldoDisponivel: number; totalEscrow: number }) {
  const [amount, setAmount] = useState("");
  const taxaAntecipacao = 3.5; // 3.5% fee
  const maxAntecipavel = totalEscrow * 0.8; // max 80% of escrow
  const parsedAmount = Number(amount) || 0;
  const taxa = parsedAmount * (taxaAntecipacao / 100);
  const valorLiquido = parsedAmount - taxa;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Antecipação de Recebíveis</h3>
        <p className="text-xs text-muted-foreground">Receba antecipadamente os valores que estão em custódia (escrow).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Disponível para antecipação</p>
          <p className="text-xl font-display font-bold text-foreground mt-1">
            R$ {maxAntecipavel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted-foreground">80% do escrow total</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Taxa de antecipação</p>
          <p className="text-xl font-display font-bold text-primary mt-1">{taxaAntecipacao}%</p>
          <p className="text-[10px] text-muted-foreground">por operação</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Prazo de liberação</p>
          <p className="text-xl font-display font-bold text-foreground mt-1">Imediato</p>
          <p className="text-[10px] text-muted-foreground">Após aprovação</p>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Solicitar antecipação</h4>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Valor a antecipar (R$)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            max={maxAntecipavel} placeholder={`Máx: R$ ${maxAntecipavel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>

        {parsedAmount > 0 && (
          <div className="space-y-2 p-3 bg-secondary/30 rounded-lg border border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Valor solicitado</span>
              <span className="text-foreground">R$ {parsedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Taxa ({taxaAntecipacao}%)</span>
              <span className="text-destructive">- R$ {taxa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm">
              <span className="text-foreground font-medium">Valor líquido</span>
              <span className="text-primary font-bold">R$ {valorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {parsedAmount > maxAntecipavel && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Valor excede o máximo disponível para antecipação.
          </div>
        )}

        <button disabled={parsedAmount <= 0 || parsedAmount > maxAntecipavel}
          onClick={() => { import("sonner").then(m => m.toast.success("Solicitação de antecipação enviada! Processamento em até 15 minutos.")); setAmount(""); }}
          className="w-full py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">
          <Zap className="w-4 h-4 inline mr-1" /> Solicitar Antecipação
        </button>
      </div>

      <div className="glass-card p-4">
        <h4 className="text-xs font-semibold text-foreground mb-2">Histórico de antecipações</h4>
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma antecipação realizada ainda.</p>
        </div>
      </div>
    </div>
  );
}

export default Financeiro;
