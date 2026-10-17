import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, Layers, PlayCircle, Clock, Users, GripVertical, ChevronDown, ChevronRight, Video, FileText, Palette, Image, Trophy, Award, MessageSquare, Lock, Unlock, HelpCircle, BarChart3, Settings, Sparkles, Download, Calendar, Star, Heart, Zap, Shield, Gift, Target, X, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Json } from "@/integrations/supabase/types";

const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card rounded-t-2xl">
          <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
};

const AreaMembros = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "cursos";
  const handleTabChange = (tab: string) => setSearchParams({ tab }, { replace: false });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showModule, setShowModule] = useState(false);
  const [showLesson, setShowLesson] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [courseForm, setCourseForm] = useState({ name: "", description: "", product_id: "" });
  const [moduleForm, setModuleForm] = useState({ title: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", video_url: "", duration_minutes: 0, is_free_preview: false });

  // Edit states
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editCourseForm, setEditCourseForm] = useState({ name: "", description: "", product_id: "" });
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editModuleForm, setEditModuleForm] = useState({ title: "" });
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [editLessonForm, setEditLessonForm] = useState({ title: "", description: "", video_url: "", duration_minutes: 0, is_free_preview: false });
  const [saving, setSaving] = useState(false);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*, products(name)").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules", user?.id],
    queryFn: async () => {
      const courseIds = courses.map((c: any) => c.id);
      if (!courseIds.length) return [];
      const { data } = await supabase.from("course_modules").select("*").in("course_id", courseIds).order("display_order");
      return data || [];
    },
    enabled: courses.length > 0
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["course-lessons", user?.id],
    queryFn: async () => {
      const modIds = modules.map((m: any) => m.id);
      if (!modIds.length) return [];
      const { data } = await supabase.from("course_lessons").select("*").in("module_id", modIds).order("display_order");
      return data || [];
    },
    enabled: modules.length > 0
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments-count", user?.id],
    queryFn: async () => {
      const courseIds = courses.map((c: any) => c.id);
      if (!courseIds.length) return [];
      const { data } = await supabase.from("student_enrollments").select("course_id").in("course_id", courseIds);
      return data || [];
    },
    enabled: courses.length > 0
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-courses", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user
  });

  const { data: memberSettings } = useQuery({
    queryKey: ["member-area-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("member_area_settings").select("settings").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data?.settings ?? null;
    },
    enabled: !!user,
  });

  const toggleCourse = (id: string) => setExpandedCourses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const toggleModule = (id: string) => setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: ["course-modules"] });
    queryClient.invalidateQueries({ queryKey: ["course-lessons"] });
  };

  const handleCreateCourse = async () => {
    if (!courseForm.name.trim()) { toast.error("Informe o nome do curso"); return; }
    const { error } = await supabase.from("courses").insert({ user_id: user!.id, name: courseForm.name, description: courseForm.description, product_id: courseForm.product_id || null });
    if (error) { toast.error("Erro ao criar curso"); return; }
    toast.success("Curso criado!");
    setShowCreate(false);
    setCourseForm({ name: "", description: "", product_id: "" });
    invalidateAll();
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim() || !selectedCourse) return;
    const order = modules.filter((m: any) => m.course_id === selectedCourse.id).length + 1;
    const { error } = await supabase.from("course_modules").insert({ course_id: selectedCourse.id, title: moduleForm.title, display_order: order });
    if (error) { toast.error("Não foi possível adicionar o módulo."); return; }
    toast.success("Módulo adicionado!");
    setShowModule(false);
    setModuleForm({ title: "" });
    invalidateAll();
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title.trim() || !selectedModule) return;
    const order = lessons.filter((l: any) => l.module_id === selectedModule.id).length + 1;
    const { error } = await supabase.from("course_lessons").insert({
      module_id: selectedModule.id, title: lessonForm.title, description: lessonForm.description,
      video_url: lessonForm.video_url, duration_minutes: lessonForm.duration_minutes,
      is_free_preview: lessonForm.is_free_preview, display_order: order
    });
    if (error) { toast.error("Não foi possível adicionar a aula."); return; }
    toast.success("Aula adicionada!");
    setShowLesson(false);
    setLessonForm({ title: "", description: "", video_url: "", duration_minutes: 0, is_free_preview: false });
    invalidateAll();
  };

  const togglePublish = async (courseId: string, published: boolean) => {
    const { error } = await supabase.from("courses").update({ is_published: !published }).eq("id", courseId);
    if (error) { toast.error("Não foi possível atualizar a publicação do curso."); return; }
    invalidateAll();
    toast.success(published ? "Curso despublicado" : "Curso publicado!");
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso? Todos os módulos e aulas serão excluídos.")) return;
    const courseModules = modules.filter((m: any) => m.course_id === id);
    const modIds = courseModules.map((m: any) => m.id);
    if (modIds.length) {
      const { error: lessonsError } = await supabase.from("course_lessons").delete().in("module_id", modIds);
      if (lessonsError) { toast.error("Não foi possível excluir as aulas do curso."); return; }
      const { error: modulesError } = await supabase.from("course_modules").delete().eq("course_id", id);
      if (modulesError) { toast.error("Não foi possível excluir os módulos do curso."); return; }
    }
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir o curso."); return; }
    invalidateAll();
    toast.success("Curso excluído");
  };

  const deleteModule = async (id: string) => {
    if (!confirm("Excluir este módulo e todas as suas aulas?")) return;
    const { error: lessonsError } = await supabase.from("course_lessons").delete().eq("module_id", id);
    if (lessonsError) { toast.error("Não foi possível excluir as aulas do módulo."); return; }
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir o módulo."); return; }
    invalidateAll();
    toast.success("Módulo excluído");
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Excluir esta aula?")) return;
    const { error } = await supabase.from("course_lessons").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir a aula."); return; }
    invalidateAll();
    toast.success("Aula excluída");
  };

  // Edit handlers
  const openEditCourse = (course: any) => {
    setEditingCourse(course);
    setEditCourseForm({ name: course.name, description: course.description || "", product_id: course.product_id || "" });
  };

  const handleEditCourse = async () => {
    if (!editingCourse || !editCourseForm.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("courses").update({ name: editCourseForm.name, description: editCourseForm.description, product_id: editCourseForm.product_id || null }).eq("id", editingCourse.id);
    if (error) { setSaving(false); toast.error("Não foi possível atualizar o curso."); return; }
    setEditingCourse(null);
    setSaving(false);
    invalidateAll();
    toast.success("Curso atualizado!");
  };

  const openEditModule = (mod: any) => {
    setEditingModule(mod);
    setEditModuleForm({ title: mod.title });
  };

  const handleEditModule = async () => {
    if (!editingModule || !editModuleForm.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("course_modules").update({ title: editModuleForm.title }).eq("id", editingModule.id);
    if (error) { setSaving(false); toast.error("Não foi possível atualizar o módulo."); return; }
    setEditingModule(null);
    setSaving(false);
    invalidateAll();
    toast.success("Módulo atualizado!");
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setEditLessonForm({
      title: lesson.title, description: lesson.description || "",
      video_url: lesson.video_url || "", duration_minutes: lesson.duration_minutes || 0,
      is_free_preview: lesson.is_free_preview || false
    });
  };

  const handleEditLesson = async () => {
    if (!editingLesson || !editLessonForm.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("course_lessons").update({
      title: editLessonForm.title, description: editLessonForm.description,
      video_url: editLessonForm.video_url, duration_minutes: editLessonForm.duration_minutes,
      is_free_preview: editLessonForm.is_free_preview
    }).eq("id", editingLesson.id);
    if (error) { setSaving(false); toast.error("Não foi possível atualizar a aula."); return; }
    setEditingLesson(null);
    setSaving(false);
    invalidateAll();
    toast.success("Aula atualizada!");
  };

  const stats = {
    totalCourses: courses.length,
    published: courses.filter((c: any) => c.is_published).length,
    totalLessons: lessons.length,
    totalStudents: enrollments.length
  };

  const themeColors = [
    { id: "silver", label: "Titânio", color: "hsl(210, 22%, 78%)" },
    { id: "purple", label: "Roxo", color: "hsl(280, 70%, 50%)" },
    { id: "blue", label: "Azul", color: "hsl(220, 80%, 55%)" },
    { id: "green", label: "Verde", color: "hsl(150, 60%, 45%)" },
    { id: "red", label: "Vermelho", color: "hsl(0, 70%, 50%)" },
    { id: "pink", label: "Rosa", color: "hsl(330, 70%, 55%)" },
  ];

  const [memberTheme, setMemberTheme] = useState("dark");
  const [memberAccent, setMemberAccent] = useState("silver");
  const [memberBanner, setMemberBanner] = useState("");
  const [memberWelcome, setMemberWelcome] = useState("Bem-vindo à área de membros!");

  // Gamification settings
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [xpPerLesson, setXpPerLesson] = useState(10);
  const [xpPerQuiz, setXpPerQuiz] = useState(25);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [badgesEnabled, setBadgesEnabled] = useState(true);

  // Certificate settings
  const [certEnabled, setCertEnabled] = useState(true);
  const [certTemplate, setCertTemplate] = useState("classic");
  const [certInstructorName, setCertInstructorName] = useState("");
  const [certCustomText, setCertCustomText] = useState("");
  const [certLogoUrl, setCertLogoUrl] = useState("");
  const [certSignatureUrl, setCertSignatureUrl] = useState("");

  // Drip content settings
  const [dripEnabled, setDripEnabled] = useState(false);
  const [dripType, setDripType] = useState<"days" | "date" | "progress">("days");
  const [dripInterval, setDripInterval] = useState(7);

  // Community settings
  const [communityEnabled, setCommunityEnabled] = useState(false);
  const [communityType, setCommunityType] = useState<"forum" | "chat" | "both">("forum");
  const [communityModeration, setCommunityModeration] = useState(true);

  // Quiz settings
  const [quizPassRate, setQuizPassRate] = useState(70);
  const [quizRetries, setQuizRetries] = useState(3);
  const [quizShowAnswers, setQuizShowAnswers] = useState(true);

  // Advanced settings
  const [downloadableMaterials, setDownloadableMaterials] = useState(true);
  const [progressTracking, setProgressTracking] = useState(true);
  const [completionRequired, setCompletionRequired] = useState(false);
  const [notifyInactivity, setNotifyInactivity] = useState(true);
  const [inactivityDays, setInactivityDays] = useState(7);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [antiPiracyEnabled, setAntiPiracyEnabled] = useState(true);

  useEffect(() => {
    if (!memberSettings || typeof memberSettings !== "object" || Array.isArray(memberSettings)) return;
    const settings = memberSettings as Record<string, Record<string, unknown>>;
    const apply = (section: string, setters: Record<string, (value: any) => void>) => {
      const values = settings[section];
      if (!values) return;
      Object.entries(setters).forEach(([key, setter]) => {
        const value = values[key];
        if (value !== undefined) setter(value);
      });
    };
    apply("personalization", { theme: setMemberTheme, accent: setMemberAccent, banner: setMemberBanner, welcome: setMemberWelcome });
    apply("gamification", { enabled: setGamificationEnabled, xpPerLesson: setXpPerLesson, xpPerQuiz: setXpPerQuiz, leaderboard: setShowLeaderboard, badges: setBadgesEnabled });
    apply("certificates", { enabled: setCertEnabled, template: setCertTemplate, instructorName: setCertInstructorName, customText: setCertCustomText, logoUrl: setCertLogoUrl, signatureUrl: setCertSignatureUrl });
    apply("drip", { enabled: setDripEnabled, type: setDripType, interval: setDripInterval });
    apply("community", { enabled: setCommunityEnabled, type: setCommunityType, moderation: setCommunityModeration });
    apply("quizzes", { passRate: setQuizPassRate, retries: setQuizRetries, showAnswers: setQuizShowAnswers });
    apply("advanced", { downloadableMaterials: setDownloadableMaterials, progressTracking: setProgressTracking, completionRequired: setCompletionRequired, notifyInactivity: setNotifyInactivity, inactivityDays: setInactivityDays, watermarkEnabled: setWatermarkEnabled, antiPiracyEnabled: setAntiPiracyEnabled });
  }, [memberSettings]);

  const saveSettings = async (section: string, sectionSettings: Json) => {
    if (!user) {
      toast.error("Entre na sua conta para salvar as configurações.");
      return;
    }
    setSaving(true);
    const existing = memberSettings && typeof memberSettings === "object" && !Array.isArray(memberSettings)
      ? memberSettings as Record<string, Json>
      : {};
    const { error } = await supabase.from("member_area_settings").upsert({
      user_id: user.id,
      settings: { ...existing, [section]: sectionSettings },
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      console.error("Could not save member area settings", error);
      toast.error("Não foi possível salvar. Confira a conexão e tente novamente.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["member-area-settings", user.id] });
    toast.success("Configurações salvas na sua conta.");
  };

  const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`w-10 h-6 rounded-full relative transition-colors ${checked ? "bg-primary" : "bg-muted"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-all ${checked ? "right-1" : "left-1"}`} />
    </button>
  );

  

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Área de Membros</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus cursos com controle total: gamificação, certificados, comunidade e muito mais.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
            <Plus className="w-4 h-4" /> Novo Curso
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Cursos</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.totalCourses}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-success" /><p className="text-xs text-muted-foreground">Publicados</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.published}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><PlayCircle className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Total de Aulas</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.totalLessons}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Alunos Matriculados</p></div>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.totalStudents}</p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="cursos" className="gap-2"><BookOpen className="w-4 h-4" /> Cursos</TabsTrigger>
            <TabsTrigger value="personalizar" className="gap-2"><Palette className="w-4 h-4" /> Personalizar</TabsTrigger>
            <TabsTrigger value="gamificacao" className="gap-2"><Trophy className="w-4 h-4" /> Gamificação</TabsTrigger>
            <TabsTrigger value="certificados" className="gap-2"><Award className="w-4 h-4" /> Certificados</TabsTrigger>
            <TabsTrigger value="drip" className="gap-2"><Calendar className="w-4 h-4" /> Drip Content</TabsTrigger>
            <TabsTrigger value="comunidade" className="gap-2"><MessageSquare className="w-4 h-4" /> Comunidade</TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-2"><HelpCircle className="w-4 h-4" /> Quizzes</TabsTrigger>
            <TabsTrigger value="avancado" className="gap-2"><Settings className="w-4 h-4" /> Avançado</TabsTrigger>
          </TabsList>

          {/* === CURSOS TAB === */}
          <TabsContent value="cursos">
            {isLoading ? (
              <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Carregando...</p></div>
            ) : courses.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Nenhum curso criado</h3>
                <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro curso e comece a organizar suas aulas.</p>
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">
                  <Plus className="w-4 h-4 inline mr-1" /> Criar Primeiro Curso
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course: any) => {
                  const courseModules = modules.filter((m: any) => m.course_id === course.id);
                  const courseLessons = lessons.filter((l: any) => courseModules.some((m: any) => m.id === l.module_id));
                  const courseEnrollments = enrollments.filter((e: any) => e.course_id === course.id).length;
                  const isExpanded = expandedCourses.includes(course.id);

                  return (
                    <div key={course.id} className="glass-card overflow-hidden">
                      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleCourse(course.id)}>
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-display font-bold text-foreground">{course.name}</h3>
                              {course.is_published ? <span className="px-2 py-0.5 text-[10px] bg-success/20 text-success rounded-full">Publicado</span> : <span className="px-2 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full">Rascunho</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{courseModules.length} módulos • {courseLessons.length} aulas • {courseEnrollments} alunos{course.products?.name && ` • Vinculado a: ${course.products.name}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => togglePublish(course.id, course.is_published)} className="p-2 hover:bg-secondary rounded-lg" title={course.is_published ? "Despublicar" : "Publicar"}>
                            {course.is_published ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                          </button>
                          <button onClick={() => openEditCourse(course)} className="p-2 hover:bg-secondary rounded-lg" title="Editar curso">
                            <Edit2 className="w-4 h-4 text-primary" />
                          </button>
                          <button onClick={() => { setSelectedCourse(course); setShowModule(true); }} className="p-2 hover:bg-secondary rounded-lg" title="Adicionar módulo">
                            <Plus className="w-4 h-4 text-primary" />
                          </button>
                          <button onClick={() => deleteCourse(course.id)} className="p-2 hover:bg-destructive/10 rounded-lg" title="Excluir curso">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-4 pb-4">
                          {courseModules.length === 0 ? (
                            <div className="py-4 text-center">
                              <p className="text-xs text-muted-foreground mb-2">Nenhum módulo adicionado.</p>
                              <button onClick={() => { setSelectedCourse(course); setShowModule(true); }} className="text-xs text-primary hover:underline">+ Adicionar módulo</button>
                            </div>
                          ) : courseModules.map((mod: any) => {
                            const modLessons = lessons.filter((l: any) => l.module_id === mod.id);
                            const isModExpanded = expandedModules.includes(mod.id);
                            return (
                              <div key={mod.id} className="mt-3">
                                <div className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg cursor-pointer" onClick={() => toggleModule(mod.id)}>
                                  <div className="flex items-center gap-2">
                                    {isModExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                    <Layers className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium text-foreground">{mod.title}</span>
                                    <span className="text-xs text-muted-foreground">({modLessons.length} aulas)</span>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => openEditModule(mod)} className="p-1 hover:bg-secondary rounded" title="Editar módulo">
                                      <Edit2 className="w-3.5 h-3.5 text-primary" />
                                    </button>
                                    <button onClick={() => { setSelectedModule(mod); setShowLesson(true); }} className="p-1 hover:bg-secondary rounded" title="Adicionar aula">
                                      <Plus className="w-3.5 h-3.5 text-primary" />
                                    </button>
                                    <button onClick={() => deleteModule(mod.id)} className="p-1 hover:bg-destructive/10 rounded" title="Excluir módulo">
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </button>
                                  </div>
                                </div>
                                {isModExpanded && (
                                  <div className="ml-8 mt-1 space-y-1">
                                    {modLessons.length === 0 ? (
                                      <div className="py-2 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">Nenhuma aula adicionada.</p>
                                        <button onClick={() => { setSelectedModule(mod); setShowLesson(true); }} className="text-xs text-primary hover:underline">+ Adicionar aula</button>
                                      </div>
                                    ) : modLessons.map((lesson: any) => (
                                      <div key={lesson.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 group">
                                        <div className="flex items-center gap-2">
                                          <PlayCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span className="text-xs text-foreground">{lesson.title}</span>
                                          {lesson.duration_minutes > 0 && <span className="text-[10px] text-muted-foreground">{lesson.duration_minutes}min</span>}
                                          {lesson.is_free_preview && <span className="px-1.5 py-0.5 text-[9px] bg-primary/10 text-primary rounded">Preview</span>}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => openEditLesson(lesson)} className="p-1 hover:bg-secondary rounded" title="Editar aula">
                                            <Edit2 className="w-3 h-3 text-primary" />
                                          </button>
                                          <button onClick={() => deleteLesson(lesson.id)} className="p-1 hover:bg-destructive/10 rounded" title="Excluir aula">
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* === PERSONALIZAR TAB === */}
          <TabsContent value="personalizar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Tema da Área de Membros</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "dark", label: "Escuro", bg: "bg-[hsl(0,0%,8%)]" },
                    { id: "light", label: "Claro", bg: "bg-[hsl(0,0%,96%)]" },
                    { id: "gray", label: "Cinza", bg: "bg-[hsl(0,0%,18%)]" },
                  ].map(t => (
                    <button key={t.id} onClick={() => setMemberTheme(t.id)} className={`p-3 rounded-xl border text-center transition-all text-xs ${memberTheme === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"}`}>
                      <div className={`w-8 h-8 rounded-full ${t.bg} mx-auto mb-1 border border-border`} />
                      <p className="font-medium text-foreground">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Cor de Destaque</h3>
                <div className="grid grid-cols-3 gap-2">
                  {themeColors.map(c => (
                    <button key={c.id} onClick={() => setMemberAccent(c.id)} className={`p-3 rounded-xl border text-center transition-all text-xs ${memberAccent === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"}`}>
                      <div className="w-8 h-8 rounded-full mx-auto mb-1" style={{ backgroundColor: c.color }} />
                      <p className="font-medium text-foreground">{c.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Image className="w-4 h-4 text-primary" /> Banner Personalizado</h3>
                <input value={memberBanner} onChange={e => setMemberBanner(e.target.value)} placeholder="URL da imagem do banner" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                {memberBanner && <div className="w-full h-24 rounded-lg overflow-hidden bg-secondary"><img src={memberBanner} alt="Preview" className="w-full h-full object-cover" /></div>}
              </div>

              <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Mensagem de Boas-vindas</h3>
                <textarea value={memberWelcome} onChange={e => setMemberWelcome(e.target.value)} rows={3} placeholder="Mensagem exibida aos alunos" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none" />
              </div>
            </div>

            <div className="glass-card p-5 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Preview</h3>
              <div className="rounded-xl overflow-hidden border border-border p-6" style={{
                backgroundColor: memberTheme === "dark" ? "hsl(0,0%,8%)" : memberTheme === "light" ? "hsl(0,0%,96%)" : "hsl(0,0%,18%)",
                color: memberTheme === "light" ? "hsl(0,0%,10%)" : "hsl(0,0%,95%)",
              }}>
                {memberBanner && <div className="w-full h-20 rounded-lg overflow-hidden mb-4"><img src={memberBanner} alt="" className="w-full h-full object-cover" /></div>}
                <p className="text-sm font-medium mb-2">{memberWelcome}</p>
                <div className="flex gap-2 mt-3">
                  <div className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: themeColors.find(c => c.id === memberAccent)?.color }}>Botão de Exemplo</div>
                  <div className="px-3 py-1.5 rounded-lg text-xs border border-current opacity-50">Secundário</div>
                </div>
              </div>
            </div>
            <button onClick={() => void saveSettings("personalization", { theme: memberTheme, accent: memberAccent, banner: memberBanner, welcome: memberWelcome })} disabled={saving} className="mt-4 px-6 py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />{saving ? "Salvando..." : "Salvar Personalização"}</button>
          </TabsContent>

          {/* === GAMIFICAÇÃO TAB === */}
          <TabsContent value="gamificacao">
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Trophy className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Sistema de Gamificação</h3>
                      <p className="text-xs text-muted-foreground">Engaje alunos com XP, badges, rankings e recompensas</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={gamificationEnabled} onChange={setGamificationEnabled} />
                </div>

                {gamificationEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> Pontos de Experiência (XP)</h4>
                      <div>
                        <label className="text-xs text-muted-foreground">XP por aula concluída</label>
                        <input type="number" value={xpPerLesson} onChange={e => setXpPerLesson(Number(e.target.value))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground mt-1" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">XP por quiz aprovado</label>
                        <input type="number" value={xpPerQuiz} onChange={e => setXpPerQuiz(Number(e.target.value))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground mt-1" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> Recursos</h4>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                        <div><p className="text-xs font-medium text-foreground">Ranking/Leaderboard</p><p className="text-[10px] text-muted-foreground">Mostrar ranking entre alunos</p></div>
                        <ToggleSwitch checked={showLeaderboard} onChange={setShowLeaderboard} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                        <div><p className="text-xs font-medium text-foreground">Badges/Conquistas</p><p className="text-[10px] text-muted-foreground">Medalhas por marcos atingidos</p></div>
                        <ToggleSwitch checked={badgesEnabled} onChange={setBadgesEnabled} />
                      </div>
                    </div>

                    {badgesEnabled && (
                      <div className="md:col-span-2">
                        <h4 className="text-xs font-semibold text-foreground mb-3">Badges Automáticas</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { icon: "🔥", name: "Primeira Aula", desc: "Completou a 1ª aula" },
                            { icon: "⚡", name: "Streak 7 dias", desc: "7 dias consecutivos" },
                            { icon: "🏆", name: "Módulo Completo", desc: "Terminou um módulo" },
                            { icon: "👑", name: "Curso Completo", desc: "Finalizou o curso todo" },
                            { icon: "🧠", name: "Quiz Master", desc: "100% em todos os quizzes" },
                            { icon: "💬", name: "Social", desc: "10 posts na comunidade" },
                            { icon: "📅", name: "Dedicado", desc: "30 dias de streak" },
                            { icon: "🌟", name: "Top 3", desc: "Top 3 no ranking" },
                          ].map(b => (
                            <div key={b.name} className="p-3 rounded-xl border border-border text-center">
                              <span className="text-2xl">{b.icon}</span>
                              <p className="text-xs font-medium text-foreground mt-1">{b.name}</p>
                              <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => void saveSettings("gamification", { enabled: gamificationEnabled, xpPerLesson, xpPerQuiz, leaderboard: showLeaderboard, badges: badgesEnabled })} disabled={saving} className="px-6 py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</button>
            </div>
          </TabsContent>

          {/* === CERTIFICADOS TAB === */}
          <TabsContent value="certificados">
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Award className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Certificados de Conclusão</h3>
                      <p className="text-xs text-muted-foreground">Emitidos automaticamente ao finalizar 100% do curso</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={certEnabled} onChange={setCertEnabled} />
                </div>

                {certEnabled && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">Template do Certificado</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "classic", label: "Clássico", desc: "Elegante e formal" },
                          { id: "modern", label: "Moderno", desc: "Minimalista e clean" },
                          { id: "premium", label: "Premium", desc: "Dourado e sofisticado" },
                        ].map(t => (
                          <button key={t.id} onClick={() => setCertTemplate(t.id)} className={`p-3 rounded-xl border text-center transition-all text-xs ${certTemplate === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"}`}>
                            <p className="font-medium text-foreground">{t.label}</p>
                            <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Nome do Instrutor</label>
                        <input value={certInstructorName} onChange={e => setCertInstructorName(e.target.value)} placeholder="Seu nome completo" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Texto Personalizado</label>
                        <input value={certCustomText} onChange={e => setCertCustomText(e.target.value)} placeholder="Ex: Certificamos que..." className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Logo (URL)</label>
                        <input value={certLogoUrl} onChange={e => setCertLogoUrl(e.target.value)} placeholder="URL da logo para o certificado" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Assinatura Digital (URL)</label>
                        <input value={certSignatureUrl} onChange={e => setCertSignatureUrl(e.target.value)} placeholder="URL da imagem da assinatura" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                      </div>
                    </div>

                    <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-secondary to-secondary/50">
                      <div className="text-center space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Certificado de Conclusão</p>
                        {certLogoUrl && <img src={certLogoUrl} alt="Logo" className="w-16 h-16 mx-auto object-contain" />}
                        <p className="text-xs text-muted-foreground">{certCustomText || "Certificamos que"}</p>
                        <p className="text-lg font-display font-bold text-foreground">Nome do Aluno</p>
                        <p className="text-xs text-muted-foreground">concluiu com sucesso o curso</p>
                        <p className="text-sm font-semibold text-primary">Nome do Curso</p>
                        <div className="pt-4 flex items-center justify-center gap-8">
                          <div className="text-center">
                            <div className="w-20 border-t border-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground mt-1">{certInstructorName || "Instrutor"}</p>
                          </div>
                          <div className="text-center">
                            <div className="w-20 border-t border-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground mt-1">Data</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => void saveSettings("certificates", { enabled: certEnabled, template: certTemplate, instructorName: certInstructorName, customText: certCustomText, logoUrl: certLogoUrl, signatureUrl: certSignatureUrl })} disabled={saving} className="px-6 py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</button>
            </div>
          </TabsContent>

          {/* === DRIP CONTENT TAB === */}
          <TabsContent value="drip">
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Lock className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Liberação Programada (Drip Content)</h3>
                      <p className="text-xs text-muted-foreground">Libere módulos gradualmente para manter o engajamento</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={dripEnabled} onChange={setDripEnabled} />
                </div>

                {dripEnabled && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">Tipo de Liberação</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "days" as const, label: "Por Dias", desc: "X dias após matrícula", icon: Clock },
                          { id: "date" as const, label: "Por Data", desc: "Data fixa de liberação", icon: Calendar },
                          { id: "progress" as const, label: "Por Progresso", desc: "Após concluir anterior", icon: Target },
                        ].map(t => (
                          <button key={t.id} onClick={() => setDripType(t.id)} className={`p-3 rounded-xl border text-center transition-all text-xs ${dripType === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"}`}>
                            <t.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                            <p className="font-medium text-foreground">{t.label}</p>
                            <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {dripType === "days" && (
                      <div>
                        <label className="text-xs text-muted-foreground">Intervalo entre módulos (dias)</label>
                        <input type="number" value={dripInterval} onChange={e => setDripInterval(Number(e.target.value))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground mt-1" />
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs text-foreground leading-relaxed">
                        <strong>Como funciona:</strong> {dripType === "days" ? `Cada módulo será liberado ${dripInterval} dias após o anterior.` : dripType === "date" ? "Defina datas específicas para cada módulo nas configurações do curso." : "O próximo módulo é liberado quando o aluno concluir 100% do atual."} Os alunos verão os módulos bloqueados com a data/condição de liberação.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => void saveSettings("drip", { enabled: dripEnabled, type: dripType, interval: dripInterval })} disabled={saving} className="px-6 py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</button>
            </div>
          </TabsContent>

          {/* === COMUNIDADE TAB === */}
          <TabsContent value="comunidade">
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Comunidade de Alunos</h3>
                      <p className="text-xs text-muted-foreground">Crie um espaço para interação entre alunos e instrutor</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={communityEnabled} onChange={setCommunityEnabled} />
                </div>

                {communityEnabled && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">Tipo de Comunidade</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "forum" as const, label: "Fórum", desc: "Discussões organizadas por tópicos" },
                          { id: "chat" as const, label: "Chat ao Vivo", desc: "Conversas em tempo real" },
                          { id: "both" as const, label: "Ambos", desc: "Fórum + chat ao vivo" },
                        ].map(t => (
                          <button key={t.id} onClick={() => setCommunityType(t.id)} className={`p-3 rounded-xl border text-center transition-all text-xs ${communityType === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"}`}>
                            <p className="font-medium text-foreground">{t.label}</p>
                            <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div><p className="text-xs font-medium text-foreground">Moderação Automática</p><p className="text-[10px] text-muted-foreground">Filtrar palavrões e spam automaticamente</p></div>
                      <ToggleSwitch checked={communityModeration} onChange={setCommunityModeration} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-border text-center">
                        <Heart className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium text-foreground">Reações</p>
                        <p className="text-[10px] text-muted-foreground">Curtir e reagir a posts</p>
                      </div>
                      <div className="p-3 rounded-xl border border-border text-center">
                        <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium text-foreground">Menções</p>
                        <p className="text-[10px] text-muted-foreground">Marcar outros alunos</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => void saveSettings("community", { enabled: communityEnabled, type: communityType, moderation: communityModeration })} disabled={saving} className="px-6 py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</button>
            </div>
          </TabsContent>

          {/* === QUIZZES TAB === */}
          <TabsContent value="quizzes">
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Configurações de Quizzes</h3>
                    <p className="text-xs text-muted-foreground">Configure como os quizzes funcionam nos seus cursos</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Nota mínima para aprovação (%)</label>
                      <input type="number" value={quizPassRate} onChange={e => setQuizPassRate(Number(e.target.value))} min={0} max={100} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Tentativas permitidas</label>
                      <input type="number" value={quizRetries} onChange={e => setQuizRetries(Number(e.target.value))} min={1} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground mt-1" />
                      <p className="text-[10px] text-muted-foreground mt-1">0 = ilimitado</p>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div><p className="text-xs font-medium text-foreground">Mostrar Respostas</p><p className="text-[10px] text-muted-foreground">Após concluir o quiz</p></div>
                      <ToggleSwitch checked={quizShowAnswers} onChange={setQuizShowAnswers} />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Tipos de Perguntas Disponíveis</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Múltipla escolha", "Verdadeiro/Falso", "Resposta curta", "Ordenação"].map(t => (
                        <div key={t} className="p-2 rounded-lg border border-border text-center">
                          <p className="text-xs text-foreground">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Dica:</strong> Para adicionar quizzes, acesse a edição de uma aula e adicione perguntas. Cada quiz é vinculado a uma aula específica.
                  </p>
                </div>
              </div>
              <button onClick={() => void saveSettings("quizzes", { passRate: quizPassRate, retries: quizRetries, showAnswers: quizShowAnswers })} disabled={saving} className="px-6 py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</button>
            </div>
          </TabsContent>

          {/* === AVANÇADO TAB === */}
          <TabsContent value="avancado">
            <div className="space-y-4">
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Configurações Avançadas</h3>

                <div className="space-y-3">
                  {[
                    { icon: Download, label: "Materiais para Download", desc: "PDFs, slides, planilhas anexadas às aulas", checked: downloadableMaterials, onChange: setDownloadableMaterials },
                    { icon: BarChart3, label: "Rastreamento de Progresso", desc: "Barra de progresso visível para o aluno", checked: progressTracking, onChange: setProgressTracking },
                    { icon: Lock, label: "Conclusão Obrigatória", desc: "Exigir 100% para desbloquear próximo módulo", checked: completionRequired, onChange: setCompletionRequired },
                    { icon: Eye, label: "Marca d'Água nos Vídeos", desc: "Email do aluno sobreposto no player", checked: watermarkEnabled, onChange: setWatermarkEnabled },
                    { icon: Shield, label: "Proteção Anti-pirataria", desc: "Bloquear gravação de tela e screenshots", checked: antiPiracyEnabled, onChange: setAntiPiracyEnabled },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-primary" />
                        <div><p className="text-xs font-medium text-foreground">{item.label}</p><p className="text-[10px] text-muted-foreground">{item.desc}</p></div>
                      </div>
                      <ToggleSwitch checked={item.checked} onChange={item.onChange} />
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <div><p className="text-xs font-medium text-foreground">Alerta de Inatividade</p><p className="text-[10px] text-muted-foreground">Notificar alunos inativos</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notifyInactivity && (
                        <div className="flex items-center gap-1">
                          <input type="number" value={inactivityDays} onChange={e => setInactivityDays(Number(e.target.value))} className="w-14 px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground text-center" />
                          <span className="text-[10px] text-muted-foreground">dias</span>
                        </div>
                      )}
                      <ToggleSwitch checked={notifyInactivity} onChange={setNotifyInactivity} />
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => void saveSettings("advanced", { downloadableMaterials, progressTracking, completionRequired, notifyInactivity, inactivityDays, watermarkEnabled, antiPiracyEnabled })} disabled={saving} className="px-6 py-2.5 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</button>
            </div>
          </TabsContent>
        </Tabs>

        {/* === MODALS === */}

        {/* Create Course */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Curso">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Nome do Curso *</label>
            <input value={courseForm.name} onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Descrição</label>
            <textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Vincular a Produto (opcional)</label>
            <select value={courseForm.product_id} onChange={e => setCourseForm(f => ({ ...f, product_id: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
              <option value="">Nenhum produto vinculado</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={handleCreateCourse} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Criar Curso</button>
        </Modal>

        {/* Edit Course */}
        <Modal open={!!editingCourse} onClose={() => setEditingCourse(null)} title="Editar Curso">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Nome do Curso *</label>
            <input value={editCourseForm.name} onChange={e => setEditCourseForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Descrição</label>
            <textarea value={editCourseForm.description} onChange={e => setEditCourseForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Vincular a Produto</label>
            <select value={editCourseForm.product_id} onChange={e => setEditCourseForm(f => ({ ...f, product_id: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
              <option value="">Nenhum produto vinculado</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={handleEditCourse} disabled={saving} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </Modal>

        {/* Create Module */}
        <Modal open={showModule} onClose={() => setShowModule(false)} title="Novo Módulo">
          <p className="text-xs text-muted-foreground">Curso: {selectedCourse?.name}</p>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Título do Módulo *</label>
            <input value={moduleForm.title} onChange={e => setModuleForm({ title: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
          <button onClick={handleCreateModule} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Adicionar Módulo</button>
        </Modal>

        {/* Edit Module */}
        <Modal open={!!editingModule} onClose={() => setEditingModule(null)} title="Editar Módulo">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Título do Módulo *</label>
            <input value={editModuleForm.title} onChange={e => setEditModuleForm({ title: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
          <button onClick={handleEditModule} disabled={saving} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </Modal>

        {/* Create Lesson */}
        <Modal open={showLesson} onClose={() => setShowLesson(false)} title="Nova Aula">
          <p className="text-xs text-muted-foreground">Módulo: {selectedModule?.title}</p>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Título da Aula *</label>
            <input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Conteúdo da Aula</label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLessonForm(f => ({ ...f, video_url: "" }))}
                  className={`p-3 rounded-lg border text-center text-xs transition-all ${!lessonForm.video_url?.startsWith("http") ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                >
                  <Video className="w-5 h-5 mx-auto mb-1 text-primary" />
                  URL do Vídeo
                </button>
                <div className="p-3 rounded-lg border border-border text-center text-xs text-muted-foreground opacity-60">
                  <FileText className="w-5 h-5 mx-auto mb-1" />
                  Upload (em breve)
                </div>
              </div>
              <input value={lessonForm.video_url} onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=... ou URL do vídeo" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
              {lessonForm.video_url && (
                <div className="rounded-lg overflow-hidden border border-border bg-secondary p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Pré-visualização:</p>
                  {lessonForm.video_url.includes("youtube.com") || lessonForm.video_url.includes("youtu.be") ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${lessonForm.video_url.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1] || ""}`}
                      className="w-full aspect-video rounded"
                      allowFullScreen
                    />
                  ) : lessonForm.video_url.includes("vimeo.com") ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${lessonForm.video_url.match(/vimeo\.com\/(\d+)/)?.[1] || ""}`}
                      className="w-full aspect-video rounded"
                      allowFullScreen
                    />
                  ) : (
                    <video src={lessonForm.video_url} controls className="w-full aspect-video rounded" />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Duração (min)</label>
              <input type="number" value={lessonForm.duration_minutes} onChange={e => setLessonForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" checked={lessonForm.is_free_preview} onChange={e => setLessonForm(f => ({ ...f, is_free_preview: e.target.checked }))} id="free-preview" />
              <label htmlFor="free-preview" className="text-xs text-foreground">Preview gratuito</label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Descrição</label>
            <textarea value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none" />
          </div>
          <button onClick={handleCreateLesson} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground">Adicionar Aula</button>
        </Modal>

        {/* Edit Lesson */}
        <Modal open={!!editingLesson} onClose={() => setEditingLesson(null)} title="Editar Aula">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Título da Aula *</label>
            <input value={editLessonForm.title} onChange={e => setEditLessonForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">URL do Vídeo</label>
            <input value={editLessonForm.video_url} onChange={e => setEditLessonForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/..." className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Duração (min)</label>
              <input type="number" value={editLessonForm.duration_minutes} onChange={e => setEditLessonForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" checked={editLessonForm.is_free_preview} onChange={e => setEditLessonForm(f => ({ ...f, is_free_preview: e.target.checked }))} id="edit-free-preview" />
              <label htmlFor="edit-free-preview" className="text-xs text-foreground">Preview gratuito</label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Descrição</label>
            <textarea value={editLessonForm.description} onChange={e => setEditLessonForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none" />
          </div>
          <button onClick={handleEditLesson} disabled={saving} className="w-full py-3 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AreaMembros;
