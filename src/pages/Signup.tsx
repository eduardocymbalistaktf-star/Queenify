import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logSecurityEvent } from "@/lib/securityLogger";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, User, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import BrandLogo from "@/components/BrandLogo";

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) {
      toast.error("Informe sua data de nascimento");
      return;
    }
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (age < 18) {
      toast.error("Você precisa ter 18 anos ou mais para se cadastrar na plataforma");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os termos de uso para continuar");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    });
    setLoading(false);
    if (error) {
      const isHibp = /pwned|leaked|compromis|weak/i.test(error.message);
      if (isHibp) {
        await logSecurityEvent({
          type: "hibp_blocked",
          severity: "warning",
          description: "Senha rejeitada pela checagem HIBP no signup",
          metadata: { email_domain: email.split("@")[1] ?? null },
        });
        toast.error("Esta senha apareceu em vazamentos públicos. Escolha outra mais segura.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    });
    if (error) {
      toast.error("Erro ao entrar com Google");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BrandLogo size="medium" />
            <span className="font-display text-2xl font-bold text-foreground">Queenify</span>
          </div>
          <p className="text-muted-foreground text-sm">Crie sua conta e comece a vender</p>
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
            Cadastrar com Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                  required
                  className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Data de nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split("T")[0]}
                  className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Você deve ter 18 anos ou mais</p>
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
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full bg-secondary rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                Li e aceito os{" "}
                <a href="/termos-de-uso" target="_blank" className="text-primary hover:text-primary/80 underline">
                  Termos de Uso
                </a>
                {" "}e a{" "}
                <a href="/politica-de-privacidade" target="_blank" className="text-primary hover:text-primary/80 underline">
                  Política de Privacidade
                </a>
                {" "}da Queenify
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
