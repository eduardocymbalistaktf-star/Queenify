import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Headphones, MessageCircle, Mail, BookOpen, Video, ArrowRight, Clock, ShieldCheck, Send, Bot, Search, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import BrandLogo from "@/components/BrandLogo";
import BackButton from "@/components/BackButton";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const channels = [
  { icon: Mail, title: "E-mail de contato", desc: "Para questões detalhadas ou envio de documentos. Não envie senhas, códigos ou dados completos de pagamento.", action: "Escrever e-mail", href: "mailto:suporte@queenify.com.br?subject=Ajuda%20Queenify", highlight: true, time: "Prazo de resposta não confirmado" },
];

const resources = [
  { icon: BookOpen, title: "Perguntas frequentes", desc: "Respostas sobre conta, vendas, pagamentos, afiliados e segurança.", link: "/faq" },
  { icon: Video, title: "Guias da plataforma", desc: "Acesse os guias disponíveis para configurar sua conta e seus produtos.", link: "/tutoriais" },
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

const openSupportEmail = (messages: ChatMsg[]) => {
  const transcript = messages.map(message => `${message.role === "user" ? "Você" : "QueenIA"}: ${message.content}`).join("\n\n");
  const subject = encodeURIComponent("Ajuda com a Queenify");
  const body = encodeURIComponent(`Olá, preciso de ajuda com a Queenify.\n\n${transcript}`);
  window.location.href = `mailto:suporte@queenify.com.br?subject=${subject}&body=${body}`;
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
  const [failCount, setFailCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userMsg: string) => {
    if (!userMsg.trim() || isLoading) return;
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
          messages: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
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
        setMessages(prev => [...prev, { role: "assistant", content: "Não consegui conectar com a QueenIA. Envie sua dúvida para [suporte@queenify.com.br](mailto:suporte@queenify.com.br) e nossa equipe responderá em até 48 horas." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, tive um problema ao processar sua pergunta. Pode tentar novamente?" }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = () => openSupportEmail(messages);

  return (
    <div className="fixed bottom-4 right-4 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-display font-bold text-foreground">QueenIA 👑</p>
          <p className="text-[10px] text-muted-foreground">IA da Queenify • e-mail de suporte</p>
        </div>
        <button onClick={handleEscalate} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
          Enviar por e-mail
        </button>
        <button onClick={onClose} aria-label="Fechar chat" className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
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
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input.trim())}
            placeholder={isLoading ? "A QueenIA está respondendo..." : "Digite sua dúvida..."}
            maxLength={2000}
            disabled={isLoading}
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input.trim())}
            disabled={!input.trim() || isLoading}
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
  const [helpSearch, setHelpSearch] = useState("");
  const filteredTopics = topics.filter(topic =>
    `${topic.title} ${topic.desc}`.toLocaleLowerCase("pt-BR").includes(helpSearch.trim().toLocaleLowerCase("pt-BR")),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo size="small" />
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
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Atendimento automatizado em configuração</div>
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Não compartilhe dados sensíveis no chat</div>
          </motion.div>
        </motion.div>
      </section>

      <section className="px-4 pb-12">
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="search" value={helpSearch} onChange={event => setHelpSearch(event.target.value)} placeholder="Buscar tópico de ajuda..." aria-label="Buscar tópico de ajuda" className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
          <p className="text-center text-xs text-muted-foreground mt-2">A QueenIA depende da ativação da integração de IA. Se estiver indisponível, tente novamente mais tarde ou use o e-mail de contato.</p>
        </div>
      </section>

      <section className="py-12 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-5xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl font-display font-bold text-center mb-8">Canais de Suporte</motion.h2>
          <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
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
            {filteredTopics.map((t) => (
              <motion.div key={t.title} variants={fadeUp}>
                <Link to={`/faq?search=${encodeURIComponent(t.title)}`} className="glass-card p-5 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors group">
                  <span><span className="block text-sm font-display font-bold text-foreground mb-1">{t.title}</span><span className="block text-xs text-muted-foreground">{t.desc}</span></span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>
          {filteredTopics.length === 0 && <p className="text-center text-sm text-muted-foreground">Nenhum tópico encontrado para “{helpSearch}”. Tente outra busca.</p>}
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
