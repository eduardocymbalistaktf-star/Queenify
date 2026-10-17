import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/layouts/DashboardLayout";
import { RefreshCw, Search, ExternalLink, Shield, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAIL = "queenifyadm@gmail.com";

interface SaleRow {
  id: string;
  mp_payment_id: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  buyer_email: string;
  buyer_name: string | null;
  created_at: string;
  external_reference: string | null;
  payment_details: any;
  product_id: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  refunded: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  chargeback: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const formatPrice = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TransacoesMP = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rechecking, setRechecking] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("id, mp_payment_id, amount, status, payment_method, buyer_email, buyer_name, created_at, external_reference, payment_details, product_id")
      .not("mp_payment_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Erro ao carregar transações");
      console.error(error);
    } else {
      setSales((data || []) as SaleRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleRecheck = async (sale: SaleRow) => {
    if (!sale.mp_payment_id) return;
    setRechecking(sale.id);
    try {
      const { data, error } = await supabase.functions.invoke("mp-recheck-status", {
        body: { sale_id: sale.id, mp_payment_id: sale.mp_payment_id },
      });
      if (error || !(data as any)?.ok) {
        toast.error((data as any)?.error || error?.message || "Erro ao reconsultar");
      } else {
        toast.success(`Status atualizado: ${(data as any).status} (${(data as any).mp_status})`);
        await load();
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao reconsultar");
    } finally {
      setRechecking(null);
    }
  };

  const filtered = sales.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.mp_payment_id?.toLowerCase().includes(q) ||
        s.buyer_email.toLowerCase().includes(q) ||
        s.buyer_name?.toLowerCase().includes(q) ||
        s.external_reference?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalAmount = filtered.reduce((s, x) => s + Number(x.amount || 0), 0);
  const completedCount = filtered.filter(x => x.status === "completed").length;
  const pendingCount = filtered.filter(x => x.status === "pending").length;
  const envBadge = sales[0]?.payment_details?.mp_env || "test";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
              <ChevronLeft className="w-3 h-3" /> Voltar ao Admin
            </Link>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Transações Mercado Pago
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todas as vendas processadas via Mercado Pago — ambiente atual:{" "}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${envBadge === "live" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                {envBadge.toUpperCase()}
              </span>
            </p>
          </div>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Total transações</p>
            <p className="text-xl font-bold text-foreground">{filtered.length}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Aprovadas</p>
            <p className="text-xl font-bold text-green-400">{completedCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-xl font-bold text-amber-400">{pendingCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Volume total</p>
            <p className="text-xl font-bold text-primary">{formatPrice(totalAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por payment_id, email, nome ou ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
          >
            <option value="all">Todos os status</option>
            <option value="completed">Aprovadas</option>
            <option value="pending">Pendentes</option>
            <option value="failed">Falhadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="refunded">Estornadas</option>
            <option value="chargeback">Chargeback</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">MP Payment ID</th>
                  <th className="px-4 py-3 font-medium">Comprador</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhuma transação encontrada</td></tr>
                ) : (
                  filtered.map(sale => (
                    <tr key={sale.id} className="border-t border-border/50 hover:bg-secondary/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{sale.mp_payment_id}</td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{sale.buyer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{sale.buyer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground capitalize">{sale.payment_method || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatPrice(sale.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[sale.status] || "bg-gray-500/10 text-gray-400 border-gray-500/30"}`}>
                          {sale.status}
                        </span>
                        {sale.payment_details?.mp_status_detail && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {sale.payment_details.mp_status_detail}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleRecheck(sale)}
                          disabled={rechecking === sale.id || !sale.mp_payment_id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${rechecking === sale.id ? "animate-spin" : ""}`} />
                          Reconsultar
                        </button>
                        {sale.mp_payment_id && (
                          <a
                            href={`https://www.mercadopago.com.br/activities/detail/${sale.mp_payment_id}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" /> MP
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TransacoesMP;
