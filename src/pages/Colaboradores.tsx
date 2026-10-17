import DashboardLayout from "@/layouts/DashboardLayout";
import { Users, UserPlus, Search, Handshake, Percent, BookOpen, Link2, Mail, Copy, Check, X, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useSupabaseData";

const partnerFunctions = [
  { icon: Percent, title: "Divisão de Lucros", desc: "Divida os lucros igualmente ou por porcentagens customizadas entre sócios." },
  { icon: BookOpen, title: "Vincular Cursos", desc: "Associe cursos/produtos a uma sociedade para divisão automática." },
  { icon: Users, title: "Co-gestão", desc: "Sócios podem visualizar métricas, vendas e relatórios dos cursos vinculados." },
  { icon: Handshake, title: "Acordo Flexível", desc: "Altere porcentagens e cursos vinculados a qualquer momento, sem burocracia." },
];

const Colaboradores = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("co-produtor");
  const [inviteShare, setInviteShare] = useState("50");
  const [inviteMessage, setInviteMessage] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [tab, setTab] = useState<"colaboradores" | "socios" | "recebidos">("colaboradores");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("email");

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ["collaboration-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaboration_invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: receivedInvites = [] } = useQuery({
    queryKey: ["received-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaboration_invites")
        .select("*")
        .eq("invitee_email", user?.email || "")
        .eq("status", "pendente");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (inviteRole === "co-produtor") {
        const activeCoProdutores = invites.filter(i => i.role === "co-produtor" && i.status === "aceito").length;
        if (activeCoProdutores >= 1) throw new Error("Limite máximo de 1 co-produtor atingido");
      }
      if (selectedCourses.length === 0) throw new Error("Selecione pelo menos um curso/produto para compartilhar");
      const { data, error } = await supabase
        .from("collaboration_invites")
        .insert({
          inviter_id: user!.id,
          invitee_email: inviteEmail,
          role: inviteRole,
          share_percentage: Number(inviteShare),
          message: inviteMessage || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["collaboration-invites"] });
      if (inviteMethod === "link") {
        const link = `${window.location.origin}${import.meta.env.BASE_URL}convite/${data.invite_token}`;
        navigator.clipboard.writeText(link);
        toast.success("Link de convite copiado para a área de transferência!");
      } else {
        toast.success(`Convite enviado para ${inviteEmail}!`);
      }
      setShowInvite(false);
      setInviteEmail("");
      setInviteMessage("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const respondInvite = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase
        .from("collaboration_invites")
        .update({ status: accept ? "aceito" : "recusado", responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ["collaboration-invites"] });
      queryClient.invalidateQueries({ queryKey: ["received-invites"] });
      toast.success(accept ? "Convite aceito!" : "Convite recusado.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}convite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const sentInvites = invites.filter(i => i.inviter_id === user?.id);
  const colaboradores = sentInvites.filter(i => i.role === "co-produtor");
  const socios = sentInvites.filter(i => i.role === "socio");
  const activeSocios = socios.filter(i => i.status === "aceito");

  const filteredColaboradores = sentInvites.filter(i =>
    i.invitee_email.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pendente: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Pendente" },
      aceito: { bg: "bg-success/20", text: "text-success", label: "Aceito" },
      recusado: { bg: "bg-destructive/20", text: "text-destructive", label: "Recusado" },
    };
    const s = map[status] || map.pendente;
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">Gerencie co-produtores e sócios dos seus produtos.</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
          <UserPlus className="w-4 h-4" /> Convidar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 max-w-md">
        <button onClick={() => setTab("colaboradores")} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === "colaboradores" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          Co-produtores
        </button>
        <button onClick={() => setTab("socios")} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === "socios" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          Sócios
        </button>
        <button onClick={() => setTab("recebidos")} className={`relative flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === "recebidos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          Recebidos
          {receivedInvites.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-destructive text-destructive-foreground min-w-[16px] text-center">
              {receivedInvites.length}
            </span>
          )}
        </button>
      </div>

      {tab === "colaboradores" && (
        <>
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">Total de Convites</p>
              <p className="text-2xl font-display font-bold text-foreground mt-1">{sentInvites.length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">Aceitos</p>
              <p className="text-2xl font-display font-bold text-success mt-1">{sentInvites.filter(i => i.status === "aceito").length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-display font-bold text-amber-400 mt-1">{sentInvites.filter(i => i.status === "pendente").length}</p>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-display font-semibold text-foreground">Convites Enviados</h3>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : filteredColaboradores.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum convite enviado ainda.</div>
              ) : (
                filteredColaboradores.map(c => (
                  <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {c.invitee_email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{c.invitee_email}</p>
                        {statusBadge(c.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.role === "socio" ? "Sócio(a)" : "Co-produtor(a)"} • {c.share_percentage}%</p>
                    </div>
                    <button onClick={() => copyInviteLink(c.invite_token)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Copiar link de convite">
                      {copiedToken === c.invite_token ? <Check className="w-4 h-4 text-success" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {tab === "socios" && (
        <>
          <div className="glass-card p-5 mb-6 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
                <Handshake className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-foreground mb-1">Sociedade na Queenify</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Com a funcionalidade de sócios, duas ou mais pessoas podem dividir os lucros de cursos/produtos de forma <strong className="text-foreground">igualitária</strong> ou por <strong className="text-foreground">porcentagens personalizadas</strong>. 
                  Vincule cursos a uma sociedade e os ganhos serão divididos automaticamente. 
                  Ser "sócio" é um título dentro da Queenify — <strong className="text-foreground">não envolve questões fiscais ou jurídicas</strong>. 
                  <strong className="text-foreground"> Sem limite de sócios</strong> por produtor. Co-produtores são limitados a <strong className="text-foreground">1 por produtor</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {partnerFunctions.map(f => (
              <div key={f.title} className="glass-card p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold text-foreground">Seus Sócios ({activeSocios.length})</h3>
              <button onClick={() => { setInviteRole("socio"); setShowInvite(true); }} className="text-xs text-primary font-medium hover:underline">+ Adicionar sócio</button>
            </div>
            <div className="divide-y divide-border">
              {socios.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum sócio adicionado ainda.</div>
              ) : (
                socios.map(s => (
                  <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {s.invitee_email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{s.invitee_email}</p>
                        {statusBadge(s.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">Participação: {s.share_percentage}%</p>
                    </div>
                    <button onClick={() => copyInviteLink(s.invite_token)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      {copiedToken === s.invite_token ? <Check className="w-4 h-4 text-success" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {tab === "recebidos" && (
        <div className="space-y-4">
          <div className="glass-card p-5 border-primary/20">
            <h3 className="text-sm font-display font-bold text-foreground mb-1">Convites Recebidos</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Aqui aparecem os convites de colaboração que outros produtores enviaram para você. Aceite para participar como co-produtor(a) ou sócio(a).
            </p>
          </div>

          {receivedInvites.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhum convite pendente</p>
              <p className="text-xs text-muted-foreground">Quando alguém te convidar para uma colaboração, o convite aparecerá aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedInvites.map(inv => (
                <div key={inv.id} className="glass-card p-5 border-primary/20">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                      📩
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Convite para <span className="text-primary">{inv.role === "socio" ? "Sócio(a)" : "Co-produtor(a)"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Participação oferecida: <strong className="text-foreground">{inv.share_percentage}%</strong>
                      </p>
                      {inv.message && (
                        <div className="mt-2 p-2.5 rounded-lg bg-secondary border border-border">
                          <p className="text-xs text-muted-foreground italic">"{inv.message}"</p>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Recebido em {new Date(inv.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button 
                        onClick={() => respondInvite.mutate({ id: inv.id, accept: true })} 
                        disabled={respondInvite.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-success/20 text-success rounded-lg text-xs font-medium hover:bg-success/30 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Aceitar
                      </button>
                      <button 
                        onClick={() => respondInvite.mutate({ id: inv.id, accept: false })} 
                        disabled={respondInvite.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-destructive/20 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/30 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Recusar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Convidar Colaborador</h2>
            <div className="space-y-4">
              {/* Method selector */}
              <div className="flex gap-1 bg-secondary rounded-lg p-1">
                <button onClick={() => setInviteMethod("email")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${inviteMethod === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                  <Mail className="w-3.5 h-3.5" /> Por e-mail
                </button>
                <button onClick={() => setInviteMethod("link")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${inviteMethod === "link" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                  <Link2 className="w-3.5 h-3.5" /> Gerar link
                </button>
              </div>

              {inviteMethod === "email" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">E-mail do colaborador</label>
                  <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemplo.com"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
              )}
              {inviteMethod === "link" && (
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground">
                    <Link2 className="w-3.5 h-3.5 inline mr-1" />
                    Um link será gerado e copiado automaticamente. Envie-o para quem deseja convidar. A pessoa poderá aceitar ou recusar.
                  </p>
                  <div className="mt-2">
                    <label className="text-xs text-muted-foreground mb-1 block">E-mail do convidado (para registro)</label>
                    <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemplo.com"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo de colaboração</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="co-produtor">Co-produtor(a)</option>
                  <option value="socio">Sócio(a)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Participação (%)</label>
                <input type="number" min="1" max="100" value={inviteShare} onChange={e => setInviteShare(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>

              {/* Course selection */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cursos/Produtos para compartilhar</label>
                {products.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 bg-secondary rounded-lg">Você ainda não tem produtos cadastrados.</p>
                ) : (
                  <div className="max-h-32 overflow-auto space-y-1 p-2 bg-secondary border border-border rounded-lg">
                    {products.map((p: any) => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-card cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCourses(prev => [...prev, p.id]);
                            else setSelectedCourses(prev => prev.filter(id => id !== p.id));
                          }}
                          className="w-3.5 h-3.5 rounded border-border accent-primary"
                        />
                        <span className="text-xs text-foreground">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">R$ {Number(p.price).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">{selectedCourses.length} selecionado(s)</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mensagem (opcional)</label>
                <textarea value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} placeholder="Gostaria de te convidar para..."
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none h-16" />
              </div>

              {inviteRole === "co-produtor" && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Nota:</strong> Limite máximo de 1 co-produtor(a) por produtor. A pessoa convidada poderá aceitar ou recusar o convite.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowInvite(false)} className="flex-1 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">Cancelar</button>
                <button
                  onClick={() => sendInvite.mutate()}
                  disabled={!inviteEmail || sendInvite.isPending}
                  className="flex-1 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {sendInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : inviteMethod === "link" ? "Gerar e Copiar Link" : "Enviar Convite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Colaboradores;
