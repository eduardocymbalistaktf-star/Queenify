import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { AlertTriangle, Send, Clock, CheckCircle, MessageSquare, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const tipos = ["Produto", "Afiliado", "Pagamento", "Suporte", "Outro"];

const motivosPorTipo: Record<string, string[]> = {
  Produto: ["Conteúdo plagiado", "Produto enganoso", "Conteúdo ofensivo", "Não entregou o prometido", "Violação de direitos autorais"],
  Afiliado: ["Spam / Mensagens em massa", "Propaganda enganosa", "Uso indevido de marca", "Conduta antiética"],
  Pagamento: ["Cobrança indevida", "Reembolso não processado", "Comissão não recebida", "Erro no valor cobrado"],
  Suporte: ["Atendimento inadequado", "Sem resposta há mais de 48h", "Informação incorreta"],
  Outro: ["Outro motivo não listado"],
};

const statusLabel: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-primary/20 text-primary" },
  em_analise: { label: "Em análise", color: "bg-[hsl(25,95%,53%)]/20 text-[hsl(25,95%,53%)]" },
  resolvida: { label: "Resolvida", color: "bg-success/20 text-success" },
};

const Denuncias = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selectedDenuncia, setSelectedDenuncia] = useState<any>(null);
  const [newTipo, setNewTipo] = useState("Produto");
  const [newMotivo, setNewMotivo] = useState("");
  const [newDescricao, setNewDescricao] = useState("");

  const { data: denuncias = [], isLoading } = useQuery({
    queryKey: ["reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createReport = useMutation({
    mutationFn: async (report: { tipo: string; motivo: string; descricao: string }) => {
      const { error } = await supabase
        .from("reports")
        .insert({ ...report, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Denúncia enviada com sucesso!");
      setShowNew(false);
      setNewMotivo("");
      setNewDescricao("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!newMotivo) {
      toast.error("Selecione um motivo para a denúncia");
      return;
    }
    createReport.mutate({ tipo: newTipo, motivo: newMotivo, descricao: newDescricao || "" });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Denúncias e Reclamações</h1>
          <p className="text-sm text-muted-foreground">Envie denúncias ou reclamações. Apenas o suporte poderá visualizar.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground"
        >
          <AlertTriangle className="w-4 h-4" /> Nova Denúncia
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {denuncias.map((d: any) => {
            const st = statusLabel[d.status] || statusLabel.pendente;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDenuncia(d)}
                className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    d.status === "pendente" ? "bg-primary/10 text-primary" :
                    d.status === "em_analise" ? "bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]" :
                    "bg-success/10 text-success"
                  }`}>
                    {d.status === "resolvida" ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">{d.motivo}</p>
                    <p className="text-xs text-muted-foreground">{d.tipo} • {format(new Date(d.created_at), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
              </div>
            );
          })}

          {denuncias.length === 0 && (
            <div className="space-y-3">
              <div className="text-center py-6 text-muted-foreground text-sm">Nenhuma denúncia registrada por você.</div>
              <div className="glass-card p-4 border-primary/20">
                <h3 className="text-xs font-semibold text-foreground mb-2">📌 Tipos de denúncias mais comuns</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="font-medium text-foreground mb-0.5">Produto</p>
                    <p>Conteúdo plagiado, produto enganoso, não entregue</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="font-medium text-foreground mb-0.5">Afiliado</p>
                    <p>Spam, propaganda enganosa, uso indevido de marca</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="font-medium text-foreground mb-0.5">Pagamento</p>
                    <p>Cobrança indevida, reembolso não processado</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="font-medium text-foreground mb-0.5">Suporte</p>
                    <p>Atendimento inadequado, sem resposta há mais de 48h</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4 border-primary/20">
                <h3 className="text-xs font-semibold text-foreground mb-2">⏱ Prazos de resposta</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <span className="text-foreground font-medium">Primeira análise:</span> até 3 dias úteis</li>
                  <li>• <span className="text-foreground font-medium">Resolução completa:</span> até 15 dias úteis</li>
                  <li>• <span className="text-foreground font-medium">Denúncias urgentes (fraude):</span> prioridade em 24h</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Denúncia Sheet */}
      <Sheet open={showNew} onOpenChange={setShowNew}>
        <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
          <SheetHeader>
            <SheetTitle className="font-display">Nova Denúncia</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-medium">⚠️ Sua denúncia será encaminhada diretamente ao suporte e será tratada com total sigilo.</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo</label>
              <select
                value={newTipo}
                onChange={(e) => { setNewTipo(e.target.value); setNewMotivo(""); }}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Motivo da denúncia</label>
              <div className="space-y-2">
                {(motivosPorTipo[newTipo] || []).map((m) => (
                  <button
                    key={m}
                    onClick={() => setNewMotivo(m)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      newMotivo === m
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border bg-secondary text-foreground hover:border-primary/30"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Descrição adicional <span className="text-muted-foreground/60">(opcional)</span></label>
              <textarea
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground h-24 resize-none"
                placeholder="Descreva com mais detalhes se quiser..."
                value={newDescricao}
                onChange={(e) => setNewDescricao(e.target.value)}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={createReport.isPending}
              className="w-full py-2.5 gradient-gold rounded-xl text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Denúncia
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={!!selectedDenuncia} onOpenChange={() => setSelectedDenuncia(null)}>
        <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
          <SheetHeader>
            <SheetTitle className="font-display">Detalhes da Denúncia</SheetTitle>
          </SheetHeader>
          {selectedDenuncia && (
            <div className="mt-6 space-y-4">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(statusLabel[selectedDenuncia.status] || statusLabel.pendente).color}`}>
                  {(statusLabel[selectedDenuncia.status] || statusLabel.pendente).label}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                <p className="text-sm text-foreground">{selectedDenuncia.tipo}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                <p className="text-sm text-foreground font-medium">{selectedDenuncia.motivo}</p>
              </div>
              {selectedDenuncia.descricao && (
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedDenuncia.descricao}</p>
                </div>
              )}
              {selectedDenuncia.resposta && (
                <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-success" />
                    <p className="text-xs text-success font-medium">Resposta do Suporte</p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{selectedDenuncia.resposta}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Denuncias;
