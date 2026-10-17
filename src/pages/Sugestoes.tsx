import DashboardLayout from "@/layouts/DashboardLayout";
import { Lightbulb, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Sugestoes = () => {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!titulo.trim() || !descricao.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        tipo: "Sugestão",
        motivo: titulo,
        descricao,
      });
      if (error) throw error;
      toast.success("Sugestão enviada com sucesso! Agradecemos seu feedback.");
      setTitulo("");
      setDescricao("");
    } catch {
      toast.error("Erro ao enviar sugestão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          Sugestões
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Tem uma ideia para melhorar a Queenify? Adoramos ouvir nossos usuários!</p>
      </div>

      <div className="glass-card p-6 max-w-2xl space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Título da sugestão</label>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Adicionar modo escuro no checkout"
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Descrição detalhada</label>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            rows={5}
            placeholder="Descreva sua sugestão em detalhes: o que gostaria de ver, como funcionaria e por que seria útil..."
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar Sugestão
        </button>
      </div>
    </DashboardLayout>
  );
};

export default Sugestoes;
