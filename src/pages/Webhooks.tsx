import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { Webhook, Plus, Trash2, Copy, ToggleLeft, ToggleRight, Search, Activity, Zap, Shield, Clock, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const availableEvents = [
  { value: "sale.completed", label: "Venda concluída" },
  { value: "sale.refunded", label: "Venda reembolsada" },
  { value: "sale.chargeback", label: "Chargeback recebido" },
  { value: "subscription.created", label: "Assinatura criada" },
  { value: "subscription.cancelled", label: "Assinatura cancelada" },
  { value: "subscription.renewed", label: "Assinatura renovada" },
  { value: "cart.abandoned", label: "Carrinho abandonado" },
  { value: "affiliate.sale", label: "Venda por afiliado" },
  { value: "product.updated", label: "Produto atualizado" },
  { value: "checkout.started", label: "Checkout iniciado" },
];

const Webhooks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["webhooks", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("webhooks").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  const toggleEvent = (ev: string) => {
    setForm(f => ({ ...f, events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev] }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Informe o nome"); return; }
    if (!form.url.trim()) { toast.error("Informe a URL"); return; }
    if (form.events.length === 0) { toast.error("Selecione ao menos um evento"); return; }

    const secretKey = `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
    const { error } = await supabase.from("webhooks").insert({
      user_id: user!.id, name: form.name, url: form.url, events: form.events, secret_key: secretKey
    });

    if (error) { toast.error("Erro ao criar webhook"); return; }
    toast.success("Webhook criado!");
    setShowCreate(false);
    setForm({ name: "", url: "", events: [] });
    queryClient.invalidateQueries({ queryKey: ["webhooks"] });
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    await supabase.from("webhooks").update({ is_active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    toast.success(active ? "Webhook desativado" : "Webhook ativado");
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from("webhooks").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    toast.success("Webhook excluído");
  };

  const copySecret = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Chave secreta copiada!");
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Webhooks & Automações</h1>
            <p className="text-sm text-muted-foreground">Configure endpoints para receber notificações de eventos em tempo real.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
            <Plus className="w-4 h-4" /> Novo Webhook
          </button>
        </div>

        {/* Info */}
        <div className="glass-card p-4 mb-6 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center"><Zap className="w-5 h-5 text-primary-foreground" /></div>
            <div>
              <h3 className="text-sm font-display font-bold text-foreground">API & Integrações</h3>
              <p className="text-xs text-muted-foreground">Receba dados de vendas, assinaturas e carrinhos em tempo real via webhooks. Cada requisição inclui uma assinatura HMAC para validação.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><Webhook className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Webhooks</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{webhooks.length}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><ToggleRight className="w-4 h-4 text-success" /><p className="text-xs text-muted-foreground">Ativos</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{webhooks.filter((w: any) => w.is_active).length}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Eventos Configurados</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{new Set(webhooks.flatMap((w: any) => w.events || [])).size}</p>
          </div>
        </div>

        {/* Webhooks List */}
        {isLoading ? (
          <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Carregando...</p></div>
        ) : webhooks.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">Nenhum webhook configurado</h3>
            <p className="text-sm text-muted-foreground">Configure webhooks para integrar com seu CRM, automações e mais.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh: any) => (
              <div key={wh.id} className={`glass-card p-4 ${!wh.is_active ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-display font-bold text-foreground">{wh.name}</h3>
                      {!wh.is_active && <span className="px-2 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full">Inativo</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(wh.events || []).map((ev: string) => (
                        <span key={ev} className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">{availableEvents.find(e => e.value === ev)?.label || ev}</span>
                      ))}
                    </div>
                    {wh.last_triggered_at && <p className="text-[10px] text-muted-foreground mt-1">Último disparo: {new Date(wh.last_triggered_at).toLocaleString("pt-BR")}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {wh.secret_key && <button onClick={() => copySecret(wh.secret_key)} className="p-2 hover:bg-secondary rounded-lg" title="Copiar chave secreta"><Shield className="w-4 h-4 text-muted-foreground" /></button>}
                    <button onClick={() => toggleWebhook(wh.id, wh.is_active)} className="p-2 hover:bg-secondary rounded-lg">
                      {wh.is_active ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => deleteWebhook(wh.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-foreground">Novo Webhook</h2>
                <button onClick={() => setShowCreate(false)} className="text-xl">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Nome *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Webhook Zapier" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">URL do Endpoint *</label>
                  <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Eventos *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableEvents.map(ev => (
                      <button key={ev.value} onClick={() => toggleEvent(ev.value)} className={`px-3 py-2 rounded-lg text-xs text-left transition-colors ${form.events.includes(ev.value) ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-foreground border border-border hover:bg-accent"}`}>
                        {ev.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleCreate} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Criar Webhook</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Webhooks;
