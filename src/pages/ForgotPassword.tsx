import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BrandLogo size="medium" />
            <span className="font-display text-2xl font-bold text-foreground">Queenify</span>
          </div>
          <div className="glass-card p-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-display font-bold text-foreground mb-2">Email enviado!</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Se existir uma conta com <span className="text-foreground font-medium">{email}</span>, você receberá um link para redefinir sua senha.
            </p>
            <Link to="/login" className="text-sm text-primary hover:text-primary/80 font-medium">
              ← Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BrandLogo size="medium" />
            <span className="font-display text-2xl font-bold text-foreground">Queenify</span>
          </div>
          <p className="text-muted-foreground text-sm">Recupere o acesso à sua conta</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email da conta</label>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
              ← Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
