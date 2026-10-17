import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Play, ChevronLeft, ChevronDown, ChevronRight, CheckCircle, Circle, Award, Download, Layers } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { toast } from "sonner";

const CursoPlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [supportOpen, setSupportOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [generatingCert, setGeneratingCert] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["course-player", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").eq("id", courseId!).single();
      return data;
    },
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["player-modules", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("course_modules").select("*").eq("course_id", courseId!).order("display_order");
      return data || [];
    },
    enabled: !!courseId,
  });

  const moduleIds = modules.map((m: any) => m.id);

  const { data: lessons = [] } = useQuery({
    queryKey: ["player-lessons", moduleIds],
    queryFn: async () => {
      if (!moduleIds.length) return [];
      const { data } = await supabase.from("course_lessons").select("*").in("module_id", moduleIds).order("display_order");
      return data || [];
    },
    enabled: moduleIds.length > 0,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["player-progress", user?.id, courseId],
    queryFn: async () => {
      const lessonIds = lessons.map((l: any) => l.id);
      if (!lessonIds.length) return [];
      const { data } = await supabase.from("student_progress").select("*").eq("student_id", user!.id).in("lesson_id", lessonIds);
      return data || [];
    },
    enabled: !!user && lessons.length > 0,
  });

  const completedIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id));
  const totalLessons = lessons.length;
  const completedCount = completedIds.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Auto-select first lesson
  const currentLesson = activeLesson || lessons[0] || null;

  const toggleModule = (id: string) => setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const toggleComplete = useMutation({
    mutationFn: async (lessonId: string) => {
      const isCompleted = completedIds.has(lessonId);
      if (isCompleted) {
        await supabase.from("student_progress").delete().eq("student_id", user!.id).eq("lesson_id", lessonId);
      } else {
        await supabase.from("student_progress").insert({
          student_id: user!.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-progress"] });
      queryClient.invalidateQueries({ queryKey: ["student_progress_panel"] });
    },
  });

  const handleGenerateCertificate = async () => {
    if (progressPct < 100) {
      toast.error("Complete todas as aulas para gerar o certificado.");
      return;
    }
    setGeneratingCert(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape" });
      const gold: [number, number, number] = [212, 168, 67];

      // Background
      doc.setFillColor(20, 20, 20);
      doc.rect(0, 0, 297, 210, "F");

      // Border
      doc.setDrawColor(...gold);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);
      doc.setLineWidth(0.5);
      doc.rect(14, 14, 269, 182);

      // Title
      doc.setTextColor(...gold);
      doc.setFontSize(36);
      doc.text("CERTIFICADO DE CONCLUSÃO", 148.5, 50, { align: "center" });

      // Body
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("Certificamos que", 148.5, 80, { align: "center" });

      doc.setTextColor(...gold);
      doc.setFontSize(28);
      doc.text(user?.email?.split("@")[0] || "Aluno(a)", 148.5, 100, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("concluiu com sucesso o curso", 148.5, 120, { align: "center" });

      doc.setTextColor(...gold);
      doc.setFontSize(22);
      doc.text(course?.name || "Curso", 148.5, 140, { align: "center" });

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.text(`${totalLessons} aulas concluídas • ${new Date().toLocaleDateString("pt-BR")}`, 148.5, 160, { align: "center" });

      // Footer
      doc.setTextColor(...gold);
      doc.setFontSize(12);
      doc.text("Queenify — Plataforma de Cursos Digitais", 148.5, 185, { align: "center" });

      doc.save(`certificado-${course?.name?.replace(/\s+/g, "-").toLowerCase() || "curso"}.pdf`);
      toast.success("Certificado gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar certificado");
    } finally {
      setGeneratingCert(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuToggle={() => {}} supportOpen={supportOpen} onSupportChange={setSupportOpen} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-3 md:p-6">
            {/* Top nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => navigate("/painel-aluno")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Meus Cursos
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{progressPct}% completo</span>
                {progressPct === 100 && (
                  <button onClick={handleGenerateCertificate} disabled={generatingCert}
                    className="flex items-center gap-1.5 px-3 py-1.5 gradient-gold rounded-lg text-xs font-semibold text-primary-foreground disabled:opacity-50">
                    <Award className="w-3.5 h-3.5" /> {generatingCert ? "Gerando..." : "Certificado"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video / Content area */}
              <div className="lg:col-span-2 space-y-4">
                {currentLesson ? (
                  <>
                    {currentLesson.video_url ? (
                      <div className="aspect-video bg-black rounded-xl overflow-hidden">
                        {currentLesson.video_url.includes("youtube.com") || currentLesson.video_url.includes("youtu.be") ? (
                          <iframe
                            src={currentLesson.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : currentLesson.video_url.includes("vimeo.com") ? (
                          <iframe
                            src={currentLesson.video_url.replace("vimeo.com/", "player.vimeo.com/video/")}
                            className="w-full h-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video src={currentLesson.video_url} controls className="w-full h-full" />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhum vídeo adicionado a esta aula</p>
                        </div>
                      </div>
                    )}

                    <div className="glass-card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-display font-bold text-foreground">{currentLesson.title}</h2>
                        <button
                          onClick={() => toggleComplete.mutate(currentLesson.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            completedIds.has(currentLesson.id)
                              ? "bg-success/20 text-success"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {completedIds.has(currentLesson.id) ? (
                            <><CheckCircle className="w-3.5 h-3.5" /> Concluída</>
                          ) : (
                            <><Circle className="w-3.5 h-3.5" /> Marcar como concluída</>
                          )}
                        </button>
                      </div>
                      {currentLesson.description && (
                        <p className="text-sm text-muted-foreground">{currentLesson.description}</p>
                      )}
                      {currentLesson.duration_minutes > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">⏱ {currentLesson.duration_minutes} min</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Selecione uma aula na lista ao lado</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar – Module/Lesson list */}
              <div className="space-y-3">
                <div className="glass-card p-4">
                  <h3 className="text-sm font-display font-bold text-foreground mb-2">{course?.name || "Curso"}</h3>
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mb-1">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{completedCount}/{totalLessons} aulas concluídas</p>
                </div>

                {modules.map((mod: any) => {
                  const modLessons = lessons.filter((l: any) => l.module_id === mod.id);
                  const modCompleted = modLessons.filter((l: any) => completedIds.has(l.id)).length;
                  const isExpanded = expandedModules.includes(mod.id);
                  return (
                    <div key={mod.id} className="glass-card overflow-hidden">
                      <button onClick={() => toggleModule(mod.id)} className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          <Layers className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-foreground">{mod.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{modCompleted}/{modLessons.length}</span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border">
                          {modLessons.map((lesson: any) => {
                            const isActive = currentLesson?.id === lesson.id;
                            const isDone = completedIds.has(lesson.id);
                            return (
                              <button key={lesson.id} onClick={() => setActiveLesson(lesson)}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors ${isActive ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                                {isDone ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className={`text-xs ${isActive ? "text-primary font-medium" : "text-foreground"}`}>{lesson.title}</span>
                                {lesson.duration_minutes > 0 && (
                                  <span className="text-[10px] text-muted-foreground ml-auto">{lesson.duration_minutes}min</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CursoPlayer;
