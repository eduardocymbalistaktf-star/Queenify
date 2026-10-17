import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/layouts/DashboardLayout";
import BackButton from "@/components/BackButton";
import SecurityEventsPanel from "@/components/SecurityEventsPanel";
import SecuritySummary from "@/components/SecuritySummary";
import AuditEnvSelector from "@/components/AuditEnvSelector";
import { useAuditEnv } from "@/hooks/useAuditEnv";
import { Shield, EyeOff, AlertTriangle, CheckCircle2, Loader2, RefreshCw, ExternalLink, ListFilter } from "lucide-react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const HIDDEN_FIELDS = [
  { table: "products", view: "products_public", field: "tracking_pixel", reason: "Pixel exposto permite injetar tracking malicioso em checkouts de terceiros." },
  { table: "tracking_pixels", view: "tracking_pixels_safe", field: "access_token", reason: "Token de API do Facebook/Google — concede acesso completo à conta de ads do usuário." },
  { table: "user_settings", view: "get_public_profile_settings (RPC)", field: "bank_account, pix_key, doc_*", reason: "Dados bancários e documentos de identidade — não devem sair do dono nunca." },
  { table: "collaboration_invites", view: "get_invite_by_token (RPC)", field: "invite_token (filtrado por token)", reason: "Tokens de convite só podem ser consultados se você já souber o token." },
  { table: "external_webhook_tokens", view: "(sem view pública)", field: "token, webhook_secret", reason: "Segredos de webhook — qualquer leitura externa daria acesso ao endpoint." },
];

interface AnonCheck { name: string; status: "ok" | "fail" | "inconclusive"; detail: string; }

const anonymousClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

const AuditoriaSeguranca = () => {
  const { user } = useAuth();
  const { active } = useAuditEnv();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [anonChecks, setAnonChecks] = useState<AnonCheck[]>([]);

  const runAnonChecks = useCallback(async () => {
    setRevalidating(true);
    const checks: AnonCheck[] = [];

    const { data: pp, error: ppError } = await anonymousClient.from("products_public" as any).select("*").limit(1);
    const ppRow = (pp as any[])?.[0];
    checks.push({
      name: "products_public esconde tracking_pixel",
      status: ppError ? "inconclusive" : ppRow ? ("tracking_pixel" in ppRow ? "fail" : "ok") : "inconclusive",
      detail: ppError ? "Não foi possível consultar a view com a chave pública." : ppRow ? `Campos retornados: ${Object.keys(ppRow).join(", ")}` : "Sem produto público para inspecionar; resultado inconclusivo.",
    });

    const { data: tps, error: tpsError } = await anonymousClient.from("tracking_pixels_safe" as any).select("*").limit(1);
    const tpsRow = (tps as any[])?.[0];
    checks.push({
      name: "tracking_pixels_safe esconde access_token",
      status: tpsError ? "inconclusive" : tpsRow ? ("access_token" in tpsRow ? "fail" : "ok") : "inconclusive",
      detail: tpsError ? "Não foi possível consultar a view com a chave pública." : tpsRow ? `Campos retornados: ${Object.keys(tpsRow).join(", ")}` : "Sem pixel acessível para inspecionar; resultado inconclusivo.",
    });

    // Use a client without a persisted session. An empty dataset is inconclusive.
    const { data: anonPixels, error: tpErr } = await anonymousClient.from("tracking_pixels").select("access_token").limit(1);
    checks.push({
      name: "tracking_pixels.access_token bloqueado por RLS",
      status: tpErr?.code === "42501" ? "ok" : tpErr ? "inconclusive" : anonPixels?.length ? "fail" : "inconclusive",
      detail: tpErr?.code === "42501" ? "O banco negou a leitura anônima." : tpErr ? "Não foi possível confirmar o bloqueio por RLS." : anonPixels?.length ? "A chave pública recebeu um access_token." : "Nenhuma linha acessível; resultado inconclusivo sem dados de teste.",
    });

    // A tabela base deve negar acesso anônimo independentemente de haver linhas.
    const { data: prodRaw, error: prodError } = await anonymousClient.from("products").select("tracking_pixel").eq("is_active", true).limit(1);
    checks.push({
      name: "Tabela products bloqueada para acesso anônimo",
      status: prodError?.code === "42501" ? "ok" : prodError ? "inconclusive" : "fail",
      detail: prodError?.code === "42501" ? "A tabela base negou acesso anônimo; use products_public para listagens." : prodError ? "Não foi possível confirmar o bloqueio de acesso à tabela base." : `A chave pública consultou products${(prodRaw as any[])?.length ? " e recebeu linhas" : ""}; isso deve ser bloqueado.`,
    });

    setAnonChecks(checks);
    setRevalidating(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (!data) { setLoading(false); return; }
      await runAnonChecks();
      setLoading(false);
    })();
  }, [user, runAnonChecks]);

  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin === false) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Auditoria de Segurança</h1>
              <p className="text-sm text-muted-foreground">Campos ocultos, views públicas, alertas e validação anônima.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              to="/dashboard/audit/events"
              className="text-xs px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary inline-flex items-center gap-1.5 border border-primary/20"
            >
              <ListFilter className="w-3.5 h-3.5" /> Eventos detalhados
            </Link>
            <Link
              to="/dashboard/audit/headers"
              className="text-xs px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary inline-flex items-center gap-1.5 border border-primary/20"
            >
              Verificador de Headers <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Seletor de ambiente compartilhado com HeadersChecker */}
            <section className="glass-card p-4">
              <AuditEnvSelector />
            </section>

            {/* Resumo com contadores e taxas (%) por tipo */}
            <SecuritySummary activeEnvLabel={active.label} key={active.url} />

            {/* Validação ao vivo + revalidar */}
            <section className="glass-card p-6">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Validação ao vivo das views públicas
                </h2>
                <button
                  onClick={runAnonChecks}
                  disabled={revalidating}
                  className="text-xs px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "animate-spin" : ""}`} />
                  {revalidating ? "Revalidando…" : "Revalidar testes anônimos"}
                </button>
              </div>
              <div className="space-y-2">
                {anonChecks.map((c) => (
                  <div key={c.name} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    {c.status === "ok" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : c.status === "fail" ? (
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${c.status === "ok" ? "bg-green-500/10 text-green-400" : c.status === "fail" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {c.status === "ok" ? "OK" : c.status === "fail" ? "VAZAMENTO" : "INCONCLUSIVO"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Mapa de campos ocultos */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-primary" />
                Campos sensíveis ocultos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-3">Tabela origem</th>
                      <th className="text-left py-2 px-3">Exposição pública</th>
                      <th className="text-left py-2 px-3">Campo oculto</th>
                      <th className="text-left py-2 px-3">Por quê</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HIDDEN_FIELDS.map((f) => (
                      <tr key={f.table} className="border-b border-border/50">
                        <td className="py-3 px-3 font-mono text-xs text-foreground">{f.table}</td>
                        <td className="py-3 px-3 font-mono text-xs text-primary">{f.view}</td>
                        <td className="py-3 px-3 font-mono text-xs text-red-400">{f.field}</td>
                        <td className="py-3 px-3 text-muted-foreground">{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Painel de eventos HIBP / RLS / CORS */}
            <SecurityEventsPanel />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuditoriaSeguranca;
