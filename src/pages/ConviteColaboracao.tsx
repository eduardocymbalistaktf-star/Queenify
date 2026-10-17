import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, Handshake, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

const ConviteColaboracao = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<"aceito" | "recusado" | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) return;
      const { data, error } = await supabase
        .from("collaboration_invites")
        .select("*")
        .eq("invite_token", token)
        .single();
      if (error || !data) {
        setInvite(null);
      } else {
        setInvite(data);
        if (data.status !== "pendente") setResponded(data.status as "aceito" | "recusado");
      }
      setLoading(false);
    };
    fetchInvite();
  }, [token]);

  const handleRespond = async (accept: boolean) => {
    if (!invite || !user) return;
    setResponding(true);
    const { error } = await supabase
      .from("collaboration_invites")
      .update({ status: accept ? "aceito" : "recusado", responded_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (error) {
      toast.error(error.message);
    } else {
      setResponded(accept ? "aceito" : "recusado");
      toast.success(accept ? "Convite aceito com sucesso!" : "Convite recusado.");
    }
    setResponding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <X className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Convite não encontrado</h1>
          <p className="text-sm text-muted-foreground mb-6">Este link de convite é inválido ou já expirou.</p>
          <button onClick={() => navigate("/")} className="px-6 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
            Ir para a plataforma
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <Users className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Convite de Colaboração</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Você precisa estar logado para aceitar ou recusar este convite.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/login")} className="px-6 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Entrar</button>
            <button onClick={() => navigate("/signup")} className="px-6 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">Criar conta</button>
          </div>
        </div>
      </div>
    );
  }

  if (responded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          {responded === "aceito" ? (
            <>
              <Check className="w-12 h-12 text-success mx-auto mb-4" />
              <h1 className="text-xl font-display font-bold text-foreground mb-2">Convite Aceito!</h1>
              <p className="text-sm text-muted-foreground mb-6">Você agora é {invite.role === "socio" ? "sócio(a)" : "co-produtor(a)"}.</p>
            </>
          ) : (
            <>
              <X className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-xl font-display font-bold text-foreground mb-2">Convite Recusado</h1>
              <p className="text-sm text-muted-foreground mb-6">Você recusou este convite de colaboração.</p>
            </>
          )}
          <button onClick={() => navigate("/")} className="px-6 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
            Ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Convite de Colaboração</h1>
          <p className="text-sm text-muted-foreground mt-1">Você foi convidado(a) para uma colaboração na Queenify</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
            <span className="text-xs text-muted-foreground">Tipo</span>
            <span className="text-sm font-medium text-foreground">{invite.role === "socio" ? "Sócio(a)" : "Co-produtor(a)"}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
            <span className="text-xs text-muted-foreground">Participação</span>
            <span className="text-sm font-medium text-primary">{invite.share_percentage}%</span>
          </div>
          {invite.message && (
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
              <p className="text-sm text-foreground italic">"{invite.message}"</p>
            </div>
          )}
        </div>

        {invite.role === "socio" && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-6">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Nota:</strong> O título de sócio(a) é interno à Queenify e permite divisão de lucros. Não constitui vínculo fiscal ou jurídico.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleRespond(false)}
            disabled={responding}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Recusar
          </button>
          <button
            onClick={() => handleRespond(true)}
            disabled={responding}
            className="flex-1 flex items-center justify-center gap-2 py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConviteColaboracao;
