import { supabase } from "@/integrations/supabase/client";

type SecurityEventType =
  | "hibp_blocked"
  | "rls_denied"
  | "cors_denied"
  | "auth_failed"
  | "rate_limit_hit"
  | "suspicious_query"
  | "unauthorized_access"
  | "other";

type Severity = "info" | "warning" | "error" | "critical";

interface LogOptions {
  type: SecurityEventType;
  severity?: Severity;
  description: string;
  metadata?: Record<string, unknown>;
}

/** Best-effort. Falhas são engolidas pra não quebrar UX. */
export async function logSecurityEvent({
  type,
  severity = "warning",
  description,
  metadata = {},
}: LogOptions): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase.from("security_events") as any).insert({
      event_type: type,
      severity,
      description: description.slice(0, 1000),
      metadata,
      user_id: user?.id ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    });
  } catch {
    // silent
  }
}

/** Detecta erros típicos de RLS no PostgREST e loga. */
export function isRlsError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42501" ||
    error.code === "PGRST301" ||
    /row-level security|permission denied|new row violates/i.test(error.message ?? "")
  );
}
