import DashboardLayout from "@/layouts/DashboardLayout";
import { GraduationCap, Lock, Play } from "lucide-react";

const modules = [
  { title: "Introdução ao Marketing Digital", lessons: 8, duration: "1h 30min" },
  { title: "Construindo sua Presença Online", lessons: 6, duration: "1h 10min" },
  { title: "Tráfego Orgânico vs Pago", lessons: 10, duration: "2h 00min" },
  { title: "Copywriting para Vendas", lessons: 7, duration: "1h 45min" },
  { title: "Funil de Vendas na Prática", lessons: 9, duration: "2h 20min" },
  { title: "Métricas e Análise de Resultados", lessons: 5, duration: "1h 00min" },
];

const AulasQueenify = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Aulas Queenify</h1>
            <p className="text-sm text-muted-foreground">Aprenda o básico sobre marketing digital com aulas exclusivas.</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Em breve</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Estamos preparando um conteúdo exclusivo sobre marketing digital para você. 
          Fique atento às novidades!
        </p>
        <span className="inline-block mt-4 text-xs px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">
          Lançamento em breve
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m, i) => (
          <div key={i} className="glass-card p-4 opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Play className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{m.title}</p>
                <p className="text-[10px] text-muted-foreground">{m.lessons} aulas • {m.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Bloqueado</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AulasQueenify;
