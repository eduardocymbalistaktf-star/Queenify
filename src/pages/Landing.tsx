import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { trackPageView } from "@/hooks/usePageTracking";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Headphones, Zap, MousePointerClick, Cpu,
  CreditCard, Clock, PaintBucket, Handshake, Store, Users,
  ChevronDown,
  Sparkles, Smartphone, MessageCircle, Megaphone, Menu, X,
  TrendingUp, BarChart3, Globe, Bot, Rocket, ArrowRight,
  CheckCircle2, Play, Target, Layers, RefreshCcw, Gauge,
} from "lucide-react";
import queenifyBee from "@/assets/queenify-bee-blue.svg";
import dashboardMockup from "@/assets/dashboard-mockup.jpg";
import mobileMockup from "@/assets/mobile-mockup.jpg";

/* ─── Animations ─── */
const fadeUp = { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } } };
const slideInLeft = { hidden: { opacity: 0, x: -80 }, visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const } } };
const slideInRight = { hidden: { opacity: 0, x: 80 }, visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const } } };
const rotateIn = { hidden: { opacity: 0, rotate: -5, scale: 0.9 }, visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } } };

/* ─── Typing animation hook ─── */
function useTypingEffect(texts: string[], typingSpeed = 80, deletingSpeed = 40, pauseMs = 2000) {
  const [display, setDisplay] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIndex < current.length) {
      timeout = setTimeout(() => { setCharIndex(c => c + 1); setDisplay(current.slice(0, charIndex + 1)); }, typingSpeed);
    } else if (!isDeleting && charIndex === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => { setCharIndex(c => c - 1); setDisplay(current.slice(0, charIndex - 1)); }, deletingSpeed);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((textIndex + 1) % texts.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pauseMs]);

  return display;
}

/* ─── Floating particle component ─── */
const FloatingParticle = ({ delay = 0, x = 0, y = 0, size = 3 }: { delay?: number; x?: number; y?: number; size?: number }) => (
  <motion.div
    className="absolute rounded-full"
    style={{ width: size * 1.5, height: size * 1.5, left: `${x}%`, top: `${y}%`, background: 'hsl(196 92% 56% / 0.6)', boxShadow: `0 0 ${size * 4}px hsl(196 92% 56% / 0.4)` }}
    animate={{ y: [0, -25, 0], opacity: [0.3, 0.9, 0.3], scale: [1, 1.4, 1] }}
    transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

/* ─── Golden streak (vivid diagonal line) ─── */
const GoldenStreak = ({ delay = 0, x = 0, y = 0, rotation = 45, width = 80 }: { delay?: number; x?: number; y?: number; rotation?: number; width?: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, width: `${width}px`, height: '2px', rotate: `${rotation}deg`, background: 'linear-gradient(90deg, transparent, hsl(196 92% 56% / 0.5), hsl(196 92% 56% / 0.8), transparent)', boxShadow: '0 0 8px hsl(196 92% 56% / 0.3)' }}
    animate={{ opacity: [0, 0.8, 0], scaleX: [0.3, 1, 0.3] }}
    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

/* ─── Glow dot (bright pulsing point) ─── */
const GlowDot = ({ delay = 0, x = 0, y = 0, size = 2 }: { delay?: number; x?: number; y?: number; size?: number }) => (
  <motion.div
    className="absolute rounded-full"
    style={{ left: `${x}%`, top: `${y}%`, width: size * 2, height: size * 2, background: 'hsl(196 92% 56%)', boxShadow: `0 0 ${size * 6}px hsl(196 92% 56% / 0.7), 0 0 ${size * 12}px hsl(196 92% 56% / 0.3)` }}
    animate={{ opacity: [0.1, 1, 0.1], scale: [0.5, 1.5, 0.5] }}
    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);
const whyFeatures = [
  { icon: Layers, title: "Cadastro de produtos", desc: "Organize as informações dos seus produtos digitais. Os tipos de produto e as entregas disponíveis podem variar durante a prévia." },
  { icon: TrendingUp, title: "Checkout configurável", desc: "Conheça as opções de personalização disponíveis. Cobranças dependem da ativação do provedor de pagamento." },
  { icon: Zap, title: "Dados financeiros", desc: "Consulte os registros da conta. Saques e prazos ainda dependem da integração financeira." },
];

const platformFeatures = [
  { icon: PaintBucket, title: "Checkout configurável", desc: "Personalize os elementos disponíveis na tela de checkout. As cobranças aguardam a validação do provedor." },
  { icon: RefreshCcw, title: "Recuperação de pagamentos", desc: "Os fluxos automatizados de recuperação ainda precisam de integração e testes com provedores." },
  { icon: BarChart3, title: "Painel de dados", desc: "Visualize os registros disponíveis na conta. Atualizações dependem das integrações conectadas." },
  { icon: Gauge, title: "Assinaturas", desc: "A cobrança recorrente ainda não está liberada para uso comercial." },
];

const powerFeatures = [
  { icon: Target, title: "Pixel & Tracking", desc: "Ferramentas de rastreamento para Meta e TikTok em configuração; Google Ads permanece pausado." },
  { icon: Bot, title: "Suporte com IA", desc: "QueenIA especializada em Queenify. As respostas dependem da publicação da função e da configuração do provedor de IA." },
  { icon: Handshake, title: "Co-produção & Sócios", desc: "Cadastros e regras de comissão dependem da implementação do fluxo de pagamento e divisão de valores." },
  { icon: Users, title: "Marketplace de Afiliados", desc: "Explore produtos e solicitações de afiliação. A atribuição e o pagamento de comissões precisam de validação ponta a ponta." },
];

const techGrid = [
  { icon: CreditCard, label: "PIX & Cartão" },
  { icon: PaintBucket, label: "Checkout customizável" },
  { icon: Handshake, label: "Co-produção & sócios" },
  { icon: Store, label: "Marketplace de afiliados" },
  { icon: Users, label: "Área de membros" },
  { icon: Smartphone, label: "Mobile-first" },
  { icon: Target, label: "Pixel & Tracking" },
  { icon: Cpu, label: "Automações & API" },
  { icon: MousePointerClick, label: "Funil & Upsell" },
  { icon: Sparkles, label: "Cupons & Webhooks" },
  { icon: Bot, label: "Suporte com IA" },
];

const faqs = [
  { q: "Quais são as taxas?", a: "As taxas ainda estão em validação. Confira as condições oficiais na Queenify antes de cadastrar uma venda; não use valores indicativos como tarifa vigente." },
  { q: "Quando recebo o dinheiro das vendas?", a: "Saques e prazos ainda não estão habilitados. A disponibilidade dependerá da integração financeira e das condições informadas antes do lançamento." },
  { q: "Quais produtos posso cadastrar?", a: "A Queenify está preparada para organizar produtos digitais, como cursos e e-books. Verifique na própria conta quais tipos e entregas estão habilitados." },
  { q: "Como funcionam afiliados e comissões?", a: "As telas de afiliados estão disponíveis para configuração, mas atribuição e pagamento de comissões precisam de validação com o fluxo real de venda." },
  { q: "Posso cobrar no checkout?", a: "A cobrança depende da ativação e dos testes do provedor de pagamento. Não aceite pedidos reais enquanto a Queenify estiver em prévia." },
  { q: "O checkout é seguro?", a: "A autenticação usa Supabase e os acessos ao banco têm políticas. A Queenify não declara certificação PCI DSS própria; o processamento depende do provedor configurado." },
  { q: "Existe suporte se eu tiver problemas?", a: "A QueenIA e os canais de atendimento estão em configuração. Consulte a Central de Ajuda para ver as opções disponíveis." },
  { q: "O que são as automações?", a: "Algumas telas de automação estão disponíveis para configuração. Cada fluxo precisa ser ativado e testado com o respectivo serviço antes de uso." },
];

const navLinks = [
  { label: "Recursos", href: "#features" },
  { label: "Taxas", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Ajuda", href: "/ajuda" },
  { label: "Sobre nós", href: "/sobre" },
];

/* ─── Parallax hook for sections ─── */
function useParallax(offset = 80) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);
  return { ref, y, opacity };
}

