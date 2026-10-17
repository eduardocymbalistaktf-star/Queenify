import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { ShoppingCart, Mail, RefreshCw, CheckCircle2, Clock, XCircle, Search, AlertTriangle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

const statusConfig: Record<string, { color: string; label: string; icon: typeof Clock }> = {
  pending: { color: "bg-amber-500/20 text-amber-400", label: "Pendente", icon: Clock },
  contacted: { color: "bg-blue-500/20 text-blue-400", label: "Contatado", icon: Mail },
  recovered: { color: "bg-emerald-500/20 text-emerald-400", label: "Recuperado", icon: CheckCircle2 },
  lost: { color: "bg-destructive/20 text-destructive", label: "Perdido", icon: XCircle },
};

const RecuperacaoVendas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: carts = [], isLoading, isError } = useQuery({
    queryKey: ["abandoned-carts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("abandoned_carts").select("*, products(name, price)").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const filtered = carts.filter((c) => {
    const matchSearch = (c.buyer_email || "").toLowerCase().includes(search.toLowerCase()) || (c.buyer_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.recovery_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: carts.length,
    pending: carts.filter((c) => c.recovery_status === "pending").length,
    recovered: carts.filter((c) => c.recovery_status === "recovered").length,
    totalValue: carts.filter((c) => c.recovery_status === "pending").reduce((acc, c) => acc + (c.cart_value || 0), 0),
    recoveredValue: carts.filter((c) => c.recovery_status === "recovered").reduce((acc, c) => acc + (c.cart_value || 0), 0),
    recoveryRate: carts.length > 0 ? Math.round((carts.filter((c) => c.recovery_status === "recovered").length / carts.length) * 100) : 0
  };

  const markAs = async (id: string, status: keyof typeof statusConfig, currentAttempts = 0) => {
    const updates: Database["public"]["Tables"]["abandoned_carts"]["Update"] = { recovery_status: status };
    if (status === "recovered") updates.recovered_at = new Date().toISOString();
    if (status === "contacted") {
      updates.last_attempt_at = new Date().toISOString();
      updates.recovery_attempts = currentAttempts + 1;
    }
    const { error } = await supabase.from("abandoned_carts").update(updates).eq("id", id).eq("user_id", user!.id);
    if (error) {
      toast.error("Não foi possível atualizar o carrinho. Tente novamente.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["abandoned-carts", user?.id] });
    toast.success(`Status atualizado para "${statusConfig[status]?.label}"`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Recuperação de Vendas</h1>
            <p className="text-sm text-muted-foreground">Acompanhe e recupere carrinhos abandonados.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-400/25 bg-amber-400/10">
            <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-xs font-medium text-amber-200">Acompanhamento manual</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Carrinhos Abandonados</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.total}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /><p className="text-xs text-muted-foreground">Pendentes</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.pending}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /><p className="text-xs text-muted-foreground">Recuperados</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.recovered}</p>
            <p className="text-[10px] text-success mt-0.5">{stats.recoveryRate}% taxa de recuperação</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-success" /><p className="text-xs text-muted-foreground">Valor Recuperado</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">R$ {stats.recoveredValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Recovery status */}
        <div className="glass-card p-4 mb-6 border-amber-400/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-300" /></div>
            <div className="flex-1">
              <h3 className="text-sm font-display font-bold text-foreground">Recuperação sem automação ativa</h3>
              <p className="text-xs text-muted-foreground">Esta tela não envia e-mails nem repete cobranças. Use os status para registrar contatos feitos fora da Queenify; a captura depende de integração de checkout configurada.</p>
            </div>
            <span className="px-3 py-1 rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-200 text-xs font-semibold">Pendente</span>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="glass-card p-3 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por email ou nome..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="contacted">Contatados</option>
            <option value="recovered">Recuperados</option>
            <option value="lost">Perdidos</option>
          </select>
        </div>

        {/* List */}
        {isError ? (
          <div className="glass-card p-12 text-center" role="alert">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-destructive">Não foi possível carregar os carrinhos. Confira a conexão e tente novamente.</p>
          </div>
        ) : isLoading ? (
          <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">Nenhum carrinho abandonado</h3>
            <p className="text-sm text-muted-foreground">Nenhum registro está disponível. Carrinhos só aparecerão aqui depois que uma integração de checkout ou webhook os gravar no Supabase.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((cart) => {
              const st = statusConfig[cart.recovery_status] || statusConfig.pending;
              const StatusIcon = st.icon;
              return (
                <div key={cart.id} className="glass-card p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <StatusIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{cart.buyer_name || cart.buyer_email}</p>
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${st.color}`}>{st.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{cart.buyer_email} {cart.buyer_phone && `• ${cart.buyer_phone}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cart.products?.name} • R$ {cart.cart_value?.toFixed(2)} • {new Date(cart.created_at).toLocaleDateString("pt-BR")}
                          {cart.recovery_attempts > 0 && ` • ${cart.recovery_attempts} tentativa(s)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cart.recovery_status === "pending" && (
                        <>
                          <button onClick={() => markAs(cart.id, "contacted", cart.recovery_attempts || 0)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30">
                            <Mail className="w-3 h-3 inline mr-1" />Registrar contato
                          </button>
                          <button onClick={() => markAs(cart.id, "lost")} className="px-3 py-1.5 bg-destructive/20 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/30">Marcar Perdido</button>
                        </>
                      )}
                      {cart.recovery_status === "contacted" && (
                        <>
                          <button onClick={() => markAs(cart.id, "recovered")} className="px-3 py-1.5 bg-success/20 text-success rounded-lg text-xs font-medium hover:bg-success/30">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />Recuperado
                          </button>
                          <button onClick={() => markAs(cart.id, "lost")} className="px-3 py-1.5 bg-destructive/20 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/30">Perdido</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecuperacaoVendas;
