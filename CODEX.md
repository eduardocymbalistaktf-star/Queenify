# Queenify – instruções para o Codex

Projeto completo: React 18 + Vite 5 + TypeScript + Tailwind 3 + shadcn/ui + Supabase (auth, banco, storage, edge functions em supabase/functions) + TanStack Query + Framer Motion + Recharts + PWA.

## Rodar
1. `cp .env.example .env` (ou use seu próprio projeto Supabase e troque as variáveis VITE_SUPABASE_*)
2. `npm install`
3. `npm run dev` → http://localhost:8080

## Backend
- Migrações SQL: `supabase/migrations/` (aplique com `supabase db push` num projeto novo)
- Edge functions: `supabase/functions/` (`supabase functions deploy`)
- Secrets necessários nas functions: chaves de pagamento (Stripe/Mercado Pago) e de IA.

## Regras do projeto
- Tema preto/dourado com seções brancas `.section-light`; cores só via tokens em `src/index.css`.
- Modais de edição definidos fora do componente principal.
- RLS estrito em todas as tabelas; 18+; 1 coprodutor por conta.
- Não altere `src/integrations/supabase/client.ts` e `types.ts` (gerados).