/* ─── Ultra-realistic showcase: laptop + phone, both running a real Queenify dashboard clone ─── */

const realisticSales = [
  { time: "agora", title: "Nova venda aprovada", body: "Mentoria Lucros Reais — R$ 1.497,00 via Pix" },
  { time: "1 min atrás", title: "Pagamento confirmado", body: "Curso Tráfego Direto — R$ 297,00 no cartão" },
  { time: "3 min atrás", title: "Order Bump aceito", body: "Pack de Bônus VIP — R$ 97,00 adicionado" },
  { time: "8 min atrás", title: "Comissão de afiliado", body: "Você recebeu R$ 148,50 da venda #4821" },
];

const CinematicShowcase = () => {
  return (
    <div
      className="hidden lg:flex items-center justify-center relative w-full h-[600px]"
      style={{ perspective: 1800 }}
    >
      {/* Soft gold halo */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 flex items-center justify-center"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-[520px] h-[520px] rounded-full bg-primary/[0.22] blur-[140px]" />
      </motion.div>

      {/* Laptop — gentle screen pan L→R */}
      <motion.div
        className="absolute"
        initial={{ opacity: 0, x: -30, scale: 0.92 }}
        animate={{
          opacity: 1,
          x: -40,
          scale: 0.96,
          rotateY: [-18, -6, 6, 18, 6, -6, -18],
        }}
        transition={{
          opacity: { duration: 0.8 },
          x: { duration: 0.8 },
          scale: { duration: 0.8 },
          rotateY: { duration: 12, ease: "easeInOut", repeat: Infinity },
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <UltraRealisticLaptop />
      </motion.div>

      {/* Phone with real Queenify dashboard mobile view */}
      <motion.div
        className="absolute right-2"
        initial={{ opacity: 0, x: 60, scale: 0.92 }}
        animate={{ opacity: 1, x: 20, scale: 1, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.7, delay: 0.2 },
          x: { duration: 0.7, delay: 0.2 },
          scale: { duration: 0.7, delay: 0.2 },
          y: { duration: 5.5, ease: "easeInOut", repeat: Infinity },
        }}
      >
        <UltraRealisticPhone />
      </motion.div>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────
   Ultra-realistic LAPTOP — silver chassis, hinge, base, keyboard, trackpad
   Inside the screen: pixel-faithful clone of the Queenify /dashboard
   ─────────────────────────────────────────────────────────────────────── */
const UltraRealisticLaptop = () => (
  <div className="relative" style={{ transformStyle: "preserve-3d" }}>
    {/* ── Lid (screen) ── */}
    <div
      className="relative"
      style={{
        width: 560,
        height: 350,
        borderRadius: 16,
        padding: 12,
        background:
          "linear-gradient(160deg, hsl(0 0% 28%) 0%, hsl(0 0% 16%) 35%, hsl(0 0% 8%) 100%)",
        boxShadow:
          "0 30px 60px -20px hsl(0 0% 0% / 0.75), 0 0 0 1px hsl(0 0% 100% / 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.12), inset 0 -1px 0 hsl(0 0% 0% / 0.5)",
      }}
    >
      {/* Camera */}
      <div className="absolute top-[4px] left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <div className="w-[3px] h-[3px] rounded-full bg-black/90 ring-1 ring-white/10" />
      </div>
      {/* Screen bezel + display */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: 6,
          background: "hsl(0 0% 0%)",
          boxShadow: "inset 0 0 0 1px hsl(0 0% 100% / 0.04)",
        }}
      >
        <DashboardClone variant="desktop" />
        {/* Glass reflection */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, hsl(0 0% 100% / 0.08) 45%, transparent 60%)",
          }}
          animate={{ x: ["-100%", "120%"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        />
      </div>
    </div>

    {/* ── Hinge (thin dark band) ── */}
    <div
      className="relative mx-auto"
      style={{
        width: 540,
        height: 4,
        background: "linear-gradient(180deg, hsl(0 0% 18%), hsl(0 0% 8%))",
        borderRadius: "2px 2px 0 0",
      }}
    />

    {/* ── Base / keyboard deck ── */}
    <div
      className="relative mx-auto"
      style={{
        width: 620,
        height: 24,
        marginTop: -1,
        background:
          "linear-gradient(180deg, hsl(0 0% 82%) 0%, hsl(0 0% 70%) 30%, hsl(0 0% 48%) 70%, hsl(0 0% 30%) 100%)",
        borderRadius: "0 0 16px 16px",
        boxShadow:
          "0 28px 40px -14px hsl(0 0% 0% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.5), inset 0 -1px 0 hsl(0 0% 0% / 0.4)",
      }}
    >
      {/* Trackpad notch */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[18px] rounded-b-[3px]"
        style={{
          width: 110,
          height: 5,
          background:
            "linear-gradient(180deg, hsl(0 0% 22%) 0%, hsl(0 0% 14%) 100%)",
          boxShadow: "inset 0 1px 0 hsl(0 0% 0% / 0.5)",
        }}
      />
      {/* Subtle base shadow underneath */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-[80%] h-3 rounded-full"
        style={{ background: "radial-gradient(ellipse, hsl(0 0% 0% / 0.4), transparent 70%)" }}
      />
    </div>
  </div>
);

/* ───────────────────────────────────────────────────────────────────────
   Ultra-realistic PHONE (iPhone-style, no brand) with mobile dashboard
   ─────────────────────────────────────────────────────────────────────── */
const UltraRealisticPhone = () => (
  <div
    className="relative"
    style={{
      width: 232,
      height: 478,
      borderRadius: 44,
      padding: 7,
      background:
        "linear-gradient(145deg, hsl(0 0% 22%) 0%, hsl(0 0% 10%) 50%, hsl(0 0% 4%) 100%)",
      boxShadow:
        "0 35px 70px -20px hsl(0 0% 0% / 0.7), 0 0 0 1px hsl(0 0% 100% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.18), inset 0 -1px 0 hsl(0 0% 0% / 0.4)",
    }}
  >
    {/* Side buttons (volume + power) — physical hardware details */}
    <div className="absolute -left-[3px] top-[100px] w-[3px] h-[28px] rounded-l" style={{ background: "linear-gradient(90deg, hsl(0 0% 0%), hsl(0 0% 28%))" }} />
    <div className="absolute -left-[3px] top-[140px] w-[3px] h-[44px] rounded-l" style={{ background: "linear-gradient(90deg, hsl(0 0% 0%), hsl(0 0% 28%))" }} />
    <div className="absolute -left-[3px] top-[195px] w-[3px] h-[44px] rounded-l" style={{ background: "linear-gradient(90deg, hsl(0 0% 0%), hsl(0 0% 28%))" }} />
    <div className="absolute -right-[3px] top-[150px] w-[3px] h-[68px] rounded-r" style={{ background: "linear-gradient(270deg, hsl(0 0% 0%), hsl(0 0% 28%))" }} />

    {/* Inner bezel */}
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        borderRadius: 38,
        background: "hsl(0 0% 0%)",
        boxShadow: "inset 0 0 0 1.5px hsl(0 0% 100% / 0.05)",
      }}
    >
      {/* Dynamic Island (sensor cluster) */}
      <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[82px] h-[24px] rounded-full z-30 flex items-center justify-center" style={{ background: "hsl(0 0% 0%)" }}>
        <div className="w-1 h-1 rounded-full mr-1" style={{ background: "hsl(0 0% 18%)" }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(0 0% 8%)" }} />
      </div>

      {/* Mobile dashboard view */}
      <DashboardClone variant="mobile" />

      {/* Glass reflection */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, hsl(0 0% 100% / 0.07) 45%, transparent 60%)",
        }}
        animate={{ x: ["-100%", "120%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
      />
    </div>
  </div>
);

/* ───────────────────────────────────────────────────────────────────────
   DASHBOARD CLONE — pixel-faithful re-creation of /dashboard
   Renders exact same colors, sidebar, KPIs, chart and lists as the real app.
   Two variants: 'desktop' (laptop) and 'mobile' (phone, no sidebar).
   ─────────────────────────────────────────────────────────────────────── */
const DashboardClone = ({ variant }: { variant: "desktop" | "mobile" }) => {
  if (variant === "mobile") return <DashboardCloneMobile />;
  return <DashboardCloneDesktop />;
};

const sidebarMenuClone = [
  { label: "Dashboard", icon: "▦", active: true },
  { label: "Gerenciar Produtos", icon: "▤" },
  { label: "Gestão de Vendas", icon: "$" },
  { label: "Colaboradores", icon: "◉" },
  { label: "Financeiro", icon: "◈" },
  { label: "Avisos", icon: "♪" },
  { label: "Marketplace", icon: "▣" },
  { label: "Trackeamento", icon: "✛" },
  { label: "Automações", icon: "⚡" },
  { label: "Tutoriais", icon: "▸" },
  { label: "Aulas Queenify", icon: "🎓" },
];

/** Desktop dashboard clone — inside laptop screen */
const DashboardCloneDesktop = () => (
  <div
    className="w-full h-full flex"
    style={{
      // Match real dashboard tokens: dark theme, near-black background, electric blue accent (196 92% 58%)
      background: "hsl(0 0% 7%)",
      color: "hsl(0 0% 95%)",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: 8,
    }}
  >
    {/* Sidebar */}
    <aside
      className="flex-shrink-0 flex flex-col"
      style={{
        width: 102,
        background: "hsl(0 0% 5%)",
        borderRight: "1px solid hsl(0 0% 12%)",
      }}
    >
      <div className="px-2.5 py-3 flex items-center gap-1.5">
        <img src={queenifyBee} alt="" className="w-3 h-3" />
        <span className="font-bold text-[8px] tracking-tight">Queenify</span>
      </div>

      <nav className="flex-1 px-1.5 space-y-[2px] overflow-hidden">
        {sidebarMenuClone.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-1.5 px-1.5 py-[5px] rounded"
            style={{
              background: item.active ? "hsl(0 0% 12%)" : "transparent",
              color: item.active ? "hsl(196 92% 56%)" : "hsl(0 0% 70%)",
              fontSize: 6.5,
              fontWeight: item.active ? 600 : 400,
            }}
          >
            <span className="w-2 text-center text-[6px]" style={{ color: item.active ? "hsl(196 92% 56%)" : "hsl(0 0% 50%)" }}>
              {item.icon}
            </span>
            <span className="truncate flex-1">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Boost card */}
      <div
        className="mx-1.5 mb-2 p-1.5 rounded"
        style={{
          background: "linear-gradient(135deg, hsl(196 92% 56%), hsl(196 92% 46%))",
          color: "hsl(0 0% 8%)",
        }}
      >
        <p className="text-[6.5px] font-bold leading-tight">Impulsione seus produtos</p>
        <p className="text-[5.5px] opacity-80 mt-[1px] leading-tight">Planos indicativos em preparação.</p>
        <div className="mt-1 inline-flex px-1.5 py-[2px] rounded text-[5.5px] font-semibold" style={{ background: "hsl(0 0% 100% / 0.25)" }}>
          Ver planos →
        </div>
      </div>

      {/* Support */}
      <div className="px-2 pb-2 flex items-center gap-1.5">
        <div className="relative">
          <div className="w-2 h-2 rounded-sm" style={{ background: "hsl(0 0% 35%)" }} />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full" style={{ background: "hsl(142 71% 45%)" }} />
        </div>
        <div>
          <p className="text-[6px] font-medium">Suporte</p>
          <p className="text-[5px]" style={{ color: "hsl(196 92% 56%)" }}>Em configuração</p>
        </div>
      </div>
    </aside>

    {/* Main area */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header
        className="flex items-center justify-between px-3 py-2"
        style={{
          background: "hsl(0 0% 5%)",
          borderBottom: "1px solid hsl(0 0% 12%)",
        }}
      >
        <div className="flex items-center gap-2 flex-1 max-w-[160px]">
          <div className="flex-1 px-1.5 py-1 rounded text-[6px]" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)", color: "hsl(0 0% 50%)" }}>
            Buscar...
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px]" style={{ background: "hsl(0 0% 12%)", color: "hsl(0 0% 70%)" }}>
            ♪
          </div>
          <div className="w-4 h-4 rounded-full" style={{ background: "linear-gradient(135deg, hsl(196 92% 56%), hsl(196 92% 36%))" }} />
        </div>
      </header>

      {/* Main scroll */}
      <main className="flex-1 p-2.5 overflow-hidden" style={{ background: "hsl(0 0% 7%)" }}>
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-bold text-[10px] leading-tight">Dashboard do Produtor</h1>
            <p className="text-[6.5px]" style={{ color: "hsl(0 0% 55%)" }}>Bem-vindo de volta, Produtor!</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="px-1.5 py-1 rounded text-[6.5px] flex items-center gap-1" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
              📅 Últimos 30 dias ▾
            </div>
            <div className="px-2 py-1 rounded text-[6.5px] font-semibold" style={{ background: "linear-gradient(135deg, hsl(196 92% 56%), hsl(196 92% 46%))", color: "hsl(0 0% 8%)" }}>
              + Novo Produto
            </div>
          </div>
        </div>

        {/* KPI cards (matches StatsCards) */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {/* Highlight card (inverted white) */}
          <div
            className="p-2 rounded col-span-1"
            style={{
              background: "hsl(0 0% 100%)",
              color: "hsl(0 0% 8%)",
              boxShadow: "0 0 0 1px hsl(196 92% 56% / 0.3), 0 4px 12px -4px hsl(196 92% 56% / 0.4)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[6px] opacity-60">Vendas</p>
                <p className="text-[5.5px] opacity-50">Últimos 30 dias</p>
              </div>
              <span className="text-[5px] font-bold px-1 py-[1px] rounded" style={{ background: "hsl(196 92% 56% / 0.15)", color: "hsl(196 92% 36%)" }}>★ DESTAQUE</span>
            </div>
            <p className="font-bold text-[12px] mt-1">R$ 47.892</p>
            <span className="text-[6px] font-semibold" style={{ color: "hsl(142 71% 45%)" }}>↗ Ativo</span>
          </div>

          {[
            { title: "Vendas Hoje", value: "R$ 2.341", sub: "+ 8 vendas" },
            { title: "Saldo Disponível", value: "R$ 47.892", sub: "Solicitar Saque" },
            { title: "Produtos Ativos", value: "12", sub: "" },
          ].map((c) => (
            <div
              key={c.title}
              className="p-2 rounded"
              style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}
            >
              <p className="text-[6px]" style={{ color: "hsl(0 0% 55%)" }}>{c.title}</p>
              <p className="font-bold text-[10px] mt-1">{c.value}</p>
              {c.sub && (
                <p className="text-[5.5px] mt-0.5" style={{ color: c.sub.includes("Solicitar") ? "hsl(0 0% 65%)" : "hsl(142 71% 45%)" }}>
                  {c.sub.includes("Solicitar") ? c.sub : `↗ ${c.sub}`}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Sales chart */}
        <div
          className="p-2 rounded mb-2"
          style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-semibold text-[7px]">Vendas por Período</p>
            <div className="flex gap-1">
              <span className="text-[5.5px] px-1 py-[1px] rounded" style={{ background: "hsl(196 92% 56% / 0.15)", color: "hsl(196 92% 56%)" }}>30D</span>
              <span className="text-[5.5px] px-1 py-[1px] rounded" style={{ color: "hsl(0 0% 55%)" }}>7D</span>
              <span className="text-[5.5px] px-1 py-[1px] rounded" style={{ color: "hsl(0 0% 55%)" }}>HOJE</span>
            </div>
          </div>
          <MiniSalesChart />
        </div>

        {/* Two columns: Top afiliados + Recent activity */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="p-2 rounded" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
            <p className="font-semibold text-[7px] mb-1.5">Top Afiliados</p>
            {["Marina S.", "Carlos B.", "Juliana R."].map((name, i) => (
              <div key={name} className="flex items-center gap-1.5 py-[3px]">
                <div className="w-3 h-3 rounded-full flex items-center justify-center text-[5px] font-bold" style={{ background: i === 0 ? "hsl(196 92% 56%)" : "hsl(0 0% 18%)", color: i === 0 ? "hsl(0 0% 8%)" : "hsl(0 0% 90%)" }}>
                  {i + 1}
                </div>
                <span className="flex-1 text-[6px]">{name}</span>
                <span className="text-[6px] font-semibold" style={{ color: "hsl(196 92% 56%)" }}>
                  R$ {(8420 - i * 1900).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
          <div className="p-2 rounded" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
            <p className="font-semibold text-[7px] mb-1.5">Atividade Recente</p>
            {[
              { txt: "Venda aprovada", val: "+R$ 297", t: "2m" },
              { txt: "Order Bump", val: "+R$ 97", t: "5m" },
              { txt: "Comissão paga", val: "+R$ 148", t: "12m" },
            ].map((a) => (
              <div key={a.txt} className="flex items-center gap-1.5 py-[3px]">
                <div className="w-1 h-1 rounded-full" style={{ background: "hsl(142 71% 45%)" }} />
                <span className="flex-1 text-[6px]">{a.txt}</span>
                <span className="text-[6px] font-semibold" style={{ color: "hsl(142 71% 45%)" }}>{a.val}</span>
                <span className="text-[5.5px]" style={{ color: "hsl(0 0% 45%)" }}>{a.t}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  </div>
);

/** Animated tiny line + bar chart that mimics SalesChart */
const MiniSalesChart = () => {
  const points = [10, 22, 18, 30, 26, 38, 34, 46, 42, 55, 50, 64];
  const max = Math.max(...points);
  const w = 100;
  const h = 40;
  const path = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (points.length - 1)) * w} ${h - (v / max) * h}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[44px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(196 92% 56%)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(196 92% 56%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#goldFill)" />
      <path d={path} fill="none" stroke="hsl(196 92% 56%)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((v, i) => (
        <circle key={i} cx={(i / (points.length - 1)) * w} cy={h - (v / max) * h} r="0.6" fill="hsl(196 92% 56%)" />
      ))}
    </svg>
  );
};

/** Mobile dashboard clone — what you see on the iPhone */
const DashboardCloneMobile = () => (
  <div
    className="w-full h-full flex flex-col"
    style={{
      background: "hsl(0 0% 7%)",
      color: "hsl(0 0% 95%)",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    }}
  >
    {/* Status bar */}
    <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[9px] font-semibold" style={{ color: "hsl(0 0% 95%)" }}>
      <span>09:41</span>
      <span className="flex items-center gap-1">
        <span>●●●</span>
        <span>📶</span>
        <span>🔋</span>
      </span>
    </div>

    {/* App header */}
    <div className="flex items-center justify-between px-3 py-2 mt-3" style={{ borderBottom: "1px solid hsl(0 0% 12%)" }}>
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "hsl(0 0% 10%)" }}>
          <span className="text-[10px]">☰</span>
        </div>
        <img src={queenifyBee} alt="" className="w-3.5 h-3.5" />
        <span className="font-bold text-[10px]">Queenify</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]" style={{ background: "hsl(0 0% 12%)", color: "hsl(0 0% 80%)" }}>♪</div>
        <div className="w-5 h-5 rounded-full" style={{ background: "linear-gradient(135deg, hsl(196 92% 56%), hsl(196 92% 36%))" }} />
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 px-3 py-3 overflow-hidden">
      <h1 className="font-bold text-[12px] leading-tight">Dashboard do Produtor</h1>
      <p className="text-[8px] mb-3" style={{ color: "hsl(0 0% 55%)" }}>Bem-vindo de volta!</p>

      {/* KPI grid 2x2 */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div
          className="p-2 rounded col-span-2"
          style={{
            background: "hsl(0 0% 100%)",
            color: "hsl(0 0% 8%)",
            boxShadow: "0 0 0 1px hsl(196 92% 56% / 0.3), 0 4px 12px -4px hsl(196 92% 56% / 0.4)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] opacity-60">Vendas</p>
              <p className="text-[7px] opacity-50">Últimos 30 dias</p>
            </div>
            <span className="text-[7px] font-bold px-1.5 py-[1px] rounded" style={{ background: "hsl(196 92% 56% / 0.15)", color: "hsl(196 92% 36%)" }}>★ DESTAQUE</span>
          </div>
          <p className="font-bold text-[18px] mt-1">R$ 47.892</p>
          <span className="text-[8px] font-semibold" style={{ color: "hsl(142 71% 45%)" }}>↗ Ativo</span>
        </div>

        {[
          { title: "Vendas Hoje", value: "R$ 2.341", sub: "+ 8 vendas" },
          { title: "Saldo", value: "R$ 47.892", sub: "Solicitar Saque" },
        ].map((c) => (
          <div key={c.title} className="p-2 rounded" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
            <p className="text-[8px]" style={{ color: "hsl(0 0% 55%)" }}>{c.title}</p>
            <p className="font-bold text-[11px] mt-1">{c.value}</p>
            <p className="text-[7px] mt-0.5" style={{ color: c.sub.includes("Solicitar") ? "hsl(0 0% 65%)" : "hsl(142 71% 45%)" }}>
              {c.sub.includes("Solicitar") ? c.sub : `↗ ${c.sub}`}
            </p>
          </div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="p-2 rounded mb-3" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-[9px]">Vendas</p>
          <span className="text-[7px] px-1.5 py-[1px] rounded" style={{ background: "hsl(196 92% 56% / 0.15)", color: "hsl(196 92% 56%)" }}>30D</span>
        </div>
        <MiniSalesChart />
      </div>

      {/* Recent activity */}
      <div className="p-2 rounded" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
        <p className="font-semibold text-[9px] mb-1.5">Atividade Recente</p>
        {[
          { txt: "Venda aprovada", val: "+R$ 297", t: "2m" },
          { txt: "Order Bump", val: "+R$ 97", t: "5m" },
          { txt: "Comissão paga", val: "+R$ 148", t: "12m" },
        ].map((a) => (
          <div key={a.txt} className="flex items-center gap-1.5 py-[3px]">
            <div className="w-1 h-1 rounded-full" style={{ background: "hsl(142 71% 45%)" }} />
            <span className="flex-1 text-[8px]">{a.txt}</span>
            <span className="text-[8px] font-semibold" style={{ color: "hsl(142 71% 45%)" }}>{a.val}</span>
            <span className="text-[7px]" style={{ color: "hsl(0 0% 45%)" }}>{a.t}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ───────────────────────────────────────────────────────────────────────
   CHECKOUT EDITOR PHONE — replica da aba "Checkout" de Gerenciar Produto
   Usado na seção de prévia do checkout
   ─────────────────────────────────────────────────────────────────────── */
const CheckoutEditorPhone = () => (
  <div
    className="relative mx-auto"
    style={{
      width: 320,
      height: 660,
      borderRadius: 56,
      padding: 9,
      background:
        "linear-gradient(145deg, hsl(0 0% 22%) 0%, hsl(0 0% 10%) 50%, hsl(0 0% 4%) 100%)",
      boxShadow:
        "0 45px 90px -25px hsl(0 0% 0% / 0.7), 0 0 0 1px hsl(0 0% 100% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.18), inset 0 -1px 0 hsl(0 0% 0% / 0.4)",
    }}
  >
    {/* Side buttons */}
    <div className="absolute -left-[3px] top-[130px] w-[3px] h-[36px] rounded-l" style={{ background: "linear-gradient(90deg, hsl(0 0% 0%), hsl(0 0% 28%))" }} />
    <div className="absolute -left-[3px] top-[180px] w-[3px] h-[58px] rounded-l" style={{ background: "linear-gradient(90deg, hsl(0 0% 0%), hsl(0 0% 28%))" }} />
    <div className="absolute -left-[3px] top-[250px] w-[3px] h-[58px] rounded-l" style={{ background: "linear-gradient(90deg, hsl(0 0% 0%), hsl(0 0% 28%))" }} />
    <div className="absolute -right-[3px] top-[200px] w-[3px] h-[90px] rounded-r" style={{ background: "linear-gradient(270deg, hsl(0 0% 0%), hsl(0 0% 28%))" }} />

    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        borderRadius: 48,
        background: "hsl(0 0% 7%)",
        boxShadow: "inset 0 0 0 1.5px hsl(0 0% 100% / 0.05)",
      }}
    >
      {/* Dynamic Island */}
      <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] rounded-full z-30 flex items-center justify-center" style={{ background: "hsl(0 0% 0%)" }}>
        <div className="w-1 h-1 rounded-full mr-1.5" style={{ background: "hsl(0 0% 18%)" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 8%)" }} />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-7 pt-[14px] text-[10px] font-semibold text-white/90 relative z-20">
        <span>09:41</span>
        <div className="w-[100px]" />
        <span className="flex items-center gap-1 text-[9px]">
          <span>●●●●</span>
        </span>
      </div>

      {/* Checkout editor app content */}
      <div className="px-3 pt-[44px] pb-3 h-full overflow-hidden text-white" style={{ fontSize: 10 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(0 0% 12%)" }}>
              <span className="text-[12px]">‹</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold leading-tight">Checkout</p>
              <p className="text-[8px]" style={{ color: "hsl(0 0% 55%)" }}>Mentoria Lucros Reais</p>
            </div>
          </div>
          <div className="px-2 py-[3px] rounded text-[8px] font-bold" style={{ background: "hsl(196 92% 56%)", color: "hsl(0 0% 8%)" }}>
            SALVAR
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3 p-[3px] rounded-lg" style={{ background: "hsl(0 0% 10%)" }}>
          {["Visual", "Textos", "Bumps", "Pixel"].map((t, i) => (
            <div
              key={t}
              className="flex-1 text-center py-1 rounded text-[8px] font-semibold"
              style={{
                background: i === 0 ? "hsl(196 92% 56%)" : "transparent",
                color: i === 0 ? "hsl(0 0% 8%)" : "hsl(0 0% 60%)",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Live preview card */}
        <div className="rounded-xl p-3 mb-3" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "hsl(196 92% 56%)" }}>Pré-visualização</span>
            <span className="text-[8px]" style={{ color: "hsl(0 0% 50%)" }}>Mobile</span>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 14%)" }}>
            <div className="flex items-center gap-2 mb-2">
              <img src={queenifyBee} alt="" className="w-3.5 h-3.5" />
              <span className="font-bold text-[8px]">Queenify · Checkout</span>
            </div>
            <p className="font-semibold text-[9px] leading-tight">Mentoria Lucros Reais</p>
            <p className="text-[8px] mb-1.5" style={{ color: "hsl(0 0% 60%)" }}>Acesso vitalício + bônus</p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="font-bold text-[14px]" style={{ color: "hsl(196 92% 56%)" }}>R$ 1.497</span>
              <span className="line-through text-[8px]" style={{ color: "hsl(0 0% 45%)" }}>R$ 2.497</span>
            </div>
            <div className="rounded p-1.5 mb-1.5 text-center text-[8px] font-bold" style={{ background: "hsl(196 92% 56%)", color: "hsl(0 0% 8%)" }}>
              FINALIZAR COMPRA
            </div>
            <div className="flex items-center justify-center gap-1 text-[7px]" style={{ color: "hsl(0 0% 55%)" }}>
              <span>Mockup demonstrativo · pagamento não conectado</span>
            </div>
          </div>
        </div>

        {/* Color settings */}
        <div className="rounded-xl p-2.5 mb-2" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
          <p className="text-[9px] font-semibold mb-1.5">Cor primária</p>
          <div className="flex gap-1.5">
            {["hsl(196 92% 56%)", "hsl(0 0% 100%)", "hsl(280 60% 60%)", "hsl(200 70% 55%)", "hsl(142 71% 45%)"].map((c, i) => (
              <div
                key={c}
                className="w-6 h-6 rounded-full"
                style={{
                  background: c,
                  boxShadow: i === 0 ? "0 0 0 2px hsl(0 0% 7%), 0 0 0 4px hsl(196 92% 56%)" : "0 0 0 1px hsl(0 0% 18%)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-1.5">
          {[
            { label: "Timer de urgência", on: true },
            { label: "Selo de garantia", on: true },
            { label: "Depoimentos", on: false },
          ].map((t) => (
            <div key={t.label} className="flex items-center justify-between rounded-lg px-2.5 py-2" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 14%)" }}>
              <span className="text-[9px]">{t.label}</span>
              <div
                className="w-7 h-4 rounded-full flex items-center transition-all"
                style={{
                  background: t.on ? "hsl(196 92% 56%)" : "hsl(0 0% 22%)",
                  padding: "0 2px",
                  justifyContent: t.on ? "flex-end" : "flex-start",
                }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 0% 100%)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Glass reflection */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, hsl(0 0% 100% / 0.06) 45%, transparent 60%)",
        }}
        animate={{ x: ["-100%", "120%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
      />
    </div>
  </div>
);

const Landing = () => {
  const { session, loading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.95]);
  const mockupY = useTransform(heroScroll, [0, 1], [0, 80]);
  const navigate = useNavigate();
  const typedText = useTypingEffect([
    "Conheça a prévia Queenify.",
    "Organize seus produtos digitais.",
    "Acompanhe os registros da conta.",
  ], 70, 35, 2200);

  // Parallax refs for sections
  const whyParallax = useParallax(60);
  const platformParallax = useParallax(50);
  const powerParallax = useParallax(60);
  const techParallax = useParallax(40);
  const pricingParallax = useParallax(50);
  const faqParallax = useParallax(40);
  const ctaParallax = useParallax(60);

  useEffect(() => { trackPageView("/"); }, []);

  // Show a floating "Ir para Dashboard" button for logged-in users instead of redirecting


  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith("#")) {
      const el = document.getElementById(href.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative scroll-smooth">
      {/* ─── Global animated aurora background ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Animated aurora ribbons — VIVID */}
        <motion.div
          className="absolute -top-[30%] -left-[20%] w-[160%] h-[60%] opacity-[0.18]"
          style={{
            background: "conic-gradient(from 180deg at 50% 50%, hsl(196 92% 56% / 0.6), transparent 20%, hsl(280 60% 50% / 0.35), transparent 45%, hsl(196 92% 56% / 0.5), transparent 70%, hsl(200 70% 50% / 0.25), transparent)",
            filter: "blur(60px)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-[20%] -right-[20%] w-[140%] h-[50%] opacity-[0.14]"
          style={{
            background: "conic-gradient(from 0deg at 50% 50%, hsl(280 50% 50% / 0.4), transparent 25%, hsl(196 92% 56% / 0.45), transparent 55%, hsl(200 60% 50% / 0.3), transparent)",
            filter: "blur(70px)",
          }}
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        {/* Third aurora ribbon for more coverage */}
        <motion.div
          className="absolute top-[20%] left-[30%] w-[80%] h-[60%] opacity-[0.1]"
          style={{
            background: "conic-gradient(from 90deg at 50% 50%, hsl(196 92% 56% / 0.3), transparent 30%, hsl(35 100% 50% / 0.25), transparent 60%, hsl(196 92% 56% / 0.2), transparent)",
            filter: "blur(90px)",
          }}
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        />
        {/* Shooting comet streaks — BRIGHTER & THICKER */}
        <motion.div
          className="absolute top-[12%] left-0 w-[300px] h-[3px]"
          style={{ background: "linear-gradient(90deg, transparent, hsl(196 92% 56% / 0.3), hsl(196 92% 56% / 0.9), hsl(196 92% 56%), hsl(196 92% 56% / 0.9), transparent)", borderRadius: "3px", boxShadow: "0 0 12px hsl(196 92% 56% / 0.5)" }}
          animate={{ x: ["-300px", "110vw"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[40%] right-0 w-[250px] h-[2.5px]"
          style={{ background: "linear-gradient(270deg, transparent, hsl(196 92% 56% / 0.3), hsl(196 92% 56% / 0.8), hsl(196 92% 56% / 0.9), transparent)", borderRadius: "3px", boxShadow: "0 0 10px hsl(196 92% 56% / 0.4)" }}
          animate={{ x: ["300px", "-110vw"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 9, ease: "easeInOut", delay: 4 }}
        />
        <motion.div
          className="absolute top-[70%] left-0 w-[200px] h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, hsl(196 92% 56% / 0.4), hsl(196 92% 56% / 0.8), transparent)", borderRadius: "2px", boxShadow: "0 0 8px hsl(196 92% 56% / 0.3)" }}
          animate={{ x: ["-200px", "110vw"], opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 12, ease: "easeInOut", delay: 2 }}
        />
        {/* Diagonal comet — new */}
        <motion.div
          className="absolute top-[5%] left-0 w-[180px] h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, hsl(196 92% 56% / 0.5), hsl(196 92% 56%), transparent)", borderRadius: "2px", rotate: "15deg", boxShadow: "0 0 6px hsl(196 92% 56% / 0.4)" }}
          animate={{ x: ["-200px", "120vw"], y: ["-10vh", "20vh"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 14, ease: "easeInOut", delay: 8 }}
        />
        {/* Pulsing dot grid overlay — MORE VISIBLE */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(196 92% 56% / 0.1) 1.5px, transparent 1.5px)`,
            backgroundSize: "40px 40px",
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {/* ─── Header ─── */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={queenifyBee} alt="Queenify" className="w-8 h-8 transition-transform group-hover:rotate-12 duration-300" />
            <span className="font-display text-xl font-bold text-foreground">Queenify</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button key={link.label} onClick={() => handleNavClick(link.href)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group/nav">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary/60 transition-all duration-300 group-hover/nav:w-full" />
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
                <Link to="/login" className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
                <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold gradient-gold rounded-lg text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/20 duration-300">
                  Criar conta
                </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="md:hidden overflow-hidden border-t border-border">
              <nav className="flex flex-col gap-1 px-4 py-3">
                {navLinks.map((link) => (
                  <button key={link.label} onClick={() => handleNavClick(link.href)} className="text-sm text-muted-foreground hover:text-foreground py-2 text-left">{link.label}</button>
                ))}
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground py-2">Login</Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-primary py-2">Criar conta</Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 min-h-[92vh] flex items-center overflow-hidden">
        {/* Mixed backdrop: black anchor + soft white panel + warm gold + neutral gray */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Base diagonal split: black (left) → warm gray → ivory (right) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, hsl(0 0% 4%) 0%, hsl(0 0% 8%) 38%, hsl(0 0% 22%) 55%, hsl(0 0% 78%) 70%, hsl(40 30% 94%) 100%)",
            }}
          />
          {/* Gold wash on the seam */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_62%_50%,hsl(196_92%_56%/0.28),transparent_65%)]" />
          {/* Subtle gold streak top-right */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_25%_at_88%_18%,hsl(196_92%_60%/0.22),transparent_70%)]" />
          {/* Soft dark vignette bottom-left for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_45%_at_8%_92%,hsl(0_0%_0%/0.5),transparent_60%)]" />
          {/* Fine grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
            }}
          />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary">Plataforma de produtos digitais</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mb-6">
                Organize seu negócio digital.{" "}
                <span className="bg-gradient-to-r from-primary via-[hsl(43,96%,70%)] to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite]">
                  {typedText}
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                    className="inline-block w-[3px] h-[0.9em] bg-primary ml-0.5 align-middle rounded-sm" />
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
                className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                Conheça a prévia da Queenify para organizar produtos digitais e acompanhar os recursos em preparação. Cobranças e ferramentas dependem da ativação das integrações.
              </motion.p>
              <p className="-mt-5 mb-7 text-xs text-muted-foreground">A demonstração visual ao lado usa dados fictícios. Não representa vendas reais.</p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-start gap-3">
                <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 gradient-gold rounded-xl text-base font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.03] shadow-lg shadow-primary/20">
                  Criar conta <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 px-6 py-4 bg-secondary/80 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
                  <Play className="w-4 h-4 text-primary" /> Ver recursos
                </button>
              </motion.div>
            </div>

            {/* Right - Cinematic 3-scene loop: laptop approach → laptop pan → phone notifications */}
            <CinematicShowcase />
          </div>
        </motion.div>
      </section>

      {/* ─── Why Queenify – Split Layout ─── */}
      <section ref={whyParallax.ref} id="features" className="section-light py-20 sm:py-28 px-4 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingParticle delay={0.5} x={5} y={30} size={3} />
          <FloatingParticle delay={2} x={92} y={60} size={4} />
          <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-primary/[0.05] blur-[100px]" />
          <GoldenStreak delay={0.5} x={80} y={20} rotation={40} width={100} />
          <GoldenStreak delay={2.5} x={8} y={75} rotation={-20} width={80} />
          <GlowDot delay={1} x={95} y={45} size={2} />
          <GlowDot delay={3.5} x={3} y={15} size={3} />
        </div>
        <motion.div style={{ y: whyParallax.y }} className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <motion.div variants={slideInLeft}>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Por que a Queenify?</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight mb-5">
                Aqui você encontra mais que uma plataforma.{" "}
                <span className="text-primary">Encontra uma parceira.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">
                A Queenify está em fase de validação. Esta prévia apresenta as áreas disponíveis e sinaliza os recursos que ainda dependem de integrações.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 gradient-gold rounded-xl text-sm font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.03]">
                Cadastrar agora <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <div className="space-y-1">
              {whyFeatures.map((f) => (
                <motion.div key={f.title} variants={fadeUp}
                  className="flex gap-4 p-5 rounded-xl border border-transparent hover:border-border hover:bg-card/50 transition-all group">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Platform Features – Cards with mobile mockup image ─── */}
      <section ref={platformParallax.ref} className="py-20 sm:py-28 px-4 border-t border-border relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ opacity: [0.02, 0.06, 0.02] }} transition={{ duration: 8, repeat: Infinity }}
            className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-[hsl(280,50%,50%)]/[0.04] blur-[120px]" />
          <GoldenStreak delay={1.5} x={70} y={15} rotation={55} width={110} />
          <GlowDot delay={1.2} x={20} y={70} size={2} />
          <FloatingParticle delay={1.2} x={75} y={25} size={3} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Prévia da plataforma</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
                Organize seu negócio digital
              </h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                Explore as telas disponíveis. Cobranças, recorrência e dados integrados aguardam ativação e testes.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {platformFeatures.map((f) => (
                  <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="glass-card p-5 flex gap-4 items-start hover:border-primary/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:rotate-6 transition-all duration-300">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-foreground mb-1">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Right – Checkout editor phone (replica fiel da aba Checkout em Gerenciar Produto) */}
              <motion.div variants={scaleIn} className="hidden lg:flex items-center justify-center relative" style={{ perspective: 1800 }}>
                <motion.div
                  animate={{ y: [0, -14, 0], rotateZ: [-1.5, 1.5, -1.5] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <CheckoutEditorPhone />
                </motion.div>
                <motion.div
                  aria-hidden
                  className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none"
                  animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-[420px] h-[420px] rounded-full bg-primary/[0.18] blur-[120px]" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Power Features ─── */}
      <section ref={powerParallax.ref} className="section-light py-20 sm:py-28 px-4 border-t border-border relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingParticle delay={0.3} x={15} y={25} size={4} />
          <FloatingParticle delay={1.8} x={80} y={70} size={3} />
          <motion.div animate={{ opacity: [0.03, 0.07, 0.03] }} transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[140px]" />
          <GoldenStreak delay={0} x={90} y={30} rotation={-40} width={100} />
          <GoldenStreak delay={3} x={5} y={50} rotation={30} width={120} />
          <GlowDot delay={1.2} x={50} y={10} size={2} />
          <GlowDot delay={2.8} x={30} y={80} size={3} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Recursos em configuração</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
                Recursos para sua operação <span className="text-primary">digital</span>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto">A disponibilidade de cada recurso depende da integração e validação indicadas na própria tela.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {powerFeatures.map((f) => (
                <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="glass-card p-6 sm:p-8 group hover:border-primary/30 transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Technology Grid ─── */}
      <section ref={techParallax.ref} className="py-20 px-4 border-t border-border relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ opacity: [0.02, 0.05, 0.02] }} transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-[30%] right-[20%] w-[250px] h-[250px] rounded-full bg-primary/[0.04] blur-[80px]" />
          <GoldenStreak delay={2} x={15} y={25} rotation={-35} width={70} />
          <GlowDot delay={1} x={85} y={65} size={2} />
          <GlowDot delay={3} x={40} y={15} size={2} />
          <FloatingParticle delay={0.6} x={92} y={40} size={3} />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold">Áreas previstas na Queenify</h2>
              <p className="text-muted-foreground mt-3">Algumas áreas estão em desenvolvimento ou aguardam conexão com provedores externos.</p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {techGrid.map((t) => (
                <motion.div key={t.label} variants={scaleIn} whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="glass-card p-4 flex flex-col items-center text-center gap-2.5 group hover:border-primary/40 transition-colors">
                  <t.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs font-medium text-foreground">{t.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials section removed per user request */}

      {/* ─── Pricing ─── */}
      <section ref={pricingParallax.ref} id="pricing" className="py-20 sm:py-28 px-4 border-t border-border relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-primary/[0.05] blur-[120px]" />
          <GoldenStreak delay={0.3} x={85} y={25} rotation={50} width={110} />
          <GoldenStreak delay={2.8} x={10} y={70} rotation={-30} width={90} />
          <GlowDot delay={0.7} x={70} y={15} size={3} />
          <GlowDot delay={2} x={25} y={80} size={2} />
          <FloatingParticle delay={1.5} x={5} y={35} size={3} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Informações comerciais</span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Condições em validação</h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-10">Taxas e prazos serão apresentados antes de a Queenify aceitar vendas.</p>
            </motion.div>
            <motion.div variants={scaleIn} whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
              className="glass-card p-8 sm:p-12 inline-block border-primary/20 glow-gold">
              <div className="text-4xl sm:text-5xl font-display font-bold text-primary mb-2">Em validação</div>
              <p className="text-sm text-muted-foreground mb-1">Taxas, meios de pagamento e prazos</p>
              <p className="text-xs text-muted-foreground">A Queenify ainda não confirmou condições comerciais para uso em produção.</p>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 space-y-3">
              <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 gradient-gold rounded-xl text-base font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.03] shadow-lg shadow-primary/20">
                Criar conta para acompanhar a prévia <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-muted-foreground">
                <Link to="/taxas" className="text-primary hover:underline">Ver estado atual das taxas →</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section ref={faqParallax.ref} id="faq" className="section-light py-20 sm:py-28 px-4 border-t border-border relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ opacity: [0.02, 0.05, 0.02] }} transition={{ duration: 9, repeat: Infinity }}
            className="absolute bottom-[20%] right-[25%] w-[300px] h-[300px] rounded-full bg-[hsl(280,50%,50%)]/[0.03] blur-[100px]" />
          <FloatingParticle delay={1.3} x={6} y={65} size={3} />
          <GoldenStreak delay={1.5} x={88} y={40} rotation={-25} width={80} />
          <GlowDot delay={0.8} x={50} y={20} size={2} />
          <GlowDot delay={3.2} x={15} y={80} size={2} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight mb-4">Perguntas Frequentes</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Consulte o estado atual da plataforma, dos recursos disponíveis e das integrações em preparação.
              </p>
              <Link to="/ajuda" className="text-sm font-semibold text-primary hover:underline">Central de ajuda →</Link>
            </motion.div>
            <div className="lg:col-span-3 space-y-2">
              {faqs.map((faq, i) => (
                <motion.div key={i} variants={fadeUp} className="border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left">
                    <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ duration: 0.2 }}>
                      <span className="text-xl text-muted-foreground leading-none">{openFaq === i ? "−" : "+"}</span>
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <div className="px-5 pb-5"><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section ref={ctaParallax.ref} className="py-20 px-4 border-t border-border relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ opacity: [0.02, 0.06, 0.02] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-[30%] left-[30%] w-[500px] h-[500px] rounded-full bg-primary/[0.05] blur-[150px]" />
          <GoldenStreak delay={0.5} x={80} y={20} rotation={35} width={100} />
          <GoldenStreak delay={3} x={15} y={65} rotation={-40} width={80} />
          <GlowDot delay={1} x={90} y={45} size={3} />
          <GlowDot delay={2.5} x={8} y={30} size={2} />
          <FloatingParticle delay={0.8} x={70} y={75} size={3} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.div variants={fadeUp}>
              <img src={queenifyBee} alt="" className="w-28 h-28 mx-auto mb-6 object-contain"
                style={{ background: "transparent", mixBlendMode: "normal" }} />
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Pronto para começar?</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Crie uma conta para conhecer a Queenify e acompanhar a liberação dos recursos. As vendas aguardam a ativação das integrações financeiras.</p>
              <Link to="/signup" className="inline-flex items-center gap-2 px-10 py-4 gradient-gold rounded-xl text-base font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.03] shadow-lg shadow-primary/20">
                Criar conta <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="section-light border-t border-border relative overflow-hidden">
        {/* Subtle glow behind footer */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] rounded-full bg-primary/[0.02] blur-[100px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <motion.h4 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="text-sm font-display font-bold text-foreground mb-4 relative inline-block">
                Plataforma
                <motion.span className="absolute -bottom-1 left-0 h-[2px] bg-primary/30" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }} />
              </motion.h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/taxas" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Taxas</Link></li>
                <li><Link to="/faq" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">FAQ</Link></li>
                <li><Link to="/ajuda" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Ajuda</Link></li>
                <li><Link to="/status" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Página de Status</Link></li>
                <li><Link to="/comunicacoes-oficiais" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Comunicações Oficiais</Link></li>
              </ul>
            </div>
            <div>
              <motion.h4 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="text-sm font-display font-bold text-foreground mb-4 relative inline-block">
                Queenify
                <motion.span className="absolute -bottom-1 left-0 h-[2px] bg-primary/30" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }} />
              </motion.h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/contato" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Contato</Link></li>
                <li><Link to="/sobre" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Sobre nós</Link></li>
                <li><Link to="/denuncias-de-produto" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Denúncias de Produto</Link></li>
                <li><Link to="/proibido-plagio" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Proibido e Plágio</Link></li>
                <li><Link to="/transparencia-salarial" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Transparência Salarial</Link></li>
                <li><Link to="/canal-de-denuncias" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Canal de Denúncias</Link></li>
                <li><Link to="/ouvidoria" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Ouvidoria</Link></li>
              </ul>
            </div>
            <div>
              <motion.h4 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="text-sm font-display font-bold text-foreground mb-4 relative inline-block">
                Legal
                <motion.span className="absolute -bottom-1 left-0 h-[2px] bg-primary/30" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.5 }} />
              </motion.h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/termos-de-uso" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Termos de Uso</Link></li>
                <li><Link to="/termos-queenipay" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Termos QueeniPay</Link></li>
                <li><Link to="/termos-conta-digital" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Conta Digital</Link></li>
                
                <li><Link to="/termos-afiliados" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Termos de Afiliados</Link></li>
                <li><Link to="/licenca-de-software" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Licença de Software</Link></li>
                <li><Link to="/politica-de-conteudo" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Política de Conteúdo</Link></li>
                <li><Link to="/politica-de-privacidade" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <motion.h4 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="text-sm font-display font-bold text-foreground mb-4 relative inline-block">
                Contato
                <motion.span className="absolute -bottom-1 left-0 h-[2px] bg-primary/30" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.5 }} />
              </motion.h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/ajuda" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">Central de ajuda</Link></li>
                <li><a href="mailto:suporte@queenify.com.br" className="hover:text-foreground hover:translate-x-1 transition-all inline-block">suporte@queenify.com.br</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
      {/* Dark copyright strip (sits below white footer) */}
      <div className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={queenifyBee} alt="" className="w-5 h-5 opacity-70" />
            <span className="text-xs font-display font-semibold text-foreground/80">Queenify</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Queenify. Todos os direitos reservados.</p>
        </div>
      </div>
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 sm:bottom-24 right-6 z-50"
          style={{ perspective: 800 }}
        >
          <motion.div
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="relative group"
          >
            {/* Pulsing gold halo */}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ background: "hsl(196 92% 56%)", filter: "blur(18px)", opacity: 0.45 }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Outer ring pulse */}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <Link
              to={session ? "/dashboard" : "/login"}
              aria-label={session ? "Ir para Dashboard" : "Fazer login"}
              className="relative flex items-center gap-2.5 pl-5 pr-6 py-3.5 rounded-full font-bold text-sm text-primary-foreground overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, hsl(196 92% 62%) 0%, hsl(196 92% 50%) 50%, hsl(38 95% 45%) 100%)",
                boxShadow:
                  "0 12px 32px -8px hsl(196 92% 50% / 0.6), 0 4px 12px -2px hsl(0 0% 0% / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.4), inset 0 -1px 0 hsl(0 0% 0% / 0.15)",
              }}
            >
              {/* Shimmer sweep */}
              <motion.span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(115deg, transparent 35%, hsl(0 0% 100% / 0.45) 50%, transparent 65%)",
                }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
              />
              <Rocket className="relative w-4 h-4 drop-shadow-sm" />
              <span className="relative">{session ? "Ir para Dashboard" : "Acessar plataforma"}</span>
              <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Landing;
