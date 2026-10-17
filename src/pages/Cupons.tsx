import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { Tag, Plus, Trash2, Copy, ToggleLeft, ToggleRight, Search, Package, Calendar, Percent, DollarSign, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Cupons = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    code: "", discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 10, max_uses: "", min_purchase: 0,
    product_id: "", expires_at: "", starts_at: ""
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("*, products(name)").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-coupons", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user
  });

  const filtered = coupons.filter((c: any) => c.code.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error("Informe o código do cupom"); return; }
    if (form.discount_value <= 0) { toast.error("Informe um valor de desconto válido"); return; }

    const { error } = await supabase.from("coupons").insert({
      user_id: user!.id, code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type, discount_value: form.discount_value,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      min_purchase: form.min_purchase,
      product_id: form.product_id || null,
      starts_at: form.starts_at || new Date().toISOString(),
      expires_at: form.expires_at || null
    });

    if (error) {
      if (error.code === "23505") toast.error("Já existe um cupom com esse código");
      else toast.error("Erro ao criar cupom");
      return;
    }

    toast.success("Cupom criado com sucesso!");
    setShowCreate(false);
    setForm({ code: "", discount_type: "percentage", discount_value: 10, max_uses: "", min_purchase: 0, product_id: "", expires_at: "", starts_at: "" });
    queryClient.invalidateQueries({ queryKey: ["coupons"] });
  };

  const toggleCoupon = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ is_active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["coupons"] });
    toast.success(active ? "Cupom desativado" : "Cupom ativado");
  };

  const deleteCoupon = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["coupons"] });
    toast.success("Cupom excluído");
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const stats = {
    total: coupons.length,
    active: coupons.filter((c: any) => c.is_active).length,
    totalUses: coupons.reduce((acc: number, c: any) => acc + (c.current_uses || 0), 0)
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Cupons de Desconto</h1>
            <p className="text-sm text-muted-foreground">Crie e gerencie cupons promocionais para seus produtos.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
            <Plus className="w-4 h-4" /> Criar Cupom
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Total de Cupons</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.total}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><ToggleRight className="w-4 h-4 text-success" /><p className="text-xs text-muted-foreground">Cupons Ativos</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.active}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><Percent className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Total de Usos</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.totalUses}</p>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card p-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cupom por código..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
        </div>

        {/* Coupons List */}
        {isLoading ? (
          <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">Nenhum cupom encontrado</h3>
            <p className="text-sm text-muted-foreground">Crie seu primeiro cupom de desconto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((coupon: any) => {
              const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
              const maxedOut = coupon.max_uses && coupon.current_uses >= coupon.max_uses;
              return (
                <div key={coupon.id} className={`glass-card p-4 ${(!coupon.is_active || expired || maxedOut) ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-mono font-bold text-foreground">{coupon.code}</span>
                          <button onClick={() => copyCoupon(coupon.code)} className="p-1 hover:bg-secondary rounded"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          {!coupon.is_active && <span className="px-2 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full">Inativo</span>}
                          {expired && <span className="px-2 py-0.5 text-[10px] bg-destructive/20 text-destructive rounded-full">Expirado</span>}
                          {maxedOut && <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-full">Esgotado</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {coupon.discount_type === "percentage" ? `${coupon.discount_value}% de desconto` : `R$ ${coupon.discount_value.toFixed(2)} de desconto`}
                          {coupon.products?.name && ` • ${coupon.products.name}`}
                          {!coupon.product_id && " • Todos os produtos"}
                          {coupon.max_uses && ` • ${coupon.current_uses}/${coupon.max_uses} usos`}
                          {coupon.expires_at && ` • Expira: ${new Date(coupon.expires_at).toLocaleDateString("pt-BR")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleCoupon(coupon.id, coupon.is_active)} className="p-2 hover:bg-secondary rounded-lg">
                        {coupon.is_active ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                      </button>
                      <button onClick={() => deleteCoupon(coupon.id)} className="p-2 hover:bg-destructive/10 rounded-lg">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-foreground">Criar Cupom de Desconto</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-secondary rounded-lg"><span className="text-xl">&times;</span></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Código do Cupom *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Ex: DESCONTO20" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Tipo de Desconto</label>
                    <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
                      <option value="percentage">Percentual (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Valor do Desconto *</label>
                    <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Limite de Usos</label>
                    <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Ilimitado" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Compra Mínima (R$)</label>
                    <input type="number" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Produto (opcional)</label>
                  <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
                    <option value="">Todos os produtos</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Data Início</label>
                    <input type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Data Expiração</label>
                    <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                  </div>
                </div>
                <button onClick={handleCreate} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Criar Cupom</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Cupons;
