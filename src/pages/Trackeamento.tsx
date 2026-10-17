import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { BarChart3, DollarSign, Target, Link2, Plus, Copy, Trash2, Activity, CheckCircle2, XCircle, RefreshCw, Webhook, AlertTriangle, Send, Calendar, Bot, Sparkles, Loader2, MessageSquarePlus, CircleAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { Download } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PLATFORMS = [
  { value: "facebook", label: "Facebook / Meta" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok Ads" },
  { value: "other", label: "Outro" },
];

export default function Trackeamento() {
  const { user } = useAuth();
  const [tab, setTab] = useState("dashboard");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <BackButton />
        <div>
          <h1 className="font-display text-3xl font-bold">Trackeamento</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Atribua suas vendas às campanhas, calcule ROI e dispare conversões server-side.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full">
            <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
            <TabsTrigger value="costs"><DollarSign className="w-4 h-4 mr-1.5" />Custos</TabsTrigger>
            <TabsTrigger value="pixels"><Target className="w-4 h-4 mr-1.5" />Pixels</TabsTrigger>
            <TabsTrigger value="events"><Activity className="w-4 h-4 mr-1.5" />Eventos</TabsTrigger>
            <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-1.5" />Webhooks</TabsTrigger>
            <TabsTrigger value="generator"><Link2 className="w-4 h-4 mr-1.5" />Gerador</TabsTrigger>
            <TabsTrigger value="automations"><Calendar className="w-4 h-4 mr-1.5" />Automações</TabsTrigger>
            <TabsTrigger value="assistant"><Bot className="w-4 h-4 mr-1.5" />Tracky</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><DashboardTab userId={user?.id} /></TabsContent>
          <TabsContent value="costs" className="mt-6"><CostsTab userId={user?.id} /></TabsContent>
          <TabsContent value="pixels" className="mt-6"><PixelsTab userId={user?.id} /></TabsContent>
          <TabsContent value="events" className="mt-6"><EventsTab userId={user?.id} /></TabsContent>
          <TabsContent value="webhooks" className="mt-6"><WebhooksTab userId={user?.id} /></TabsContent>
          <TabsContent value="generator" className="mt-6"><GeneratorTab /></TabsContent>
          <TabsContent value="automations" className="mt-6"><AutomationsTab userId={user?.id} /></TabsContent>
          <TabsContent value="assistant" className="mt-6"><AssistantTab userId={user?.id} /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ─── DASHBOARD ───
function DashboardTab({ userId }: { userId?: string }) {
  const { data: sales = [] } = useQuery({
    queryKey: ["tracking-sales", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("amount, status, utm_source, utm_medium, utm_campaign, utm_content, sold_at")
        .eq("user_id", userId!)
        .eq("status", "completed")
        .order("sold_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["tracking-campaigns", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tracking_campaigns")
        .select("*, tracking_costs(amount, impressions, clicks)")
        .eq("user_id", userId!);
      return data || [];
    },
    enabled: !!userId,
  });

  const stats = useMemo(() => {
    const byCampaign: Record<string, { revenue: number; sales: number; spent: number; impressions: number; clicks: number; name: string }> = {};
    sales.forEach((s: any) => {
      const key = s.utm_campaign || "(direto)";
      if (!byCampaign[key]) byCampaign[key] = { revenue: 0, sales: 0, spent: 0, impressions: 0, clicks: 0, name: key };
      byCampaign[key].revenue += Number(s.amount || 0);
      byCampaign[key].sales += 1;
    });
    campaigns.forEach((c: any) => {
      const key = c.utm_campaign;
      if (!byCampaign[key]) byCampaign[key] = { revenue: 0, sales: 0, spent: 0, impressions: 0, clicks: 0, name: c.name };
      else byCampaign[key].name = c.name;
      const costs = c.tracking_costs || [];
      costs.forEach((co: any) => {
        byCampaign[key].spent += Number(co.amount || 0);
        byCampaign[key].impressions += Number(co.impressions || 0);
        byCampaign[key].clicks += Number(co.clicks || 0);
      });
    });
    return Object.entries(byCampaign).map(([k, v]) => ({
      key: k,
      ...v,
      profit: v.revenue - v.spent,
      roas: v.spent > 0 ? v.revenue / v.spent : 0,
      cpa: v.sales > 0 && v.spent > 0 ? v.spent / v.sales : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [sales, campaigns]);

  const totals = stats.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.revenue,
      spent: acc.spent + s.spent,
      sales: acc.sales + s.sales,
      profit: acc.profit + s.profit,
    }),
    { revenue: 0, spent: 0, sales: 0, profit: 0 }
  );
  const totalRoas = totals.spent > 0 ? totals.revenue / totals.spent : 0;

  return (
    <div className="space-y-6">
      <RoasAlertBanner stats={stats} userId={userId} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Receita atribuída</p>
          <p className="text-2xl font-display font-bold mt-1">{formatBRL(totals.revenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Investimento</p>
          <p className="text-2xl font-display font-bold mt-1">{formatBRL(totals.spent)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Lucro</p>
          <p className={`text-2xl font-display font-bold mt-1 ${totals.profit >= 0 ? "text-success" : "text-destructive"}`}>
            {formatBRL(totals.profit)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">ROAS</p>
          <p className="text-2xl font-display font-bold mt-1">{totalRoas.toFixed(2)}x</p>
        </Card>
      </div>

      {stats.length > 0 && (
        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display font-semibold">Receita vs Investimento por campanha</h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142, 71%, 45%)" }} />
                  Receita
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0, 72%, 51%)" }} />
                  Investimento
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: "hsl(43, 96%, 56%)" }} />
                  Lucro
                </span>
              </div>
            </div>
            <div className="glass-card px-4 py-2">
              <span className="text-xs text-muted-foreground">ROAS médio</span>
              <p className="text-sm font-semibold text-primary">{totalRoas.toFixed(2)}x</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
              <Tooltip
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-xl min-w-[180px]">
                      <p className="text-sm font-semibold mb-2">{label}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Receita:</span><span className="font-semibold" style={{ color: "hsl(142, 71%, 45%)" }}>{formatBRL(d.revenue)}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Investido:</span><span className="font-semibold" style={{ color: "hsl(0, 72%, 51%)" }}>{formatBRL(d.spent)}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Lucro:</span><span className="font-semibold" style={{ color: "hsl(43, 96%, 56%)" }}>{formatBRL(d.profit)}</span></div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-border/50 mt-1"><span className="text-muted-foreground">ROAS:</span><span className="font-semibold text-primary">{d.roas.toFixed(2)}x</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Vendas:</span><span className="font-semibold">{d.sales}</span></div>
                      </div>
                    </div>
                  );
                }}
              />
              <Area type="natural" dataKey="revenue" stroke="hsl(142, 71%, 45%)" strokeWidth={2.5} fill="url(#gradRevenue)" animationDuration={800} />
              <Area type="natural" dataKey="spent" stroke="hsl(0, 72%, 51%)" strokeWidth={2.5} fill="url(#gradSpent)" animationDuration={800} />
              <Area type="natural" dataKey="profit" stroke="hsl(43, 96%, 56%)" strokeWidth={2} fill="url(#gradProfit)" animationDuration={800} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      <TimeSeriesChart sales={sales} />

      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-display font-semibold">Performance por campanha</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-3 font-medium">Campanha</th>
                <th className="text-right p-3 font-medium">Vendas</th>
                <th className="text-right p-3 font-medium">Receita</th>
                <th className="text-right p-3 font-medium">Gasto</th>
                <th className="text-right p-3 font-medium">Lucro</th>
                <th className="text-right p-3 font-medium">ROAS</th>
                <th className="text-right p-3 font-medium">CPA</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma venda atribuída ainda. Use o Gerador de UTM para criar links rastreados.</td></tr>
              ) : (
                stats.map((s) => (
                  <tr key={s.key} className="border-t">
                    <td className="p-3">{s.name}</td>
                    <td className="text-right p-3">{s.sales}</td>
                    <td className="text-right p-3">{formatBRL(s.revenue)}</td>
                    <td className="text-right p-3">{formatBRL(s.spent)}</td>
                    <td className={`text-right p-3 font-medium ${s.profit >= 0 ? "text-success" : "text-destructive"}`}>{formatBRL(s.profit)}</td>
                    <td className="text-right p-3">{s.roas.toFixed(2)}x</td>
                    <td className="text-right p-3">{s.cpa > 0 ? formatBRL(s.cpa) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── COSTS ───
function CostsTab({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", utm_campaign: "", utm_source: "", platform: "facebook", daily_budget: "" });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["tracking-campaigns-list", userId],
    queryFn: async () => {
      const { data } = await supabase.from("tracking_campaigns").select("*, tracking_costs(amount)").eq("user_id", userId!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tracking_campaigns").insert({
        user_id: userId!,
        name: form.name,
        utm_campaign: form.utm_campaign,
        utm_source: form.utm_source || null,
        platform: form.platform,
        daily_budget: Number(form.daily_budget) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campanha criada");
      setShowForm(false);
      setForm({ name: "", utm_campaign: "", utm_source: "", platform: "facebook", daily_budget: "" });
      qc.invalidateQueries({ queryKey: ["tracking-campaigns-list"] });
      qc.invalidateQueries({ queryKey: ["tracking-campaigns"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addCostMut = useMutation({
    mutationFn: async ({ campaign_id, amount, impressions, clicks }: any) => {
      const { error } = await supabase.from("tracking_costs").insert({
        user_id: userId!,
        campaign_id,
        amount: Number(amount),
        impressions: Number(impressions) || 0,
        clicks: Number(clicks) || 0,
      });
      if (error) throw error;
      // Update total
      const { data: costs } = await supabase.from("tracking_costs").select("amount").eq("campaign_id", campaign_id);
      const total = (costs || []).reduce((s: number, c: any) => s + Number(c.amount), 0);
      await supabase.from("tracking_campaigns").update({ total_spent: total }).eq("id", campaign_id);
    },
    onSuccess: () => {
      toast.success("Gasto registrado");
      qc.invalidateQueries({ queryKey: ["tracking-campaigns-list"] });
      qc.invalidateQueries({ queryKey: ["tracking-campaigns"] });
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracking_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["tracking-campaigns-list"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Registre quanto gastou em cada campanha para calcular ROI/ROAS automaticamente.</p>
        <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" />Nova campanha</Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Nome da campanha</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Black Friday 2026" />
            </div>
            <div>
              <Label>Plataforma</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>UTM Campaign (obrigatório)</Label>
              <Input value={form.utm_campaign} onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })} placeholder="black-friday-2026" />
            </div>
            <div>
              <Label>UTM Source</Label>
              <Input value={form.utm_source} onChange={(e) => setForm({ ...form, utm_source: e.target.value })} placeholder="facebook" />
            </div>
            <div>
              <Label>Orçamento diário (R$)</Label>
              <Input type="number" value={form.daily_budget} onChange={(e) => setForm({ ...form, daily_budget: e.target.value })} placeholder="100" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMut.mutate()} disabled={!form.name || !form.utm_campaign || createMut.isPending}>Criar</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">Nenhuma campanha cadastrada ainda.</Card>
        ) : (
          campaigns.map((c: any) => {
            const total = (c.tracking_costs || []).reduce((s: number, x: any) => s + Number(x.amount), 0);
            return (
              <Card key={c.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-semibold">{c.name}</h4>
                      <Badge variant="outline" className="text-[10px]">{c.platform}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">utm_campaign: <code className="bg-muted px-1 rounded">{c.utm_campaign}</code></p>
                    <p className="text-sm mt-2">Total gasto: <strong>{formatBRL(total)}</strong></p>
                  </div>
                  <div className="flex gap-2">
                    <QuickAddCost onAdd={(data) => addCostMut.mutate({ campaign_id: c.id, ...data })} />
                    <Button size="icon" variant="ghost" onClick={() => delMut.mutate(c.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function QuickAddCost({ onAdd }: { onAdd: (d: { amount: string; impressions: string; clicks: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ amount: "", impressions: "", clicks: "" });
  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>+ Gasto</Button>;
  return (
    <div className="flex gap-1 items-center">
      <Input className="w-20 h-8" placeholder="R$" value={data.amount} onChange={(e) => setData({ ...data, amount: e.target.value })} />
      <Input className="w-20 h-8" placeholder="Impr." value={data.impressions} onChange={(e) => setData({ ...data, impressions: e.target.value })} />
      <Input className="w-20 h-8" placeholder="Cliques" value={data.clicks} onChange={(e) => setData({ ...data, clicks: e.target.value })} />
      <Button size="sm" onClick={() => { onAdd(data); setData({ amount: "", impressions: "", clicks: "" }); setOpen(false); }}>OK</Button>
    </div>
  );
}

// ─── PIXELS ───
function PixelsTab({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const { data: pixels = [] } = useQuery({
    queryKey: ["tracking-pixels", userId],
    queryFn: async () => {
      const { data } = await supabase.from("tracking_pixels").select("*").eq("user_id", userId!);
      return data || [];
    },
    enabled: !!userId,
  });

  const upsertMut = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("tracking_pixels").upsert(data, { onConflict: "user_id,platform" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pixel salvo");
      qc.invalidateQueries({ queryKey: ["tracking-pixels"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/20">
        <p className="text-sm">
          <strong>Como funciona:</strong> Configure aqui o Pixel ID e Access Token de cada plataforma. Quando uma venda é aprovada, a Queenify dispara o evento <code>Purchase</code> server-side direto pra API de cada plataforma — sem depender de cookies do navegador (à prova de bloqueadores).
        </p>
      </Card>

      <PixelCard
        platform="facebook"
        title="Facebook / Meta CAPI"
        description="Conversions API. Gere o Access Token em Events Manager → Settings → Conversions API."
        existing={pixels.find((p: any) => p.platform === "facebook")}
        fields={[
          { key: "pixel_id", label: "Pixel ID", placeholder: "123456789012345" },
          { key: "access_token", label: "Access Token", placeholder: "EAAxxxxxxx...", type: "password" },
          { key: "test_event_code", label: "Test Event Code (opcional)", placeholder: "TEST12345" },
        ]}
        onSave={(d) => upsertMut.mutate({ user_id: userId, platform: "facebook", ...d })}
      />

      <Card className="border-amber-500/30 p-4">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold">Google Ads server-side — indisponível</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">A implementação antiga não autenticava as chamadas com OAuth. O envio foi pausado até migrar para o fluxo de conversões atual. Não salve credenciais nesta tela.</p>
          </div>
        </div>
      </Card>


      <PixelCard
        platform="tiktok"
        title="TikTok Events API"
        description="Eventos server-side do TikTok. Gere o Access Token em Events Manager → Settings."
        existing={pixels.find((p: any) => p.platform === "tiktok")}
        fields={[
          { key: "pixel_id", label: "Pixel ID", placeholder: "C4XXXXXXXXXXXXXX" },
          { key: "access_token", label: "Access Token", placeholder: "xxxxxxx", type: "password" },
        ]}
        onSave={(d) => upsertMut.mutate({ user_id: userId, platform: "tiktok", ...d })}
      />
    </div>
  );
}

function PixelCard({ platform, title, description, existing, fields, onSave }: any) {
  const [data, setData] = useState<any>(() => existing || {});
  const [editing, setEditing] = useState(!existing);
  const isConfigured = !!existing?.pixel_id;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold">{title}</h3>
            {isConfigured && <Badge className="bg-success text-success-foreground">Conectado</Badge>}
            {existing?.events_sent_count > 0 && (
              <span className="text-xs text-muted-foreground">{existing.events_sent_count} eventos enviados</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        {!editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>}
      </div>

      {editing && (
        <div className="space-y-2">
          {fields.map((f: any) => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Input
                type={f.type || "text"}
                placeholder={f.placeholder}
                value={data[f.key] || ""}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => { onSave(data); setEditing(false); }}>Salvar</Button>
            {existing && <Button size="sm" variant="outline" onClick={() => { setData(existing); setEditing(false); }}>Cancelar</Button>}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── GENERATOR ───
function GeneratorTab() {
  const [base, setBase] = useState("");
  const [utms, setUtms] = useState({ utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "", utm_term: "" });

  const result = useMemo(() => {
    if (!base) return "";
    try {
      const url = new URL(base.startsWith("http") ? base : `https://${base}`);
      Object.entries(utms).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
      });
      return url.toString();
    } catch {
      return "URL inválida";
    }
  }, [base, utms]);

  return (
    <Card className="p-4 space-y-4">
      <div>
        <Label>URL de destino</Label>
        <Input value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://queenify.app/checkout/abc123" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>utm_source <span className="text-muted-foreground text-xs">(de onde vem)</span></Label>
          <Input value={utms.utm_source} onChange={(e) => setUtms({ ...utms, utm_source: e.target.value })} placeholder="facebook" />
        </div>
        <div>
          <Label>utm_medium <span className="text-muted-foreground text-xs">(tipo de tráfego)</span></Label>
          <Input value={utms.utm_medium} onChange={(e) => setUtms({ ...utms, utm_medium: e.target.value })} placeholder="cpc" />
        </div>
        <div>
          <Label>utm_campaign <span className="text-muted-foreground text-xs">(nome campanha)</span></Label>
          <Input value={utms.utm_campaign} onChange={(e) => setUtms({ ...utms, utm_campaign: e.target.value })} placeholder="black-friday-2026" />
        </div>
        <div>
          <Label>utm_content <span className="text-muted-foreground text-xs">(qual criativo)</span></Label>
          <Input value={utms.utm_content} onChange={(e) => setUtms({ ...utms, utm_content: e.target.value })} placeholder="video-vsl-v1" />
        </div>
        <div>
          <Label>utm_term <span className="text-muted-foreground text-xs">(palavra-chave)</span></Label>
          <Input value={utms.utm_term} onChange={(e) => setUtms({ ...utms, utm_term: e.target.value })} placeholder="curso emagrecimento" />
        </div>
      </div>
      {result && (
        <Card className="p-3 bg-muted/30">
          <Label className="text-xs">URL gerada</Label>
          <div className="flex gap-2 items-center mt-1">
            <code className="flex-1 text-xs break-all">{result}</code>
            <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copiado!"); }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </Card>
  );
}

// ─── TIME SERIES CHART ───
function TimeSeriesChart({ sales }: { sales: any[] }) {
  const [days, setDays] = useState(30);

  const { series, topCampaigns } = useMemo(() => {
    const start = startOfDay(subDays(new Date(), days - 1));
    const buckets: Record<string, Record<string, number>> = {};
    const campaignTotals: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
      buckets[d] = {};
    }

    sales.forEach((s: any) => {
      const sDate = new Date(s.sold_at);
      if (sDate < start) return;
      const dKey = format(sDate, "yyyy-MM-dd");
      const camp = s.utm_campaign || "(direto)";
      if (!buckets[dKey]) buckets[dKey] = {};
      buckets[dKey][camp] = (buckets[dKey][camp] || 0) + Number(s.amount || 0);
      campaignTotals[camp] = (campaignTotals[camp] || 0) + Number(s.amount || 0);
    });

    const top = Object.entries(campaignTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    const series = Object.entries(buckets).map(([date, vals]) => {
      const row: any = { date: format(new Date(date), "dd/MM", { locale: ptBR }) };
      top.forEach((c) => { row[c] = vals[c] || 0; });
      return row;
    });

    return { series, topCampaigns: top };
  }, [sales, days]);

  const colors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-semibold">Evolução de vendas por campanha</h3>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {topCampaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Sem vendas no período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: any) => formatBRL(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {topCampaigns.map((c, i) => (
              <Line key={c} type="monotone" dataKey={c} stroke={colors[i]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// ─── EVENTS LOG ───
function EventsTab({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "sent" | "failed">("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["tracking-events", userId, filter],
    queryFn: async () => {
      let q = supabase.from("tracking_events").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!userId,
  });

  const totals = useMemo(() => {
    const sent = events.filter((e: any) => e.status === "sent").length;
    const failed = events.filter((e: any) => e.status === "failed").length;
    return { sent, failed, total: events.length };
  }, [events]);

  const platformLabel: Record<string, string> = { facebook: "Facebook", google: "Google Ads", tiktok: "TikTok" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total enviados</p>
          <p className="text-2xl font-display font-bold mt-1">{totals.total}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Sucesso</p>
          <p className="text-2xl font-display font-bold mt-1 text-success">{totals.sent}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Falhas</p>
          <p className="text-2xl font-display font-bold mt-1 text-destructive">{totals.failed}</p>
        </Card>
      </div>

      <div className="flex justify-between items-center gap-2 flex-wrap">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Sucesso</SelectItem>
            <SelectItem value="failed">Falhas</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <RetryAllFailedButton userId={userId} />
          <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["tracking-events"] })}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Atualizar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-3 font-medium">Quando</th>
                <th className="text-left p-3 font-medium">Plataforma</th>
                <th className="text-left p-3 font-medium">Evento</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Detalhes</th>
                <th className="text-right p-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum evento disparado ainda. Eventos aparecerão aqui após uma venda aprovada com pixel configurado.</td></tr>
              ) : (
                events.map((e: any) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(e.created_at), "dd/MM HH:mm:ss")}</td>
                    <td className="p-3">{platformLabel[e.platform] || e.platform}</td>
                    <td className="p-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{e.event_name}</code></td>
                    <td className="p-3">
                      {e.status === "sent" ? (
                        <Badge className="bg-success/15 text-success hover:bg-success/15"><CheckCircle2 className="w-3 h-3 mr-1" />Enviado</Badge>
                      ) : (
                        <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-md truncate" title={e.error_message || JSON.stringify(e.response)}>
                      {e.error_message || (e.response ? JSON.stringify(e.response).slice(0, 80) : "—")}
                    </td>
                    <td className="p-3 text-right">
                      {e.status === "failed" && e.sale_id && <RetryEventButton eventId={e.id} />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── ROAS ALERT BANNER ───
function RoasAlertBanner({ stats, userId }: { stats: any[]; userId?: string }) {
  const qc = useQueryClient();
  const lowRoas = stats.filter((s) => s.spent >= 50 && s.roas < 1.5);
  const checkMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("roas-alert-check", { body: { user_id: userId } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.alerts_created ? `${data.alerts_created} alerta(s) gerado(s)` : "Tudo OK — nenhum ROAS crítico");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (lowRoas.length === 0) return null;
  return (
    <Card className="p-4 border-destructive/40 bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-display font-semibold text-destructive">{lowRoas.length} campanha(s) com ROAS abaixo de 1.5x</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {lowRoas.slice(0, 3).map((c) => `${c.name} (${c.roas.toFixed(2)}x)`).join(" · ")}
            {lowRoas.length > 3 && ` · +${lowRoas.length - 3}`}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Gerar notificações e enviar pro sino do dashboard:</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => checkMut.mutate()} disabled={checkMut.isPending}>
          {checkMut.isPending ? "Verificando..." : "Gerar alertas"}
        </Button>
      </div>
    </Card>
  );
}

// ─── RETRY EVENT BUTTON ───
function RetryEventButton({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("track-conversion", { body: { retry_event_id: eventId } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const ok = data?.results?.[0]?.ok;
      if (ok) toast.success("Evento reenviado com sucesso");
      else toast.error("Reenvio falhou — confira os detalhes do novo evento");
      qc.invalidateQueries({ queryKey: ["tracking-events"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Button size="sm" variant="outline" onClick={() => mut.mutate()} disabled={mut.isPending}>
      <Send className="w-3 h-3 mr-1" />{mut.isPending ? "..." : "Reenviar"}
    </Button>
  );
}

// ─── RETRY ALL FAILED (last 24h) ───
function RetryAllFailedButton({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      // Fetch failed events from the last 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: failed } = await supabase
        .from("tracking_events")
        .select("id, sale_id")
        .eq("user_id", userId!)
        .eq("status", "failed")
        .gte("created_at", since);
      const list = (failed || []).filter((e: any) => e.sale_id);
      if (list.length === 0) return { total: 0, ok: 0, fail: 0 };
      let ok = 0, fail = 0;
      // Process sequentially to avoid hammering the pixel APIs
      for (const ev of list) {
        try {
          const { data } = await supabase.functions.invoke("track-conversion", { body: { retry_event_id: ev.id } });
          if (data?.results?.[0]?.ok) ok++; else fail++;
        } catch { fail++; }
      }
      return { total: list.length, ok, fail };
    },
    onSuccess: (r: any) => {
      if (r.total === 0) toast.info("Nenhum evento falho nas últimas 24h");
      else toast.success(`Reenviados: ${r.ok} sucesso · ${r.fail} falha (de ${r.total})`);
      qc.invalidateQueries({ queryKey: ["tracking-events"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Button size="sm" variant="outline" onClick={() => mut.mutate()} disabled={mut.isPending} title="Retenta automaticamente todos os eventos com status 'falhou' das últimas 24 horas">
      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${mut.isPending ? "animate-spin" : ""}`} />
      {mut.isPending ? "Reenviando..." : "Reenviar todos os falhos (24h)"}
    </Button>
  );
}
function WebhooksTab({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const [source, setSource] = useState("hotmart");
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

  const { data: tokens = [] } = useQuery({
    queryKey: ["webhook-tokens", userId],
    queryFn: async () => {
      const { data } = await supabase.from("external_webhook_tokens").select("*").eq("user_id", userId!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("external_webhook_tokens").insert({ user_id: userId!, source });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Token criado");
      qc.invalidateQueries({ queryKey: ["webhook-tokens"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: any) => {
      const { error } = await supabase.from("external_webhook_tokens").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-tokens"] }),
  });

  const secretMut = useMutation({
    mutationFn: async ({ id, webhook_secret }: { id: string; webhook_secret: string | null }) => {
      const { error } = await supabase.from("external_webhook_tokens").update({ webhook_secret }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Segredo HMAC atualizado");
      qc.invalidateQueries({ queryKey: ["webhook-tokens"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("external_webhook_tokens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Token removido");
      qc.invalidateQueries({ queryKey: ["webhook-tokens"] });
    },
  });

  const buildUrl = (token: string) => `${supabaseUrl}/functions/v1/external-sale-webhook?token=${token}`;

  const sourceLabel: Record<string, string> = { hotmart: "Hotmart", kirvano: "Kirvano", generic: "Genérico" };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/20">
        <p className="text-sm">
          <strong>Receba vendas de plataformas externas.</strong> Use a URL gerada para encaminhar eventos. Para Hotmart, configure também o Hottok recebido no header <code>X-HOTMART-HOTTOK</code>. A importação requer um identificador de transação único para evitar duplicidade.
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Plataforma de origem</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="kirvano">Kirvano</SelectItem>
                <SelectItem value="generic">Genérico (formato customizado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}><Plus className="w-4 h-4 mr-1" />Gerar token</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {tokens.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">Nenhum webhook configurado ainda.</Card>
        ) : (
          tokens.map((t: any) => (
            <Card key={t.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{sourceLabel[t.source] || t.source}</Badge>
                    {t.is_active ? <Badge className="bg-success/15 text-success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                    {t.total_received > 0 && <span className="text-xs text-muted-foreground">{t.total_received} venda(s) recebida(s)</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={t.is_active} onCheckedChange={(v) => toggleMut.mutate({ id: t.id, is_active: v })} />
                  <Button size="icon" variant="ghost" onClick={() => delMut.mutate(t.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">URL do webhook (cole na plataforma de origem)</Label>
                <div className="flex gap-2 items-center mt-1">
                  <code className="flex-1 text-xs bg-muted p-2 rounded break-all">{buildUrl(t.token)}</code>
                  <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(buildUrl(t.token)); toast.success("Copiado!"); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <HmacSecretField token={t} onSave={(secret) => secretMut.mutate({ id: t.id, webhook_secret: secret })} />
            </Card>
          ))
        )}
      </div>

      <Card className="p-4 bg-muted/10">
        <h4 className="font-display font-semibold text-sm mb-2">Como configurar</h4>
        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>Hotmart:</strong> Ferramentas → Webhooks → Nova URL → cole a URL acima e selecione "Compra aprovada".</p>
          <p><strong>Kirvano:</strong> Configurações → Webhooks → Nova integração → cole a URL e ative o evento "sale.approved".</p>
          <p><strong>Genérico:</strong> Envie POST com JSON contendo <code>buyer_email</code>, <code>amount</code>, <code>status</code>, <code>utm_source</code>, <code>utm_campaign</code>, etc.</p>
        </div>
      </Card>

      <Card className="p-4 bg-muted/10">
        <h4 className="font-display font-semibold text-sm mb-2">Glossário rápido</h4>
        <div className="text-xs text-muted-foreground space-y-1.5">
          <p><strong>Webhook:</strong> uma URL que outras plataformas chamam automaticamente quando algo acontece (ex.: "venda aprovada"). É como um "notificador" entre sistemas.</p>
          <p><strong>Token:</strong> uma senha aleatória embutida na URL. Sem o token correto, o webhook é rejeitado.</p>
          <p><strong>HMAC / x-signature:</strong> uma "assinatura digital" que prova que quem mandou a venda é mesmo a Hotmart/Kirvano (e não alguém fingindo). A plataforma assina o corpo do POST com um segredo compartilhado e a Queenify confere se bate.</p>
          <p><strong>UTM:</strong> parâmetros na URL (utm_source, utm_campaign, etc.) que identificam de qual anúncio/campanha veio a venda.</p>
          <p><strong>ROAS:</strong> Return On Ad Spend — quantos reais de receita você teve para cada R$ 1 gasto em anúncio. Abaixo de 1x significa prejuízo.</p>
          <p><strong>Pixel server-side:</strong> em vez de o navegador do comprador avisar o Facebook/Google da conversão (e poder ser bloqueado), o servidor da Queenify avisa direto via API — mais confiável.</p>
        </div>
      </Card>
    </div>
  );
}

// ─── HMAC SECRET FIELD ───
function HmacSecretField({ token, onSave }: { token: any; onSave: (s: string | null) => void }) {
  const [value, setValue] = useState(token.webhook_secret || "");
  const [show, setShow] = useState(false);
  const hasSecret = !!token.webhook_secret;
  return (
    <div className="border-t pt-3">
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs flex items-center gap-1.5">
          {token.source === "hotmart" ? "Hottok da Hotmart (obrigatório)" : <>Segredo HMAC <span className="text-muted-foreground">(opcional)</span></>}
          {hasSecret && <Badge className="bg-success/15 text-success text-[10px] px-1.5 py-0">protegido</Badge>}
        </Label>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShow((s) => !s)}>
          {show ? "ocultar" : "mostrar"}
        </button>
      </div>
      <div className="flex gap-2">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={token.source === "hotmart" ? "Cole o Hottok da aba Autenticação da Hotmart" : "Segredo HMAC configurado no sistema de origem"}
          className="text-xs h-8"
        />
        <Button size="sm" variant="outline" onClick={() => onSave(value || null)}>Salvar</Button>
        {hasSecret && <Button size="sm" variant="ghost" onClick={() => { setValue(""); onSave(null); }}>Remover</Button>}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">
        {token.source === "hotmart"
          ? <>A Hotmart envia esse valor no header <code className="bg-muted px-1 rounded">X-HOTMART-HOTTOK</code>. A Queenify o valida em cada evento.</>
          : <>Quando configurado, o POST precisa trazer <code className="bg-muted px-1 rounded">x-signature</code> com HMAC-SHA256 do corpo da requisição.</>}
      </p>
    </div>
  );
}

// ─── AUTOMAÇÕES ───
function AutomationsTab({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const { data: schedule } = useQuery({
    queryKey: ["roas-schedule", userId],
    queryFn: async () => {
      const { data } = await supabase.from("roas_alert_schedules").select("*").eq("user_id", userId!).maybeSingle();
      return data;
    },
    enabled: !!userId,
  });
  const { data: executions = [] } = useQuery({
    queryKey: ["roas-executions", userId],
    queryFn: async () => {
      const { data } = await supabase.from("roas_alert_executions").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(30);
      return data || [];
    },
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const [enabled, setEnabled] = useState(schedule?.is_enabled ?? true);
  const [frequency, setFrequency] = useState<string>(schedule?.frequency || "daily");
  const [hour, setHour] = useState<number>(schedule?.hour_utc ?? 12);
  const [weekday, setWeekday] = useState<number>(schedule?.weekday ?? 1);

  useMemo(() => {
    if (schedule) {
      setEnabled(schedule.is_enabled);
      setFrequency(schedule.frequency);
      setHour(schedule.hour_utc);
      setWeekday(schedule.weekday);
    }
  }, [schedule?.id]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("manage-roas-cron", {
        body: { is_enabled: enabled, frequency, hour_utc: hour, weekday },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(enabled ? "Agendamento salvo e cron ativado" : "Agendamento desativado");
      qc.invalidateQueries({ queryKey: ["roas-schedule"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const lastExec = executions[0];
  const nextRunLabel = useMemo(() => {
    if (!enabled) return "Desativado";
    const now = new Date();
    const next = new Date();
    next.setUTCHours(hour, 0, 0, 0);
    if (frequency === "daily") {
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    } else {
      const targetDow = weekday;
      let diff = (targetDow - next.getUTCDay() + 7) % 7;
      if (diff === 0 && next <= now) diff = 7;
      next.setUTCDate(next.getUTCDate() + diff);
    }
    return format(next, "dd/MM 'às' HH:mm", { locale: ptBR }) + " (UTC)";
  }, [enabled, frequency, hour, weekday]);

  const weekdays = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/20">
        <p className="text-sm">
          <strong>Monitoramento automático de ROAS.</strong> O sistema verifica todas as suas campanhas no horário escolhido e cria alertas quando alguma estiver dando prejuízo (ROAS abaixo de 1.5x). Funciona mesmo com você offline.
        </p>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold">Agendamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Próxima execução: <strong>{nextRunLabel}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Ativo</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency} disabled={!enabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Horário (UTC)</Label>
            <Select value={String(hour)} onValueChange={(v) => setHour(Number(v))} disabled={!enabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 24 }).map((_, h) => (
                  <SelectItem key={h} value={String(h)}>{String(h).padStart(2,"0")}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">Brasília = UTC-3 (ex: 12 UTC = 09h BRT)</p>
          </div>
          {frequency === "weekly" && (
            <div>
              <Label className="text-xs">Dia da semana</Label>
              <Select value={String(weekday)} onValueChange={(v) => setWeekday(Number(v))} disabled={!enabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {weekdays.map((w, i) => <SelectItem key={i} value={String(i)}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full md:w-auto">
          {saveMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
          Salvar agendamento
        </Button>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Histórico de execuções</h3>
          <div className="flex items-center gap-2">
            {lastExec && <span className="text-xs text-muted-foreground">Última: {format(new Date(lastExec.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>}
            <Button
              size="sm"
              variant="outline"
              disabled={executions.length === 0}
              onClick={() => {
                const header = "data_hora,status,disparado_por,campanhas_checadas,alertas_criados,erro\n";
                const rows = executions.map((e: any) =>
                  [
                    format(new Date(e.created_at), "yyyy-MM-dd HH:mm:ss"),
                    e.status,
                    e.triggered_by,
                    e.campaigns_checked,
                    e.alerts_created,
                    (e.error_message || "").replace(/[",\n]/g, " "),
                  ].join(",")
                ).join("\n");
                const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `roas-execucoes-${format(new Date(), "yyyy-MM-dd")}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Exportar CSV
            </Button>
          </div>
        </div>
        {executions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma execução registrada ainda. O cron começará a rodar no próximo horário agendado.</p>
        ) : (
          <div className="space-y-2">
            {executions.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded border bg-muted/10">
                <div className="flex items-center gap-3">
                  {e.status === "success"
                    ? <CheckCircle2 className="w-4 h-4 text-success" />
                    : <XCircle className="w-4 h-4 text-destructive" />}
                  <div>
                    <p className="text-sm font-medium">
                      {e.status === "success" ? "Sucesso" : "Falha"}
                      <Badge variant="outline" className="ml-2 text-[10px]">{e.triggered_by}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      {e.error_message && <span className="text-destructive"> — {e.error_message}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p>{e.campaigns_checked} camp. checadas</p>
                  {e.alerts_created > 0 && <p className="text-warning">{e.alerts_created} alerta(s) criado(s)</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── ASSISTENTE (TRACKY BOT) ───
function AssistantTab({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const { data: conversations = [] } = useQuery({
    queryKey: ["bot-conversations", userId],
    queryFn: async () => {
      const { data } = await supabase.from("tracking_bot_conversations").select("*").eq("user_id", userId!).order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["bot-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data } = await supabase.from("tracking_bot_messages").select("*").eq("conversation_id", conversationId).order("created_at");
      return data || [];
    },
    enabled: !!conversationId,
  });

  const newConv = async () => {
    const { data } = await supabase.from("tracking_bot_conversations").insert({ user_id: userId!, title: "Nova conversa" }).select().single();
    if (data) {
      setConversationId(data.id);
      qc.invalidateQueries({ queryKey: ["bot-conversations"] });
    }
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    let convId = conversationId;
    if (!convId) {
      const { data } = await supabase.from("tracking_bot_conversations").insert({ user_id: userId!, title: input.slice(0, 60) }).select().single();
      convId = data?.id;
      setConversationId(convId);
    }
    const userMsg = input;
    setInput("");
    setSending(true);
    qc.setQueryData(["bot-messages", convId], (old: any[] = []) => [...old, { id: "tmp-u", role: "user", content: userMsg, created_at: new Date().toISOString() }]);

    try {
      const { data, error } = await supabase.functions.invoke("tracking-bot", {
        body: {
          conversation_id: convId,
          messages: [...messages.map((m: any) => ({ role: m.role, content: m.content })), { role: "user", content: userMsg }],
        },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["bot-messages", convId] });
      qc.invalidateQueries({ queryKey: ["bot-conversations"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao falar com o Tracky");
    } finally {
      setSending(false);
    }
  };

  const suggestions = [
    "Como está o ROAS das minhas campanhas?",
    "Quais eventos de pixel estão falhando?",
    "Me ajude a montar uma URL com UTM",
    "O que é Meta CAPI e por que importa?",
  ];

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      <Card className="p-3 flex flex-col gap-2 overflow-hidden">
        <Button size="sm" onClick={newConv} variant="outline"><MessageSquarePlus className="w-4 h-4 mr-1.5" />Nova conversa</Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setConversationId(c.id)}
              className={`w-full text-left text-xs p-2 rounded hover:bg-muted transition ${conversationId === c.id ? "bg-muted" : ""}`}
            >
              <p className="truncate font-medium">{c.title}</p>
              <p className="text-[10px] text-muted-foreground">{format(new Date(c.updated_at), "dd/MM HH:mm", { locale: ptBR })}</p>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-[11px] text-muted-foreground p-2">Nenhuma conversa. Clique acima ou faça uma pergunta.</p>
          )}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        <div className="p-3 border-b flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-sm">Tracky</p>
            <p className="text-[10px] text-muted-foreground">Especialista em campanhas, UTMs, pixels e ROAS</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={messages.length === 0}
            onClick={() => {
              const conv = conversations.find((c: any) => c.id === conversationId);
              const header = "data_hora,papel,mensagem\n";
              const rows = messages.map((m: any) =>
                [
                  format(new Date(m.created_at), "yyyy-MM-dd HH:mm:ss"),
                  m.role,
                  `"${(m.content || "").replace(/"/g, '""')}"`,
                ].join(",")
              ).join("\n");
              const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `tracky-${(conv?.title || "conversa").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exportar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !sending && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Olá! Sou o Tracky, especialista em trackeamento da Queenify. Tenho acesso aos seus dados reais (campanhas, ROAS, vendas, eventos). Comece com:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="text-left text-xs p-2.5 rounded border hover:bg-muted transition">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Tracky está pensando...
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pergunte sobre suas campanhas..."
            disabled={sending}
          />
          <Button onClick={send} disabled={sending || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

