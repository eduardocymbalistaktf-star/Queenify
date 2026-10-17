import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/layouts/DashboardLayout";
import BackButton from "@/components/BackButton";
import { ShieldCheck, AlertTriangle, CheckCircle2, Loader2, FileText, ExternalLink, Plus, X, RefreshCw } from "lucide-react";

interface CheckResult {
  header: string;
  expected: string;
  actual: string | null;
  ok: boolean;
  source: "http" | "meta" | "missing";
  notes?: string;
}

interface EnvResult {
  label: string;
  url: string;
  status: "ok" | "loading" | "error";
  error?: string;
  results: CheckResult[];
}

const REQUIRED = [
  { header: "content-security-policy", expectedHint: "default-src 'self'", notes: "CSP via meta tag (limitação do hosting Lovable)." },
  { header: "x-content-type-options", expectedHint: "nosniff" },
  { header: "x-frame-options", expectedHint: "SAMEORIGIN" },
  { header: "referrer-policy", expectedHint: "strict-origin-when-cross-origin" },
  { header: "permissions-policy", expectedHint: "geolocation=()" },
  { header: "strict-transport-security", expectedHint: "max-age=31536000", notes: "Só funciona via HTTP header — configure no Cloudflare/proxy do seu domínio." },
];

async function checkUrl(url: string): Promise<CheckResult[]> {
  let httpHeaders: Headers | null = null;
  let metaMap = new Map<string, string>();

  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store", mode: "cors" });
    httpHeaders = res.headers;
  } catch {
    // CORS pode bloquear — tenta fetch com no-cors (não dá pra ler headers, mas evita lançar).
    httpHeaders = null;
  }

  // Pra origem atual conseguimos ler meta tags do DOM.
  if (url.startsWith(window.location.origin)) {
    document.querySelectorAll<HTMLMetaElement>("meta[http-equiv]").forEach(m => {
      metaMap.set(m.httpEquiv.toLowerCase(), m.content);
    });
    document.querySelectorAll<HTMLMetaElement>("meta[name]").forEach(m => {
      const n = m.name.toLowerCase();
      if (["referrer", "permissions-policy"].includes(n)) {
        metaMap.set(n === "referrer" ? "referrer-policy" : n, m.content);
      }
    });
  } else {
    // Pra URLs externas, faz GET ao HTML e parseia meta tags.
    try {
      const html = await (await fetch(url, { cache: "no-store" })).text();
      const parser = new DOMParser().parseFromString(html, "text/html");
      parser.querySelectorAll<HTMLMetaElement>("meta[http-equiv]").forEach(m => {
        metaMap.set(m.httpEquiv.toLowerCase(), m.content);
      });
      parser.querySelectorAll<HTMLMetaElement>("meta[name]").forEach(m => {
        const n = m.name.toLowerCase();
        if (["referrer", "permissions-policy"].includes(n)) {
          metaMap.set(n === "referrer" ? "referrer-policy" : n, m.content);
        }
      });
    } catch { /* ignore */ }
  }

  return REQUIRED.map(r => {
    const httpVal = httpHeaders?.get(r.header) ?? null;
    const metaVal = metaMap.get(r.header) ?? null;
    const actual = httpVal ?? metaVal;
    const source: CheckResult["source"] = httpVal ? "http" : metaVal ? "meta" : "missing";
    const ok = !!actual && actual.toLowerCase().includes(r.expectedHint.toLowerCase().split(";")[0].split(",")[0].trim());
    return { header: r.header, expected: r.expectedHint, actual, ok, source, notes: r.notes };
  });
}

const STORAGE_KEY = "headers-checker-envs";

function loadStoredEnvs(): EnvResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { label: string; url: string }[];
    return parsed.map(e => ({ ...e, status: "loading" as const, results: [] }));
  } catch { return []; }
}

function persistEnvs(envs: EnvResult[]) {
  const minimal = envs.map(e => ({ label: e.label, url: e.url }));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal)); } catch { /* ignore */ }
}

