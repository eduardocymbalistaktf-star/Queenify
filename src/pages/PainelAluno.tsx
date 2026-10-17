import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Play, Clock, Award, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";

const PainelAluno = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supportOpen, setSupportOpen] = useState(false);

  // Fetch enrollments with course info
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["student_enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("*, courses(id, name, description, image_url, user_id)")
        .eq("student_id", user!.id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch all lesson counts per course and student progress
  const courseIds = enrollments.map((e: any) => e.course_id);

  const { data: courseLessons = [] } = useQuery({
    queryKey: ["course_lessons_for_student", courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from("course_modules")
        .select("course_id, course_lessons(id)")
        .in("course_id", courseIds);
      if (error) throw error;
      return data || [];
    },
    enabled: courseIds.length > 0,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["student_progress_panel", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_progress")
        .select("lesson_id, completed")
        .eq("student_id", user!.id)
        .eq("completed", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Build per-course stats
  const lessonCountByCourse: Record<string, number> = {};
  (courseLessons as any[]).forEach((mod) => {
    const cid = mod.course_id;
    const count = mod.course_lessons?.length || 0;
    lessonCountByCourse[cid] = (lessonCountByCourse[cid] || 0) + count;
  });

  // Collect all lesson IDs per course
  const lessonIdsByCourse: Record<string, string[]> = {};
  (courseLessons as any[]).forEach((mod) => {
    const cid = mod.course_id;
    if (!lessonIdsByCourse[cid]) lessonIdsByCourse[cid] = [];
    (mod.course_lessons || []).forEach((l: any) => lessonIdsByCourse[cid].push(l.id));
  });

  const completedLessonIds = new Set(progress.map((p: any) => p.lesson_id));

  const cursos = enrollments.map((e: any) => {
    const course = e.courses;
    const totalLessons = lessonCountByCourse[e.course_id] || 0;
    const lessonIds = lessonIdsByCourse[e.course_id] || [];
    const completedCount = lessonIds.filter((id) => completedLessonIds.has(id)).length;
    const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    return {
      id: e.course_id,
      title: course?.name || "Curso",
      description: course?.description || "",
      image: course?.image_url,
      totalAulas: totalLessons,
      progress: pct,
      enrolledAt: e.enrolled_at,
    };
  });

  const emAndamento = cursos.filter((c) => c.progress > 0 && c.progress < 100).length;
  const concluidos = cursos.filter((c) => c.progress === 100).length;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          onMenuToggle={() => {}}
          supportOpen={supportOpen}
          onSupportChange={setSupportOpen}
        />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Meus Cursos</h1>
                <p className="text-sm text-muted-foreground">Acesse os cursos que você comprou.</p>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Painel do Produtor
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Cursos Adquiridos</p>
                </div>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{cursos.length}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Em Andamento</p>
                </div>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{emAndamento}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </div>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{concluidos}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : cursos.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Nenhum curso adquirido</h3>
                <p className="text-sm text-muted-foreground mb-4">Explore o marketplace para encontrar cursos incríveis.</p>
                <button onClick={() => navigate("/marketplace")} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
                  Explorar Marketplace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cursos.map((curso) => (
                  <div key={curso.id} className="glass-card overflow-hidden group cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => navigate(`/curso/${curso.id}`)}>
                    <div className="aspect-video bg-secondary flex items-center justify-center relative">
                      {curso.image ? (
                        <img src={curso.image} alt={curso.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-10 h-10 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {curso.progress === 100 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-success/90 text-white text-[10px] font-bold">
                          Concluído ✓
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-display font-bold text-foreground mb-1">{curso.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{curso.totalAulas} aulas</p>
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${curso.progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{curso.progress}% completo</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PainelAluno;
