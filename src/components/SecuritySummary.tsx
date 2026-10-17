import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ShieldOff, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type Period = "24h" | "7d" | "30d";
const PERIODS: { value: Period; label: string; hours: number }[] = [
  { value: "24h", label: "24h", hours: 24 },
  { value: "7d", label: "7 dias", hours: 24 * 7 },
  { value: "30d", label: "30 dias", hours: 24 * 30 },
];

const TYPES = [
  { key: "hibp_blocked", label: "HIBP bloqueado", icon: Lock, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { key: "rls_denied", label: "RLS negado", icon: ShieldOff, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { key: "cors_denied", label: "CORS recusado", icon: AlertTriangle, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
];

interface Props { activeEnvLabel?: string }

const SecuritySummary = ({ activeEnvLabel }: Props) => {
  const [period, setPeriod] = useState<Period>("7d");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - PERIODS.find(p => p.value === period)!.hours * 3600 * 1000).toISOString();
      const next: Record<string, number> = {};
      let totalCount = 0;
      await Promise.all(TYPES.map(async (t) => {
        const { count } = await (supabase.from("security_events") as any)
          .select("id", { count: "exact", head: true })
          .eq("event_type", t.key)
          .gte("created_at", since);
        next[t.key] = count ?? 0;
        totalCount += count ?? 0;
      }));
      setCounts(next);
      setTotal(totalCount);
      setLoading(false);
    })();
  }, [period]);

  return (
    <section className="glass-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Resumo de eventos
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Contadores e taxas (%) no período selecionado{activeEnvLabel ? ` — ambiente: ${activeEnvLabel}` : ""}.
          </p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                period === p.value
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TYPES.map(t => {
              const Icon = t.icon;
              const count = counts[t.key] ?? 0;
              const rate = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={t.key} className={`p-4 rounded-lg border ${t.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">{t.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{rate}% do total</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground">Total no período: <span className="text-foreground font-semibold">{total}</span></p>
            <Link to="/dashboard/audit/events" className="text-xs text-primary hover:underline">Ver todos os eventos →</Link>
          </div>
        </>
      )}
    </section>
  );
};

export default SecuritySummary;
