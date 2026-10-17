import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Package, TrendingUp, DollarSign, Percent, Layers, ToggleLeft, ToggleRight, Eye, ShoppingCart, CreditCard, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const flowTypeConfig: Record<string, { label: string; color: string; icon: typeof ArrowUp }> = {
  upsell: { label: "Upsell", color: "bg-emerald-500/20 text-emerald-400", icon: ArrowUp },
  downsell: { label: "Downsell", color: "bg-blue-500/20 text-blue-400", icon: ArrowDown },
  cross_sell: { label: "Cross-sell", color: "bg-purple-500/20 text-purple-400", icon: Layers },
};

const FunilVendas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ product_id: "", upsell_product_id: "", flow_type: "upsell", discount_percent: 0 });

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ["upsell-flows", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("upsell_flows").select("*, products!upsell_flows_product_id_fkey(name, price), upsell_product:products!upsell_flows_upsell_product_id_fkey(name, price)").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-funnel", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, price").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user
  });

  // Real funnel metrics from page_views and sales
  const { data: funnelMetrics } = useQuery({
    queryKey: ["funnel-metrics", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      
      const [pageViewsRes, salesRes, abandonedRes] = await Promise.all([
        supabase.from("page_views").select("id", { count: "exact" }).eq("owner_id", user!.id).gte("created_at", thirtyDaysAgo),
        supabase.from("sales").select("id, status", { count: "exact" }).eq("user_id", user!.id).gte("created_at", thirtyDaysAgo),
        supabase.from("abandoned_carts").select("id", { count: "exact" }).eq("user_id", user!.id).gte("created_at", thirtyDaysAgo),
      ]);

      const visitors = pageViewsRes.count || 0;
      const totalSales = salesRes.data?.length || 0;
      const completedSales = salesRes.data?.filter((s: any) => s.status === "completed").length || 0;
      const abandonedCarts = abandonedRes.count || 0;
      const checkoutVisits = totalSales + abandonedCarts;

      return { visitors, checkoutVisits, payments: totalSales, completedSales };
    },
    enabled: !!user
  });

  const metrics = funnelMetrics || { visitors: 0, checkoutVisits: 0, payments: 0, completedSales: 0 };
  const rate = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) : "0.0";

  const handleCreate = async () => {
    if (!form.product_id || !form.upsell_product_id) { toast.error("Selecione os dois produtos"); return; }
    if (form.product_id === form.upsell_product_id) { toast.error("Selecione produtos diferentes"); return; }
    const { error } = await supabase.from("upsell_flows").insert({
      user_id: user!.id, product_id: form.product_id, upsell_product_id: form.upsell_product_id,
      flow_type: form.flow_type, discount_percent: form.discount_percent
    });
    if (error) { toast.error("Erro ao criar fluxo"); return; }
    toast.success("Fluxo de venda criado!");
    setShowCreate(false);
    setForm({ product_id: "", upsell_product_id: "", flow_type: "upsell", discount_percent: 0 });
    queryClient.invalidateQueries({ queryKey: ["upsell-flows"] });
  };

  const toggleFlow = async (id: string, active: boolean) => {
    await supabase.from("upsell_flows").update({ is_active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["upsell-flows"] });
    toast.success(active ? "Fluxo desativado" : "Fluxo ativado");
  };

  const deleteFlow = async (id: string) => {
    await supabase.from("upsell_flows").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["upsell-flows"] });
    toast.success("Fluxo excluído");
  };

  const funnelSteps = [
    { label: "Visitantes", value: metrics.visitors, icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Checkout", value: metrics.checkoutVisits, icon: ShoppingCart, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Pagamento", value: metrics.payments, icon: CreditCard, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Venda Concluída", value: metrics.completedSales, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Funil de Vendas</h1>
            <p className="text-sm text-muted-foreground">Configure upsells, downsells e acompanhe a conversão do funil.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
            <Plus className="w-4 h-4" /> Novo Fluxo
          </button>
        </div>

        {/* Funnel visualization with real data */}
        <div className="glass-card p-5 mb-6">
          <h3 className="text-sm font-display font-bold text-foreground mb-4">📊 Métricas do Funil (últimos 30 dias)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {funnelSteps.map((step, i) => (
              <div key={step.label} className="text-center">
                <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center mx-auto mb-2`}>
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <p className="text-lg font-display font-bold text-foreground">{step.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{step.label}</p>
                {i > 0 && (
                  <p className="text-[10px] text-primary font-medium mt-1">
                    ↓ {rate(step.value, funnelSteps[i - 1].value)}% taxa de passagem
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Taxa de conversão total: <span className="text-foreground font-semibold">{rate(metrics.completedSales, metrics.visitors)}%</span>
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { title: "Upsell", desc: "Ofereça um produto superior após a compra", icon: ArrowUp, color: "text-emerald-400" },
            { title: "Downsell", desc: "Ofereça alternativa mais barata se recusar", icon: ArrowDown, color: "text-blue-400" },
            { title: "Cross-sell", desc: "Sugira produtos complementares", icon: Layers, color: "text-purple-400" },
          ].map(item => (
            <div key={item.title} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1"><item.icon className={`w-4 h-4 ${item.color}`} /><p className="text-sm font-medium text-foreground">{item.title}</p></div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Flows List */}
        {isLoading ? (
          <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Carregando...</p></div>
        ) : flows.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">Nenhum fluxo configurado</h3>
            <p className="text-sm text-muted-foreground mb-4">Crie fluxos de upsell/downsell para aumentar suas vendas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flows.map((flow: any) => {
              const ft = flowTypeConfig[flow.flow_type] || flowTypeConfig.upsell;
              const FlowIcon = ft.icon;
              return (
                <div key={flow.id} className={`glass-card p-4 ${!flow.is_active ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-2 bg-secondary rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Produto</p>
                          <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{flow.products?.name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">R$ {flow.products?.price?.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <FlowIcon className={`w-5 h-5 ${ft.color.split(" ")[1]}`} />
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${ft.color}`}>{ft.label}</span>
                        </div>
                        <div className="px-3 py-2 bg-secondary rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Oferta</p>
                          <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{flow.upsell_product?.name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            R$ {flow.upsell_product?.price?.toFixed(2)}
                            {flow.discount_percent > 0 && <span className="text-success ml-1">-{flow.discount_percent}%</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFlow(flow.id, flow.is_active)} className="p-2 hover:bg-secondary rounded-lg">
                        {flow.is_active ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                      </button>
                      <button onClick={() => deleteFlow(flow.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-foreground">Novo Fluxo de Venda</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-secondary rounded-lg"><span className="text-xl">&times;</span></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="text-xs font-medium text-foreground mb-1 block">Tipo de Fluxo</label><select value={form.flow_type} onChange={e => setForm(f => ({ ...f, flow_type: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground"><option value="upsell">Upsell</option><option value="downsell">Downsell</option><option value="cross_sell">Cross-sell</option></select></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Produto Principal *</label><select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground"><option value="">Selecione...</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}</select></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Produto da Oferta *</label><select value={form.upsell_product_id} onChange={e => setForm(f => ({ ...f, upsell_product_id: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground"><option value="">Selecione...</option>{products.filter((p: any) => p.id !== form.product_id).map((p: any) => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}</select></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Desconto na oferta (%)</label><input type="number" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: parseFloat(e.target.value) || 0 }))} min="0" max="100" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" /></div>
                <button onClick={handleCreate} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Criar Fluxo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FunilVendas;
