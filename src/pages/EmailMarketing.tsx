import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useMemo } from "react";
import { Mail, Plus, Send, FileText, Users, BarChart3, Edit2, Trash2, Eye, Copy, Search, Sparkles, Image, Type, AlignLeft, Palette, CheckCircle2, XCircle, ArrowRight, GripVertical, X, Bold, Italic, Link2, List, Heading1, Heading2, MousePointerClick, Save, ChevronDown, Package, Zap, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts, useSales } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SegmentationPanel from "@/components/email/SegmentationPanel";
import AutomationSequences from "@/components/email/AutomationSequences";

type Tab = "campanhas" | "templates" | "listas" | "automacoes" | "metricas";
type CampaignStatus = "rascunho";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  productId: string;
  preheader: string;
  senderName: string;
  senderEmail: string;
  blocks: EmailBlock[];
  updatedAt: string;
}

interface EmailBlock {
  id: string;
  type: "titulo" | "texto" | "imagem" | "botao" | "divisor" | "social";
  content: string;
  settings: Record<string, string>;
}

type CampaignDraft = Omit<Campaign, "id" | "updatedAt" | "status">;

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  preview: string;
  lastEdited: string;
  blocks: EmailBlock[];
}

const defaultTemplateBlocks: Record<string, EmailBlock[]> = {
  "Promoção Flash": [
    { id: "1", type: "imagem", content: "", settings: { url: "", alt: "Banner promoção" } },
    { id: "2", type: "titulo", content: "🔥 Oferta imperdível!", settings: { align: "center", size: "28" } },
    { id: "3", type: "texto", content: "Aproveite nossa promoção exclusiva com até 70% de desconto. Esta oferta é por tempo limitado!", settings: { align: "center" } },
    { id: "4", type: "botao", content: "APROVEITAR AGORA", settings: { url: "", color: "#58C8F5", align: "center" } },
  ],
  "Lançamento de Produto": [
    { id: "1", type: "titulo", content: "🚀 Novidade chegando!", settings: { align: "center", size: "32" } },
    { id: "2", type: "imagem", content: "", settings: { url: "", alt: "Novo produto" } },
    { id: "3", type: "texto", content: "Temos o prazer de apresentar nosso mais novo produto. Desenvolvido com carinho para transformar seus resultados.", settings: {} },
    { id: "4", type: "botao", content: "CONHECER AGORA", settings: { url: "", color: "#58C8F5", align: "center" } },
  ],
  "Newsletter Semanal": [
    { id: "1", type: "titulo", content: "📰 Newsletter da Semana", settings: { align: "left", size: "24" } },
    { id: "2", type: "divisor", content: "", settings: {} },
    { id: "3", type: "texto", content: "Confira as principais novidades e conteúdos desta semana.", settings: {} },
    { id: "4", type: "titulo", content: "Destaques", settings: { align: "left", size: "20" } },
    { id: "5", type: "texto", content: "• Artigo: Como aumentar suas vendas em 30 dias\n• Dica: O melhor horário para enviar emails\n• Novidade: Nova funcionalidade liberada", settings: {} },
    { id: "6", type: "social", content: "", settings: {} },
  ],
  "Boas-vindas": [
    { id: "1", type: "titulo", content: "Bem-vindo(a) à família! 🎉", settings: { align: "center", size: "28" } },
    { id: "2", type: "texto", content: "Estamos muito felizes em ter você conosco. A partir de agora você terá acesso a conteúdos exclusivos e ofertas especiais.", settings: { align: "center" } },
    { id: "3", type: "botao", content: "ACESSAR AGORA", settings: { url: "", color: "#58C8F5", align: "center" } },
  ],
  "Carrinho Abandonado": [
    { id: "1", type: "titulo", content: "Você esqueceu algo... 🛒", settings: { align: "center", size: "26" } },
    { id: "2", type: "texto", content: "Notamos que você deixou um item no seu carrinho. Que tal finalizar sua compra?", settings: { align: "center" } },
    { id: "3", type: "botao", content: "FINALIZAR COMPRA COM 10% OFF", settings: { url: "", color: "#22c55e", align: "center" } },
  ],
  "Depoimento Social": [
    { id: "1", type: "titulo", content: "Veja o que dizem nossos clientes ⭐", settings: { align: "center", size: "24" } },
    { id: "2", type: "texto", content: '"Produto incrível! Mudou completamente minha vida profissional." — Mariana S.\n\n"O melhor investimento que já fiz." — João P.', settings: {} },
    { id: "3", type: "botao", content: "QUERO EXPERIMENTAR", settings: { url: "", color: "#58C8F5", align: "center" } },
  ],
  "Pix Pendente": [
    { id: "1", type: "titulo", content: "⏳ Seu pagamento está pendente", settings: { align: "center", size: "26" } },
    { id: "2", type: "texto", content: "Notamos que seu pagamento via PIX ainda não foi confirmado. Finalize agora para garantir seu acesso imediato ao produto.", settings: { align: "center" } },
    { id: "3", type: "botao", content: "PAGAR AGORA VIA PIX", settings: { url: "", color: "#8b5cf6", align: "center" } },
    { id: "4", type: "texto", content: "Se já realizou o pagamento, desconsidere este email. A confirmação pode levar alguns minutos.", settings: { align: "center" } },
  ],
  "Boleto Vencendo": [
    { id: "1", type: "titulo", content: "📋 Seu boleto vence hoje!", settings: { align: "center", size: "26" } },
    { id: "2", type: "texto", content: "Não perca o prazo! Seu boleto vence hoje. Efetue o pagamento para garantir acesso ao produto.", settings: { align: "center" } },
    { id: "3", type: "botao", content: "VER BOLETO", settings: { url: "", color: "#f59e0b", align: "center" } },
  ],
  "Upsell Pós-Compra": [
    { id: "1", type: "titulo", content: "🎁 Oferta exclusiva para você!", settings: { align: "center", size: "28" } },
    { id: "2", type: "texto", content: "Parabéns pela sua compra! Como agradecimento, preparamos uma oferta especial com 30% de desconto em um produto complementar.", settings: { align: "center" } },
    { id: "3", type: "botao", content: "VER OFERTA EXCLUSIVA", settings: { url: "", color: "#58C8F5", align: "center" } },
    { id: "4", type: "texto", content: "⚡ Oferta válida por 48 horas", settings: { align: "center" } },
  ],
  "Aniversário": [
    { id: "1", type: "titulo", content: "🎂 Parabéns! Presente especial para você", settings: { align: "center", size: "28" } },
    { id: "2", type: "texto", content: "Neste dia especial, preparamos um cupom exclusivo de 20% OFF em qualquer produto da nossa loja.", settings: { align: "center" } },
    { id: "3", type: "botao", content: "RESGATAR MEU PRESENTE", settings: { url: "", color: "#ec4899", align: "center" } },
  ],
  "Black Friday": [
    { id: "1", type: "imagem", content: "", settings: { url: "", alt: "Black Friday" } },
    { id: "2", type: "titulo", content: "🖤 BLACK FRIDAY — Até 70% OFF", settings: { align: "center", size: "32" } },
    { id: "3", type: "texto", content: "A maior promoção do ano chegou! Aproveite descontos exclusivos por tempo limitado.", settings: { align: "center" } },
    { id: "4", type: "botao", content: "COMPRAR AGORA", settings: { url: "", color: "#58C8F5", align: "center" } },
  ],
};

