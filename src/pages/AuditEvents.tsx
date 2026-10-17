import { useEffect, useMemo, useState, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/layouts/DashboardLayout";
import BackButton from "@/components/BackButton";
import AuditEnvSelector from "@/components/AuditEnvSelector";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuditEnv } from "@/hooks/useAuditEnv";
import {
  AlertTriangle, ShieldOff, Lock, RefreshCw, Loader2, Download, Search, Filter,
  ChevronDown, ArrowLeft, X, Copy, Check,
} from "lucide-react";

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  metadata: any;
  user_id: string | null;
  created_at: string;
}

const RELEVANT_TYPES = ["hibp_blocked", "rls_denied", "cors_denied"] as const;
type EventFilter = "all" | (typeof RELEVANT_TYPES)[number];

const PAGE_SIZE = 50;

const severityColor: Record<string, string> = {
  info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  error: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
};

const typeIcon: Record<string, JSX.Element> = {
  hibp_blocked: <Lock className="w-3.5 h-3.5" />,
  rls_denied: <ShieldOff className="w-3.5 h-3.5" />,
  cors_denied: <AlertTriangle className="w-3.5 h-3.5" />,
};

function csvEscape(v: any): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Extrai os campos normalizados de qualquer payload de metadata. */
function normalize(e: SecurityEvent) {
  const md = (e.metadata ?? {}) as Record<string, any>;
  return {
    endpoint: (md.endpoint ?? md.path ?? md.url ?? "") as string,
    method: (md.method ?? md.http_method ?? "") as string,
    reason: (md.reason ?? md.error ?? e.description ?? "") as string,
    request_id: (md.request_id ?? md.requestId ?? md.req_id ?? "") as string,
    user_id: e.user_id ?? "",
  };
}

