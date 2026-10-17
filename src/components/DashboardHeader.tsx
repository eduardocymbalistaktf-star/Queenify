import { Search, Bell, MessageSquare, HelpCircle, ChevronDown, LogOut, User, Settings, Menu, BookOpen, ExternalLink, Package, GraduationCap, ShoppingCart, Loader2, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BrandLogo from "@/components/BrandLogo";
import { getUserLevel, levels } from "@/components/LevelCard";
import frameBronze from "@/assets/frame-bronze.png";
import frameSilver from "@/assets/frame-silver.png";
import frameGold from "@/assets/frame-gold.png";
import frameCrown from "@/assets/frame-crown.png";
import DashboardThemeMenu from "@/components/DashboardThemeMenu";
import { toast } from "sonner";

const frameMap: Record<string, string> = {
  Bronze: frameBronze,
  Silver: frameSilver,
  Gold: frameGold,
  Crown: frameCrown,
};

type Notification = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Ontem" : `há ${days} dias`;
};

const getNotifColor = (type: string) => {
  if (type === "reembolso" || type === "chargeback") return "text-destructive";
  if (type === "afiliado" || type === "boleto" || type === "pix") return "text-success";
  return "text-foreground";
};

const helpLinks = [
  { label: "Central de Ajuda", path: "/ajuda", icon: HelpCircle },
  { label: "Tutoriais", path: "/tutoriais", icon: BookOpen },
  { label: "FAQ", path: "/faq", icon: ExternalLink },
];

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  supportOpen?: boolean;
  onSupportChange?: (open: boolean) => void;
}

