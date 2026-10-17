import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Code,
  Copy,
  Eye,
  Globe,
  Mail,
  RefreshCw,
  Shield,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type IntegrationTab = "recovery" | "tracking" | "api";

const Automacoes = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<IntegrationTab>("recovery");

  const { data: carts = [], isLoading: cartsLoading, isError: cartsError } = useQuery({
    queryKey: ["smartpay-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("id, recovery_status, cart_value, recovery_attempts")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: userPixel, isError: pixelError } = useQuery({
    queryKey: ["user-pixel", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_pixels")
        .select("pixel_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.pixel_id?.trim() || null;
    },
    enabled: !!user,
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: pageViews = [], isError: pageViewsError } = useQuery({
    queryKey: ["pixel-stats", user?.id, thirtyDaysAgo.slice(0, 10)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_views")
        .select("visitor_id")
        .eq("owner_id", user!.id)
        .gte("created_at", thirtyDaysAgo);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: sales30d = [], isError: salesError } = useQuery({
    queryKey: ["pixel-conversions", user?.id, thirtyDaysAgo.slice(0, 10)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id")
        .eq("user_id", user!.id)
        .gte("sold_at", thirtyDaysAgo);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const recoveredCarts = carts.filter((cart) => cart.recovery_status === "recovered");
  const recoveryRate = carts.length > 0 ? Math.round((recoveredCarts.length / carts.length) * 100) : 0;
  const recoveredValue = recoveredCarts.reduce((sum, cart) => sum + Number(cart.cart_value || 0), 0);
  const visitorCount = new Set(pageViews.map((view) => view.visitor_id).filter(Boolean)).size;

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error("Não foi possível copiar. Verifique a permissão da área de transferência.");
    }
  };

  const tabs = [
    { id: "recovery" as const, label: "Recuperação", icon: RefreshCw },
    { id: "tracking" as const, label: "Métricas", icon: Eye },
    { id: "api" as const, label: "API e webhooks", icon: Code },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Painel de integrações</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Automações e integrações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Veja o que já está conectado e o que ainda precisa de configuração.</p>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-secondary/70 p-1" role="tablist" aria-label="Integrações">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {tab === "recovery" && (
          <section className="space-y-4" role="tabpanel">
            <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-display font-bold text-foreground">Acompanhamento de carrinhos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os registros podem ser consultados e atualizados manualmente. A Queenify ainda não envia cobranças ou mensagens de recuperação automaticamente.
                </p>
              </div>
              <span className="w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">Operação manual</span>
            </div>

            {cartsError ? (
              <div className="glass-card flex items-start gap-3 p-4 text-sm text-destructive" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Não foi possível carregar os carrinhos. Confira sua conexão e tente novamente.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard label="Registros" value={cartsLoading ? "…" : carts.length.toLocaleString("pt-BR")} detail="carrinhos salvos" />
                <MetricCard label="Marcados como recuperados" value={cartsLoading ? "…" : `${recoveredCarts.length} (${recoveryRate}%)`} detail="status informado manualmente" />
                <MetricCard label="Valor registrado" value={cartsLoading ? "…" : `R$ ${recoveredValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} detail="soma dos registros recuperados" />
              </div>
            )}

            <div className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Registrar contatos e status</h3>
                <p className="mt-1 text-xs text-muted-foreground">A tela de recuperação permite marcar cada carrinho como contatado, recuperado ou perdido.</p>
              </div>
              <a href={`${import.meta.env.BASE_URL}recuperacao-vendas`} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary">Abrir carrinhos</a>
            </div>
          </section>
        )}

        {tab === "tracking" && (
          <section className="space-y-4" role="tabpanel">
            <div className="glass-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Eye className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h2 className="text-lg font-display font-bold text-foreground">Métricas registradas na Queenify</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Estes números vêm das visualizações e vendas já gravadas no Supabase nos últimos 30 dias.</p>
                </div>
              </div>

              {userPixel && (
                <div className="mt-5 rounded-xl border border-border bg-secondary/60 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">ID cadastrado no painel</p>
                    <button type="button" onClick={() => void copyToClipboard(userPixel, "ID")} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Copy className="h-3 w-3" /> Copiar ID
                    </button>
                  </div>
                  <code className="block break-all rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono text-foreground">{userPixel}</code>
                </div>
              )}

              {!userPixel && !pixelError && <p className="mt-5 text-sm text-muted-foreground">Nenhum ID de pixel foi cadastrado.</p>}
              {pixelError && <p className="mt-5 text-sm text-destructive" role="alert">Não foi possível consultar o ID cadastrado.</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard label="Visualizações" value={pageViewsError ? "—" : pageViews.length.toLocaleString("pt-BR")} detail="registros internos em 30 dias" icon={<BarChart3 className="h-4 w-4 text-primary" />} />
              <MetricCard label="Visitantes identificados" value={pageViewsError ? "—" : visitorCount.toLocaleString("pt-BR")} detail="IDs únicos nos registros em 30 dias" icon={<Eye className="h-4 w-4 text-primary" />} />
              <MetricCard label="Vendas registradas" value={salesError ? "—" : sales30d.length.toLocaleString("pt-BR")} detail="registros em 30 dias" icon={<CheckCircle2 className="h-4 w-4 text-primary" />} />
            </div>

            <div className="glass-card flex items-start gap-3 border-amber-400/20 p-4 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p>O script de rastreamento externo ainda não está publicado. O ID cadastrado não representa um pixel externo ativo, então não instale códigos antigos que apontem para <code className="text-foreground">pixel.queenify.com</code>.</p>
            </div>
          </section>
        )}

        {tab === "api" && (
          <section className="space-y-4" role="tabpanel">
            <div className="glass-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Globe className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground">API pública ainda indisponível</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Não existe uma API pública ativa para os endpoints exibidos anteriormente. Nenhuma chave de API foi criada. A chave demonstrativa foi removida para evitar que parecesse uma credencial real.</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Não compartilhe chaves de serviço do Supabase no navegador.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Uma API pública precisa de autenticação própria, permissões por usuário, limites de requisição e validação no servidor antes de gerar credenciais.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Webhook className="h-5 w-5" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Webhooks</h3>
                <p className="mt-1 text-xs text-muted-foreground">A tela de webhooks é o caminho disponível para configurar integrações de saída.</p>
              </div>
              <a href={`${import.meta.env.BASE_URL}webhooks`} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary">Abrir webhooks</a>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon?: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1 text-xl font-display font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}

export default Automacoes;
