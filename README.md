# Queenify

Painel de vendas e produtos digitais em React, Vite, TypeScript e Supabase. O ZIP recebido continha o código do app e as migrações, mas não as credenciais privadas nem a configuração do projeto de hospedagem.

## Desenvolvimento local

1. Use Node.js 20 ou mais recente.
2. Copie `.env.example` para `.env.local` e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para o seu projeto.
3. Execute `npm ci` e `npm run dev`.
4. Para gerar os arquivos de produção, execute `npm run build`.

Somente a URL e a chave publicável do Supabase podem usar o prefixo `VITE_`. Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, tokens do Mercado Pago, credenciais OAuth ou segredos de webhook em variáveis `VITE_`.

## Banco e funções

As migrações em `supabase/migrations` devem ser aplicadas em ordem. Para um projeto já conectado ao Supabase CLI, use `supabase link` e `supabase db push`. A migração `202610160001_security_hardening.sql` fecha gravação de vendas e matrículas pelo navegador, restringe a administração a sessões com MFA verificado e cria o limitador compartilhado das funções públicas.

Publique as Edge Functions após configurar os segredos pelo Supabase Dashboard ou CLI. Valores privados necessários incluem:

- `MERCADO_PAGO_ACCESS_TOKEN_TEST` ou `MERCADO_PAGO_ACCESS_TOKEN_LIVE`, conforme `MERCADO_PAGO_ENV`.
- `MERCADO_PAGO_WEBHOOK_SECRET` configurado no painel de Webhooks do Mercado Pago.
- `N8N_SUPPORT_WEBHOOK_URL`, apontando para um webhook de produção do n8n.
- `WEEKLY_COMPETITION_SECRET`, enviado pelo agendador no cabeçalho `x-cron-secret`.
- `LOVABLE_API_KEY` para o assistente de trackeamento, se esse recurso for usado.
- Credenciais OAuth de Meta e Google para as integrações de anúncios, quando habilitadas.

O projeto Supabase fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` às funções. A chave `service_role` só pode permanecer no ambiente de servidor.

O endereço de teste do n8n que veio no ZIP foi removido do código. Revogue esse webhook antigo no n8n e crie outro antes de reativar o chat de suporte. O código não consegue revogar um segredo que já foi publicado fora do repositório.

## Segurança e publicação

- Revise `public/docs/security-headers-hosting.md` e configure os cabeçalhos HTTP no provedor de hospedagem. Os arquivos `vercel.json` e `public/_headers` servem como configuração para Vercel e hospedagens compatíveis, respectivamente.
- Configure HSTS apenas depois de confirmar que o domínio e seus subdomínios usam HTTPS.
- Configure autenticação, SMTP, URLs de retorno, MFA e limites de tentativa no Supabase Auth.
- Aplique as migrações, publique as funções e teste o checkout com credenciais de sandbox antes de liberar pagamentos reais.
- Revise permissões e limites de cada integração externa antes de ativá-la.

O painel de auditoria anônima agora distingue falha, sucesso observado e resultado inconclusivo. Um projeto sem dados de teste não prova que as políticas RLS estão corretas; valide com uma conta anônima e duas contas autenticadas em ambiente de homologação.

## Estado dos recursos

O checkout gera a cobrança com o preço armazenado no banco e usa a mesma chave de idempotência em repetições da tentativa. Matrículas em cursos não podem ser inseridas diretamente pelo navegador; o fluxo que associa uma compra confirmada à conta do aluno ainda precisa ser conectado ao produto usado em produção. Se order bumps forem ativados, os itens e descontos também devem ser calculados e registrados no servidor antes de cobrar.
