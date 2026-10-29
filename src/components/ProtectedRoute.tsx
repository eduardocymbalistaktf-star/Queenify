import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useHasPermission, ROUTE_PERMISSIONS } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [mfaStatus, setMfaStatus] = useState<"checking" | "none" | "ok" | "required" | "error">("checking");
  const [mfaRetry, setMfaRetry] = useState(0);
  const requiredPermission = ROUTE_PERMISSIONS[location.pathname] || null;
  const { data: hasPermission, isLoading: permLoading } = useHasPermission(
    requiredPermission || "__skip__"
  );

  useEffect(() => {
    if (!session) { setMfaStatus("none"); return; }
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    setMfaStatus("checking");
    const checkAssurance = async () => {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("MFA verification timed out")), 10_000);
      });

      try {
        const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.race([
          Promise.all([
            supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
            supabase.auth.mfa.listFactors(),
          ]),
          timeout,
        ]);
        if (!active) return;
        if (assuranceError || factorsError) { setMfaStatus("error"); return; }
        const hasVerifiedTotp = !!factors?.totp?.some(factor => factor.status === "verified");
        setMfaStatus(hasVerifiedTotp && assurance?.currentLevel !== "aal2" ? "required" : "ok");
      } catch {
        if (active) setMfaStatus("error");
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    void checkAssurance();
    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [session?.access_token, session?.user.id, mfaRetry]);

  if (loading || (session && (mfaStatus === "checking" || (requiredPermission && permLoading)))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (mfaStatus === "required") {
    return <Navigate to="/login?mfa=required" replace state={{ from: location }} />;
  }

  if (mfaStatus === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">Verificação de segurança indisponível</h2>
          <p className="text-sm text-muted-foreground mb-4">Não foi possível confirmar o nível de autenticação desta sessão. Tente novamente antes de continuar.</p>
          <button onClick={() => setMfaRetry(value => value + 1)} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (requiredPermission && hasPermission === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Esta área exige uma permissão administrativa e uma sessão com autenticação em dois fatores verificada. Confira o acesso da sua conta nas Configurações.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
