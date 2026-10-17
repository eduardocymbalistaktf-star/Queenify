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
import Index from "./pages/Index";
import Vendas from "./pages/Vendas";
import MeusProdutos from "./pages/MeusProdutos";
import Afiliados from "./pages/Afiliados";
import Financeiro from "./pages/Financeiro";
import Avisos from "./pages/Avisos";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Marketplace from "./pages/Marketplace";
import Boost from "./pages/Boost";
import Trackeamento from "./pages/Trackeamento";
import Tutoriais from "./pages/Tutoriais";
import Denuncias from "./pages/Denuncias";
import AulasQueenify from "./pages/AulasQueenify";
import Colaboradores from "./pages/Colaboradores";
import PainelAluno from "./pages/PainelAluno";
import Cupons from "./pages/Cupons";
import RecuperacaoVendas from "./pages/RecuperacaoVendas";
import FunilVendas from "./pages/FunilVendas";
import AreaMembros from "./pages/AreaMembros";

import Automacoes from "./pages/Automacoes";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import Landing from "./pages/Landing";
import Checkout from "./pages/Checkout";
import Taxas from "./pages/Taxas";
import FAQ from "./pages/FAQ";
import Ajuda from "./pages/Ajuda";
import SobreNos from "./pages/SobreNos";
import CursosQueenify from "./pages/CursosQueenify";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import PoliticaConteudo from "./pages/PoliticaConteudo";
import LicencaSoftware from "./pages/LicencaSoftware";
import TermosQueeniPay from "./pages/TermosQueeniPay";
import TermosContaDigital from "./pages/TermosContaDigital";
import PaginaDeStatus from "./pages/PaginaDeStatus";
import ComunicacoesOficiais from "./pages/ComunicacoesOficiais";
import Contato from "./pages/Contato";
import DenunciasProduto from "./pages/DenunciasProduto";
import ProibidoPlagio from "./pages/ProibidoPlagio";
import TransparenciaSalarial from "./pages/TransparenciaSalarial";
import CanalDenuncias from "./pages/CanalDenuncias";
import Ouvidoria from "./pages/Ouvidoria";
import CheckoutPersonalizar from "./pages/CheckoutPersonalizar";
import ConviteColaboracao from "./pages/ConviteColaboracao";
import TermosAnuncios from "./pages/TermosAnuncios";
import TermosAfiliados from "./pages/TermosAfiliados";
import RetencaoAlunos from "./pages/RetencaoAlunos";
import CursoPlayer from "./pages/CursoPlayer";
import ReportarBug from "./pages/ReportarBug";
import Sugestoes from "./pages/Sugestoes";
import Admin from "./pages/Admin";
import AuditoriaSeguranca from "./pages/AuditoriaSeguranca";
import HeadersChecker from "./pages/HeadersChecker";
import AuditEvents from "./pages/AuditEvents";
import EmailMarketing from "./pages/EmailMarketing";
import Termos from "./pages/Termos";
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
          </TutorialGuideProvider>
          </ThemeAccentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
