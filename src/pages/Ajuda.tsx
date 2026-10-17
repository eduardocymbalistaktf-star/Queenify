import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Headphones, MessageCircle, Mail, BookOpen, Video, FileText, ArrowRight, Search, Clock, ShieldCheck, Send, Bot, User, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import queenifyBee from "@/assets/queenify-bee.png";
import BackButton from "@/components/BackButton";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const channels = [
  { icon: MessageCircle, title: "WhatsApp", desc: "Respostas rápidas em tempo real. Nosso canal mais ágil.", action: "Abrir WhatsApp", href: "#", highlight: true, time: "Resposta média: 5 min" },
  { icon: Headphones, title: "Chat na Plataforma", desc: "Fale com nosso time diretamente pelo dashboard.", action: "Iniciar chat", href: "#", time: "Resposta média: 15 min" },
  { icon: Mail, title: "E-mail", desc: "Para questões detalhadas ou envio de documentos.", action: "Enviar e-mail", href: "mailto:suporte@queenify.com.br", time: "Resposta em até 48h" },
];

const resources = [
  { icon: BookOpen, title: "Base de Conhecimento", desc: "Artigos detalhados sobre todas as funcionalidades da plataforma.", link: "/faq" },
  { icon: Video, title: "Tutoriais em Vídeo", desc: "Passo a passo visual para configurar checkout, afiliados e mais.", link: "#" },
  { icon: FileText, title: "Documentação da API", desc: "Integre a Queenify com suas ferramentas usando nossa API.", link: "#" },
];

const topics = [
  { title: "Primeiros passos", desc: "Como criar conta, cadastrar produto e configurar checkout" },
  { title: "Vendas e checkout", desc: "Personalização, formas de pagamento e otimização" },
  { title: "Saques e financeiro", desc: "Prazos, taxas, escrow e antecipação" },
  { title: "Afiliados e co-produção", desc: "Gerenciar afiliados, comissões e parcerias" },
  { title: "Segurança da conta", desc: "2FA, senhas, dados pessoais e privacidade" },
  { title: "Problemas técnicos", desc: "Erros no checkout, pagamentos e integrações" },
];

