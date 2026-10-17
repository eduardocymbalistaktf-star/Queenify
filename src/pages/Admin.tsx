import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Shield, Users, Package, DollarSign, AlertTriangle, BarChart3, Search, Ban, Check, Eye, RefreshCw, UserCog, Plus, Trash2, Activity, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useHasRole } from "@/hooks/useUserRoles";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

type AppRole = Database["public"]["Enums"]["app_role"];
const ALL_ROLES: AppRole[] = ["admin", "moderador", "produtor", "afiliado"];

type AdminTab = "overview" | "users" | "products" | "finance" | "chargebacks" | "reports" | "roles" | "analytics" | "reviews";

const Admin = () => {
  const { user } = useAuth();
  const { hasRole: isAdmin, isLoading: roleLoading } = useHasRole("admin");
  const [tab, setTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [chargebacks, setChargebacks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalSales: 0, totalRevenue: 0, pendingProducts: 0, activeChargebacks: 0 });
  const [analyticsPeriod, setAnalyticsPeriod] = useState<7 | 30 | 90>(30);

  // Role management state
  const [allUserRoles, setAllUserRoles] = useState<Record<string, AppRole[]>>({});
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [addingRole, setAddingRole] = useState<{ userId: string; role: AppRole } | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && tab === "roles") loadAuditLog();
  }, [isAdmin, tab]);

  useEffect(() => {
    if (isAdmin && tab === "reviews") loadPendingReviews();
  }, [isAdmin, tab]);

  const loadPendingReviews = async () => {
    setReviewsLoading(true);
    const { data, error } = await supabase.from("product_reviews").select("*").eq("is_approved", false).order("created_at", { ascending: true });
    if (error) toast.error("Não foi possível carregar as avaliações pendentes.");
    setPendingReviews(data || []);
    setReviewsLoading(false);
  };

  const moderateReview = async (reviewId: string, approve: boolean) => {
    if (!approve && !window.confirm("Excluir esta avaliação pendente?")) return;
    if (approve) {
      const { data, error } = await supabase.from("product_reviews").update({ is_approved: true })
        .eq("id", reviewId).eq("is_approved", false).select("id").maybeSingle();
      if (error || !data) {
        toast.error("Não foi possível atualizar a avaliação. Confira o acesso de moderador.");
        return;
      }
    } else {
      const { count, error } = await supabase.from("product_reviews").delete({ count: "exact" })
        .eq("id", reviewId).eq("is_approved", false);
      if (error || !count) {
        toast.error("Não foi possível atualizar a avaliação. Confira o acesso de moderador.");
        return;
      }
    }
    setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
    toast.success(approve ? "Avaliação publicada." : "Avaliação recusada.");
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesRes, productsRes, salesRes, chargebacksRes, reportsRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("products").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("sales").select("*, products(name)").order("sold_at", { ascending: false }).limit(200),
        supabase.from("chargebacks").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("user_roles").select("*"),
      ]);

      setUsers(profilesRes.data || []);
      setProducts(productsRes.data || []);
      setSales(salesRes.data || []);
      setChargebacks(chargebacksRes.data || []);
      setReports(reportsRes.data || []);

      // Build role map
      const roleMap: Record<string, AppRole[]> = {};
      (rolesRes.data || []).forEach((r: any) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });
      setAllUserRoles(roleMap);

      const totalRevenue = (salesRes.data || []).reduce((s: number, sale: any) => s + Number(sale.amount || 0), 0);
      const pendingProducts = (productsRes.data || []).filter((p: any) => Number(p.price) > 900 && p.is_active).length;

      setStats({
        totalUsers: profilesRes.data?.length || 0,
        totalProducts: productsRes.data?.length || 0,
        totalSales: salesRes.data?.length || 0,
        totalRevenue,
        pendingProducts,
        activeChargebacks: (chargebacksRes.data || []).filter((c: any) => c.status === 'pending').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    setAuditLoading(true);
    const { data } = await supabase
      .from("role_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setAuditLog(data || []);
    setAuditLoading(false);
  };

  const logAudit = async (userId: string, role: string, action: string) => {
    await supabase.from("role_audit_log").insert({
      user_id: userId,
      role,
      action,
      performed_by: user!.id,
    });

    // Send in-app notification to the affected user
    const targetUser = users.find(u => u.user_id === userId);
    const actionLabel = action === "atribuir" ? "atribuído" : "removido";
    await supabase.from("notifications").insert({
      user_id: userId,
      title: `Cargo ${actionLabel}`,
      message: `O cargo "${role}" foi ${actionLabel} ${action === "atribuir" ? "a" : "de"} sua conta por um administrador.`,
      type: "role_change",
    });
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
        granted_by: user!.id,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("Usuário já possui este cargo");
        } else {
          throw error;
        }
        return;
      }
      await logAudit(userId, role, "atribuir");
      toast.success(`Cargo "${role}" atribuído com sucesso`);
      setAllUserRoles(prev => ({
        ...prev,
        [userId]: [...(prev[userId] || []), role],
      }));
      loadAuditLog();
    } catch (err: any) {
      toast.error(err.message);
    }
    setAddingRole(null);
  };

  const removeRole = async (userId: string, role: AppRole) => {
    if (role === "produtor") {
      toast.error("O cargo 'produtor' é padrão e não pode ser removido");
      return;
    }
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
      await logAudit(userId, role, "remover");
      toast.success(`Cargo "${role}" removido`);
      setAllUserRoles(prev => ({
        ...prev,
        [userId]: (prev[userId] || []).filter(r => r !== role),
      }));
      loadAuditLog();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Analytics data
  const analyticsCutoff = useMemo(() => new Date(Date.now() - analyticsPeriod * 86400000), [analyticsPeriod]);
  const filteredAnalyticsSales = useMemo(() => sales.filter(s => new Date(s.sold_at) >= analyticsCutoff), [sales, analyticsCutoff]);

  const salesByDay = useMemo(() => {
    const numDays = Math.min(analyticsPeriod, 30);
    return Array.from({ length: numDays }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - numDays + 1 + i);
      const dayStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const daySales = filteredAnalyticsSales.filter(s => {
        const sd = new Date(s.sold_at);
        return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      return { dia: dayStr, vendas: daySales.length, receita: daySales.reduce((s, v) => s + Number(v.amount || 0), 0) };
    });
  }, [filteredAnalyticsSales, analyticsPeriod]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; vendas: number; receita: number }> = {};
    filteredAnalyticsSales.forEach((s: any) => {
      const name = (s.products as any)?.name || "Desconhecido";
      if (!counts[s.product_id]) counts[s.product_id] = { name, vendas: 0, receita: 0 };
      counts[s.product_id].vendas += 1;
      counts[s.product_id].receita += Number(s.amount || 0);
    });
    return Object.values(counts).sort((a, b) => b.receita - a.receita).slice(0, 5);
  }, [filteredAnalyticsSales]);

  const activeUsers = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - analyticsPeriod * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const activePeriod = new Set(sales.filter(s => new Date(s.sold_at) >= cutoff).map(s => s.user_id)).size;
    const active7 = new Set(sales.filter(s => new Date(s.sold_at) >= sevenDaysAgo).map(s => s.user_id)).size;
    return { activePeriod, active7 };
  }, [sales, analyticsPeriod]);

  const periodRevenue = useMemo(() => filteredAnalyticsSales.reduce((s, v) => s + Number(v.amount || 0), 0), [filteredAnalyticsSales]);

  const AnalyticsTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
            {p.name}: {p.name === "receita" ? `R$ ${p.value.toLocaleString("pt-BR")}` : p.value}
          </p>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: "overview" as const, label: "Visão Geral", icon: BarChart3 },
    { id: "analytics" as const, label: "Analytics", icon: Activity },
    { id: "users" as const, label: "Usuários", icon: Users },
    { id: "roles" as const, label: "Cargos", icon: UserCog },
    { id: "products" as const, label: "Produtos", icon: Package },
    { id: "finance" as const, label: "Financeiro", icon: DollarSign },
    { id: "chargebacks" as const, label: "Chargebacks", icon: AlertTriangle },
    { id: "reports" as const, label: "Denúncias", icon: Shield },
    { id: "reviews" as const, label: "Avaliações", icon: MessageSquare },
  ];

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const roleColor = (role: AppRole) => {
    switch (role) {
      case "admin": return "bg-destructive/20 text-destructive";
      case "moderador": return "bg-blue-500/10 text-blue-700";
      case "produtor": return "bg-emerald-500/10 text-emerald-700";
      case "afiliado": return "bg-amber-500/10 text-amber-800";
    }
  };

  if (roleLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Verificando acesso administrativo" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground">Controle total da plataforma Queenify</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === "reviews" && (
            <section className="space-y-3" aria-labelledby="pending-reviews-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="pending-reviews-title" className="text-lg font-semibold text-foreground">Moderação de avaliações</h2>
                  <p className="mt-1 text-sm text-muted-foreground">As avaliações só aparecem no Marketplace depois da aprovação.</p>
                </div>
                <button onClick={loadPendingReviews} className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary sm:self-auto">
                  <RefreshCw className="h-3.5 w-3.5" /> Atualizar fila
                </button>
              </div>
              {reviewsLoading ? (
                <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
              ) : pendingReviews.length === 0 ? (
                <div className="glass-card py-12 text-center">
                  <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium text-foreground">Nenhuma avaliação pendente</p>
                  <p className="mt-1 text-sm text-muted-foreground">A fila está em dia.</p>
                </div>
              ) : pendingReviews.map(review => (
                <article key={review.id} className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{review.reviewer_name || "Usuário"}</h3>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{review.rating}/5 estrelas</span>
                      <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <p className="mt-1 break-all text-[11px] text-muted-foreground">Produto {review.product_id}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{review.comment || "Sem comentário escrito."}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => moderateReview(review.id, false)} className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5">
                      <Ban className="h-3.5 w-3.5" /> Recusar
                    </button>
                    <button onClick={() => moderateReview(review.id, true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                      <Check className="h-3.5 w-3.5" /> Publicar
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}

          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: "Total Usuários", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
                  { label: "Total Produtos", value: stats.totalProducts, icon: Package, color: "text-emerald-400" },
                  { label: "Total Vendas", value: stats.totalSales, icon: DollarSign, color: "text-primary" },
                  { label: "Receita Total", value: formatCurrency(stats.totalRevenue), icon: BarChart3, color: "text-green-400" },
                  { label: "Produtos p/ Análise (>R$900)", value: stats.pendingProducts, icon: Eye, color: "text-amber-400" },
                  { label: "Chargebacks Pendentes", value: stats.activeChargebacks, icon: AlertTriangle, color: "text-destructive" },
                ].map((s, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={loadData} className="flex items-center gap-2 text-xs text-primary hover:text-primary/80">
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar dados
                </button>
                <a href={`${import.meta.env.BASE_URL}dashboard/audit`} className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 ml-auto">
                  <Shield className="w-3.5 h-3.5" /> Auditoria de segurança →
                </a>
                <a href={`${import.meta.env.BASE_URL}dashboard/audit/headers`} className="flex items-center gap-2 text-xs text-primary hover:text-primary/80">
                  <Shield className="w-3.5 h-3.5" /> Verificar headers →
                </a>
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome..."
                  className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground"
                />
              </div>
              {users.filter(u => !searchQuery || u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                <div key={u.id} className="glass-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-gold opacity-40" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.display_name || "Sem nome"}</p>
                      <div className="flex gap-1 mt-0.5">
                        {(allUserRoles[u.user_id] || []).map(r => (
                          <span key={r} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${roleColor(r)}`}>{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-secondary/80">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive hover:bg-destructive/20">
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "roles" && (
            <div className="space-y-4">
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-1">Gerenciar Cargos</h3>
                <p className="text-xs text-muted-foreground mb-4">Atribua ou remova cargos dos usuários da plataforma.</p>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={roleSearchQuery}
                    onChange={e => setRoleSearchQuery(e.target.value)}
                    placeholder="Buscar usuário por nome..."
                    className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground"
                  />
                </div>

                <div className="space-y-3">
                  {users
                    .filter(u => !roleSearchQuery || u.display_name?.toLowerCase().includes(roleSearchQuery.toLowerCase()))
                    .map(u => {
                      const userRoles = allUserRoles[u.user_id] || [];
                      const availableRoles = ALL_ROLES.filter(r => !userRoles.includes(r));
                      const isAdding = addingRole?.userId === u.user_id;

                      return (
                        <div key={u.id} className="bg-secondary/50 border border-border rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-gold opacity-40" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{u.display_name || "Sem nome"}</p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{u.user_id}</p>
                              </div>
                            </div>
                            {availableRoles.length > 0 && (
                              <button
                                onClick={() => setAddingRole(isAdding ? null : { userId: u.user_id, role: availableRoles[0] })}
                                className="p-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary hover:bg-primary/20 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {userRoles.map(role => (
                              <div key={role} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium ${roleColor(role)}`}>
                                {role}
                                {role !== "produtor" && (
                                  <button
                                    onClick={() => removeRole(u.user_id, role)}
                                    className="ml-0.5 hover:opacity-70"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {userRoles.length === 0 && (
                              <span className="text-[10px] text-muted-foreground italic">Sem cargos</span>
                            )}
                          </div>

                          {isAdding && (
                            <div className="mt-2 flex items-center gap-2 bg-background/50 rounded-lg p-2 border border-border">
                              <select
                                value={addingRole.role}
                                onChange={e => setAddingRole({ ...addingRole, role: e.target.value as AppRole })}
                                className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
                              >
                                {availableRoles.map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => assignRole(u.user_id, addingRole.role)}
                                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
                              >
                                Atribuir
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Audit Log */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-1">Log de Auditoria</h3>
                <p className="text-xs text-muted-foreground mb-4">Histórico de todas as alterações de cargos.</p>
                {auditLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : auditLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhuma alteração registrada ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {auditLog.map(log => {
                      const targetUser = users.find(u => u.user_id === log.user_id);
                      const performer = users.find(u => u.user_id === log.performed_by);
                      return (
                        <div key={log.id} className="flex items-start gap-3 bg-secondary/50 border border-border rounded-lg p-2.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${log.action === "atribuir" ? "bg-emerald-500/20" : "bg-destructive/20"}`}>
                            {log.action === "atribuir" ? <Plus className="w-3 h-3 text-emerald-400" /> : <Trash2 className="w-3 h-3 text-destructive" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground">
                              <span className="font-medium">{performer?.display_name || log.performed_by.slice(0, 8)}</span>
                              {" "}{log.action === "atribuir" ? "atribuiu" : "removeu"} o cargo{" "}
                              <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${roleColor(log.role as AppRole)}`}>{log.role}</span>
                              {" "}de{" "}
                              <span className="font-medium">{targetUser?.display_name || log.user_id.slice(0, 8)}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(log.created_at).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "analytics" && (
            <div className="space-y-4">
              {/* Period Filter */}
              <div className="flex gap-2">
                {([7, 30, 90] as const).map(p => (
                  <button key={p} onClick={() => setAnalyticsPeriod(p)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${analyticsPeriod === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                  >Últimos {p}d</button>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground">Usuários Ativos ({analyticsPeriod}d)</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{activeUsers.activePeriod}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground">Vendas ({analyticsPeriod}d)</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{filteredAnalyticsSales.length}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground">Receita ({analyticsPeriod}d)</p>
                  <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(periodRevenue)}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{filteredAnalyticsSales.length > 0 ? formatCurrency(periodRevenue / filteredAnalyticsSales.length) : "R$ 0"}</p>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-display font-semibold text-foreground mb-1">Vendas por Dia</h3>
                <p className="text-xs text-muted-foreground mb-4">Últimos {Math.min(analyticsPeriod, 30)} dias</p>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={salesByDay}>
                    <defs>
                      <linearGradient id="adminVendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="adminRecGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Area type="monotone" dataKey="vendas" name="vendas" stroke="hsl(142, 71%, 45%)" fill="url(#adminVendGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="receita" name="receita" stroke="hsl(43, 96%, 56%)" fill="url(#adminRecGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-display font-semibold text-foreground mb-1">Produtos Mais Vendidos</h3>
                <p className="text-xs text-muted-foreground mb-4">Ranking por receita total</p>
                {topProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma venda registrada</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v.toLocaleString("pt-BR")}`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip content={<AnalyticsTooltip />} />
                        <Bar dataKey="receita" name="receita" fill="hsl(43, 96%, 56%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {topProducts.map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                            <span className="text-sm text-foreground">{p.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-foreground">{formatCurrency(p.receita)}</p>
                            <p className="text-[10px] text-muted-foreground">{p.vendas} vendas</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-display font-semibold text-foreground mb-1">Distribuição por Cargo</h3>
                <p className="text-xs text-muted-foreground mb-4">Quantidade de usuários por cargo</p>
                <div className="grid grid-cols-2 gap-3">
                  {ALL_ROLES.map(role => {
                    const count = Object.values(allUserRoles).filter(roles => roles.includes(role)).length;
                    return (
                      <div key={role} className="bg-secondary/50 border border-border rounded-xl p-3 flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor(role)}`}>{role}</span>
                        <span className="text-lg font-bold text-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "products" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Produtos acima de R$900 precisam de aprovação manual.</p>
              {products.map(p => (
                <div key={p.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(p.price))} · {p.total_sales || 0} vendas
                      {Number(p.price) > 900 && <span className="ml-2 text-amber-400 font-medium">⚠️ Requer análise</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {Number(p.price) > 900 && (
                      <button className="px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg text-xs text-success hover:bg-success/20">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button className="px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive hover:bg-destructive/20">
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "finance" && (
            <div className="space-y-3">
              <div className="glass-card p-4">
                <p className="text-sm font-medium text-foreground mb-2">Vendas Recentes</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sales.slice(0, 50).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-xs text-foreground">{s.buyer_name || s.buyer_email}</p>
                        <p className="text-[10px] text-muted-foreground">{(s.products as any)?.name} · {s.payment_method}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-foreground">{formatCurrency(Number(s.amount))}</p>
                        <span className={`text-[10px] ${s.status === "completed" ? "text-success" : "text-amber-400"}`}>{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "chargebacks" && (
            <div className="space-y-3">
              <div className="glass-card p-4">
                <p className="text-sm font-medium text-foreground mb-1">Sistema de Chargebacks</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Quando um chargeback é solicitado: se o produtor tem saldo, é descontado. Se não, o saldo fica negativo.
                  Após 4 meses com saldo negativo sem pagamento, o nome vai ao Serasa.
                </p>
                {chargebacks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhum chargeback registrado</p>
                ) : (
                  chargebacks.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50">
                      <div>
                        <p className="text-xs text-foreground">{formatCurrency(Number(c.amount))}</p>
                        <p className="text-[10px] text-muted-foreground">{c.reason || "Sem motivo"}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        c.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                        c.status === "resolved" ? "bg-success/20 text-success" :
                        "bg-destructive/20 text-destructive"
                      }`}>{c.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma denúncia</p>
              ) : (
                reports.map(r => (
                  <div key={r.id} className="glass-card p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.motivo}</p>
                        <p className="text-xs text-muted-foreground">{r.tipo} · {r.descricao?.slice(0, 60)}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        r.status === "pendente" ? "bg-amber-500/20 text-amber-400" : "bg-success/20 text-success"
                      }`}>{r.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default Admin;
