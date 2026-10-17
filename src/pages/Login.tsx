import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import queenifyBee from "@/assets/queenify-bee.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    let active = true;
    const restoreOAuthSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) { setCheckingSession(false); return; }

      const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      if (!active) return;
      if (assuranceError || factorsError) {
        setCheckingSession(false);
        toast.error("Não foi possível verificar a autenticação da conta. Tente novamente.");
        return;
      }

      const totpFactor = factors?.totp?.find(factor => factor.status === "verified");
      if (totpFactor && assurance?.currentLevel !== "aal2") {
        setMfaFactorId(totpFactor.id);
        setMfaRequired(true);
        setCheckingSession(false);
        return;
      }
      navigate("/dashboard", { replace: true });
    };

    void restoreOAuthSession();
    return () => { active = false; };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha inválidos" : error.message);
      return;
    }
    // Check if MFA is required
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("Não foi possível verificar o 2FA. Entre novamente em alguns instantes.");
      return;
    }
    const totpFactor = factors?.totp?.find((f) => f.status === "verified");
    if (totpFactor) {
      setMfaFactorId(totpFactor.id);
      setMfaRequired(true);
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate("/dashboard");
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId || mfaCode.length !== 6) return;
    setLoading(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (challengeError) {
      toast.error("Erro ao iniciar verificação 2FA");
      setLoading(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode,
    });
    setLoading(false);
    if (verifyError) {
      toast.error("Código 2FA inválido. Tente novamente.");
      setMfaCode("");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error: cleanupError } = await supabase.from("user_settings").update({ backup_codes: null } as any).eq("user_id", userData.user.id);
      if (cleanupError) console.warn("Could not clear obsolete recovery codes", cleanupError);
    }
    navigate("/dashboard");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}login`,
      },
    });
    if (error) {
      toast.error("Erro ao entrar com Google");
      setLoading(false);
      return;
    }
  };

  if (mfaRequired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={queenifyBee} alt="Queenify" className="h-10 w-auto" />
              <span className="font-display text-2xl font-bold text-foreground">Queenify</span>
            </div>
            <p className="text-muted-foreground text-sm">Verificação de dois fatores</p>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-2 justify-center text-primary">
              <Shield className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-foreground">Autenticação 2FA</h3>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Sua conta possui autenticação de dois fatores ativada. Digite o código de 6 dígitos do seu aplicativo autenticador.
            </p>
            <div className="flex justify-center">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="w-48 bg-secondary border border-border rounded-lg px-4 py-3 text-lg text-foreground text-center tracking-[0.5em] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-ring"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                autoFocus
              />
            </div>
            <button
              onClick={handleMfaVerify}
              disabled={loading || mfaCode.length !== 6}
              className="w-full py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar e Entrar"}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              A Queenify não oferece códigos de recuperação nesta versão. Se perder o autenticador, consulte a <Link to="/ajuda" className="text-primary hover:underline">Central de Ajuda</Link>.
            </p>

            <button
              onClick={() => { setMfaRequired(false); setMfaCode(""); setMfaFactorId(null); supabase.auth.signOut(); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
            >
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (checkingSession) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={queenifyBee} alt="Queenify" className="h-10 w-auto" />
            <span className="font-display text-2xl font-bold text-foreground">Queenify</span>
          </div>
          <p className="text-muted-foreground text-sm">Entre na sua conta para acessar o dashboard</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-secondary rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
