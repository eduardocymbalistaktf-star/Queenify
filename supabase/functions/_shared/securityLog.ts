// Helper compartilhado pra registrar eventos de segurança em edge functions.
// Uso:
//   import { logEdgeSecurityEvent } from "../_shared/securityLog.ts";
//   await logEdgeSecurityEvent({ type: "rls_denied", endpoint: "mp-webhook", reason: error.message });
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type EdgeSecurityEvent = {
  type:
    | "rls_denied"
    | "cors_denied"
    | "auth_failed"
    | "rate_limit_hit"
    | "validation_failed"
    | "unauthorized_access"
    | "hibp_blocked"
    | "other";
  severity?: "info" | "warning" | "error" | "critical";
  endpoint: string;
  reason: string;
  userId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Lista de chaves cujo valor é redigido antes de logar — protege PII/segredos.
const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|cpf|email|phone|access_token|api[_-]?key/i;

function redact(obj: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!obj) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "string" && v.length > 500) {
      out[k] = v.slice(0, 500) + "…";
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function logEdgeSecurityEvent(evt: EdgeSecurityEvent): Promise<void> {
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const description = `[${evt.endpoint}] ${evt.reason}`.slice(0, 1000);
    await admin.from("security_events").insert({
      event_type: evt.type,
      severity: evt.severity ?? "warning",
      description,
      user_id: evt.userId ?? null,
      metadata: {
        endpoint: evt.endpoint,
        request_id: evt.requestId ?? null,
        ...redact(evt.metadata),
      },
    });
  } catch (e) {
    console.error("[securityLog] failed", e);
  }
}

/** Detecta erros de RLS no PostgREST. */
export function isRlsError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  return (
    e.code === "42501" ||
    e.code === "PGRST301" ||
    /row-level security|permission denied|new row violates/i.test(e.message ?? "")
  );
}
