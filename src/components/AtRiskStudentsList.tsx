import { AlertTriangle, User, Clock, TrendingDown, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

interface AtRiskStudent {
  studentId: string;
  displayName: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastActivity: string | null;
}

interface AtRiskStudentsListProps {
  students: AtRiskStudent[];
}

const AtRiskStudentsList = ({ students }: AtRiskStudentsListProps) => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  const handleGenerateAlerts = async () => {
    if (!user || students.length === 0) return;
    setSending(true);
    try {
      const notifications = students.map((s) => ({
        user_id: user.id,
        type: "warning",
        title: `Aluno em risco: ${s.displayName}`,
        message: `${s.displayName} completou apenas ${s.progressPercent}% do curso. Considere entrar em contato.`,
        related_entity_type: "student_retention",
        related_entity_id: s.studentId,
      }));
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
      toast.success(`${students.length} alerta(s) criado(s) com sucesso!`);
    } catch {
      toast.error("Erro ao criar alertas");
    } finally {
      setSending(false);
    }
  };

  if (students.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-success" />
          <h3 className="text-sm font-display font-semibold text-foreground">Alunos em Risco</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum aluno em risco detectado 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-display font-semibold text-foreground">Alunos em Risco de Abandono</h3>
          </div>
          <p className="text-xs text-muted-foreground">Alunos com menos de 10% de progresso</p>
        </div>
        <button
          onClick={handleGenerateAlerts}
          disabled={sending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          <Bell className="w-3.5 h-3.5" />
          {sending ? "Criando..." : "Gerar Alertas"}
        </button>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto">
        {students.map((student) => (
          <div
            key={student.studentId}
            className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{student.displayName}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendingDown className="w-3 h-3" />
                  {student.completedLessons}/{student.totalLessons} aulas ({student.progressPercent}%)
                </span>
                {student.lastActivity && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(student.lastActivity).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-destructive transition-all"
                  style={{ width: `${Math.max(student.progressPercent, 2)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AtRiskStudentsList;
