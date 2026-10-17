import { useEffect, useState, useCallback } from "react";

/**
 * Lê os ambientes salvos pelo HeadersChecker (localStorage "headers-checker-envs")
 * e mantém o ambiente ativo para a auditoria em "audit-active-env".
 *
 * Os dados de Supabase (events / summary) são globais — o seletor serve como
 * contexto visual para deixar claro qual ambiente está sendo inspecionado.
 * A revalidação anônima e os fetchs HEAD do HeadersChecker passam a respeitar
 * a URL escolhida quando relevante.
 */

export interface AuditEnv {
  label: string;
  url: string;
}

const ENVS_KEY = "headers-checker-envs";
const ACTIVE_KEY = "audit-active-env";

function readStoredEnvs(): AuditEnv[] {
  try {
    const raw = localStorage.getItem(ENVS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditEnv[];
    return Array.isArray(parsed) ? parsed.filter(e => e.label && e.url) : [];
  } catch {
    return [];
  }
}

function readActive(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

export function useAuditEnv() {
  const current: AuditEnv = {
    label: "Atual (preview)",
    url: typeof window !== "undefined" ? window.location.origin + "/" : "/",
  };

  const [envs, setEnvs] = useState<AuditEnv[]>(() => {
    const stored = readStoredEnvs();
    return [current, ...stored.filter(s => s.url !== current.url)];
  });

  const [activeUrl, setActiveUrlState] = useState<string>(() => {
    const saved = readActive();
    if (saved && envs.some(e => e.url === saved)) return saved;
    return current.url;
  });

  // Sincroniza com mudanças feitas no HeadersChecker em outra aba/página.
  useEffect(() => {
    const sync = () => {
      const stored = readStoredEnvs();
      setEnvs([current, ...stored.filter(s => s.url !== current.url)]);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveUrl = useCallback((url: string) => {
    setActiveUrlState(url);
    try { localStorage.setItem(ACTIVE_KEY, url); } catch { /* ignore */ }
  }, []);

  const active = envs.find(e => e.url === activeUrl) ?? current;

  return { envs, active, activeUrl, setActiveUrl };
}
