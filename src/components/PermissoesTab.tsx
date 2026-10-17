import { useState, useEffect } from "react";
import { ShieldCheck, Megaphone, Wallet, AlertTriangle, Users, Crown, UserCheck, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "admin" | "moderador" | "produtor" | "afiliado";

interface RolePermission {
  role: AppRole;
  permission: string;
  enabled: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}>
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-all ${enabled ? "right-1" : "left-1"}`} />
  </button>
);

const roleLabels: Record<AppRole, { label: string; icon: typeof Crown; color: string }> = {
  admin: { label: "Admin", icon: Crown, color: "text-amber-400" },
  moderador: { label: "Moderador", icon: ShieldCheck, color: "text-blue-400" },
  produtor: { label: "Produtor", icon: UserCheck, color: "text-green-400" },
  afiliado: { label: "Afiliado", icon: Users, color: "text-purple-400" },
};

const permissionLabels: Record<string, { label: string; desc: string }> = {
  gerenciar_produtos: { label: "Gerenciar Produtos", desc: "Criar, editar e excluir produtos" },
  gerenciar_usuarios: { label: "Gerenciar Usuários", desc: "Ver e gerenciar contas de usuários" },
  gerenciar_financeiro: { label: "Gerenciar Financeiro", desc: "Acessar relatórios financeiros e saques" },
  
  moderar_conteudo: { label: "Moderar Conteúdo", desc: "Revisar e moderar denúncias e conteúdo" },
  gerenciar_afiliados: { label: "Gerenciar Afiliados", desc: "Aprovar e gerenciar programa de afiliados" },
  ver_relatorios: { label: "Ver Relatórios", desc: "Acessar dashboards e relatórios" },
  gerenciar_cupons: { label: "Gerenciar Cupons", desc: "Criar e editar cupons de desconto" },
  gerenciar_webhooks: { label: "Gerenciar Webhooks", desc: "Configurar integrações via webhook" },
  gerenciar_checkout: { label: "Gerenciar Checkout", desc: "Personalizar páginas de checkout" },
  gerenciar_cursos: { label: "Gerenciar Cursos", desc: "Criar e editar cursos na área de membros" },
  gerenciar_roles: { label: "Gerenciar Cargos", desc: "Atribuir e remover cargos de usuários" },
};

const allRoles: AppRole[] = ["admin", "moderador", "produtor", "afiliado"];

// Platform settings state
interface PlatformSettings {
  permPublicProfile: boolean;
  permAffiliateRequests: boolean;
  permEmailMarketing: boolean;
  adAutoReview: boolean;
  adBlockProhibited: boolean;
  adRequireLanding: boolean;
  adBlockMisleading: boolean;
  adBlockAdult: boolean;
  adBlockHealth: boolean;
  adBlockFinancial: boolean;
  adPixelVerification: boolean;
  antiFraudEnabled: boolean;
  chargebackAutoBlock: boolean;
}

export default function PermissoesTab({ user }: { user: any }) {
  const [myRoles, setMyRoles] = useState<AppRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AppRole>("produtor");
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isAdmin = myRoles.includes("admin");

  // Platform settings
  const [ps, setPs] = useState<PlatformSettings>({
    permPublicProfile: false, permAffiliateRequests: true, permEmailMarketing: false,
    adAutoReview: true, adBlockProhibited: true, adRequireLanding: true,
    adBlockMisleading: true, adBlockAdult: true, adBlockHealth: true,
    adBlockFinancial: true, adPixelVerification: true, antiFraudEnabled: true,
    chargebackAutoBlock: true,
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [rolesRes, permsRes, settingsRes] = await Promise.all([
      supabase.from("user_roles").select("*").eq("user_id", user.id),
      supabase.from("role_permissions").select("*"),
      supabase.from("platform_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    if (rolesRes.data) setMyRoles(rolesRes.data.map((r: any) => r.role));
    if (permsRes.data) setPermissions(permsRes.data as RolePermission[]);
    if (settingsRes.data) {
      const s = settingsRes.data as any;
      setPs({
        permPublicProfile: s.allow_public_profile ?? false,
        permAffiliateRequests: s.allow_affiliate_requests ?? true,
        permEmailMarketing: s.allow_email_marketing ?? false,
        adAutoReview: s.ad_auto_review ?? true,
        adBlockProhibited: s.ad_block_prohibited ?? true,
        adRequireLanding: s.ad_require_landing_page ?? true,
        adBlockMisleading: s.ad_block_misleading ?? true,
        adBlockAdult: s.ad_block_adult_content ?? true,
        adBlockHealth: s.ad_block_health_claims ?? true,
        adBlockFinancial: s.ad_block_financial_promises ?? true,
        adPixelVerification: s.ad_pixel_verification ?? true,
        antiFraudEnabled: s.anti_fraud_enabled ?? true,
        chargebackAutoBlock: s.chargeback_auto_block ?? true,
      });
    }
    setLoading(false);
  };

  const rolePerms = permissions.filter(p => p.role === selectedRole);

  const togglePermission = async (permission: string, currentEnabled: boolean) => {
    if (!isAdmin) { toast.error("Apenas admins podem alterar permissões"); return; }
    const { error } = await supabase.from("role_permissions")
      .update({ enabled: !currentEnabled, updated_at: new Date().toISOString() })
      .eq("role", selectedRole).eq("permission", permission);
    if (error) { toast.error("Erro ao salvar"); return; }
    setPermissions(prev => prev.map(p =>
      p.role === selectedRole && p.permission === permission ? { ...p, enabled: !currentEnabled } : p
    ));
    toast.success("Permissão atualizada");
  };

  const updatePs = (key: keyof PlatformSettings) => {
    setPs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePlatformSettings = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").upsert({
      user_id: user.id,
      allow_public_profile: ps.permPublicProfile,
      allow_affiliate_requests: ps.permAffiliateRequests,
      allow_email_marketing: ps.permEmailMarketing,
      ad_auto_review: ps.adAutoReview,
      ad_block_prohibited: ps.adBlockProhibited,
      ad_require_landing_page: ps.adRequireLanding,
      ad_block_misleading: ps.adBlockMisleading,
      ad_block_adult_content: ps.adBlockAdult,
      ad_block_health_claims: ps.adBlockHealth,
      ad_block_financial_promises: ps.adBlockFinancial,
      ad_pixel_verification: ps.adPixelVerification,
      anti_fraud_enabled: ps.antiFraudEnabled,
      chargeback_auto_block: ps.chargebackAutoBlock,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Erro ao salvar configurações");
    else toast.success("Configurações salvas!");
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* My Roles */}
      <div>
        <div className="flex items-center gap-2 mb-3"><Crown className="w-4 h-4 text-primary" /><h4 className="text-sm font-semibold text-foreground">Meus Cargos</h4></div>
        <div className="flex flex-wrap gap-2">
          {myRoles.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum cargo atribuído</p>
          ) : myRoles.map(role => {
            const info = roleLabels[role];
            const Icon = info.icon;
            return (
              <span key={role} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium">
                <Icon className={`w-3.5 h-3.5 ${info.color}`} />
                {info.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-primary" /><h4 className="text-sm font-semibold text-foreground">Permissões por Cargo</h4></div>
        <p className="text-[10px] text-muted-foreground mb-3">
          {isAdmin ? "Como admin, você pode alterar as permissões de cada cargo." : "Somente admins podem alterar permissões."}
        </p>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {allRoles.map(role => {
            const info = roleLabels[role];
            const Icon = info.icon;
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedRole === role ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {info.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {Object.entries(permissionLabels).map(([key, { label, desc }]) => {
            const perm = rolePerms.find(p => p.permission === key);
            const enabled = perm?.enabled ?? false;
            return (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
                <Toggle enabled={enabled} onChange={() => togglePermission(key, enabled)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Permissions */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-primary" /><h4 className="text-sm font-semibold text-foreground">Permissões da Conta</h4></div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border"><div><p className="text-xs font-medium text-foreground">Perfil público visível</p><p className="text-[10px] text-muted-foreground">Seu perfil pode ser encontrado por outros usuários</p></div><Toggle enabled={ps.permPublicProfile} onChange={() => updatePs("permPublicProfile")} /></div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border"><div><p className="text-xs font-medium text-foreground">Aceitar pedidos de afiliação</p><p className="text-[10px] text-muted-foreground">Permitir que afiliados solicitem promover seus produtos</p></div><Toggle enabled={ps.permAffiliateRequests} onChange={() => updatePs("permAffiliateRequests")} /></div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border"><div><p className="text-xs font-medium text-foreground">E-mail marketing</p><p className="text-[10px] text-muted-foreground">Receber ofertas e novidades de parceiros</p></div><Toggle enabled={ps.permEmailMarketing} onChange={() => updatePs("permEmailMarketing")} /></div>
        </div>
      </div>


      {/* Financial Config */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-1"><Wallet className="w-4 h-4 text-primary" /><h4 className="text-sm font-semibold text-foreground">Configuração Financeira</h4></div>
        <p className="text-[10px] text-muted-foreground mb-3">Regras anti-fraude, limites e configurações financeiras</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border">
            <div><p className="text-xs font-medium text-foreground">Anti-fraude ativada</p><p className="text-[10px] text-muted-foreground">Monitorar transações suspeitas automaticamente</p></div>
            <Toggle enabled={ps.antiFraudEnabled} onChange={() => updatePs("antiFraudEnabled")} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border">
            <div><p className="text-xs font-medium text-foreground">Bloqueio automático por chargeback</p><p className="text-[10px] text-muted-foreground">Bloquear saques quando houver chargebacks pendentes</p></div>
            <Toggle enabled={ps.chargebackAutoBlock} onChange={() => updatePs("chargebackAutoBlock")} />
          </div>
          <div className="p-3 rounded-xl border border-border space-y-2">
            <p className="text-xs font-medium text-foreground">Taxa da plataforma</p>
            <p className="text-sm font-semibold text-primary">Taxas de processamento em validação</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1">Saque mínimo</p><p className="text-sm font-semibold text-foreground">R$ 20,00</p></div>
            <div className="p-3 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1">Custódia (escrow)</p><p className="text-sm font-semibold text-foreground">14 dias</p></div>
            <div className="p-3 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1">KYC obrigatório acima de</p><p className="text-sm font-semibold text-foreground">R$ 1.000,00</p></div>
            <div className="p-3 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1">Taxa máx. reembolso</p><p className="text-sm font-semibold text-foreground">10%</p></div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><p className="text-xs font-semibold text-foreground">Negativação Serasa</p></div>
            <p className="text-[10px] text-muted-foreground">Saldos negativos por chargebacks não quitados em 4 meses serão encaminhados para negativação.</p>
          </div>
        </div>
      </div>

      <button onClick={savePlatformSettings} disabled={saving} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground mt-2 disabled:opacity-50">
        {saving ? "Salvando..." : "Salvar Configurações"}
      </button>
    </div>
  );
}
