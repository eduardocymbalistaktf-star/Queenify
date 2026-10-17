import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Target, Eye, Users, Sparkles, ShieldCheck, Globe, Award } from "lucide-react";
import queenifyBee from "@/assets/queenify-bee.png";
import BackButton from "@/components/BackButton";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const values = [
  { icon: Heart, title: "Empatia", desc: "Entendemos as dores dos produtores digitais porque já estivemos no seu lugar." },
  { icon: ShieldCheck, title: "Transparência", desc: "Taxas claras, sem custos ocultos, sem surpresas. Você sabe exatamente o que paga." },
  { icon: Sparkles, title: "Inovação", desc: "Estamos sempre evoluindo, trazendo tecnologias que simplificam e potencializam suas vendas." },
  { icon: Users, title: "Comunidade", desc: "Acreditamos que crescer juntos é melhor. Nosso marketplace conecta produtores e afiliados." },
];

const milestones = [
  { year: "2025", event: "Ideia e concepção da Queenify" },
  { year: "2025", event: "Desenvolvimento da plataforma" },
  { year: "2026", event: "Lançamento oficial" },
  { year: "2026", event: "Marketplace de afiliados" },
  { year: "2026", event: "App Mobile" },
];

const stats = [
  { value: "6,99%", label: "Taxa única por venda" },
  { value: "2 dias", label: "Liberação via PIX" },
  { value: "7 dias", label: "Suporte por semana" },
  { value: "24h", label: "Aprovação de produtos" },
];

const SobreNos = () => (
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

    <section className="py-20 px-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(43_96%_56%/0.12),transparent)]" />
      <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto relative z-10">
        <motion.img variants={fadeUp} src={queenifyBee} alt="Queenify" className="w-20 h-20 mx-auto mb-6" />
        <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-display font-bold mb-4">
          Sobre a <span className="text-primary">Queenify</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">
          Nascemos para democratizar o mercado digital. Acreditamos que qualquer pessoa com conhecimento valioso merece uma plataforma que a ajude a transformar esse conhecimento em um negócio rentável.
        </motion.p>
      </motion.div>
    </section>

    <section className="py-16 px-4 border-t border-border">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="glass-card p-8 border-primary/20">
          <Target className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-display font-bold mb-3">Nossa Missão</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Oferecer a plataforma mais acessível, transparente e tecnologicamente avançada para produtores digitais. Queremos eliminar barreiras e permitir que qualquer pessoa possa vender online com facilidade.
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass-card p-8 border-primary/20">
          <Eye className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-display font-bold mb-3">Nossa Visão</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ser a plataforma de referência no mercado de produtos digitais na América Latina, reconhecida pela inovação, pelo suporte excepcional e por realmente se importar com o sucesso de cada produtor.
          </p>
        </motion.div>
      </motion.div>
    </section>

    <section className="py-16 px-4 border-t border-border">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
        <motion.h2 variants={fadeUp} className="text-2xl font-display font-bold text-center mb-10">Nossos Valores</motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {values.map((v) => (
            <motion.div key={v.title} variants={fadeUp} className="glass-card p-6 flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <v.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground mb-1">{v.title}</h3>
                <p className="text-xs text-muted-foreground">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>

    <section className="py-16 px-4 border-t border-border">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="glass-card p-6 text-center">
              <p className="text-2xl font-display font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>

    <section className="py-16 px-4 border-t border-border">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mx-auto">
        <motion.h2 variants={fadeUp} className="text-2xl font-display font-bold text-center mb-10">Nossa Jornada</motion.h2>
        <div className="space-y-4">
          {milestones.map((m, i) => (
            <motion.div key={i} variants={fadeUp} className="flex items-center gap-4">
              <div className="w-16 text-right">
                <span className="text-sm font-bold text-primary">{m.year}</span>
              </div>
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 ring-4 ring-primary/20" />
              <div className="glass-card p-4 flex-1">
                <p className="text-sm text-foreground">{m.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>

    <section className="py-20 px-4 border-t border-border text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-3">Faça parte dessa história</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">Junte-se a milhares de produtores que estão transformando conhecimento em negócio.</p>
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

export default SobreNos;