const mockTemplates: EmailTemplate[] = [
  { id: "1", name: "Promoção Flash", category: "Vendas", preview: "Template com banner de destaque, timer de urgência e CTA grande", lastEdited: "05/04/2026", blocks: defaultTemplateBlocks["Promoção Flash"] },
  { id: "2", name: "Lançamento de Produto", category: "Lançamento", preview: "Layout com imagem hero, descrição e botão de compra", lastEdited: "03/04/2026", blocks: defaultTemplateBlocks["Lançamento de Produto"] },
  { id: "3", name: "Newsletter Semanal", category: "Conteúdo", preview: "Layout editorial com seções de artigos e destaques", lastEdited: "01/04/2026", blocks: defaultTemplateBlocks["Newsletter Semanal"] },
  { id: "4", name: "Boas-vindas", category: "Automação", preview: "Email de boas-vindas com apresentação da marca", lastEdited: "28/03/2026", blocks: defaultTemplateBlocks["Boas-vindas"] },
  { id: "5", name: "Carrinho Abandonado", category: "Recuperação", preview: "Lembrete com imagem do produto e desconto exclusivo", lastEdited: "25/03/2026", blocks: defaultTemplateBlocks["Carrinho Abandonado"] },
  { id: "6", name: "Depoimento Social", category: "Engajamento", preview: "Template com depoimentos de clientes e prova social", lastEdited: "20/03/2026", blocks: defaultTemplateBlocks["Depoimento Social"] },
  { id: "7", name: "Pix Pendente", category: "Recuperação", preview: "Lembrete para pagamentos PIX ainda não confirmados", lastEdited: "18/03/2026", blocks: defaultTemplateBlocks["Pix Pendente"] },
  { id: "8", name: "Boleto Vencendo", category: "Recuperação", preview: "Alerta para boleto que vence hoje", lastEdited: "15/03/2026", blocks: defaultTemplateBlocks["Boleto Vencendo"] },
  { id: "9", name: "Upsell Pós-Compra", category: "Vendas", preview: "Oferta exclusiva com desconto após compra aprovada", lastEdited: "12/03/2026", blocks: defaultTemplateBlocks["Upsell Pós-Compra"] },
  { id: "10", name: "Aniversário", category: "Engajamento", preview: "Cupom especial de aniversário para fidelização", lastEdited: "10/03/2026", blocks: defaultTemplateBlocks["Aniversário"] },
  { id: "11", name: "Black Friday", category: "Vendas", preview: "Template de promoção Black Friday com contagem regressiva", lastEdited: "08/03/2026", blocks: defaultTemplateBlocks["Black Friday"] },
];