const DashboardHeader = ({ onMenuToggle, supportOpen = false, onSupportChange }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isStudentPanel = location.pathname === "/painel-aluno";
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState<string>("all");
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ label: string; path: string; type: string; icon: any }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "Olá! Sou a assistente QueenIA. Escreva sua dúvida para consultar o suporte." },
  ]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [notifList, setNotifList] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showFrame, setShowFrame] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [userLevel, setUserLevel] = useState<ReturnType<typeof getUserLevel>>(null);
  const [has2FA, setHas2FA] = useState(false);
  const unreadCount = notifList.filter(n => !n.is_read).length;

  // Load notifications from DB + realtime subscription
  useEffect(() => {
    if (!user) return;
    const loadNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifList(data as Notification[]);
    };
    loadNotifs();

    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifList(prev => [payload.new as Notification, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const showSupport = supportOpen;
  const setShowSupport = (v: boolean) => onSupportChange?.(v);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url, display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      if (data?.display_name) setDisplayName(data.display_name);
    });
    supabase.from("user_settings").select("show_frame").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setShowFrame(data.show_frame ?? true);
    });
    // Load user level based on sales
    supabase.from("sales").select("amount").eq("user_id", user.id).eq("status", "completed").then(({ data }) => {
      const totalRevenue = (data || []).reduce((sum, s) => sum + Number(s.amount), 0);
      setUserLevel(getUserLevel(totalRevenue));
    });
    // Check 2FA status
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.some(f => f.status === "verified");
      setHas2FA(!!verified);
    });
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setShowHelp(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchResults([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchPages = [
    { label: "Dashboard", path: "/dashboard", keywords: "dashboard início home painel" },
    { label: "Meus Produtos", path: "/meus-produtos", keywords: "produtos cursos infoprodutos criar produto" },
    { label: "Vendas", path: "/vendas", keywords: "vendas transações pedidos faturamento" },
    { label: "Cupons", path: "/cupons", keywords: "cupons desconto promoção voucher" },
    { label: "Funil de Vendas", path: "/funil-vendas", keywords: "funil upsell order bump downsell" },
    { label: "Recuperação de Vendas", path: "/recuperacao-vendas", keywords: "carrinho abandonado recuperação boleto pix" },
    { label: "Afiliados", path: "/afiliados", keywords: "afiliados comissão parceiros divulgação" },
    { label: "Colaboradores", path: "/colaboradores", keywords: "colaboradores sócios co-produtor parceria" },
    { label: "Financeiro", path: "/financeiro", keywords: "financeiro saldo saque extrato receita" },
    { label: "Área de Membros", path: "/area-membros", keywords: "área membros curso módulos aulas alunos" },
    { label: "Avisos", path: "/avisos", keywords: "avisos notificações alertas" },
    { label: "Relatórios", path: "/relatorios", keywords: "relatórios métricas analytics dados" },
    { label: "Marketplace", path: "/marketplace", keywords: "marketplace vitrine loja produtos" },
    { label: "Checkout", path: "/checkout-personalizar", keywords: "checkout personalizar tema cores pagamento" },
    { label: "Pixel & Tracking", path: "/trackeamento", keywords: "pixel tracking trackeamento rastreamento eventos" },
    { label: "Webhooks", path: "/webhooks", keywords: "webhooks integração api" },
    { label: "Automações", path: "/automacoes", keywords: "automações smartpay pixel api recuperação" },
    { label: "Configurações", path: "/configuracoes", keywords: "configurações perfil conta dados pessoais" },
    { label: "Ajuda", path: "/ajuda", keywords: "ajuda suporte faq dúvidas" },
    { label: "Tutoriais", path: "/tutoriais", keywords: "tutoriais guia aprender como" },
  ];

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    
    const lower = q.toLowerCase();
    // Page results (instant)
    const pageResults = searchPages.filter(p =>
      p.label.toLowerCase().includes(lower) || p.keywords.includes(lower)
    ).slice(0, 3).map(p => ({ label: p.label, path: p.path, type: "Página", icon: Search }));

    setSearchResults(pageResults);
    if (!user) return;

    // Debounce DB search
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [productsRes, coursesRes, buyerNameRes, buyerEmailRes] = await Promise.all([
          supabase.from("products").select("id, name").eq("user_id", user!.id).ilike("name", `%${q}%`).limit(3),
          supabase.from("courses").select("id, name").eq("user_id", user!.id).ilike("name", `%${q}%`).limit(3),
          supabase.from("sales").select("id, buyer_name, buyer_email").eq("user_id", user!.id).ilike("buyer_name", `%${q}%`).limit(3),
          supabase.from("sales").select("id, buyer_name, buyer_email").eq("user_id", user!.id).ilike("buyer_email", `%${q}%`).limit(3),
        ]);

        const dbResults: typeof searchResults = [];
        (productsRes.data || []).forEach(p => dbResults.push({ label: p.name, path: "/meus-produtos", type: "Produto", icon: Package }));
        (coursesRes.data || []).forEach(c => dbResults.push({ label: c.name, path: "/area-membros", type: "Curso", icon: GraduationCap }));
        const matchedSales = [...(buyerNameRes.data || []), ...(buyerEmailRes.data || [])];
        const uniqueSales = [...new Map(matchedSales.map(s => [s.id, s])).values()];
        uniqueSales.forEach(s => dbResults.push({ label: `${s.buyer_name || s.buyer_email}`, path: "/vendas", type: "Venda", icon: ShoppingCart }));

        setSearchResults(prev => [...prev.filter(r => r.type === "Página"), ...dbResults].slice(0, 8));
      } catch {} finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const sendMessage = async () => {
    const message = supportMessage.trim();
    if (!message || supportLoading || !user) return;
    const history = [...chatMessages, { from: "user", text: message }].slice(-10);
    setChatMessages(history);
    setSupportMessage("");
    setSupportLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !publishableKey) throw new Error("O suporte está indisponível neste ambiente.");

      const response = await fetch(`${supabaseUrl}/functions/v1/support-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publishableKey}` },
        body: JSON.stringify({
          messages: history.slice(-10).map(({ from, text }) => ({ role: from === "bot" ? "assistant" : "user", content: text })),
        }),
      });
      const responseBody = await response.text();
      if (!response.ok) {
        let errorMessage = "O suporte não conseguiu responder agora.";
        try { errorMessage = JSON.parse(responseBody).error || errorMessage; } catch { /* use friendly fallback */ }
        throw new Error(errorMessage);
      }

      const reply = responseBody.split("\n").reduce((text, line) => {
        if (!line.startsWith("data: ") || line.slice(6).trim() === "[DONE]") return text;
        try { return text + (JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ""); }
        catch { return text; }
      }, "").trim();
      if (!reply) throw new Error("O suporte retornou uma resposta vazia. Tente novamente.");
      setChatMessages(prev => [...prev, { from: "bot", text: reply }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível conectar ao suporte.");
    } finally {
      setSupportLoading(false);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    const previous = notifList;
    setNotifList(previous.map(n => ({ ...n, is_read: true })));
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    if (error) {
      setNotifList(previous);
      toast.error("Não foi possível atualizar as notificações.");
    }
  };

  return (
    <>
      <header className="dashboard-topbar h-14 md:h-16 border-b border-border flex items-center justify-between px-3 md:px-6 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isMobile && (
            <button onClick={onMenuToggle} aria-label="Abrir navegação" className="text-foreground p-1">
              <Menu className="w-5 h-5" />
            </button>
          )}

          {isMobile ? (
            <button onClick={() => setShowSearch(!showSearch)} aria-label="Pesquisar" aria-expanded={showSearch} className="text-muted-foreground p-1">
              <Search className="w-5 h-5" />
            </button>
          ) : (
            <div className="relative w-80" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                aria-label="Pesquisar na Queenify"
                placeholder="Pesquisar na Queenify..."
                className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
                  {searchResults.map((r, i) => (
                    <button key={`${r.path}-${i}`} onClick={() => { navigate(r.path); setSearchQuery(""); setSearchResults([]); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2">
                      <r.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{r.label}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">{r.type}</span>
                    </button>
                  ))}
                  {searchLoading && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Theme & motion menu (centralized) */}
          <DashboardThemeMenu />
          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowHelp(false); }}
              aria-label={unreadCount ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
              aria-expanded={showNotifications}
              className="relative text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-bold">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className={`absolute ${isMobile ? '-right-2' : 'right-0'} top-10 w-80 md:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden`}>
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Notificações</p>
                  <button onClick={markAllRead} className="text-[10px] text-primary hover:text-primary/80">Marcar como lidas</button>
                </div>
                <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto">
                  {[
                    { key: "all", label: "Todas" },
                    { key: "sale", label: "Vendas" },
                    { key: "chargeback", label: "Chargebacks" },
                    { key: "system", label: "Sistema" },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setNotifFilter(f.key)}
                      className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                        notifFilter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {(() => {
                    const filtered = notifFilter === "all"
                      ? notifList
                      : notifFilter === "system"
                        ? notifList.filter(n => ["system", "info", "warning", "retention"].includes(n.type))
                        : notifFilter === "chargeback"
                          ? notifList.filter(n => ["chargeback", "financial"].includes(n.type))
                          : notifList.filter(n => n.type === notifFilter);
                    if (filtered.length === 0) return (
                      <div className="p-6 text-center text-xs text-muted-foreground">Nenhuma notificação</div>
                    );
                    return filtered.map((n) => (
                      <div key={n.id} className={`p-3 border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-xs font-medium ${getNotifColor(n.type)}`}>{n.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                          </div>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatTimeAgo(n.created_at)}</p>
                      </div>
                    ));
                  })()}
                </div>
                <button
                  onClick={() => { navigate("/avisos"); setShowNotifications(false); }}
                  className="w-full p-2.5 text-xs text-primary hover:bg-secondary/50 transition-colors font-medium"
                >
                  Ver histórico completo →
                </button>
              </div>
            )}
          </div>

          {/* Support Chat */}
          <button
            onClick={() => setShowSupport(!showSupport)}
            aria-label="Abrir suporte"
            aria-expanded={showSupport}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Help Menu */}
          <div className="relative" ref={helpRef}>
            <button
              onClick={() => { setShowHelp(!showHelp); setShowNotifications(false); setShowProfile(false); }}
              aria-label="Ajuda"
              aria-expanded={showHelp}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            {showHelp && (
              <div className="absolute right-0 top-10 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                {helpLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => { navigate(link.path); setShowHelp(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowHelp(false); }}
              aria-label="Menu do perfil"
              aria-expanded={showProfile}
              className={`flex items-center gap-2 ${isMobile ? '' : 'ml-2 pl-4 border-l border-border'}`}
            >
              <div className="relative flex-shrink-0" style={{ width: showFrame && userLevel ? 44 : 36, height: showFrame && userLevel ? 44 : 36 }}>
                {showFrame && userLevel && (
                  <img src={frameMap[userLevel.name]} alt="" className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" />
                )}
                <div className={`absolute rounded-full bg-secondary overflow-hidden ${showFrame && userLevel ? 'inset-[18%]' : 'inset-0'}`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-gold opacity-60" />
                  )}
                </div>
              </div>
              {!isMobile && (
                <>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{displayName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"}</p>
                    {userLevel ? (
                      <span className="text-[10px] px-2 py-0.5 gradient-gold rounded-full text-primary-foreground font-medium">
                        {userLevel.name}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
                        Sem Nível
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </>
              )}
            </button>
            {showProfile && (
              <div className="absolute right-0 top-12 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"}</p>
                  <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                  {has2FA && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <ShieldCheck className="w-3 h-3 text-success" />
                      <span className="text-[10px] text-success font-medium">2FA Ativo</span>
                    </div>
                  )}
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { navigate(isStudentPanel ? "/dashboard" : "/painel-aluno"); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {isStudentPanel ? "Mudar para Painel do Produtor" : "Mudar para Painel de Aluno"}
                  </button>
                  <button
                    onClick={() => { navigate("/configuracoes"); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5" /> Meu Perfil
                  </button>
                  <button
                    onClick={() => { navigate("/configuracoes"); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" /> Configurações
                  </button>
                  <button onClick={async () => { await signOut(); navigate("/login"); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <LogOut className="w-3.5 h-3.5" /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search bar */}
      {isMobile && showSearch && (
        <div className="px-3 py-2 border-b border-border bg-background" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              aria-label="Pesquisar na Queenify"
              placeholder="Pesquisar na Queenify..."
              autoFocus
              className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
                {searchResults.map((r, i) => (
                  <button key={`${r.path}-${i}`} onClick={() => { navigate(r.path); setSearchQuery(""); setSearchResults([]); setShowSearch(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2">
                    <r.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{r.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">{r.type}</span>
                  </button>
                ))}
                {searchLoading && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Support Chat Widget */}
      {showSupport && (
        <div className={`dashboard-support-chat fixed bottom-4 ${isMobile ? 'left-3 right-3' : 'right-4 w-80'} bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden`} style={{ height: isMobile ? 380 : 420 }}>
          <div className="p-3 border-b border-sidebar-border bg-sidebar flex items-center gap-2">
            <BrandLogo size="small" alt="" />
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">QueenIA · Suporte</p>
              <p className="text-[10px] text-sidebar-foreground/65">Conectada à central de ajuda</p>
            </div>
            <button onClick={() => setShowSupport(false)} aria-label="Fechar suporte" className="ml-auto text-sidebar-foreground/65 hover:text-sidebar-foreground text-lg">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  m.from === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          {supportLoading && <p className="px-3 pb-1 text-[10px] text-muted-foreground" role="status">QueenIA está respondendo…</p>}
          <div className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={supportMessage}
              maxLength={2000}
              onChange={(e) => setSupportMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Digite sua mensagem..."
              disabled={supportLoading}
              className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={sendMessage} disabled={supportLoading || !supportMessage.trim()} className="px-3 py-2 rounded-lg gradient-gold text-primary-foreground text-xs font-medium disabled:opacity-50">
              {supportLoading ? "Enviando" : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardHeader;
