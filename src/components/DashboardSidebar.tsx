import { 
  LayoutDashboard, Package, ShoppingCart, Users, Wallet, 
  Bell, BarChart3, Settings, Headphones, ChevronDown, ChevronRight, Store, Megaphone, BookOpen, AlertTriangle, GraduationCap, UsersRound,
  Tag, RefreshCw, TrendingUp, Layers, Paintbrush, Zap, Target, UserCheck, Bug, ShieldAlert, Lightbulb, DollarSign, Mail, FileText, Crosshair
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import queenifyBee from "@/assets/queenify-bee.png";

type MenuItem = {
  icon: any;
  label: string;
  path?: string;
  badgeKey?: string;
  children?: { icon: any; label: string; path: string }[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  {
    icon: Package, label: "Gerenciar Produtos",
    children: [
      { icon: Package, label: "Produtos", path: "/meus-produtos" },
      { icon: Layers, label: "Área de Membros", path: "/area-membros" },
      { icon: Paintbrush, label: "Checkout", path: "/checkout-personalizar" },
    ],
  },
  {
    icon: DollarSign, label: "Gestão de Vendas",
    children: [
      { icon: ShoppingCart, label: "Vendas", path: "/vendas" },
      { icon: TrendingUp, label: "Funil de Vendas", path: "/funil-vendas" },
      { icon: RefreshCw, label: "Recuperação", path: "/recuperacao-vendas" },
      { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
      { icon: Target, label: "Analytics", path: "/analytics" },
      { icon: Tag, label: "Cupons", path: "/cupons" },
      { icon: Mail, label: "Email Marketing", path: "/email-marketing" },
    ],
  },
  {
    icon: UsersRound, label: "Colaboradores",
    children: [
      { icon: Users, label: "Afiliados", path: "/afiliados" },
      { icon: UsersRound, label: "Sócios e Co-produtores", path: "/colaboradores" },
      { icon: UserCheck, label: "Retenção de Alunos", path: "/retencao-alunos" },
    ],
  },
  { icon: Wallet, label: "Financeiro", path: "/financeiro" },
  { icon: Bell, label: "Avisos", path: "/avisos" },
  { icon: Store, label: "Marketplace", path: "/marketplace" },
  { icon: Crosshair, label: "Trackeamento", path: "/trackeamento" },
  
  { icon: Zap, label: "Automações", path: "/automacoes" },
  { icon: BookOpen, label: "Tutoriais", path: "/tutoriais" },
  { icon: GraduationCap, label: "Meus cursos", path: "/painel-aluno" },
  {
    icon: ShieldAlert, label: "Suporte & Denúncias",
    children: [
      { icon: AlertTriangle, label: "Denúncias", path: "/denuncias" },
      { icon: Bug, label: "Reportar Bug", path: "/reportar-bug" },
      { icon: Lightbulb, label: "Sugestões", path: "/sugestoes" },
    ],
  },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
  onOpenSupport?: () => void;
}

const DashboardSidebar = ({ onNavigate, onOpenSupport }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // Auto-expand if current path is in a sub-menu
    const expanded: string[] = [];
    menuItems.forEach(item => {
      if (item.children?.some(c => location.pathname === c.path)) {
        expanded.push(item.label);
      }
    });
    return expanded;
  });

  const { data: retentionAlertCount = 0 } = useQuery({
    queryKey: ["retention-alert-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false)
        .eq("related_entity_type", "student_retention");
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const toggleExpand = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const isChildActive = (item: MenuItem) =>
    item.children?.some(c => location.pathname === c.path) || false;

  return (
    <aside className="dashboard-sidebar w-64 h-full max-h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      <div className="p-6 flex items-center gap-3">
        <img src={queenifyBee} alt="Queenify" className="h-8 w-auto" />
        <span className="font-display text-xl font-bold text-sidebar-foreground">Queenify</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.children) {
            const isExpanded = expandedMenus.includes(item.label);
            const childActive = isChildActive(item);

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    childActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${childActive ? "text-primary" : ""}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                </button>
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-border/50 space-y-0.5 mt-0.5 mb-1">
                    {item.children.map(child => {
                      const isActive = location.pathname === child.path;
                      const badge = child.path === "/retencao-alunos" ? retentionAlertCount : 0;
                      return (
                        <button
                          key={child.path}
                          onClick={() => handleNavigate(child.path)}
                          aria-current={isActive ? "page" : undefined}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <child.icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : ""}`} />
                          <span className="flex-1 text-left">{child.label}</span>
                          {badge > 0 && (
                            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground min-w-[18px] text-center">
                              {badge > 99 ? "99+" : badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.path!)}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 p-4 rounded-xl gradient-gold cursor-pointer" onClick={() => handleNavigate("/boost")}>
        <p className="font-display font-semibold text-primary-foreground text-sm">Impulsione seus produtos</p>
        <p className="text-primary-foreground/70 text-xs mt-1">Apareça no topo do marketplace.</p>
        <span className="mt-3 inline-flex px-4 py-1.5 bg-primary-foreground/20 backdrop-blur rounded-lg text-primary-foreground text-xs font-medium hover:bg-primary-foreground/30 transition-colors items-center gap-1">
          Ativar Boost <span>→</span>
        </span>
      </div>

      <div className="px-4 pb-2 flex items-center gap-3 cursor-pointer" onClick={onOpenSupport}>
        <div className="relative">
          <Headphones className="w-5 h-5 text-sidebar-foreground" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full" />
        </div>
        <div>
          <p className="text-sm text-sidebar-accent-foreground font-medium">Suporte</p>
        <p className="text-xs text-sidebar-foreground/65">Central de ajuda</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate("/termos")}
          className="flex items-center gap-2 text-[11px] text-sidebar-foreground/65 hover:text-sidebar-foreground transition-colors"
        >
          <FileText className="w-3 h-3" />
          Termos e Políticas
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