const HeadersChecker = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [envs, setEnvs] = useState<EnvResult[]>(() => {
    const stored = loadStoredEnvs();
    const current: EnvResult = { label: "Atual (este preview)", url: window.location.origin + "/", status: "loading", results: [] };
    const merged = [current, ...stored.filter(s => s.url !== current.url)];
    return merged;
  });
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  // Persiste sempre que a lista mudar (ignora status/results).
  useEffect(() => { persistEnvs(envs); }, [envs.map(e => `${e.label}|${e.url}`).join(",")]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (!data) { setLoading(false); return; }
      await runChecks();
      setLoading(false);
    })();
  }, [user]);

  const runChecks = async () => {
    setEnvs(prev => prev.map(e => ({ ...e, status: "loading" })));
    const updated = await Promise.all(envs.map(async (e) => {
      try {
        const results = await checkUrl(e.url);
        return { ...e, results, status: "ok" as const };
      } catch (err) {
        return { ...e, status: "error" as const, error: (err as Error).message };
      }
    }));
    setEnvs(updated);
  };

  const addEnv = async () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    if (!url.endsWith("/")) url += "/";
    const newEnv: EnvResult = { label: newLabel.trim(), url, status: "loading", results: [] };
    setEnvs(prev => [...prev, newEnv]);
    setNewLabel(""); setNewUrl("");
    try {
      const results = await checkUrl(url);
      setEnvs(prev => prev.map(e => e.url === url ? { ...e, results, status: "ok" } : e));
    } catch (err) {
      setEnvs(prev => prev.map(e => e.url === url ? { ...e, status: "error", error: (err as Error).message } : e));
    }
  };

  const removeEnv = (url: string) => setEnvs(prev => prev.filter(e => e.url !== url));

  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin === false) return <Navigate to="/dashboard" replace />;

  // Calcula diff por header entre os ambientes.
  const buildDiffRow = (header: string) => {
    const cells = envs.map(e => e.results.find(r => r.header === header));
    const distinctValues = new Set(cells.map(c => c?.actual ?? "(ausente)"));
    return { cells, hasDiff: distinctValues.size > 1 };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Verificador de Security Headers</h1>
            <p className="text-sm text-muted-foreground">CSP, HSTS, X-Frame-Options & cia — comparação multi-ambiente.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Adicionar ambiente */}
            <section className="glass-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">Adicionar ambiente (staging/prod)</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Nome (ex: Produção)"
                  className="flex-1 min-w-[140px] text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:border-primary"
                />
                <input
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://app.queenify.com.br"
                  className="flex-[2] min-w-[200px] text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:border-primary font-mono"
                />
                <button
                  onClick={addEnv}
                  className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
                <button
                  onClick={runChecks}
                  className="text-sm px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Revalidar
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ambientes externos podem bloquear leitura de headers via CORS — nesse caso só meta tags aparecerão.
              </p>
            </section>

            {/* Tabela comparativa */}
            <section className="glass-card p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-3">Header</th>
                      {envs.map(e => (
                        <th key={e.url} className="text-left py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{e.label}</span>
                            {envs.length > 1 && (
                              <button onClick={() => removeEnv(e.url)} className="text-muted-foreground hover:text-red-400">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground normal-case font-normal mt-0.5 truncate max-w-[180px]" title={e.url}>{e.url}</div>
                          {e.status === "loading" && <Loader2 className="w-3 h-3 animate-spin mt-1" />}
                          {e.status === "error" && <span className="text-[10px] text-red-400">{e.error}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REQUIRED.map(r => {
                      const { cells, hasDiff } = buildDiffRow(r.header);
                      return (
                        <tr key={r.header} className={`border-b border-border/40 align-top ${hasDiff ? "bg-yellow-500/5" : ""}`}>
                          <td className="py-3 px-3 font-mono text-xs text-foreground">
                            {r.header}
                            {hasDiff && <span className="ml-2 text-[9px] uppercase text-yellow-400 px-1.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">diff</span>}
                          </td>
                          {cells.map((c, i) => (
                            <td key={i} className="py-3 px-3">
                              {!c ? (
                                <span className="text-muted-foreground italic text-xs">—</span>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    {c.ok ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                    ) : (
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                    )}
                                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-full ${
                                      c.source === "http" ? "bg-green-500/10 text-green-400" :
                                      c.source === "meta" ? "bg-yellow-500/10 text-yellow-400" :
                                      "bg-red-500/10 text-red-400"
                                    }`}>{c.source}</span>
                                  </div>
                                  <div className="font-mono text-[10px] text-foreground max-w-[200px] truncate" title={c.actual ?? ""}>
                                    {c.actual ?? <span className="text-muted-foreground italic">(ausente)</span>}
                                  </div>
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="glass-card p-6 border border-yellow-500/20">
              <h2 className="text-base font-display font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-400" />
                HSTS via hosting próprio
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                O hosting da Lovable não permite HTTP headers customizados. Pra HSTS no seu domínio, configure no Cloudflare/Netlify/nginx.
              </p>
              <a
                href={`${import.meta.env.BASE_URL}docs/security-headers-hosting.md`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Abrir guia de configuração <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HeadersChecker;
