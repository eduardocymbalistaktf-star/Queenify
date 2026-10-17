import { useState } from "react";
import { Zap, Clock, Mail, ShoppingCart, UserPlus, Star, TrendingUp, ToggleLeft, ToggleRight, Play, Pause, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Sequence {
  id: string;
  name: string;
  trigger: string;
  triggerIcon: typeof Mail;
  steps: { delay: string; action: string; template: string }[];
  active: boolean;
  sent: number;
  converted: number;
}

const defaultSequences: Sequence[] = [
  {
    id: "welcome",
    name: "Boas-vindas ao comprador",
    trigger: "Após compra aprovada",
    triggerIcon: UserPlus,
    steps: [
      { delay: "Imediato", action: "Enviar email", template: "Boas-vindas + acesso ao produto" },
      { delay: "3 dias", action: "Enviar email", template: "Dicas para aproveitar melhor" },
      { delay: "7 dias", action: "Enviar email", template: "Pedir avaliação do produto" },
    ],
    active: false,
    sent: 0,
    converted: 0,
  },
  {
    id: "abandoned",
    name: "Recuperação de carrinho",
    trigger: "Carrinho abandonado há 1h",
    triggerIcon: ShoppingCart,
    steps: [
      { delay: "1 hora", action: "Enviar email", template: "Lembrete do carrinho" },
      { delay: "24 horas", action: "Enviar email", template: "Oferta com 10% OFF" },
      { delay: "72 horas", action: "Enviar email", template: "Última chance + urgência" },
    ],
    active: false,
    sent: 0,
    converted: 0,
  },
  {
    id: "reengagement",
    name: "Reengajamento",
    trigger: "Sem compras há 60 dias",
    triggerIcon: TrendingUp,
    steps: [
      { delay: "60 dias", action: "Enviar email", template: "Sentimos sua falta!" },
      { delay: "75 dias", action: "Enviar email", template: "Oferta exclusiva de retorno" },
    ],
    active: false,
    sent: 0,
    converted: 0,
  },
  {
    id: "review",
    name: "Pedir avaliação",
    trigger: "7 dias após a compra",
    triggerIcon: Star,
    steps: [
      { delay: "7 dias", action: "Enviar email", template: "Como está sendo sua experiência?" },
      { delay: "14 dias", action: "Enviar email", template: "Deixe sua avaliação ⭐" },
    ],
    active: false,
    sent: 0,
    converted: 0,
  },
  {
    id: "pix_pending",
    name: "Lembrete PIX/Boleto pendente",
    trigger: "Pagamento pendente há 30min",
    triggerIcon: Clock,
    steps: [
      { delay: "30 min", action: "Enviar email", template: "Seu pagamento está pendente" },
      { delay: "2 horas", action: "Enviar email", template: "Finalize seu pagamento via PIX" },
      { delay: "24 horas", action: "Enviar email", template: "Última chance para pagar" },
    ],
    active: false,
    sent: 0,
    converted: 0,
  },
];

const AutomationSequences = () => {
  const [sequences, setSequences] = useState(defaultSequences);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSequence = (id: string) => {
    setSequences(seqs =>
      seqs.map(s => s.id === id ? { ...s, active: !s.active } : s)
    );
    const seq = sequences.find(s => s.id === id);
    toast.success(seq?.active ? `"${seq.name}" desativada` : `"${seq?.name}" ativada`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Sequências Automáticas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Emails enviados automaticamente baseados em gatilhos de comportamento.</p>
        </div>
        <span className="px-2.5 py-1 bg-success/10 text-success text-[10px] font-semibold rounded-full">
          {sequences.filter(s => s.active).length} ativas
        </span>
      </div>

      {sequences.map(seq => (
        <div key={seq.id} className={`glass-card overflow-hidden ${!seq.active ? "opacity-70" : ""}`}>
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
            onClick={() => setExpandedId(expandedId === seq.id ? null : seq.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${seq.active ? "bg-primary/10" : "bg-secondary"}`}>
                <seq.triggerIcon className={`w-4 h-4 ${seq.active ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{seq.name}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Play className="w-2.5 h-2.5" /> {seq.trigger} · {seq.steps.length} etapas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground">
                <span>{seq.sent} enviados</span>
                <span>{seq.converted} conversões</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleSequence(seq.id); }}
                className="p-1"
              >
                {seq.active
                  ? <ToggleRight className="w-6 h-6 text-success" />
                  : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                }
              </button>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === seq.id ? "rotate-90" : ""}`} />
            </div>
          </div>

          {expandedId === seq.id && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              <div className="space-y-2">
                {seq.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {i + 1}
                      </div>
                      {i < seq.steps.length - 1 && <div className="w-px h-4 bg-border" />}
                    </div>
                    <div className="flex-1 p-2.5 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium">{step.delay}</span>
                        <span className="text-[10px] text-muted-foreground">→</span>
                        <Mail className="w-3 h-3 text-primary" />
                        <span className="text-xs text-foreground">{step.template}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 italic">
                💡 Para enviar emails reais, configure seu domínio de email em Configurações → Email.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AutomationSequences;