const AuditEvents = () => {
  const { user } = useAuth();
  const { active } = useAuditEnv();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [reqIdQuery, setReqIdQuery] = useState("");
  const [endpointQuery, setEndpointQuery] = useState("");
  const [textQuery, setTextQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState<SecurityEvent | null>(null);
  const [copied, setCopied] = useState(false);

  const debouncedText = useDebounce(textQuery, 350);

  const buildQuery = useCallback((from: number, to: number) => {
    let q = (supabase.from("security_events") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (filter !== "all") q = q.eq("event_type", filter);
    else q = q.in("event_type", RELEVANT_TYPES as any);
    if (debouncedText.trim()) q = q.ilike("description", `%${debouncedText.trim()}%`);
    return q;
  }, [filter, debouncedText]);

  const load = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setEvents([]); setHasMore(true); }
    else setLoadingMore(true);

    const offset = reset ? 0 : events.length;
    const { data } = await buildQuery(offset, offset + PAGE_SIZE - 1);
    const next = (data as SecurityEvent[]) ?? [];

    setEvents(prev => reset ? next : [...prev, ...next]);
    setHasMore(next.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [buildQuery, events.length]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (!data) { setLoading(false); return; }
      await load(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Recarrega quando filtros (incluindo texto debounced) mudam.
  useEffect(() => {
    if (isAdmin) load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedText, isAdmin]);

  // Filtros client-side com debounce p/ request_id e endpoint.
  const debouncedReqId = useDebounce(reqIdQuery, 350);
  const debouncedEndpoint = useDebounce(endpointQuery, 350);

  const filtered = useMemo(() => {
    return events.filter(e => {
      const n = normalize(e);
      const ep = n.endpoint.toLowerCase();
      const rid = n.request_id.toLowerCase();
      if (debouncedReqId.trim() && !rid.includes(debouncedReqId.trim().toLowerCase())) return false;
      if (debouncedEndpoint.trim() && !ep.includes(debouncedEndpoint.trim().toLowerCase())) return false;
      return true;
    });
  }, [events, debouncedReqId, debouncedEndpoint]);

  const exportCsv = () => {
    // Colunas FIXAS, sempre na mesma ordem, com endpoint/method/reason normalizados.
    const headers = [
      "created_at", "event_type", "severity",
      "endpoint", "method", "reason", "request_id",
      "user_id", "description",
    ];
    const rows = filtered.map(e => {
      const n = normalize(e);
      return [
        e.created_at, e.event_type, e.severity,
        n.endpoint, n.method, n.reason, n.request_id,
        n.user_id, e.description,
      ].map(csvEscape).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPayload = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selected.metadata ?? {}, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin === false) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldOff className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Eventos de segurança</h1>
              <p className="text-sm text-muted-foreground">
                HIBP, RLS e CORS — busca avançada, paginação e export CSV. Ambiente:{" "}
                <span className="text-foreground font-medium">{active.label}</span>
              </p>
            </div>
          </div>
          <Link to="/dashboard/audit" className="text-xs px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar à auditoria
          </Link>
        </div>

        {/* Seletor de ambiente */}
        <div className="glass-card p-4">
          <AuditEnvSelector />
        </div>

        {/* Filtros */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="w-4 h-4 text-primary" /> Filtros avançados
            <span className="ml-auto text-[10px] text-muted-foreground font-normal">
              busca automática (debounce 350ms)
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["all", ...RELEVANT_TYPES] as EventFilter[]).map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filter === t
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "all" ? "Todos" : t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={reqIdQuery}
                onChange={e => setReqIdQuery(e.target.value)}
                placeholder="Request ID"
                className="w-full text-sm bg-background border border-border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={endpointQuery}
                onChange={e => setEndpointQuery(e.target.value)}
                placeholder="Endpoint (ex: /mp-webhook)"
                className="w-full text-sm bg-background border border-border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={textQuery}
                onChange={e => setTextQuery(e.target.value)}
                placeholder="Texto livre no motivo / descrição"
                className="w-full text-sm bg-background border border-border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {filtered.length} evento(s) exibido(s){events.length !== filtered.length && ` de ${events.length} carregado(s)`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => load(true)}
                className="text-xs px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar
              </button>
              <button
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="text-xs px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary inline-flex items-center gap-1.5 border border-primary/20 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> Exportar CSV ({filtered.length})
              </button>
            </div>
          </div>
        </section>

        {/* Tabela */}
        <section className="glass-card p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Nenhum evento encontrado.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-2">Tipo</th>
                      <th className="text-left py-2 px-2">Endpoint</th>
                      <th className="text-left py-2 px-2">Método</th>
                      <th className="text-left py-2 px-2">Motivo</th>
                      <th className="text-left py-2 px-2">Request ID</th>
                      <th className="text-left py-2 px-2">Quando</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => {
                      const n = normalize(e);
                      return (
                        <tr
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className="border-b border-border/40 align-top cursor-pointer hover:bg-secondary/30 transition-colors"
                          title="Clique para ver o payload completo"
                        >
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] uppercase px-2 py-0.5 rounded-full border ${severityColor[e.severity] ?? severityColor.warning}`}>
                              {typeIcon[e.event_type]} {e.event_type}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] text-foreground max-w-[180px] truncate" title={n.endpoint}>{n.endpoint || "—"}</td>
                          <td className="py-2 px-2 font-mono text-[11px] text-muted-foreground">{n.method || "—"}</td>
                          <td className="py-2 px-2 text-xs text-foreground max-w-[260px] truncate" title={n.reason}>{n.reason || "—"}</td>
                          <td className="py-2 px-2 font-mono text-[10px] text-muted-foreground max-w-[120px] truncate" title={n.request_id}>{n.request_id || "—"}</td>
                          <td className="py-2 px-2 text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(e.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => load(false)}
                    disabled={loadingMore}
                    className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                    Carregar mais
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Modal de payload */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={ev => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 p-5 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-flex items-center gap-1 text-[10px] uppercase px-2 py-0.5 rounded-full border ${severityColor[selected.severity] ?? severityColor.warning} shrink-0`}>
                  {typeIcon[selected.event_type]} {selected.event_type}
                </span>
                <h3 className="text-sm font-display font-semibold text-foreground truncate">
                  {selected.description}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {(() => {
                const n = normalize(selected);
                return (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Endpoint</p>
                      <p className="font-mono text-foreground break-all">{n.endpoint || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Método</p>
                      <p className="font-mono text-foreground">{n.method || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Motivo</p>
                      <p className="text-foreground">{n.reason || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Request ID</p>
                      <p className="font-mono text-foreground break-all">{n.request_id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Usuário</p>
                      <p className="font-mono text-foreground break-all">{n.user_id || "anônimo"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Quando</p>
                      <p className="text-foreground">
                        {new Date(selected.created_at).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "long" })}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Payload (metadata)</p>
                  <button
                    onClick={copyPayload}
                    className="text-[11px] px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "copiado" : "copiar"}
                  </button>
                </div>
                <pre className="bg-background border border-border rounded-md p-3 text-[11px] font-mono text-foreground overflow-x-auto max-h-[300px]">
                  {JSON.stringify(selected.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AuditEvents;
