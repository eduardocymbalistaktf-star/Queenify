import DashboardLayout from "@/layouts/DashboardLayout";
import { useMemo, useState, useRef } from "react";
import { Filter } from "lucide-react";
import {
  Users, TrendingUp, TrendingDown, BookOpen, CheckCircle2, Clock, AlertTriangle, Award, BarChart3
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AtRiskStudentsList from "@/components/AtRiskStudentsList";

const PIE_COLORS = ["hsl(142, 71%, 45%)", "hsl(43, 96%, 56%)", "hsl(25, 95%, 53%)", "hsl(0, 70%, 55%)"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const RetencaoAlunos = () => {
  const { user } = useAuth();

  const { data: courses = [] } = useQuery({
    queryKey: ["retention-courses", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, name").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["retention-modules", user?.id],
    queryFn: async () => {
      const ids = courses.map((c: any) => c.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("course_modules").select("id, course_id, title, display_order").in("course_id", ids).order("display_order");
      return data || [];
    },
    enabled: courses.length > 0,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["retention-lessons", user?.id],
    queryFn: async () => {
      const ids = modules.map((m: any) => m.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("course_lessons").select("id, module_id").in("module_id", ids);
      return data || [];
    },
    enabled: modules.length > 0,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["retention-enrollments", user?.id],
    queryFn: async () => {
      const ids = courses.map((c: any) => c.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("student_enrollments").select("id, course_id, student_id, enrolled_at").in("course_id", ids);
      return data || [];
    },
    enabled: courses.length > 0,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["retention-progress", user?.id],
    queryFn: async () => {
      const lessonIds = lessons.map((l: any) => l.id);
      if (!lessonIds.length) return [];
      const { data } = await supabase.from("student_progress").select("id, lesson_id, student_id, completed, completed_at").in("lesson_id", lessonIds);
      return data || [];
    },
    enabled: lessons.length > 0,
  });

  // Course filter
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

  const filteredModules = useMemo(() => selectedCourseId === "all" ? modules : modules.filter((m: any) => m.course_id === selectedCourseId), [modules, selectedCourseId]);
  const filteredLessons = useMemo(() => {
    const modIds = new Set(filteredModules.map((m: any) => m.id));
    return lessons.filter((l: any) => modIds.has(l.module_id));
  }, [lessons, filteredModules]);
  const filteredEnrollments = useMemo(() => selectedCourseId === "all" ? enrollments : enrollments.filter((e: any) => e.course_id === selectedCourseId), [enrollments, selectedCourseId]);
  const filteredProgress = useMemo(() => {
    const lessonIds = new Set(filteredLessons.map((l: any) => l.id));
    return progress.filter((p: any) => lessonIds.has(p.lesson_id));
  }, [progress, filteredLessons]);

  // KPIs
  const totalAlunos = new Set(filteredEnrollments.map((e: any) => e.student_id)).size;
  const totalLessons = filteredLessons.length;
  const completedLessons = filteredProgress.filter((p: any) => p.completed).length;
  const engagementRate = totalAlunos > 0 && totalLessons > 0
    ? ((completedLessons / (totalAlunos * totalLessons)) * 100).toFixed(1)
    : "0";

  // Completion per module
  const moduleMetrics = useMemo(() => {
    return filteredModules.map((mod: any) => {
      const modLessons = filteredLessons.filter((l: any) => l.module_id === mod.id);
      const modLessonIds = modLessons.map((l: any) => l.id);
      const modProgress = filteredProgress.filter((p: any) => modLessonIds.includes(p.lesson_id));
      const modCompleted = modProgress.filter((p: any) => p.completed).length;
      const modStudents = new Set(filteredEnrollments.filter((e: any) => e.course_id === mod.course_id).map((e: any) => e.student_id)).size;
      const totalPossible = modStudents * modLessons.length;
      const completionRate = totalPossible > 0 ? +((modCompleted / totalPossible) * 100).toFixed(1) : 0;
      const courseName = courses.find((c: any) => c.id === mod.course_id)?.name || "";

      return {
        name: mod.title,
        course: courseName,
        lessons: modLessons.length,
        students: modStudents,
        completed: modCompleted,
        total: totalPossible,
        rate: completionRate,
      };
    });
  }, [filteredModules, filteredLessons, filteredProgress, filteredEnrollments, courses]);

  // Completion distribution for pie chart
  const completionDistribution = useMemo(() => {
    if (!totalAlunos || !totalLessons) return [];
    const studentProgress: Record<string, number> = {};
    filteredProgress.filter((p: any) => p.completed).forEach((p: any) => {
      studentProgress[p.student_id] = (studentProgress[p.student_id] || 0) + 1;
    });
    let completed = 0, halfWay = 0, started = 0, notStarted = 0;
    const allStudents = new Set(filteredEnrollments.map((e: any) => e.student_id));
    allStudents.forEach(sid => {
      const done = studentProgress[sid] || 0;
      const pct = (done / totalLessons) * 100;
      if (pct >= 100) completed++;
      else if (pct >= 50) halfWay++;
      else if (pct > 0) started++;
      else notStarted++;
    });
    return [
      { name: "Concluído (100%)", value: completed },
      { name: "Metade (50-99%)", value: halfWay },
      { name: "Iniciado (<50%)", value: started },
      { name: "Não iniciado", value: notStarted },
    ].filter(d => d.value > 0);
  }, [filteredProgress, filteredEnrollments, totalAlunos, totalLessons]);

  // Enrollment trend (last 14 days)
  const enrollmentTrend = useMemo(() => {
    const days = 14;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dayStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = filteredEnrollments.filter((e: any) => {
        const ed = new Date(e.enrolled_at);
        return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
      }).length;
      return { dia: dayStr, matriculas: count };
    });
  }, [filteredEnrollments]);

  // At-risk students (enrolled but <10% progress)
  const { data: profiles = [] } = useQuery({
    queryKey: ["retention-profiles", user?.id],
    queryFn: async () => {
      const studentIds = [...new Set(enrollments.map((e: any) => e.student_id))];
      if (!studentIds.length) return [];
      const { data } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", studentIds);
      return data || [];
    },
    enabled: enrollments.length > 0,
  });

  const atRiskStudents = useMemo(() => {
    if (!totalAlunos || !totalLessons) return [];
    const studentProg: Record<string, { count: number; lastDate: string | null }> = {};
    filteredProgress.filter((p: any) => p.completed).forEach((p: any) => {
      if (!studentProg[p.student_id]) studentProg[p.student_id] = { count: 0, lastDate: null };
      studentProg[p.student_id].count += 1;
      if (!studentProg[p.student_id].lastDate || (p.completed_at && p.completed_at > studentProg[p.student_id].lastDate!)) {
        studentProg[p.student_id].lastDate = p.completed_at;
      }
    });
    const allStudents = new Set(filteredEnrollments.map((e: any) => e.student_id));
    const result: any[] = [];
    allStudents.forEach(sid => {
      const done = studentProg[sid]?.count || 0;
      const pct = +((done / totalLessons) * 100).toFixed(1);
      if (pct < 10) {
        const profile = profiles.find((p: any) => p.user_id === sid);
        result.push({
          studentId: sid,
          displayName: profile?.display_name || "Aluno",
          progressPercent: pct,
          completedLessons: done,
          totalLessons,
          lastActivity: studentProg[sid]?.lastDate || null,
        });
      }
    });
    return result.sort((a, b) => a.progressPercent - b.progressPercent);
  }, [filteredProgress, filteredEnrollments, totalAlunos, totalLessons, profiles]);

  const atRiskCount = atRiskStudents.length;
  const maxRate = moduleMetrics.length > 0 ? Math.max(...moduleMetrics.map(m => m.rate)) : 100;
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Retenção de Alunos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Engajamento, progresso e conclusão por módulo</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {courses.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="text-sm bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos os cursos</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div ref={contentRef}>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5 group hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Total de Alunos</p>
          <p className="text-xl font-display font-bold text-foreground mt-0.5">{totalAlunos}</p>
        </div>

        <div className="glass-card p-5 group hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Taxa de Engajamento</p>
          <p className="text-xl font-display font-bold text-foreground mt-0.5">{engagementRate}%</p>
        </div>

        <div className="glass-card p-5 group hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Aulas Concluídas</p>
          <p className="text-xl font-display font-bold text-foreground mt-0.5">{completedLessons} / {totalAlunos * totalLessons || 0}</p>
        </div>

        <div className="glass-card p-5 group hover:border-destructive/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Alunos em Risco</p>
          <p className="text-xl font-display font-bold text-destructive mt-0.5">{atRiskCount}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Enrollment trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-1">Novas Matrículas</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 14 dias</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={enrollmentTrend}>
              <defs>
                <linearGradient id="matGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="matriculas" name="Matrículas" stroke="hsl(var(--primary))" fill="url(#matGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Completion distribution pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-1">Distribuição de Progresso</h3>
          <p className="text-xs text-muted-foreground mb-4">Status geral dos alunos</p>
          {completionDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado de progresso ainda</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={completionDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {completionDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {completionDistribution.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-foreground">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion per module */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">Taxa de Conclusão por Módulo</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Progresso detalhado de cada módulo</p>
        {moduleMetrics.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Crie cursos e módulos para ver as métricas</p>
        ) : (
          <div className="space-y-3">
            {moduleMetrics.map((mod, i) => {
              const intensity = maxRate > 0 ? mod.rate / maxRate : 0;
              const hue = 0 + intensity * 142; // red to green
              return (
                <div key={`${mod.name}-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `hsla(${hue}, 70%, 50%, 0.15)`, color: `hsl(${hue}, 70%, 45%)` }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{mod.name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">({mod.course})</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${mod.rate}%`, backgroundColor: `hsl(${hue}, 70%, 45%)` }} />
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: `hsl(${hue}, 70%, 45%)` }}>{mod.rate}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{mod.lessons} aulas</p>
                    <p className="text-xs text-muted-foreground">{mod.students} alunos</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* At-risk students detail */}
      <div className="mb-6">
        <AtRiskStudentsList students={atRiskStudents} />
      </div>
      {moduleMetrics.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-1">Comparativo de Conclusão</h3>
          <p className="text-xs text-muted-foreground mb-4">Visão geral por módulo</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={moduleMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" name="Conclusão %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default RetencaoAlunos;
