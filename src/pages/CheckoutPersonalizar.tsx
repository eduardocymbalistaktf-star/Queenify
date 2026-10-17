import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { Paintbrush, Type, Image, Shield, Clock, Eye, Save, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useSupabaseData";
import { toast } from "sonner";

interface CheckoutSettings {
  id?: string;
  product_id: string;
  theme: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  banner_url: string | null;
  show_guarantee_badge: boolean;
  show_security_badge: boolean;
  show_testimonials: boolean;
  custom_cta_text: string;
  custom_header_text: string | null;
  urgency_enabled: boolean;
  urgency_text: string;
  countdown_enabled: boolean;
  countdown_minutes: number;
  countdown_seconds?: number;
}

const THEMES = [
  { id: "dark", label: "Escuro", bg: "#0a0a0a", fg: "#ffffff" },
  { id: "minimal", label: "Minimalista", bg: "#f5f5f5", fg: "#333333" },
  { id: "modern", label: "Moderno", bg: "#1a1a2e", fg: "#eaeaea" },
];

const PRESET_COLORS = [
  "#D4A843", "#e74c3c", "#3498db", "#2ecc71", "#9b59b6",
  "#e67e22", "#1abc9c", "#e91e63", "#00bcd4", "#ff5722",
];

const defaultSettings: Omit<CheckoutSettings, "product_id"> = {
  theme: "dark",
  primary_color: "#D4A843",
  secondary_color: "#1a1a1a",
  accent_color: "#D4A843",
  logo_url: null,
  banner_url: null,
  show_guarantee_badge: true,
  show_security_badge: true,
  show_testimonials: false,
  custom_cta_text: "Comprar agora",
  custom_header_text: null,
  urgency_enabled: false,
  urgency_text: "Oferta por tempo limitado!",
  countdown_enabled: false,
  countdown_minutes: 15,
  countdown_seconds: 0,
};

const CheckoutPersonalizar = () => {
  const { user } = useAuth();
  const { data: products } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [settings, setSettings] = useState<CheckoutSettings>({ ...defaultSettings, product_id: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (products?.length && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  useEffect(() => {
    if (!selectedProductId || !user) return;
    setLoading(true);
    supabase
      .from("checkout_settings")
      .select("*")
      .eq("product_id", selectedProductId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettings({ ...data, countdown_seconds: 0 } as any);
        } else {
          setSettings({ ...defaultSettings, product_id: selectedProductId });
        }
        setLoading(false);
      });
  }, [selectedProductId, user]);

  const handleSave = async () => {
    if (!user || !selectedProductId) return;
    setSaving(true);
    const { countdown_seconds, ...rest } = settings;
    const payload = { ...rest, product_id: selectedProductId, user_id: user.id };
    delete (payload as any).id;

    const { error } = settings.id
      ? await supabase.from("checkout_settings").update(payload).eq("id", settings.id)
      : await supabase.from("checkout_settings").insert(payload);

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Checkout personalizado salvo!");
      const { data } = await supabase.from("checkout_settings").select("*").eq("product_id", selectedProductId).maybeSingle();
      if (data) setSettings({ ...data, countdown_seconds: 0 } as any);
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/checkout-logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Erro no upload"); return; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    setSettings(s => ({ ...s, logo_url: publicUrl }));
    toast.success("Logo enviado!");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/checkout-banner-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Erro no upload"); return; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    setSettings(s => ({ ...s, banner_url: publicUrl }));
    toast.success("Banner enviado!");
  };

  const selectedProduct = products?.find(p => p.id === selectedProductId);
  const totalSeconds = (settings.countdown_minutes * 60) + (settings.countdown_seconds || 0);
  const displayMin = Math.floor(totalSeconds / 60);
  const displaySec = totalSeconds % 60;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Paintbrush className="w-6 h-6 text-primary" />
            Personalizar Checkout
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Customize cores, tema, logo e gatilhos do seu checkout.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedProductId && (
            <a href={`${import.meta.env.BASE_URL}checkout/${selectedProductId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors">
              <Eye className="w-4 h-4" /> Pré-visualizar
            </a>
          )}
          <button onClick={handleSave} disabled={saving || !selectedProductId} className="flex items-center gap-2 px-5 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <div className="glass-card p-4 mb-6">
        <label className="text-xs text-muted-foreground mb-1.5 block">Selecione o produto</label>
        <div className="relative">
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Selecione...</option>
            {products?.map(p => <option key={p.id} value={p.id}>{p.name} — R$ {p.price.toFixed(2)}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : !selectedProductId ? (
        <div className="glass-card p-12 text-center">
          <Paintbrush className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">Selecione um produto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Theme */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2"><Paintbrush className="w-4 h-4 text-primary" /> Tema do Checkout</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setSettings(s => ({ ...s, theme: t.id }))} className={`p-3 rounded-xl border text-center transition-all ${settings.theme === t.id ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/20"}`}>
                    <div className="w-full h-8 rounded-lg mb-2" style={{ background: t.bg, border: `1px solid ${t.fg}20` }}>
                      <div className="w-6 h-1.5 rounded-full mx-auto mt-2" style={{ background: t.fg }} />
                    </div>
                    <p className="text-xs font-medium text-foreground">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors - removed "Cor de fundo" */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-display font-bold text-foreground">🎨 Cores</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "primary_color", label: "Cor primária (botões)" },
                  { key: "accent_color", label: "Cor de destaque" },
                ].map(c => (
                  <div key={c.key}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{c.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={(settings as any)[c.key]} onChange={(e) => setSettings(s => ({ ...s, [c.key]: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                      <input type="text" value={(settings as any)[c.key]} onChange={(e) => setSettings(s => ({ ...s, [c.key]: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground font-mono" />
                    </div>
                    <div className="flex gap-1 mt-2">
                      {PRESET_COLORS.map(color => (
                        <button key={color} onClick={() => setSettings(s => ({ ...s, [c.key]: color }))} className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform" style={{ background: color }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2"><Image className="w-4 h-4 text-primary" /> Logo e Banner</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Logo do checkout</label>
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-secondary/50">
                    {settings.logo_url ? <img src={settings.logo_url} alt="Logo" className="h-20 object-contain" /> : <><Image className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Enviar logo</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {settings.logo_url && <button onClick={() => setSettings(s => ({ ...s, logo_url: null }))} className="text-xs text-destructive mt-1">Remover</button>}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Banner do checkout</label>
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-secondary/50">
                    {settings.banner_url ? <img src={settings.banner_url} alt="Banner" className="h-20 w-full object-cover rounded-lg" /> : <><Image className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Enviar banner</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                  </label>
                  {settings.banner_url && <button onClick={() => setSettings(s => ({ ...s, banner_url: null }))} className="text-xs text-destructive mt-1">Remover</button>}
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> Textos</h2>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Título do checkout (opcional)</label>
                <input type="text" placeholder="Ex: Garanta sua vaga agora!" value={settings.custom_header_text || ""} onChange={(e) => setSettings(s => ({ ...s, custom_header_text: e.target.value || null }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Texto do botão de compra</label>
                <input type="text" value={settings.custom_cta_text} onChange={(e) => setSettings(s => ({ ...s, custom_cta_text: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
              </div>
            </div>

            {/* Badges & Urgency */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Badges e Gatilhos</h2>
              <div className="space-y-3">
                {[
                  { key: "show_guarantee_badge", label: "Selo de garantia" },
                  { key: "show_security_badge", label: "Selo de segurança" },
                  { key: "show_testimonials", label: "Exibir depoimentos" },
                ].map(b => (
                  <label key={b.key} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/50 cursor-pointer">
                    <span className="text-sm text-foreground">{b.label}</span>
                    <div onClick={() => setSettings(s => ({ ...s, [b.key]: !(s as any)[b.key] }))} className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${(settings as any)[b.key] ? "bg-primary" : "bg-muted"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${(settings as any)[b.key] ? "translate-x-5" : ""}`} />
                    </div>
                  </label>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Gatilhos de Urgência</h3>
                <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/50 cursor-pointer">
                  <span className="text-sm text-foreground">Texto de urgência</span>
                  <div onClick={() => setSettings(s => ({ ...s, urgency_enabled: !s.urgency_enabled }))} className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${settings.urgency_enabled ? "bg-primary" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.urgency_enabled ? "translate-x-5" : ""}`} />
                  </div>
                </label>
                {settings.urgency_enabled && (
                  <input type="text" value={settings.urgency_text} onChange={(e) => setSettings(s => ({ ...s, urgency_text: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
                )}

                <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/50 cursor-pointer">
                  <span className="text-sm text-foreground">Timer de contagem regressiva</span>
                  <div onClick={() => setSettings(s => ({ ...s, countdown_enabled: !s.countdown_enabled }))} className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${settings.countdown_enabled ? "bg-primary" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.countdown_enabled ? "translate-x-5" : ""}`} />
                  </div>
                </label>
                {settings.countdown_enabled && (
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Minutos</label>
                      <input type="number" min={0} max={120} value={settings.countdown_minutes} onChange={(e) => setSettings(s => ({ ...s, countdown_minutes: parseInt(e.target.value) || 0 }))} className="w-24 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
                    </div>
                    <span className="text-foreground font-bold mt-5">:</span>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Segundos</label>
                      <input type="number" min={0} max={59} value={settings.countdown_seconds || 0} onChange={(e) => setSettings(s => ({ ...s, countdown_seconds: Math.min(59, parseInt(e.target.value) || 0) }))} className="w-24 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <h3 className="text-sm font-display font-bold text-foreground">Pré-visualização</h3>
              <div className="rounded-2xl border border-border overflow-hidden shadow-xl" style={{ background: THEMES.find(t => t.id === settings.theme)?.bg || "#0a0a0a" }}>
                <div className="p-3 border-b" style={{ borderColor: `${THEMES.find(t => t.id === settings.theme)?.fg || "#fff"}15` }}>
                  <div className="flex items-center justify-between">
                    {settings.logo_url ? <img src={settings.logo_url} alt="" className="h-5 object-contain" /> : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full" style={{ background: settings.primary_color }} />
                        <span className="text-[10px] font-bold" style={{ color: THEMES.find(t => t.id === settings.theme)?.fg }}>Queenify</span>
                      </div>
                    )}
                    <span className="text-[8px]" style={{ color: `${THEMES.find(t => t.id === settings.theme)?.fg || "#fff"}60` }}>🔒 Seguro</span>
                  </div>
                </div>
                {settings.banner_url && <img src={settings.banner_url} alt="" className="w-full h-16 object-cover" />}
                {settings.urgency_enabled && (
                  <div className="px-3 py-1.5 text-center" style={{ background: `${settings.primary_color}20` }}>
                    <span className="text-[9px] font-bold" style={{ color: settings.primary_color }}>⚡ {settings.urgency_text}</span>
                  </div>
                )}
                {settings.custom_header_text && (
                  <div className="px-3 pt-3"><p className="text-[10px] font-bold" style={{ color: THEMES.find(t => t.id === settings.theme)?.fg }}>{settings.custom_header_text}</p></div>
                )}
                <div className="p-3 space-y-2">
                  <div className="space-y-1.5">
                    <div className="h-2 w-12 rounded bg-current opacity-20" style={{ color: THEMES.find(t => t.id === settings.theme)?.fg }} />
                    <div className="h-6 rounded-lg" style={{ background: `${THEMES.find(t => t.id === settings.theme)?.fg || "#fff"}10`, border: `1px solid ${THEMES.find(t => t.id === settings.theme)?.fg || "#fff"}15` }} />
                  </div>
                  {settings.countdown_enabled && (
                    <div className="text-center py-1">
                      <span className="text-[10px] font-mono font-bold" style={{ color: settings.accent_color }}>
                        ⏱ {String(displayMin).padStart(2, "0")}:{String(displaySec).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                  <button className="w-full py-2 rounded-lg text-[10px] font-bold text-white" style={{ background: settings.primary_color }}>{settings.custom_cta_text}</button>
                  {settings.show_security_badge && (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="text-[7px]" style={{ color: `${THEMES.find(t => t.id === settings.theme)?.fg || "#fff"}40` }}>🔐 SSL</span>
                      <span className="text-[7px]" style={{ color: `${THEMES.find(t => t.id === settings.theme)?.fg || "#fff"}40` }}>🛡️ Seguro</span>
                    </div>
                  )}
                </div>
                {settings.show_guarantee_badge && selectedProduct && (
                  <div className="mx-3 mb-3 p-2 rounded-lg text-center" style={{ background: `${settings.primary_color}10`, border: `1px solid ${settings.primary_color}30` }}>
                    <span className="text-[8px] font-medium" style={{ color: settings.primary_color }}>🛡️ Garantia de {selectedProduct.guarantee_days || 7} dias</span>
                  </div>
                )}
                <div className="p-2 text-center border-t" style={{ borderColor: `${THEMES.find(t => t.id === settings.theme)?.fg || "#fff"}10` }}>
                  <span className="text-[7px]" style={{ color: `${THEMES.find(t => t.id === settings.theme)?.fg || "#fff"}30` }}>Powered by Queenify</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CheckoutPersonalizar;
