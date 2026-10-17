import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useEffect, useRef } from "react";
import { User, Lock, Bell, CreditCard, Upload, Check, Share2, Copy, MessageCircle, Palette, FileText, Shield, X, KeyRound, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useUserSettings, useUpdateSettings } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useNavigate, useSearchParams } from "react-router-dom";
import PermissoesTab from "@/components/PermissoesTab";

const tabs = [
  { icon: User, label: "Perfil" },
  { icon: Lock, label: "Segurança" },
  { icon: Bell, label: "Notificações" },
  { icon: CreditCard, label: "Pagamento" },
  { icon: Palette, label: "Aparência" },
  { icon: FileText, label: "Documentos" },
  { icon: Shield, label: "Permissões" },
];

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}>
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-all ${enabled ? "right-1" : "left-1"}`} />
  </button>
);

const themeOptions = [
  { id: "dark", label: "Grafite", bg: "bg-[hsl(222,20%,7%)]", border: "border-[hsl(218,15%,24%)]" },
  { id: "light", label: "Aço", bg: "bg-[hsl(220,18%,13%)]", border: "border-[hsl(212,18%,36%)]" },
  { id: "gray", label: "Titânio", bg: "bg-[hsl(216,17%,17%)]", border: "border-[hsl(210,20%,45%)]" },
];

const colorPalette = [
  { id: "silver", label: "Titânio", color: "hsl(210, 22%, 78%)", value: "210 22% 78%" },
  { id: "purple", label: "Roxo", color: "hsl(270, 70%, 60%)", value: "270 70% 60%" },
  { id: "blue", label: "Azul", color: "hsl(220, 90%, 56%)", value: "220 90% 56%" },
  { id: "green", label: "Verde", color: "hsl(142, 71%, 45%)", value: "142 71% 45%" },
  { id: "orange", label: "Laranja", color: "hsl(25, 95%, 53%)", value: "25 95% 53%" },
  { id: "pink", label: "Rosa", color: "hsl(330, 80%, 60%)", value: "330 80% 60%" },
  { id: "red", label: "Vermelho", color: "hsl(0, 72%, 51%)", value: "0 72% 51%" },
  { id: "teal", label: "Teal", color: "hsl(180, 60%, 45%)", value: "180 60% 45%" },
];

const applyThemeToDOM = (themeId: string) => {
  const themes: Record<string, Record<string, string>> = {
    dark: { "--background": "222 20% 7%", "--card": "222 18% 11%", "--secondary": "220 16% 16%", "--muted": "220 16% 16%", "--border": "218 15% 24%", "--input": "218 15% 24%", "--popover": "222 19% 10%", "--sidebar-background": "225 24% 6%", "--sidebar-accent": "222 20% 12%", "--sidebar-border": "220 16% 17%" },
    light: { "--background": "220 18% 10%", "--card": "220 17% 14%", "--secondary": "218 16% 19%", "--muted": "218 16% 19%", "--border": "215 17% 31%", "--input": "215 17% 31%", "--popover": "220 17% 13%", "--sidebar-background": "222 21% 8%", "--sidebar-accent": "220 18% 14%", "--sidebar-border": "216 17% 23%" },
    gray: { "--background": "218 18% 12%", "--card": "216 17% 17%", "--secondary": "215 16% 22%", "--muted": "215 16% 22%", "--border": "210 18% 38%", "--input": "210 18% 38%", "--popover": "216 17% 15%", "--sidebar-background": "220 22% 9%", "--sidebar-accent": "216 18% 16%", "--sidebar-border": "212 17% 29%" },
  };
  const chosenTheme = themes[themeId] || themes.dark;
  const sharedText = { "--foreground": "213 25% 93%", "--card-foreground": "213 25% 93%", "--muted-foreground": "216 12% 68%", "--secondary-foreground": "213 20% 90%", "--sidebar-foreground": "213 20% 85%", "--sidebar-accent-foreground": "0 0% 100%" };
  Object.entries({ ...chosenTheme, ...sharedText }).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
};

const applyColorToDOM = (colorId: string) => {
  const color = colorPalette.find(c => c.id === colorId) || (colorId === "gold" ? colorPalette[0] : undefined);
  if (color) {
    document.documentElement.style.setProperty("--primary", color.value);
    document.documentElement.style.setProperty("--accent", color.value);
    document.documentElement.style.setProperty("--ring", color.value);
    document.documentElement.style.setProperty("--sidebar-primary", color.value);
    document.documentElement.style.setProperty("--sidebar-ring", color.value);
  }
};

const Configuracoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const { upload: uploadAvatar, uploading: avatarUploading } = useImageUpload("avatars");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docRgRef = useRef<HTMLInputElement>(null);
  const docSelfieRef = useRef<HTMLInputElement>(null);
  const docAddressRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "Perfil";
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: false });

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [showLevel, setShowLevel] = useState(true);
  const [showFrame, setShowFrame] = useState(true);

  // Notifications
  const [notifVendas, setNotifVendas] = useState(true);
  const [notifAfiliados, setNotifAfiliados] = useState(true);
  const [notifSistema, setNotifSistema] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [permNotifications, setPermNotifications] = useState(true);

  // Payment
  const [pixKey, setPixKey] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAgency, setBankAgency] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  
  // 2FA TOTP
  const [totpEnrolling, setTotpEnrolling] = useState(false);
  const [totpQrUrl, setTotpQrUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpChallengeId, setTotpChallengeId] = useState<string | null>(null);
  const [totpLoading, setTotpLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Appearance
  const [selectedTheme, setSelectedTheme] = useState("dark");
  const [selectedColor, setSelectedColor] = useState("silver");

  // Documents
  const [docCpf, setDocCpf] = useState("");
  const [docRgUrl, setDocRgUrl] = useState<string | null>(null);
  const [docSelfieUrl, setDocSelfieUrl] = useState<string | null>(null);
  const [docAddressUrl, setDocAddressUrl] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Permissions (moved to PermissoesTab component)

  useEffect(() => {
    if (settings) {
      setBio(settings.bio || "");
      setInstagram(settings.social_instagram || "");
      setYoutube(settings.social_youtube || "");
      setTiktok(settings.social_tiktok || "");
      setShowLevel(settings.show_level ?? true);
      setShowFrame(settings.show_frame ?? true);
      setPixKey(settings.pix_key || "");
      setBankName(settings.bank_name || "");
      setBankAgency(settings.bank_agency || "");
      setBankAccount(settings.bank_account || "");
      const np = settings.notification_preferences as Record<string, boolean> | null;
      if (np) {
        setNotifVendas(np.vendas_email ?? true);
        setNotifAfiliados(np.afiliados_email ?? true);
        setNotifSistema(np.sistema_email ?? false);
        setNotifEmail(np.vendas_email ?? true);
        setNotifPush(np.vendas_push ?? false);
      }
      const dbTheme = (settings as any).theme;
      const dbColor = (settings as any).accent_color;
      if (dbTheme) { setSelectedTheme(dbTheme); applyThemeToDOM(dbTheme); }
      if (dbColor) {
        const preferredColor = dbColor === "gold" ? "silver" : dbColor;
        setSelectedColor(preferredColor);
        applyColorToDOM(preferredColor);
      }
      setDocRgUrl((settings as any).doc_rg_url || null);
      setDocSelfieUrl((settings as any).doc_selfie_url || null);
      setDocAddressUrl((settings as any).doc_address_url || null);
      setDocCpf((settings as any).doc_cpf_url || "");
    }
  }, [settings]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url, display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      if (data?.display_name) setDisplayName(data.display_name);
    });
  }, [user]);

  // Check existing TOTP factors + backup codes
  useEffect(() => {
    if (!user) return;
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.find(f => f.status === "verified");
      if (totp) {
        setTotpEnabled(true);
        setTotpFactorId(totp.id);
      }
    });
    supabase.from("user_settings").select("backup_codes").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.backup_codes) setBackupCodes(data.backup_codes as string[]);
    });
  }, [user]);


  const handleEnrollTotp = async () => {
    setTotpLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Queenify 2FA" });
    if (error) { toast.error("Erro ao configurar 2FA: " + error.message); setTotpLoading(false); return; }
    setTotpQrUrl(data.totp.qr_code);
    setTotpSecret(data.totp.secret);
    setTotpFactorId(data.id);
    setTotpEnrolling(true);
    
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: data.id });
    if (challengeError) { toast.error("Erro no desafio 2FA"); setTotpLoading(false); return; }
    setTotpChallengeId(challengeData.id);
    setTotpLoading(false);
  };

  const handleVerifyTotp = async () => {
    if (!totpFactorId || !totpChallengeId) return;
    setTotpLoading(true);
    const { error } = await supabase.auth.mfa.verify({ factorId: totpFactorId, challengeId: totpChallengeId, code: totpVerifyCode });
    if (error) { toast.error("Código inválido. Tente novamente."); setTotpLoading(false); return; }
    
    // Generate backup codes
    const codes = Array.from({ length: 8 }, () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    });
    setBackupCodes(codes);
    setShowBackupCodes(true);
    
    // Save backup codes to DB
    if (user) {
      await supabase.from("user_settings").update({ backup_codes: codes } as any).eq("user_id", user.id);
    }
    
    setTotpEnabled(true);
    setTotpEnrolling(false);
    setTotpVerifyCode("");
    setTotpLoading(false);
    
    // Internal notification
    if (user) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "security",
        title: "2FA Ativado",
        message: "A autenticação de dois fatores foi ativada na sua conta. Seus códigos de recuperação foram gerados.",
      });
    }
    toast.success("2FA ativado! Salve seus códigos de recuperação.");
  };

  const handleUnenrollTotp = async () => {
    if (!totpFactorId) return;
    setTotpLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactorId });
    if (error) { toast.error("Erro ao desativar 2FA: " + error.message); setTotpLoading(false); return; }
    setTotpEnabled(false);
    setTotpFactorId(null);
    setTotpEnrolling(false);
    setTotpQrUrl(null);
    setTotpSecret(null);
    setBackupCodes(null);
    setShowBackupCodes(false);
    if (user) await supabase.from("user_settings").update({ backup_codes: null } as any).eq("user_id", user.id);
    
    // Internal notification
    if (user) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "security",
        title: "2FA Desativado",
        message: "A autenticação de dois fatores foi desativada na sua conta. Recomendamos reativar para maior segurança.",
      });
    }
    setTotpLoading(false);
    toast.success("Autenticação de dois fatores desativada.");
  };

  const handleRegenerateBackupCodes = async () => {
    if (!user) return;
    setTotpLoading(true);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const codes = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    );
    await supabase.from("user_settings").update({ backup_codes: codes } as any).eq("user_id", user.id);
    setBackupCodes(codes);
    setShowBackupCodes(true);
    setTotpLoading(false);
    toast.success("Novos códigos gerados! Os anteriores foram invalidados.");
  };

  const applyColor = async (colorId: string) => {
    setSelectedColor(colorId);
    applyColorToDOM(colorId);
    if (user) {
      const { error } = await supabase.from("user_settings").update({ accent_color: colorId } as any).eq("user_id", user.id);
      if (error) { toast.error("A cor foi aplicada nesta sessão, mas não pôde ser salva na conta."); return; }
    }
    try { localStorage.setItem("queenify-theme-color", colorId); } catch { /* storage can be unavailable in private browsing */ }
    toast.success("Cor aplicada!");
  };

  const applyTheme = async (themeId: string) => {
    setSelectedTheme(themeId);
    applyThemeToDOM(themeId);
    if (user) {
      const { error } = await supabase.from("user_settings").update({ theme: themeId } as any).eq("user_id", user.id);
      if (error) { toast.error("O tema foi aplicado nesta sessão, mas não pôde ser salvo na conta."); return; }
    }
    try { localStorage.setItem("queenify-theme", themeId); } catch { /* storage can be unavailable in private browsing */ }
    toast.success("Tema aplicado!");
  };

  const uploadDocument = async (file: File, docType: string) => {
    if (!user) return;
    setUploadingDoc(docType);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${docType}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar documento: " + error.message); setUploadingDoc(null); return; }
    const updateField: Record<string, string> = {};
    updateField[`doc_${docType}_url`] = path;
    await supabase.from("user_settings").update(updateField as any).eq("user_id", user.id);
    if (docType === "rg") setDocRgUrl(path);
    else if (docType === "selfie") setDocSelfieUrl(path);
    else if (docType === "address") setDocAddressUrl(path);
    setUploadingDoc(null);
    toast.success("Documento enviado com sucesso!");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAvatar(file);
    if (url) {
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user!.id);
      toast.success("Avatar atualizado!");
    }
  };

  const [profileSaving, setProfileSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    setNameError("");

    // Check unique display name
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setNameError("Nome de usuário é obrigatório");
      setProfileSaving(false);
      return;
    }

    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("display_name", trimmedName)
      .neq("user_id", user.id)
      .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
      setNameError("Nome de usuário já ocupado, insira outro nome");
      setProfileSaving(false);
      toast.error("Nome de usuário já ocupado, insira outro nome");
      return;
    }

    // Save display name to profiles table
    await supabase.from("profiles").update({ display_name: trimmedName }).eq("user_id", user.id);

    // Update auth user metadata
    await supabase.auth.updateUser({ data: { full_name: trimmedName } });

    // Save other settings
    await updateSettings.mutateAsync({ bio, social_instagram: instagram, social_youtube: youtube, social_tiktok: tiktok, show_level: showLevel, show_frame: showFrame });
    setProfileSaving(false);
  };

  const handleSaveNotifications = async () => {
    await updateSettings.mutateAsync({
      notification_preferences: { vendas_email: notifVendas, vendas_push: notifPush, afiliados_email: notifAfiliados, afiliados_push: false, sistema_email: notifSistema, sistema_push: notifPush },
    });
  };

  const handleSavePayment = async () => {
    await updateSettings.mutateAsync({ pix_key: pixKey, bank_name: bankName, bank_agency: bankAgency, bank_account: bankAccount });
  };

  const handleSendVerificationCode = async () => {
    if (!currentPassword) { toast.error("Informe a senha atual"); return; }
    setSendingCode(true);
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInError) { setSendingCode(false); toast.error("Senha atual incorreta"); return; }
    
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedCode(code);
    setCodeSent(true);
    setSendingCode(false);
    toast.success(`Código de verificação enviado para ${user!.email}`, { description: `(Demo) Seu código é: ${code}` });
  };

  const handleVerifyCode = () => {
    if (verificationCode === generatedCode) {
      setCodeVerified(true);
      toast.success("Código verificado com sucesso!");
    } else {
      toast.error("Código incorreto. Tente novamente.");
    }
  };

  const handleChangePassword = async () => {
    if (!codeVerified) { toast.error("Verifique o código de e-mail primeiro"); return; }
    if (newPassword.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); } else {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setVerificationCode(""); setGeneratedCode(""); setCodeSent(false); setCodeVerified(false);
    }
  };

  const handleSaveDocuments = async () => {
    if (!user) return;
    await supabase.from("user_settings").update({ doc_cpf_url: docCpf } as any).eq("user_id", user.id);
    toast.success("Documentos salvos! Verificação em análise.");
  };

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie as configurações da sua conta.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.label} onClick={() => setActiveTab(t.label)} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-colors ${activeTab === t.label ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        {activeTab === "Perfil" && (
          <div className="space-y-5 max-w-lg">
            <div className="flex items-center gap-4 mb-2">
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <div className="relative w-20 h-20 rounded-full bg-secondary overflow-hidden border-2 border-border flex-shrink-0">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">{displayName.slice(0, 2).toUpperCase()}</div>
                )}
                {avatarUploading && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
              </div>
              <button onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-accent transition-colors disabled:opacity-50">
                <Upload className="w-3.5 h-3.5" /> Alterar foto
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome completo</label>
              <input className={`w-full bg-secondary border rounded-lg px-3 py-2 text-sm text-foreground ${nameError ? "border-destructive" : "border-border"}`} value={displayName} onChange={(e) => { setDisplayName(e.target.value); setNameError(""); }} />
              {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
            </div>
            <div><label className="text-xs text-muted-foreground block mb-1">E-mail</label><input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground" value={user?.email || ""} disabled /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Instagram</label><input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuuser" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">YouTube</label><input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="URL do canal" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">TikTok</label><input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@seuuser" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Bio</label><textarea className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground h-20 resize-none" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm text-foreground font-medium">Exibir nível no perfil</p><p className="text-xs text-muted-foreground">Escolha se seu nível aparece publicamente.</p></div><Toggle enabled={showLevel} onChange={() => setShowLevel(!showLevel)} /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm text-foreground font-medium">Exibir moldura no perfil</p><p className="text-xs text-muted-foreground">Escolha se a moldura do nível aparece no seu avatar.</p></div><Toggle enabled={showFrame} onChange={() => setShowFrame(!showFrame)} /></div>
            <button onClick={handleSaveProfile} disabled={profileSaving || updateSettings.isPending} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground mt-4 disabled:opacity-50">{profileSaving || updateSettings.isPending ? "Salvando..." : "Salvar Alterações"}</button>
            {user && (
              <div className="mt-4 p-4 bg-secondary/50 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Seu perfil público</p>
                <div className="flex items-center gap-2 mb-3">
                  <input readOnly value={`${window.location.origin}${import.meta.env.BASE_URL}p/${user.id}`} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground" />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}p/${user.id}`); toast.success("Link copiado!"); }} className="p-1.5 bg-secondary border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Copiar link"><Copy className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`${import.meta.env.BASE_URL}p/${user.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-accent transition-colors"><Share2 className="w-3.5 h-3.5" /> Ver perfil</a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Confira meus produtos na Queenify! ${window.location.origin}${import.meta.env.BASE_URL}p/${user.id}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/15 border border-[#25D366]/30 rounded-lg text-xs text-[#25D366] hover:bg-[#25D366]/25 transition-colors"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Segurança" && (
          <div className="space-y-5 max-w-lg">
            {(() => {
              const identities = user?.identities || [];
              const hasPasswordIdentity = identities.some((id: any) => id.provider === "email");
              const oauthIdentity = identities.find((id: any) => id.provider !== "email");
              const providerName = oauthIdentity?.provider;
              const isOAuthOnly = !hasPasswordIdentity && oauthIdentity;
              return { isOAuthOnly, providerName };
            })().isOAuthOnly ? (
              <>
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-semibold text-foreground">Conta vinculada via {(() => { const i = user?.identities?.find((id: any) => id.provider !== "email"); return i?.provider === "google" ? "Google" : i?.provider || "login social"; })()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sua conta foi criada usando login social e não possui uma senha definida. 
                    Para definir uma senha e poder alterá-la futuramente, utilize a opção <strong>"Esqueci minha senha"</strong> abaixo. 
                    Um link será enviado para <strong>{user.email}</strong>.
                  </p>
                </div>
                <div>
                  <button onClick={() => navigate("/forgot-password")} className="flex items-center gap-1.5 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
                    <KeyRound className="w-3.5 h-3.5" /> Definir minha senha
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-primary" /><p className="text-sm font-semibold text-foreground">Verificação em 3 etapas</p></div>
                  <p className="text-xs text-muted-foreground">1. Informe a senha atual → 2. Confirme o código enviado por e-mail → 3. Defina a nova senha.</p>
                </div>

                {/* Step 1: Current password */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Etapa 1 — Senha atual</label>
                  <input type="password" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Digite sua senha atual" disabled={codeSent} />
                </div>
                {!codeSent && (
                  <button onClick={handleSendVerificationCode} disabled={sendingCode || !currentPassword} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">
                    {sendingCode ? "Enviando..." : "Enviar código de verificação"}
                  </button>
                )}

                {/* Step 2: Verification code */}
                {codeSent && !codeVerified && (
                  <div className="space-y-3 p-4 bg-secondary/50 border border-border rounded-xl">
                    <label className="text-xs text-muted-foreground block">Etapa 2 — Código de 4 dígitos enviado para {user?.email}</label>
                    <div className="flex items-center gap-3">
                      <input type="text" maxLength={4} className="w-32 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center tracking-[0.5em] font-mono font-bold" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="0000" />
                      <button onClick={handleVerifyCode} disabled={verificationCode.length !== 4} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">Verificar</button>
                    </div>
                    <button onClick={handleSendVerificationCode} className="text-xs text-primary hover:underline">Reenviar código</button>
                  </div>
                )}

                {/* Step 3: New password */}
                {codeVerified && (
                  <>
                    <div className="flex items-center gap-2 text-success text-xs"><Check className="w-4 h-4" /> Código verificado com sucesso</div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Etapa 3 — Nova senha</label>
                      <input type="password" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Confirmar nova senha</label>
                      <input type="password" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <button onClick={handleChangePassword} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Alterar Senha</button>
                  </>
                )}

                <div className="border-t border-border pt-4">
                  <button onClick={() => navigate("/forgot-password")} className="flex items-center gap-1.5 px-4 py-2 bg-secondary border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <KeyRound className="w-3.5 h-3.5" /> Esqueci minha senha
                  </button>
                </div>
              </>
            )}

            {/* 2FA TOTP Section */}
            <div className="border-t border-border pt-5 mt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Autenticação de Dois Fatores (2FA)</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Adicione uma camada extra de segurança usando um aplicativo autenticador (Google Authenticator, Authy, etc.).
              </p>

              {/* Backup codes display */}
              {showBackupCodes && backupCodes && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-destructive" />
                    <p className="text-xs font-semibold text-foreground">Códigos de Recuperação</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Guarde estes códigos em um local seguro. Cada código pode ser usado uma única vez caso você perca acesso ao seu app autenticador.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, i) => (
                      <code key={i} className="text-xs font-mono bg-secondary px-3 py-1.5 rounded text-foreground text-center select-all">{code}</code>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(backupCodes.join("\n")); toast.success("Códigos copiados!"); }} className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-secondary/80">
                      Copiar códigos
                    </button>
                    <button onClick={() => setShowBackupCodes(false)} className="px-3 py-1.5 gradient-gold rounded-lg text-xs font-semibold text-primary-foreground">
                      Já salvei meus códigos
                    </button>
                  </div>
                </div>
              )}

              {totpEnabled ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-success text-xs">
                    <Check className="w-4 h-4" /> 2FA está ativo na sua conta
                  </div>
                  {backupCodes && !showBackupCodes && (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setShowBackupCodes(true)} className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Ver códigos de recuperação
                      </button>
                      <button onClick={handleRegenerateBackupCodes} disabled={totpLoading} className="px-3 py-1.5 bg-secondary border border-primary/30 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors disabled:opacity-50">
                        {totpLoading ? "Gerando..." : "Regenerar códigos"}
                      </button>
                    </div>
                  )}
                  <button onClick={handleUnenrollTotp} disabled={totpLoading} className="px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50">
                    {totpLoading ? "Desativando..." : "Desativar 2FA"}
                  </button>
                </div>
              ) : totpEnrolling ? (
                <div className="space-y-4 p-4 bg-secondary/50 border border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">Escaneie o QR Code abaixo no seu aplicativo autenticador:</p>
                  {totpQrUrl && (
                    <div className="flex justify-center">
                      <img src={totpQrUrl} alt="QR Code 2FA" className="w-48 h-48 rounded-lg bg-white p-2" />
                    </div>
                  )}
                  {totpSecret && (
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Ou insira o código manualmente:</p>
                      <code className="text-xs font-mono bg-secondary px-3 py-1 rounded text-foreground select-all">{totpSecret}</code>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Digite o código de 6 dígitos do seu app:</label>
                    <div className="flex items-center gap-3">
                      <input type="text" maxLength={6} className="w-40 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center tracking-[0.4em] font-mono font-bold" value={totpVerifyCode} onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" />
                      <button onClick={handleVerifyTotp} disabled={totpVerifyCode.length !== 6 || totpLoading} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">
                        {totpLoading ? "Verificando..." : "Ativar 2FA"}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { setTotpEnrolling(false); setTotpQrUrl(null); setTotpSecret(null); }} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                </div>
              ) : (
                <button onClick={handleEnrollTotp} disabled={totpLoading} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {totpLoading ? "Configurando..." : "Configurar 2FA"}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "Notificações" && (
          <div className="space-y-5 max-w-lg">
            <h4 className="text-sm font-semibold text-foreground">Categorias de notificação</h4>
            <div className="flex items-center justify-between"><div><p className="text-sm text-foreground font-medium">Vendas</p><p className="text-xs text-muted-foreground">Receber notificações de novas vendas.</p></div><Toggle enabled={notifVendas} onChange={() => setNotifVendas(!notifVendas)} /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm text-foreground font-medium">Afiliados</p><p className="text-xs text-muted-foreground">Pedidos de afiliação e atividade de afiliados.</p></div><Toggle enabled={notifAfiliados} onChange={() => setNotifAfiliados(!notifAfiliados)} /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm text-foreground font-medium">Sistema</p><p className="text-xs text-muted-foreground">Atualizações da plataforma e manutenções.</p></div><Toggle enabled={notifSistema} onChange={() => setNotifSistema(!notifSistema)} /></div>
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Canais de entrega</h4>
              <div className="flex items-center justify-between mb-3"><div><p className="text-sm text-foreground font-medium">E-mail</p><p className="text-xs text-muted-foreground">Receber resumos por e-mail.</p></div><Toggle enabled={notifEmail} onChange={() => setNotifEmail(!notifEmail)} /></div>
              <div className="flex items-center justify-between"><div><p className="text-sm text-foreground font-medium">Push no navegador</p><p className="text-xs text-muted-foreground">Notificações em tempo real.</p></div><Toggle enabled={notifPush} onChange={() => setNotifPush(!notifPush)} /></div>
            </div>
            <button onClick={handleSaveNotifications} disabled={updateSettings.isPending} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground mt-2 disabled:opacity-50">{updateSettings.isPending ? "Salvando..." : "Salvar Preferências"}</button>
          </div>
        )}

        {activeTab === "Pagamento" && (
          <div className="space-y-5 max-w-lg">
            <h4 className="text-sm font-semibold text-foreground">Dados para recebimento</h4>
            <div><label className="text-xs text-muted-foreground block mb-1">Chave PIX</label><input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="CPF, e-mail, telefone ou chave aleatória" value={pixKey} onChange={(e) => setPixKey(e.target.value)} /></div>
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Conta bancária (opcional)</h4>
              <div className="space-y-3">
                <div><label className="text-xs text-muted-foreground block mb-1">Banco</label><input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="Ex: Nubank, Itaú..." value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">Agência</label><input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="0001" value={bankAgency} onChange={(e) => setBankAgency(e.target.value)} /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Conta</label><input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="12345-6" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} /></div>
                </div>
              </div>
            </div>
            <div className="glass-card p-4 mt-4">
              <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-primary" /><p className="text-sm font-semibold text-foreground">Taxas da plataforma</p></div>
              <p className="text-xs text-muted-foreground">Taxa por venda: <span className="text-foreground font-medium">PIX 6,99% • Cartão/Boleto 7,99% + R$ 1,49</span></p>
              <p className="text-xs text-muted-foreground">Prazo de saque: <span className="text-foreground font-medium">2 a 14 dias úteis</span></p>
            </div>
            <button onClick={handleSavePayment} disabled={updateSettings.isPending} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground mt-2 disabled:opacity-50">{updateSettings.isPending ? "Salvando..." : "Salvar Dados"}</button>
          </div>
        )}

        {activeTab === "Aparência" && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Tema do site</h4>
              <p className="text-xs text-muted-foreground mb-4">Escolha entre os temas disponíveis.</p>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((t) => (
                  <button key={t.id} onClick={() => applyTheme(t.id)} className={`p-4 rounded-xl border-2 transition-all ${selectedTheme === t.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground/30"}`}>
                    <div className={`w-full h-10 rounded-lg ${t.bg} ${t.border} border mb-2`} />
                    <p className="text-xs text-foreground font-medium">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-6">
              <h4 className="text-sm font-semibold text-foreground mb-1">Cor dos botões</h4>
              <p className="text-xs text-muted-foreground mb-4">Personalize a cor principal do site e dos botões.</p>
              <div className="grid grid-cols-4 gap-3">
                {colorPalette.map((c) => (
                  <button key={c.id} onClick={() => applyColor(c.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedColor === c.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground/30"}`}>
                    <div className="w-8 h-8 rounded-full border-2 border-border" style={{ background: c.color }} />
                    <span className="text-[10px] text-muted-foreground">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">Pré-visualização</h4>
              <div className="glass-card p-4 space-y-3">
                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground" style={{ background: colorPalette.find(c => c.id === selectedColor)?.color }}>Exemplo de Botão</button>
                <p className="text-sm" style={{ color: colorPalette.find(c => c.id === selectedColor)?.color }}>Texto com cor de destaque</p>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full w-2/3" style={{ background: colorPalette.find(c => c.id === selectedColor)?.color }} /></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Documentos" && (
          <div className="space-y-5 max-w-lg">
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-primary" /><p className="text-sm font-semibold text-foreground">Verificação obrigatória</p></div>
              <p className="text-xs text-muted-foreground">Para sacar valores da plataforma, é necessário enviar os documentos abaixo para verificação de identidade.</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-foreground">CPF</p>{docCpf ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success">Enviado</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Pendente</span>}</div>
                <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="000.000.000-00" value={docCpf} onChange={(e) => setDocCpf(e.target.value)} />
              </div>
              <div className="p-4 bg-secondary/50 border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-foreground">RG ou CNH</p>{docRgUrl ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success">Enviado ✓</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Pendente</span>}</div>
                <p className="text-xs text-muted-foreground mb-2">Envie uma foto legível da frente do documento.</p>
                <input ref={docRgRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "rg"); }} />
                <button onClick={() => docRgRef.current?.click()} disabled={uploadingDoc === "rg"} className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-accent transition-colors disabled:opacity-50">
                  {uploadingDoc === "rg" ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {docRgUrl ? "Reenviar documento" : "Enviar foto do documento"}
                </button>
              </div>
              <div className="p-4 bg-secondary/50 border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-foreground">Selfie com documento</p>{docSelfieUrl ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success">Enviado ✓</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Pendente</span>}</div>
                <p className="text-xs text-muted-foreground mb-2">Tire uma foto segurando seu documento ao lado do rosto.</p>
                <input ref={docSelfieRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "selfie"); }} />
                <button onClick={() => docSelfieRef.current?.click()} disabled={uploadingDoc === "selfie"} className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-accent transition-colors disabled:opacity-50">
                  {uploadingDoc === "selfie" ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {docSelfieUrl ? "Reenviar selfie" : "Enviar selfie"}
                </button>
              </div>
              <div className="p-4 bg-secondary/50 border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-foreground">Comprovante de endereço</p>{docAddressUrl ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success">Enviado ✓</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Pendente</span>}</div>
                <p className="text-xs text-muted-foreground mb-2">Conta de luz, água ou extrato bancário recente.</p>
                <input ref={docAddressRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "address"); }} />
                <button onClick={() => docAddressRef.current?.click()} disabled={uploadingDoc === "address"} className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-accent transition-colors disabled:opacity-50">
                  {uploadingDoc === "address" ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {docAddressUrl ? "Reenviar comprovante" : "Enviar comprovante"}
                </button>
              </div>
            </div>
            <button onClick={handleSaveDocuments} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Salvar Documentos</button>
          </div>
        )}

        {activeTab === "Permissões" && (
          <PermissoesTab user={user} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
