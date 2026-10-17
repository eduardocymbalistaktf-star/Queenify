// Suite de testes CORS para todas edge functions.
// Roda OPTIONS preflight e valida headers obrigatórios.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

const FUNCTIONS = [
  "ads-integration",
  "external-sale-webhook",
  "manage-roas-cron",
  "mp-create-payment",
  "mp-recheck-status",
  "mp-webhook",
  "purchase-webhook",
  "roas-alert-check",
  "support-chat",
  "track-conversion",
  "tracking-bot",
  "weekly-competition",
];

async function preflight(fn: string): Promise<Response> {
  return await fetch(`${FUNCTIONS_BASE}/${fn}`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, content-type, apikey",
    },
  });
}

for (const fn of FUNCTIONS) {
  Deno.test(`CORS preflight: ${fn}`, async () => {
    const res = await preflight(fn);
    await res.body?.cancel();

    // Preflight deve retornar 200 ou 204
    assert([200, 204].includes(res.status), `${fn} preflight retornou ${res.status}`);

    const allowOrigin = res.headers.get("access-control-allow-origin");
    assert(allowOrigin === "*" || allowOrigin === "https://example.com",
      `${fn} sem Access-Control-Allow-Origin (got: ${allowOrigin})`);

    const allowHeaders = (res.headers.get("access-control-allow-headers") ?? "").toLowerCase();
    assert(allowHeaders.includes("authorization"), `${fn} não permite header 'authorization'`);
    assert(allowHeaders.includes("content-type"), `${fn} não permite header 'content-type'`);
  });
}

Deno.test("CORS smoke: GET com Origin retorna allow-origin", async () => {
  const res = await fetch(`${FUNCTIONS_BASE}/support-chat`, {
    method: "OPTIONS",
    headers: { "Origin": "https://app.queenify.com.br", "Access-Control-Request-Method": "POST" },
  });
  await res.body?.cancel();
  const allowOrigin = res.headers.get("access-control-allow-origin");
  assertEquals(typeof allowOrigin, "string");
});
