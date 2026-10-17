import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { CheckCircle, ShoppingCart, Users, Wallet, Settings, Bell, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const tabs = [
  { label: "Todas", icon: Bell },
  { label: "Vendas", icon: ShoppingCart },
  { label: "Afiliados", icon: Users },
  { label: "Financeiro", icon: Wallet },
  { label: "Sistema", icon: Settings },
];

const typeToCategory: Record<string, string> = {
  sale: "Vendas",
  affiliate: "Afiliados",
  financial: "Financeiro",
  warning: "Sistema",
  info: "Sistema",
  system: "Sistema",
  retention: "Sistema",
};

const typeToIcon: Record<string, any> = {
  sale: ShoppingCart,
  affiliate: Users,
  financial: Wallet,
  warning: AlertTriangle,
  info: Bell,
  system: Settings,
  retention: RefreshCw,
};

const typeToColors: Record<string, { iconColor: string; iconBg: string }> = {
  sale: { iconColor: "text-success", iconBg: "bg-success/10" },
  affiliate: { iconColor: "text-success", iconBg: "bg-success/10" },
  financial: { iconColor: "text-primary", iconBg: "bg-primary/10" },
  warning: { iconColor: "text-destructive", iconBg: "bg-destructive/10" },
  info: { iconColor: "text-muted-foreground", iconBg: "bg-muted" },
  system: { iconColor: "text-muted-foreground", iconBg: "bg-muted" },
  retention: { iconColor: "text-destructive", iconBg: "bg-destructive/10" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  return `Há ${days} dias`;
}

const Avisos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications-page", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const unreadCounts = notifications.reduce((acc: Record<string, number>, n: any) => {
    if (!n.is_read) {
      const cat = typeToCategory[n.type] || "Sistema";
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const filtered = activeTab === "Todas"
    ? notifications
    : notifications.filter((n: any) => (typeToCategory[n.type] || "Sistema") === activeTab);

  const selected = notifications.find((n: any) => n.id === selectedId);

  const markAllRead = async () => {
    const unread = notifications.filter((n: any) => !n.is_read);
    if (!unread.length) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user!.id)
      .eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
    queryClient.invalidateQueries({ queryKey: ["retention-alert-count"] });
    toast.success("Todas as notificações foram marcadas como lidas.");
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
    queryClient.invalidateQueries({ queryKey: ["retention-alert-count"] });
  };

  const showSystemBanner = activeTab === "Sistema" || activeTab === "Todas";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Avisos</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Fique por dentro de tudo que acontece na sua conta.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => {
            const count = t.label === "Todas"
              ? notifications.filter((n: any) => !n.is_read).length
              : unreadCounts[t.label] || 0;
            return (
              <button
                key={t.label}
                onClick={() => setActiveTab(t.label)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  activeTab === t.label ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    activeTab === t.label ? "bg-primary-foreground/20" : "bg-destructive text-destructive-foreground"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={markAllRead} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <CheckCircle className="w-3.5 h-3.5" /> Marcar todas como lidas
        </button>
      </div>

      {/* System banner - always on top when viewing Sistema or Todas */}
      {showSystemBanner && (
        <div className="mb-4 p-4 rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-500">Aviso Importante</p>
            <p className="text-xs text-yellow-400/80 mt-0.5">
              Todas as atualizações, manutenções e avisos oficiais sobre a plataforma Queenify serão enviados exclusivamente por aqui. 
              Fique atento a esta seção para não perder nenhuma informação importante.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n: any) => {
            const Icon = typeToIcon[n.type] || Bell;
            const colors = typeToColors[n.type] || typeToColors.info;
            return (
              <div
                key={n.id}
                className={`glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors ${!n.is_read ? "border-l-2 border-l-primary" : ""}`}
                onClick={() => { setSelectedId(n.id); if (!n.is_read) markAsRead(n.id); }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center ${colors.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{n.message || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(n.created_at)}</span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Nenhum aviso</p>
              <p className="text-sm text-muted-foreground mt-1">Suas notificações aparecerão aqui.</p>
            </div>
          )}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
          <SheetHeader>
            <SheetTitle className="font-display">Detalhes do Aviso</SheetTitle>
          </SheetHeader>
          {selected && (() => {
            const Icon = typeToIcon[selected.type] || Bell;
            const colors = typeToColors[selected.type] || typeToColors.info;
            const category = typeToCategory[selected.type] || "Sistema";
            return (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${colors.iconBg} flex items-center justify-center ${colors.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selected.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(selected.created_at)}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{category}</span>
                </div>
                {selected.message && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Detalhes</p>
                    <p className="text-sm text-foreground leading-relaxed">{selected.message}</p>
                  </div>
                )}
                {selected.related_entity_type && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Referência</p>
                    <p className="text-sm text-foreground">{selected.related_entity_type}{selected.related_entity_id ? ` #${selected.related_entity_id.slice(0, 8)}` : ""}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Avisos;