const statusConfig: Record<CampaignStatus, { color: string; label: string }> = {
  rascunho: { color: "bg-muted text-muted-foreground", label: "Rascunho" },
};

// ── Block Renderer ──
const BlockRenderer = ({ block, onUpdate, onDelete }: { block: EmailBlock; onUpdate: (b: EmailBlock) => void; onDelete: () => void }) => {
  const [editing, setEditing] = useState(false);

  const renderPreview = () => {
    switch (block.type) {
      case "titulo":
        return (
          <h2 style={{ fontSize: `${block.settings.size || 24}px`, textAlign: (block.settings.align as any) || "left" }}
            className="font-display font-bold text-foreground">
            {block.content || "Título"}
          </h2>
        );
      case "texto":
        return (
          <p className="text-sm text-foreground/80 whitespace-pre-line" style={{ textAlign: (block.settings.align as any) || "left" }}>
            {block.content || "Texto do email..."}
          </p>
        );
      case "imagem":
        return block.settings.url ? (
          <img src={block.settings.url} alt={block.settings.alt || ""} className="w-full rounded-lg object-cover max-h-48" />
        ) : (
          <div className="w-full h-32 bg-secondary rounded-lg flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
        );
      case "botao":
        return (
          <div style={{ textAlign: (block.settings.align as any) || "center" }}>
            <span className="inline-block px-6 py-3 rounded-lg text-sm font-bold text-white cursor-default"
              style={{ background: block.settings.color || "#58C8F5" }}>
              {block.content || "Botão CTA"}
            </span>
          </div>
        );
      case "divisor":
        return <hr className="border-border my-2" />;
      case "social":
        return (
          <div className="flex items-center justify-center gap-4 py-2">
            {block.settings.instagram && <span className="text-xs text-primary">Instagram</span>}
            {block.settings.youtube && <span className="text-xs text-primary">YouTube</span>}
            {block.settings.tiktok && <span className="text-xs text-primary">TikTok</span>}
          </div>
        );
      default:
        return null;
    }
  };

  const renderEditor = () => {
    switch (block.type) {
      case "titulo":
        return (
          <div className="space-y-2">
            <input value={block.content} onChange={e => onUpdate({ ...block, content: e.target.value })}
              placeholder="Texto do título" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
            <div className="flex gap-2">
              <select value={block.settings.size || "24"} onChange={e => onUpdate({ ...block, settings: { ...block.settings, size: e.target.value } })}
                className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground">
                <option value="20">Pequeno</option><option value="24">Médio</option><option value="28">Grande</option><option value="32">Extra grande</option>
              </select>
              <select value={block.settings.align || "left"} onChange={e => onUpdate({ ...block, settings: { ...block.settings, align: e.target.value } })}
                className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground">
                <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
              </select>
            </div>
          </div>
        );
      case "texto":
        return (
          <div className="space-y-2">
            <textarea value={block.content} onChange={e => onUpdate({ ...block, content: e.target.value })}
              rows={4} placeholder="Conteúdo do texto..." className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none" />
            <p className="text-[10px] text-muted-foreground">Use variáveis: {"{{nome}}"}, {"{{email}}"}, {"{{produto}}"}, {"{{link}}"}</p>
          </div>
        );
      case "imagem":
        return (
          <div className="space-y-2">
            <input value={block.settings.url || ""} onChange={e => onUpdate({ ...block, settings: { ...block.settings, url: e.target.value } })}
              placeholder="URL da imagem" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
            <input value={block.settings.alt || ""} onChange={e => onUpdate({ ...block, settings: { ...block.settings, alt: e.target.value } })}
              placeholder="Texto alternativo" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
          </div>
        );
      case "botao":
        return (
          <div className="space-y-2">
            <input value={block.content} onChange={e => onUpdate({ ...block, content: e.target.value })}
              placeholder="Texto do botão" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
            <input value={block.settings.url || ""} onChange={e => onUpdate({ ...block, settings: { ...block.settings, url: e.target.value } })}
              placeholder="URL de destino" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
            <div className="flex gap-2 items-center">
              <label className="text-xs text-muted-foreground">Cor:</label>
              <input type="color" value={block.settings.color || "#58C8F5"}
                onChange={e => onUpdate({ ...block, settings: { ...block.settings, color: e.target.value } })}
                className="w-8 h-8 rounded border border-border cursor-pointer" />
              <select value={block.settings.align || "center"} onChange={e => onUpdate({ ...block, settings: { ...block.settings, align: e.target.value } })}
                className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground">
                <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
              </select>
            </div>
          </div>
        );
      case "social":
        return (
          <div className="space-y-2">
            <input value={block.settings.instagram || ""} onChange={e => onUpdate({ ...block, settings: { ...block.settings, instagram: e.target.value } })}
              placeholder="Link Instagram" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
            <input value={block.settings.youtube || ""} onChange={e => onUpdate({ ...block, settings: { ...block.settings, youtube: e.target.value } })}
              placeholder="Link YouTube" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
            <input value={block.settings.tiktok || ""} onChange={e => onUpdate({ ...block, settings: { ...block.settings, tiktok: e.target.value } })}
              placeholder="Link TikTok" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group relative border border-border rounded-lg hover:border-primary/30 transition-colors">
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => setEditing(!editing)} className="p-1 rounded-full bg-primary text-primary-foreground shadow-lg">
          <Edit2 className="w-3 h-3" />
        </button>
        <button onClick={onDelete} className="p-1 rounded-full bg-destructive text-white shadow-lg">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="p-3">
        {editing ? renderEditor() : renderPreview()}
      </div>
    </div>
  );
};

// ── Editor Panel ──
const EditorPanel = ({ onClose, onSave, campaignId, initialBlocks, campaignName, initialSubject, initialPreheader, initialSenderName, initialSenderEmail, selectedProductId, products }: {
  onClose: () => void;
  onSave: (draft: CampaignDraft, id?: string) => Promise<boolean>;
  campaignId?: string;
  initialBlocks?: EmailBlock[];
  campaignName?: string;
  initialSubject?: string;
  initialPreheader?: string;
  initialSenderName?: string;
  initialSenderEmail?: string;
  selectedProductId?: string;
  products: any[];
}) => {
  const [editorTab, setEditorTab] = useState<"conteudo" | "design" | "preview" | "config">("conteudo");
  const [subject, setSubject] = useState(initialSubject || "");
  const [preheader, setPreheader] = useState(initialPreheader || "");
  const [name, setName] = useState(campaignName || "");
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks || []);
  const [senderName, setSenderName] = useState(initialSenderName || "Queenify");
  const [senderEmail, setSenderEmail] = useState(initialSenderEmail || "");
  const [productTarget, setProductTarget] = useState(selectedProductId || "");
  const [designBg, setDesignBg] = useState("#0b1018");
  const [designText, setDesignText] = useState("#ffffff");
  const [designAccent, setDesignAccent] = useState("#58c8f5");
  const [designFont, setDesignFont] = useState("Inter");
  const [designWidth, setDesignWidth] = useState("600");
  const [showBlockPanel, setShowBlockPanel] = useState(true);
  const [saving, setSaving] = useState(false);

  const addBlock = (type: EmailBlock["type"]) => {
    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      type,
      content: "",
      settings: type === "botao" ? { url: "", color: designAccent, align: "center" } :
        type === "titulo" ? { align: "center", size: "24" } :
          type === "social" ? {} : {},
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, block: EmailBlock) => {
    setBlocks(blocks.map(b => b.id === id ? block : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Dê um nome à campanha"); return; }
    if (!subject.trim()) { toast.error("Defina o assunto do email"); return; }
    setSaving(true);
    const saved = await onSave({ name: name.trim(), subject: subject.trim(), productId: productTarget, preheader, senderName, senderEmail, blocks }, campaignId);
    setSaving(false);
    if (saved) onClose();
  };

  const editorBlocks = [
    { icon: Type, type: "titulo" as const, label: "Título", desc: "Heading H1/H2" },
    { icon: AlignLeft, type: "texto" as const, label: "Texto", desc: "Parágrafo" },
    { icon: Image, type: "imagem" as const, label: "Imagem", desc: "Upload ou URL" },
    { icon: MousePointerClick, type: "botao" as const, label: "Botão CTA", desc: "Call-to-action" },
    { icon: Sparkles, type: "divisor" as const, label: "Divisor", desc: "Separador" },
    { icon: Users, type: "social" as const, label: "Social", desc: "Redes sociais" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button type="button" onClick={onClose} className="text-xs sm:text-sm text-muted-foreground hover:text-foreground flex-shrink-0">← Voltar</button>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da campanha"
            className="text-sm font-semibold text-foreground bg-transparent border-none outline-none min-w-0 w-full max-w-[200px]" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs gradient-gold rounded-lg text-primary-foreground font-semibold flex items-center gap-1 disabled:opacity-50">
            <Save className="w-3 h-3" /> <span>{saving ? "Salvando..." : "Salvar rascunho"}</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 sm:px-4 py-2 border-b border-border overflow-x-auto">
        {(["conteudo", "design", "preview", "config"] as const).map(t => (
          <button key={t} onClick={() => setEditorTab(t)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${editorTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "conteudo" ? "Conteúdo" : t === "design" ? "Design" : t === "preview" ? "Preview" : "Configurações"}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {editorTab === "conteudo" && (
          <>
            {/* Block sidebar */}
            <div className={`${showBlockPanel ? "w-full sm:w-56" : "w-0"} sm:block border-r border-border overflow-y-auto flex-shrink-0 transition-all ${showBlockPanel ? "" : "hidden sm:hidden"}`}>
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Adicionar bloco</p>
                {editorBlocks.map(b => (
                  <button key={b.label} onClick={() => { addBlock(b.type); if (window.innerWidth < 640) setShowBlockPanel(false); }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    <b.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-medium text-foreground">{b.label}</p>
                      <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                    </div>
                  </button>
                ))}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Variáveis</p>
                  {["{{nome}}", "{{email}}", "{{produto}}", "{{link}}"].map(v => (
                    <button key={v} onClick={() => { navigator.clipboard.writeText(v); toast.success("Copiado!"); }}
                      className="block w-full text-left px-2 py-1 text-xs text-primary hover:bg-primary/5 rounded">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main editor area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <div className="max-w-xl mx-auto space-y-4">
                <button onClick={() => setShowBlockPanel(!showBlockPanel)} className="sm:hidden flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground w-full">
                  <Plus className="w-4 h-4 text-primary" /> {showBlockPanel ? "Fechar blocos" : "Adicionar bloco"}
                </button>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Assunto do email *</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: 🔥 Oferta imperdível!"
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Pré-header</label>
                  <input value={preheader} onChange={e => setPreheader(e.target.value)} placeholder="Texto que aparece após o assunto na caixa de entrada"
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-foreground">Envio de campanhas indisponível</p>
                  <p className="mt-1 text-xs text-muted-foreground">Você pode editar e salvar o rascunho. Para enviar e agendar mensagens, a Queenify precisa de um provedor de e-mail configurado.</p>
                </div>

                {blocks.length === 0 ? (
                  <div className="border-2 border-dashed border-border rounded-xl p-8 sm:p-12 text-center">
                    <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Adicione blocos para construir seu email</p>
                    <p className="text-xs text-muted-foreground mt-1">Clique nos blocos à esquerda ou use o botão acima no celular</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blocks.map((block, i) => (
                      <div key={block.id} className="flex gap-2 items-start">
                        <div className="flex flex-col gap-0.5 pt-3">
                          <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">▲</button>
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">▼</button>
                        </div>
                        <div className="flex-1">
                          <BlockRenderer block={block} onUpdate={b => updateBlock(block.id, b)} onDelete={() => deleteBlock(block.id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {editorTab === "design" && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Estilo global do email</h3>
              <div className="glass-card p-4 space-y-4">
                {[
                  { label: "Cor de fundo", value: designBg, set: setDesignBg },
                  { label: "Cor do texto", value: designText, set: setDesignText },
                  { label: "Cor de destaque", value: designAccent, set: setDesignAccent },
                ].map(c => (
                  <div key={c.label} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{c.label}</span>
                    <div className="flex items-center gap-2">
                      <input type="color" value={c.value} onChange={e => c.set(e.target.value)} className="w-6 h-6 rounded border border-border cursor-pointer" />
                      <span className="text-xs text-muted-foreground font-mono">{c.value}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Fonte</span>
                  <select value={designFont} onChange={e => setDesignFont(e.target.value)}
                    className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground">
                    <option>Inter</option><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Helvetica</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Largura do conteúdo</span>
                  <select value={designWidth} onChange={e => setDesignWidth(e.target.value)}
                    className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground">
                    <option value="500">500px</option><option value="600">600px</option><option value="700">700px</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {editorTab === "preview" && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex justify-center">
            <div className="w-full rounded-xl border border-border overflow-hidden" style={{ maxWidth: `${designWidth}px`, background: designBg, color: designText, fontFamily: designFont }}>
              <div className="p-6 sm:p-8 space-y-4">
                {blocks.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm opacity-50">Nenhum conteúdo adicionado</p>
                  </div>
                ) : blocks.map(block => (
                  <div key={block.id}>
                    {block.type === "titulo" && <h2 style={{ fontSize: `${block.settings.size || 24}px`, textAlign: (block.settings.align as any) || "left", color: designText }} className="font-bold">{block.content || "Título"}</h2>}
                    {block.type === "texto" && <p style={{ color: designText, opacity: 0.85, textAlign: (block.settings.align as any) || "left" }} className="text-sm whitespace-pre-line">{block.content || "Texto"}</p>}
                    {block.type === "imagem" && block.settings.url && <img src={block.settings.url} alt={block.settings.alt || ""} className="w-full rounded-lg object-cover max-h-48" />}
                    {block.type === "botao" && <div style={{ textAlign: (block.settings.align as any) || "center" }}><span className="inline-block px-6 py-3 rounded-lg text-sm font-bold text-white" style={{ background: block.settings.color || designAccent }}>{block.content || "Botão"}</span></div>}
                    {block.type === "divisor" && <hr style={{ borderColor: `${designText}22` }} />}
                    {block.type === "social" && <div className="flex items-center justify-center gap-4 py-2"><span style={{ color: designAccent }} className="text-xs">Instagram</span><span style={{ color: designAccent }} className="text-xs">YouTube</span><span style={{ color: designAccent }} className="text-xs">TikTok</span></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {editorTab === "config" && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-md mx-auto space-y-4">
              <div className="glass-card p-4 space-y-3">
                <h4 className="text-xs font-semibold text-foreground">Remetente</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                    <input value={senderName} onChange={e => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                    <input value={senderEmail} onChange={e => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 space-y-3">
                <h4 className="text-xs font-semibold text-foreground">Produto associado ao rascunho</h4>
                <p className="text-[10px] text-muted-foreground">Esse vínculo organiza a campanha. Nenhuma mensagem será enviada enquanto o provedor não estiver configurado.</p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Produto (opcional)</label>
                  <select value={productTarget} onChange={e => setProductTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
                    <option value="">Selecione um produto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EmailMarketing = () => {
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { data: allSales = [] } = useSales();
  const [tab, setTab] = useState<Tab>("campanhas");
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editorProps, setEditorProps] = useState<{ id?: string; blocks?: EmailBlock[]; name?: string; subject?: string; preheader?: string; senderName?: string; senderEmail?: string; productId?: string }>({});
  const [templateCategory, setTemplateCategory] = useState("Todos");
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ["email-campaigns", user?.id],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase.from("email_campaigns").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: "rascunho",
        productId: campaign.product_id || "",
        preheader: campaign.preheader,
        senderName: campaign.sender_name,
        senderEmail: campaign.sender_email,
        blocks: campaign.blocks as unknown as EmailBlock[],
        updatedAt: campaign.updated_at,
      }));
    },
    enabled: !!user,
  });

  // Build product-based buyer lists
  const productBuyerCounts = useMemo(() => {
    const map: Record<string, number> = {};
    const emailSets: Record<string, Set<string>> = {};
    allSales.filter((s: any) => s.status === "completed").forEach((s: any) => {
      if (!emailSets[s.product_id]) emailSets[s.product_id] = new Set();
      emailSets[s.product_id].add(s.buyer_email);
    });
    Object.entries(emailSets).forEach(([pid, emails]) => { map[pid] = emails.size; });
    return map;
  }, [allSales]);

  const totalBuyers = useMemo(() => {
    const emails = new Set<string>();
    allSales.filter((s: any) => s.status === "completed").forEach((s: any) => emails.add(s.buyer_email));
    return emails.size;
  }, [allSales]);

  // Stats from real data
  const stats = useMemo(() => ({
    totalBuyers,
    totalProducts: products.length,
    totalSales: allSales.filter((s: any) => s.status === "completed").length,
  }), [totalBuyers, products, allSales]);

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: "campanhas", label: "Campanhas", icon: Send },
    { key: "templates", label: "Templates", icon: FileText },
    { key: "listas", label: "Segmentação", icon: Filter },
    { key: "automacoes", label: "Automações", icon: Zap },
    { key: "metricas", label: "Métricas", icon: BarChart3 },
  ];

  const openNewCampaign = () => {
    setEditorProps({});
    setShowEditor(true);
  };

  const openEditCampaign = (c: Campaign) => {
    setEditorProps({ id: c.id, name: c.name, subject: c.subject, preheader: c.preheader, senderName: c.senderName, senderEmail: c.senderEmail, productId: c.productId, blocks: c.blocks });
    setShowEditor(true);
  };

  const openFromTemplate = (t: EmailTemplate) => {
    setEditorProps({ blocks: t.blocks, name: `Campanha - ${t.name}` });
    setShowEditor(true);
  };

  const saveCampaign = async (draft: CampaignDraft, id?: string): Promise<boolean> => {
    if (!user) { toast.error("Entre na sua conta para salvar o rascunho."); return false; }
    const values = {
      name: draft.name,
      subject: draft.subject,
      preheader: draft.preheader,
      sender_name: draft.senderName,
      sender_email: draft.senderEmail,
      product_id: draft.productId || null,
      blocks: draft.blocks as unknown as import("@/integrations/supabase/types").Json,
      updated_at: new Date().toISOString(),
    };
    const { error } = id
      ? await supabase.from("email_campaigns").update(values).eq("id", id).eq("user_id", user.id)
      : await supabase.from("email_campaigns").insert({ ...values, user_id: user.id });
    if (error) {
      console.error("Could not save campaign draft", error);
      toast.error("Não foi possível salvar o rascunho. Tente novamente.");
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: ["email-campaigns", user.id] });
    toast.success("Rascunho salvo na sua conta.");
    return true;
  };

  const duplicateCampaign = async (campaign: Campaign) => {
    const { id: _id, updatedAt: _updatedAt, ...draft } = campaign;
    const saved = await saveCampaign({ ...draft, name: `${campaign.name} (cópia)` });
    if (saved) toast.success("Rascunho duplicado.");
  };

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir o rascunho."); return; }
    await queryClient.invalidateQueries({ queryKey: ["email-campaigns", user?.id] });
    toast.success("Rascunho excluído.");
  };

  if (showEditor) return (
    <EditorPanel
      onClose={() => setShowEditor(false)}
      onSave={saveCampaign}
      campaignId={editorProps.id}
      initialBlocks={editorProps.blocks}
      campaignName={editorProps.name}
      initialSubject={editorProps.subject}
      initialPreheader={editorProps.preheader}
      initialSenderName={editorProps.senderName}
      initialSenderEmail={editorProps.senderEmail}
      selectedProductId={editorProps.productId}
      products={products}
    />
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Email Marketing</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Monte campanhas, organize rascunhos e acompanhe a base dos seus produtos.</p>
        </div>
        <button onClick={openNewCampaign} className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4" /> Nova Campanha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Compradores únicos", value: stats.totalBuyers.toLocaleString("pt-BR"), sub: "Base total de emails" },
          { label: "Produtos ativos", value: stats.totalProducts.toString(), sub: "Com compradores" },
          { label: "Vendas concluídas", value: stats.totalSales.toLocaleString("pt-BR"), sub: "Total geral" },
          { label: "Rascunhos salvos", value: campaigns.length.toString(), sub: "Na sua conta" },
        ].map(s => (
          <div key={s.label} className="glass-card p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg sm:text-xl font-display font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Campanhas */}
      {tab === "campanhas" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar campanhas..."
                className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>
          {campaigns.length === 0 && (
            <div className="text-center py-12 glass-card">
              <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Nenhuma campanha criada</p>
              <p className="text-xs text-muted-foreground mt-1">Crie e salve um rascunho. O envio será liberado após a integração de um provedor de e-mail.</p>
              <button onClick={openNewCampaign} className="mt-4 px-4 py-2 gradient-gold rounded-lg text-xs font-semibold text-primary-foreground">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Criar Campanha
              </button>
            </div>
          )}
          {campaigns.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
            <div key={c.id} className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground truncate">{c.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig[c.status].color}`}>{statusConfig[c.status].label}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.subject}</p>
                <p className="mt-1.5 text-[10px] text-muted-foreground">Atualizado em {new Date(c.updatedAt).toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEditCampaign(c)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => duplicateCampaign(c)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title="Duplicar"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteCampaign(c.id)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates */}
      {tab === "templates" && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {["Todos", ...new Set(mockTemplates.map(t => t.category))].map(cat => (
              <button key={cat} onClick={() => setTemplateCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${templateCategory === cat ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground border border-border hover:text-foreground"}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTemplates.filter(t => templateCategory === "Todos" || t.category === templateCategory).map(t => (
              <div key={t.id} className="glass-card p-4 space-y-3 group">
                <div className="h-28 sm:h-32 bg-secondary/50 rounded-lg border border-border flex items-center justify-center">
                  <div className="p-3 text-center">
                    <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">{t.blocks?.length || 0} blocos</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.preview}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditorProps({ blocks: t.blocks, name: t.name }); setShowEditor(true); }}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-secondary">Editar</button>
                  <button onClick={() => openFromTemplate(t)}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg gradient-gold text-primary-foreground">Usar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segmentação */}
      {tab === "listas" && (
        <div className="space-y-4">
          <SegmentationPanel
            allSales={allSales}
            products={products}
          />

          {/* Product list with buyer counts */}
          <div className="space-y-2">
            <h4 className="text-sm font-display font-bold text-foreground">Compradores por Produto</h4>
            {products.map((p: any) => (
              <div key={p.id} className="glass-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <Package className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(productBuyerCounts[p.id] || 0).toLocaleString("pt-BR")} compradores · R$ {Number(p.price).toFixed(2)}
                  </p>
                </div>
                <button onClick={() => { setEditorProps({ productId: p.id }); setShowEditor(true); }}
                  className="text-xs px-3 py-1.5 gradient-gold rounded-lg text-primary-foreground font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Criar rascunho
                </button>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum produto cadastrado.</div>
            )}
          </div>

        </div>
      )}

      {/* Automações */}
      {tab === "automacoes" && (
        <AutomationSequences />
      )}

      {/* Métricas */}
      {tab === "metricas" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Compradores por produto</h3>
              <div className="space-y-2">
                {products.slice(0, 5).map((p: any) => {
                  const count = productBuyerCounts[p.id] || 0;
                  const maxCount = Math.max(...Object.values(productBuyerCounts), 1);
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground font-medium truncate">{p.name}</p>
                        <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                          <div className="bg-primary rounded-full h-1.5" style={{ width: `${(count / maxCount) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-primary font-semibold flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="glass-card p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Resumo</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-xs text-foreground">Base total de compradores</span></div>
                  <span className="text-xs font-semibold text-foreground">{totalBuyers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Package className="w-4 h-4 text-primary" /><span className="text-xs text-foreground">Produtos com compradores</span></div>
                  <span className="text-xs font-semibold text-foreground">{Object.keys(productBuyerCounts).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><span className="text-xs text-foreground">Rascunhos salvos</span></div>
                  <span className="text-xs font-semibold text-foreground">{campaigns.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmailMarketing;