interface ChatMsg {
  role: "assistant" | "user";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;

const isHumanSupportAvailable = (): boolean => {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 6=Sáb
  if (day === 0) return false; // Domingo: sem atendente
  const hour = now.getHours();
  const min = now.getMinutes();
  const timeDecimal = hour + min / 60;
  // Seg-Sáb: 09:00-17:00 e 19:00-22:00
  return (timeDecimal >= 9 && timeDecimal < 17) || (timeDecimal >= 19 && timeDecimal < 22);
};

const getHumanSupportMessage = (): string => {
  if (isHumanSupportAvailable()) {
    return "Nosso time de suporte humano está disponível agora! Posso transferir você.";
  }
  return "No momento, nosso suporte humano está fora do horário de atendimento (Seg-Sáb, 09h–17h e 19h–22h). Enquanto isso, eu posso ajudar com suas dúvidas! 😊";
};

const quickQuestions = [
  { label: "💰 Como faço um saque?", message: "Como faço para solicitar um saque na Queenify?" },
  { label: "📦 Como criar produto?", message: "Como crio um produto digital na Queenify?" },
  { label: "🤝 Afiliados", message: "Como funciona o sistema de afiliados?" },
  { label: "🛒 Checkout", message: "Como personalizo meu checkout?" },
  { label: "💳 Taxas", message: "Quais são as taxas da Queenify?" },
  { label: "🔒 Segurança", message: "Como ativo a verificação em duas etapas?" },
];

const SupportChatbot = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Olá! 👋 Sou a **QueenIA**, a assistente inteligente da Queenify. Como posso ajudar?\n\nEscolha uma pergunta rápida abaixo ou digite sua dúvida:" }
  ]);
  const [input, setInput] = useState("");
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userMsg: string) => {
    if (!userMsg.trim() || isLoading || escalated) return;
    setShowQuickQuestions(false);
    setInput("");
    const newMessages: ChatMsg[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erro na resposta");
      }

      if (!resp.body) throw new Error("No body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > newMessages.length) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      setFailCount(0);
    } catch (e) {
      console.error("Chat error:", e);
      const newFails = failCount + 1;
      setFailCount(newFails);
      if (newFails >= 2) {
        const humanMsg = isHumanSupportAvailable()
          ? "Não consegui resolver sua dúvida. Vou encaminhar você para nosso time de suporte humano. Um atendente entrará em contato em breve! 🙋‍♀️"
          : "Não consegui resolver sua dúvida. Nosso suporte humano funciona de segunda a sábado, das 09h às 17h e das 19h às 22h. Por favor, tente novamente nesse horário ou deixe sua mensagem que entraremos em contato! 📩";
        setMessages(prev => [...prev, { role: "assistant", content: humanMsg }]);
        setEscalated(true);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, tive um problema ao processar sua pergunta. Pode tentar novamente?" }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = () => {
    if (isHumanSupportAvailable()) {
      setMessages(prev => [...prev, { role: "assistant", content: "Encaminhando para suporte humano. Um atendente entrará em contato em breve! 🙋‍♀️" }]);
    } else {
      setMessages(prev => [...prev, { role: "assistant", content: "Nosso suporte humano está disponível de segunda a sábado, das 09h às 17h e das 19h às 22h. Deixe sua mensagem e retornaremos assim que possível! 📩" }]);
    }
    setEscalated(true);
  };

  return (
    <div className="fixed bottom-4 right-4 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-display font-bold text-foreground">QueenIA 👑</p>
          <p className="text-[10px] text-muted-foreground">{escalated ? "Encaminhado para atendente" : "IA da Queenify • 24/7"}</p>
        </div>
        {!escalated && (
          <button onClick={handleEscalate} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
            Falar com humano
          </button>
        )}
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-secondary text-foreground rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_ul]:mt-1 [&_li]:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {showQuickQuestions && messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {quickQuestions.map((q) => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.message)}
                className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        {escalated && (
          <div className="text-center py-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full text-xs font-medium">
              <User className="w-3.5 h-3.5" />
              Conectando com atendente humano...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input.trim())}
            placeholder={escalated ? "Aguardando atendente..." : "Digite sua dúvida..."}
            disabled={escalated || isLoading}
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input.trim())}
            disabled={escalated || !input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Ajuda = () => {
  const [chatOpen, setChatOpen] = useState(false);

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

      <section className="py-16 px-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Headphones className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-display font-bold mb-4">
            Central de <span className="text-primary">Ajuda</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto mb-8">
            Estamos aqui para ajudar. Encontre respostas, tutoriais e fale diretamente com nosso time de suporte.
          </motion.p>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Seg–Sáb: 09h–17h / 19h–22h</div>
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Bot IA 24h</div>
          </motion.div>
        </motion.div>
      </section>

      <section className="px-4 pb-12">
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar ajuda..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </section>

      <section className="px-4 pb-12">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl gradient-gold text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            <Bot className="w-5 h-5" />
            Falar com QueenIA 👑
          </button>
          <p className="text-center text-xs text-muted-foreground mt-2">QueenIA 24/7 • Atendentes humanos: Seg–Sáb, 09h–17h e 19h–22h • E-mail: até 48h</p>
        </div>
      </section>

      <section className="py-12 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-5xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl font-display font-bold text-center mb-8">Canais de Suporte</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <motion.a key={ch.title} href={ch.href} variants={fadeUp} className={`glass-card p-6 text-center group hover:border-primary/30 transition-all block ${ch.highlight ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
                <ch.icon className={`w-8 h-8 mx-auto mb-3 ${ch.highlight ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-display font-bold text-foreground mb-1">{ch.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{ch.desc}</p>
                <p className="text-[10px] text-primary font-medium mb-3">{ch.time}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  {ch.action} <ArrowRight className="w-4 h-4" />
                </span>
                {ch.highlight && <span className="block mt-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">Recomendado</span>}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-12 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl font-display font-bold text-center mb-8">Tópicos Populares</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((t) => (
              <motion.div key={t.title} variants={fadeUp} className="glass-card p-5 hover:border-primary/30 transition-colors cursor-pointer">
                <h3 className="text-sm font-display font-bold text-foreground mb-1">{t.title}</h3>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-12 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl font-display font-bold text-center mb-8">Recursos</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((r) => (
              <motion.div key={r.title} variants={fadeUp}>
                <Link to={r.link} className="glass-card p-6 text-center block hover:border-primary/30 transition-colors">
                  <r.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-display font-bold text-foreground mb-1">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Queenify. Todos os direitos reservados.</p>
      </footer>

      {chatOpen && <SupportChatbot onClose={() => setChatOpen(false)} />}

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-gold shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50"
        >
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
        </button>
      )}
    </div>
  );
};

export default Ajuda;
