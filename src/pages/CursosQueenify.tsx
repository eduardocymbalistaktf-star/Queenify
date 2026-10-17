import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Play, Clock, Star, Lock, ArrowRight, BookOpen, TrendingUp, Palette, Users } from "lucide-react";
import queenifyBee from "@/assets/queenify-bee-blue.png";
import BackButton from "@/components/BackButton";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const courses = [
  {
    title: "Primeiros Passos na Queenify",
    desc: "Aprenda a criar sua conta, cadastrar seu primeiro produto e configurar o checkout perfeito. Do zero à primeira venda.",
    duration: "45 min",
    lessons: 8,
    level: "Bronze",
    icon: BookOpen,
    available: true,
    topics: ["Criação de conta", "Cadastro de produto", "Configuração de checkout", "Formas de pagamento", "Primeiro link de venda"],
  },
  {
    title: "Dominando o Checkout",
    desc: "Otimize seu checkout para maximizar conversões. Aprenda sobre order bumps, upsells, personalização visual e estratégias comprovadas.",
    duration: "1h 20min",
    lessons: 12,
    level: "Intermediário",
    icon: Palette,
    available: true,
    topics: ["Cores e branding", "Order bumps", "Textos persuasivos", "Teste A/B", "Mobile optimization"],
  },
  {
    title: "Estratégias de Afiliados",
    desc: "Monte um exército de afiliados para multiplicar suas vendas. Aprenda a definir comissões, recrutar e gerenciar afiliados de alto desempenho.",
    duration: "1h 45min",
    lessons: 15,
    level: "Intermediário",
    icon: Users,
    available: true,
    topics: ["Definindo comissões", "Recrutamento de afiliados", "Materiais de divulgação", "Monitoramento", "Escalando resultados"],
  },
  {
    title: "Escala com Tráfego Pago",
    desc: "Integre suas campanhas de Facebook Ads e Google Ads com a Queenify. Aprenda a rastrear conversões e otimizar seu ROI.",
    duration: "2h 10min",
    lessons: 18,
    level: "Avançado",
    icon: TrendingUp,
    available: false,
    topics: ["Pixel de conversão", "UTM tracking", "Integração com ads", "Otimização de ROI", "Scaling strategies"],
  },
];

const CursosQueenify = () => {
  const navigate = useNavigate();

  const handleStartCourse = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={queenifyBee} alt="Queenify" className="w-8 h-8" />
            <span className="font-display text-xl font-bold">Queenify</span>
          </Link>
          <BackButton fallbackPath="/" />
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(43_96%_56%/0.1),transparent)]" />
        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto relative z-10">
          <motion.div variants={fadeUp} className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <GraduationCap className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-display font-bold mb-4">
            Cursos <span className="text-primary">Queenify</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto mb-3">
            Aprenda a usar a plataforma do zero ao avançado. Cursos 100% gratuitos criados pelo time Queenify para maximizar seus resultados.
          </motion.p>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-sm text-primary font-medium">
            <Star className="w-4 h-4" />
            100% gratuito para todos os produtores
          </motion.div>
        </motion.div>
      </section>

      {/* Courses */}
      <section className="pb-20 px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto space-y-6">
          {courses.map((course, i) => (
            <motion.div key={i} variants={fadeUp} className={`glass-card p-6 sm:p-8 ${!course.available ? "opacity-60" : "hover:border-primary/30"} transition-colors`}>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <course.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{course.level}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Play className="w-3 h-3" /> {course.lessons} aulas</span>
                      </div>
                    </div>
                    {!course.available && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="w-3 h-3" /> Em breve</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{course.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.topics.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">{t}</span>
                    ))}
                  </div>
                  {course.available ? (
                    <button
                      onClick={handleStartCourse}
                      className="inline-flex items-center gap-2 px-5 py-2 gradient-gold rounded-lg text-sm font-bold text-primary-foreground hover:opacity-90 transition-all"
                    >
                      <Play className="w-4 h-4" /> Começar curso <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button disabled className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-secondary text-muted-foreground text-sm font-medium cursor-not-allowed">
                      <Lock className="w-4 h-4" /> Disponível em breve
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-border text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-display font-bold mb-3">Pronto para aprender?</h2>
          <p className="text-muted-foreground mb-6 text-sm">Crie sua conta e acesse todos os cursos gratuitamente.</p>
          <Link to="/signup" className="inline-flex px-8 py-3.5 gradient-gold rounded-xl text-base font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/20">
            Cadastrar agora
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Queenify. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default CursosQueenify;
