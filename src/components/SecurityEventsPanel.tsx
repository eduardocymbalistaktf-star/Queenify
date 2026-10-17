import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ShieldOff, Lock, RefreshCw, Loader2 } from "lucide-react";

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

const SecurityEventsPanel = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let query = (supabase.from("security_events") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);
    if (filter !== "all") query = query.eq("event_type", filter);
    else query = query.in("event_type", RELEVANT_TYPES as any);
    const { data } = await query;
    setEvents((data as SecurityEvent[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="glass-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-primary" />
            Alertas de segurança
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            HIBP bloqueado, RLS negado e CORS recusado — dados sensíveis são redigidos automaticamente.
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
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
            {t !== "all" && counts[t] ? ` (${counts[t]})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-6 text-center">
          Nenhum evento registrado no período.
        </p>
      ) : (
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
              {events.map(e => {
                const md = (e.metadata ?? {}) as Record<string, any>;
                const endpoint = md.endpoint ?? md.path ?? "—";
                const method = md.method ?? "—";
                const reqId = md.request_id ?? md.requestId ?? "—";
                return (
                  <tr key={e.id} className="border-b border-border/40 align-top">
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase px-2 py-0.5 rounded-full border ${severityColor[e.severity] ?? severityColor.warning}`}>
                        {typeIcon[e.event_type]} {e.event_type}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-foreground max-w-[180px] truncate" title={endpoint}>{endpoint}</td>
                    <td className="py-2 px-2 font-mono text-[11px] text-muted-foreground">{method}</td>
                    <td className="py-2 px-2 text-xs text-foreground max-w-[260px] truncate" title={e.description}>{e.description}</td>
                    <td className="py-2 px-2 font-mono text-[10px] text-muted-foreground max-w-[120px] truncate" title={reqId}>{reqId}</td>
                    <td className="py-2 px-2 text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default SecurityEventsPanel;
