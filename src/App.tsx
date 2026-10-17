import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { TutorialGuideProvider } from "@/contexts/TutorialGuideContext";
import { ThemeAccentProvider } from "@/contexts/ThemeAccentContext";
import TutorialGuideOverlay from "@/components/TutorialGuideOverlay";
import ProtectedRoute from "@/components/ProtectedRoute";
const Index = lazy(() => import("./pages/Index"));
const Vendas = lazy(() => import("./pages/Vendas"));
const MeusProdutos = lazy(() => import("./pages/MeusProdutos"));
const Afiliados = lazy(() => import("./pages/Afiliados"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Avisos = lazy(() => import("./pages/Avisos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Boost = lazy(() => import("./pages/Boost"));
const Trackeamento = lazy(() => import("./pages/Trackeamento"));
const Tutoriais = lazy(() => import("./pages/Tutoriais"));
const Denuncias = lazy(() => import("./pages/Denuncias"));
const AulasQueenify = lazy(() => import("./pages/AulasQueenify"));
const Colaboradores = lazy(() => import("./pages/Colaboradores"));
const PainelAluno = lazy(() => import("./pages/PainelAluno"));
const Cupons = lazy(() => import("./pages/Cupons"));
const RecuperacaoVendas = lazy(() => import("./pages/RecuperacaoVendas"));
const FunilVendas = lazy(() => import("./pages/FunilVendas"));
const AreaMembros = lazy(() => import("./pages/AreaMembros"));

const Automacoes = lazy(() => import("./pages/Automacoes"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Landing = lazy(() => import("./pages/Landing"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Taxas = lazy(() => import("./pages/Taxas"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Ajuda = lazy(() => import("./pages/Ajuda"));
const SobreNos = lazy(() => import("./pages/SobreNos"));
const CursosQueenify = lazy(() => import("./pages/CursosQueenify"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const PoliticaConteudo = lazy(() => import("./pages/PoliticaConteudo"));
const LicencaSoftware = lazy(() => import("./pages/LicencaSoftware"));
const TermosQueeniPay = lazy(() => import("./pages/TermosQueeniPay"));
const TermosContaDigital = lazy(() => import("./pages/TermosContaDigital"));
const PaginaDeStatus = lazy(() => import("./pages/PaginaDeStatus"));
const ComunicacoesOficiais = lazy(() => import("./pages/ComunicacoesOficiais"));
const Contato = lazy(() => import("./pages/Contato"));
const DenunciasProduto = lazy(() => import("./pages/DenunciasProduto"));
const ProibidoPlagio = lazy(() => import("./pages/ProibidoPlagio"));
const TransparenciaSalarial = lazy(() => import("./pages/TransparenciaSalarial"));
const CanalDenuncias = lazy(() => import("./pages/CanalDenuncias"));
const Ouvidoria = lazy(() => import("./pages/Ouvidoria"));
const CheckoutPersonalizar = lazy(() => import("./pages/CheckoutPersonalizar"));
const ConviteColaboracao = lazy(() => import("./pages/ConviteColaboracao"));
const TermosAnuncios = lazy(() => import("./pages/TermosAnuncios"));
const TermosAfiliados = lazy(() => import("./pages/TermosAfiliados"));
const RetencaoAlunos = lazy(() => import("./pages/RetencaoAlunos"));
const CursoPlayer = lazy(() => import("./pages/CursoPlayer"));
const ReportarBug = lazy(() => import("./pages/ReportarBug"));
const Sugestoes = lazy(() => import("./pages/Sugestoes"));
const Admin = lazy(() => import("./pages/Admin"));
const AuditoriaSeguranca = lazy(() => import("./pages/AuditoriaSeguranca"));
const HeadersChecker = lazy(() => import("./pages/HeadersChecker"));
const AuditEvents = lazy(() => import("./pages/AuditEvents"));
const EmailMarketing = lazy(() => import("./pages/EmailMarketing"));
const Termos = lazy(() => import("./pages/Termos"));
import { isSupabaseConfigured } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-5 py-12 text-foreground">
        <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-7 shadow-xl sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Queenify</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Conecte seu projeto para começar</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A interface está pronta. Para habilitar login, dados e pagamentos, configure as chaves públicas do seu projeto Supabase.
          </p>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-6">
            <li>Crie um arquivo <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code> na pasta Queenify.</li>
            <li>Copie os valores de <code className="rounded bg-muted px-1.5 py-0.5">.env.example</code> do seu próprio projeto Supabase.</li>
            <li>Preencha <code className="rounded bg-muted px-1.5 py-0.5">VITE_SUPABASE_URL</code> e <code className="rounded bg-muted px-1.5 py-0.5">VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
            <li>Reinicie o servidor local com <code className="rounded bg-muted px-1.5 py-0.5">npm run dev</code>.</li>
          </ol>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            Não use a chave <code>service_role</code> nem tokens privados em variáveis <code>VITE_</code>. Essas credenciais pertencem apenas às funções de servidor.
          </p>
        </section>
      </main>
    );
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <ThemeAccentProvider>
          <TutorialGuideProvider>
          <TutorialGuideOverlay />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Carregando página" /></div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/p/:userId" element={<PublicProfile />} />
            <Route path="/" element={<Landing />} />
            <Route path="/checkout/:productId" element={<Checkout />} />
            <Route path="/taxas" element={<Taxas />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/ajuda" element={<Ajuda />} />
            <Route path="/sobre" element={<SobreNos />} />
            <Route path="/cursos-queenify" element={<CursosQueenify />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/politica-de-conteudo" element={<PoliticaConteudo />} />
            <Route path="/licenca-de-software" element={<LicencaSoftware />} />
            <Route path="/termos-queenipay" element={<TermosQueeniPay />} />
            <Route path="/termos-conta-digital" element={<TermosContaDigital />} />
            <Route path="/status" element={<PaginaDeStatus />} />
            <Route path="/comunicacoes-oficiais" element={<ComunicacoesOficiais />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/denuncias-de-produto" element={<DenunciasProduto />} />
            <Route path="/proibido-plagio" element={<ProibidoPlagio />} />
            <Route path="/transparencia-salarial" element={<TransparenciaSalarial />} />
            <Route path="/canal-de-denuncias" element={<CanalDenuncias />} />
            <Route path="/ouvidoria" element={<Ouvidoria />} />
            <Route path="/convite/:token" element={<ConviteColaboracao />} />
            <Route path="/termos-anuncios" element={<TermosAnuncios />} />
            <Route path="/termos-afiliados" element={<TermosAfiliados />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
            <Route path="/meus-produtos" element={<ProtectedRoute><MeusProdutos /></ProtectedRoute>} />
            <Route path="/afiliados" element={<ProtectedRoute><Afiliados /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
            <Route path="/avisos" element={<ProtectedRoute><Avisos /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/boost" element={<ProtectedRoute><Boost /></ProtectedRoute>} />
            <Route path="/trackeamento" element={<ProtectedRoute><Trackeamento /></ProtectedRoute>} />
            <Route path="/anuncios" element={<Navigate to="/trackeamento" replace />} />
            <Route path="/tutoriais" element={<ProtectedRoute><Tutoriais /></ProtectedRoute>} />
            <Route path="/denuncias" element={<ProtectedRoute><Denuncias /></ProtectedRoute>} />
            <Route path="/aulas" element={<ProtectedRoute><AulasQueenify /></ProtectedRoute>} />
            <Route path="/colaboradores" element={<ProtectedRoute><Colaboradores /></ProtectedRoute>} />
            <Route path="/painel-aluno" element={<ProtectedRoute><PainelAluno /></ProtectedRoute>} />
            <Route path="/curso/:courseId" element={<ProtectedRoute><CursoPlayer /></ProtectedRoute>} />
            <Route path="/cupons" element={<ProtectedRoute><Cupons /></ProtectedRoute>} />
            <Route path="/recuperacao-vendas" element={<ProtectedRoute><RecuperacaoVendas /></ProtectedRoute>} />
            <Route path="/funil-vendas" element={<ProtectedRoute><FunilVendas /></ProtectedRoute>} />
            <Route path="/area-membros" element={<ProtectedRoute><AreaMembros /></ProtectedRoute>} />
            
            <Route path="/checkout-personalizar" element={<ProtectedRoute><CheckoutPersonalizar /></ProtectedRoute>} />
            <Route path="/automacoes" element={<ProtectedRoute><Automacoes /></ProtectedRoute>} />
            <Route path="/retencao-alunos" element={<ProtectedRoute><RetencaoAlunos /></ProtectedRoute>} />
            <Route path="/reportar-bug" element={<ProtectedRoute><ReportarBug /></ProtectedRoute>} />
            <Route path="/sugestoes" element={<ProtectedRoute><Sugestoes /></ProtectedRoute>} />
            <Route path="/email-marketing" element={<ProtectedRoute><EmailMarketing /></ProtectedRoute>} />
            <Route path="/termos" element={<ProtectedRoute><Termos /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/admin/auditoria-seguranca" element={<ProtectedRoute><AuditoriaSeguranca /></ProtectedRoute>} />
            <Route path="/dashboard/audit" element={<ProtectedRoute><AuditoriaSeguranca /></ProtectedRoute>} />
            <Route path="/dashboard/audit/events" element={<ProtectedRoute><AuditEvents /></ProtectedRoute>} />
            <Route path="/dashboard/audit/headers" element={<ProtectedRoute><HeadersChecker /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </TutorialGuideProvider>
          </ThemeAccentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
