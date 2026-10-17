import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Upload, X } from "lucide-react";
import { useUpdateProduct, useDeleteProduct, Product } from "@/hooks/useSupabaseData";
import { useImageUpload } from "@/hooks/useImageUpload";
import OrderBumpsSection from "@/components/OrderBumpsSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const PixelSection = ({ trackingPixel, setTrackingPixel }: { trackingPixel: string; setTrackingPixel: (v: string) => void }) => {
  const { user } = useAuth();
  const { data: userPixel } = useQuery({
    queryKey: ["user_pixel", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_pixels").select("pixel_id").eq("user_id", user!.id).maybeSingle();
      if (!data) {
        // Auto-create pixel for this user
        const { data: created } = await supabase.from("user_pixels").insert({ user_id: user!.id, pixel_id: "" }).select("pixel_id").single();
        return created?.pixel_id || null;
      }
      return data.pixel_id;
    },
    enabled: !!user,
  });

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      <p className="text-sm text-foreground font-medium flex items-center gap-2">📊 Pixel de Rastreamento</p>
      <p className="text-[10px] text-muted-foreground">
        Seu Pixel Queenify único é gerado automaticamente. Cole-o neste produto para conectar às suas campanhas.
      </p>
      
      {userPixel && (
        <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Seu Pixel Queenify:</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-primary font-bold">{userPixel}</code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(userPixel); }}
              className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Pixel vinculado a este produto</label>
        <input
          value={trackingPixel}
          onChange={(e) => {
            const numOnly = e.target.value.replace(/\D/g, "").slice(0, 12);
            setTrackingPixel(numOnly);
          }}
          placeholder="Cole seu pixel (apenas números)"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground font-mono"
        />
      </div>

      {trackingPixel && trackingPixel === userPixel && (
        <div className="p-2 rounded-lg bg-success/10 border border-success/20">
          <p className="text-[10px] text-success flex items-center gap-1">✅ Pixel vinculado — este produto será rastreado nas suas campanhas de anúncios</p>
        </div>
      )}
      {trackingPixel && trackingPixel !== userPixel && (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-[10px] text-destructive flex items-center gap-1">⚠️ Este pixel não corresponde ao seu. Verifique o número.</p>
        </div>
      )}
    </div>
  );
};

interface EditProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: Product | null;
}

const nichos = ["Marketing", "Negócios", "Saúde", "Educação", "Tecnologia", "Finanças", "Entretenimento", "Lifestyle", "Relacionamentos", "Espiritualidade", "Direito", "Culinária", "Música", "Fotografia", "Moda", "Pets", "Esportes", "Games"];
const subnichos: Record<string, string[]> = {
  Marketing: ["Tráfego Pago", "Social Media", "Copywriting", "SEO", "Email Marketing", "Branding", "Growth Hacking", "Marketing de Conteúdo", "Influência Digital"],
  Negócios: ["E-commerce", "Dropshipping", "Freelancing", "Startups", "PLR", "Infoprodutos", "Consultoria", "Franquias", "Importação"],
  Saúde: ["Nutrição", "Fitness", "Bem-estar", "Meditação", "Yoga", "Emagrecimento", "Saúde Mental", "Fisioterapia", "Estética"],
  Educação: ["Idiomas", "Concursos", "Vestibular", "Cursos Livres", "Reforço Escolar", "ENEM", "Pós-graduação", "Alfabetização"],
  Tecnologia: ["Programação", "Design", "No-code", "IA", "Automação", "Cybersegurança", "Cloud", "Mobile", "Data Science"],
  Finanças: ["Investimentos", "Renda Extra", "Criptomoedas", "Trading", "Day Trade", "Fundos Imobiliários", "Planejamento Financeiro", "Contabilidade"],
  Entretenimento: ["Humor", "Podcast", "YouTube", "TikTok", "Streaming", "Eventos"],
  Lifestyle: ["Minimalismo", "Produtividade", "Organização", "Viagens", "Decoração"],
  Relacionamentos: ["Desenvolvimento Pessoal", "Coaching", "Comunicação", "Liderança", "Autoestima"],
  Espiritualidade: ["Tarot", "Astrologia", "Mindfulness", "Reiki", "Numerologia"],
  Direito: ["Trabalhista", "Tributário", "Civil", "Penal", "Digital", "Empresarial"],
  Culinária: ["Confeitaria", "Gastronomia Fit", "Vegano", "Churrasco", "Panificação"],
  Música: ["Violão", "Piano", "Canto", "Produção Musical", "DJ", "Teoria Musical"],
  Fotografia: ["Retratos", "Paisagens", "Edição", "Fotografia de Produto", "Drone"],
  Moda: ["Consultoria de Imagem", "Costura", "Design de Moda", "Personal Stylist"],
  Pets: ["Adestramento", "Petshop", "Nutrição Animal", "Comportamento Animal"],
  Esportes: ["Futebol", "Basquete", "Lutas", "Corrida", "Natação", "Surf"],
  Games: ["Desenvolvimento de Jogos", "eSports", "Streaming de Games", "Game Design"],
};
const idiomas = ["Português", "Inglês", "Espanhol"];
const garantiaOptions = [7, 8, 9, 10, 11, 12, 13, 14, 15];

const EditProductSheet = ({ open, onOpenChange, produto }: EditProductSheetProps) => {
  const isMobile = useIsMobile();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { upload, uploading } = useImageUpload("product-images");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [nicho, setNicho] = useState("");
  const [subnicho, setSubnicho] = useState("");
  const [idioma, setIdioma] = useState("Português");
  const [preco, setPreco] = useState("");
  const [garantia, setGarantia] = useState(7);
  const [comissaoAtiva, setComissaoAtiva] = useState(true);
  const [comissao, setComissao] = useState(30);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [trackingPixel, setTrackingPixel] = useState("");

  useEffect(() => {
    if (produto) {
      setNome(produto.name);
      setDescricao(produto.description || "");
      setNicho(produto.niche || "");
      setSubnicho(produto.sub_niche || "");
      setIdioma(produto.language || "Português");
      setPreco(String(produto.price));
      setGarantia(produto.guarantee_days || 7);
      setComissaoAtiva((produto.commission_rate || 0) > 0);
      setComissao(produto.commission_rate || 30);
      setImageUrl(produto.image_url || null);
      setTrackingPixel((produto as any).tracking_pixel || "");
    }
  }, [produto]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setImageUrl(url);
  };

  const handleSave = async () => {
    if (!produto) return;
    const precoNum = parseFloat(preco.replace(/[^\d,.-]/g, "").replace(",", "."));
    await updateProduct.mutateAsync({
      id: produto.id,
      name: nome,
      description: descricao,
      category: nicho,
      niche: nicho,
      sub_niche: subnicho,
      language: idioma,
      price: isNaN(precoNum) ? produto.price : precoNum,
      guarantee_days: garantia,
      commission_rate: comissaoAtiva ? comissao : 0,
      image_url: imageUrl,
      tracking_pixel: trackingPixel || null,
    } as any);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!produto) return;
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    await deleteProduct.mutateAsync(produto.id);
    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col gap-5 p-2">
      <p className="text-sm text-muted-foreground">Editar informações do produto</p>

      {/* Image */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Imagem do Produto</label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        {imageUrl ? (
          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setImageUrl(null)} className="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded text-[10px] text-foreground">Trocar</button>
            {uploading && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Enviar imagem</span>
          </button>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Nome do Produto</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none" placeholder="Mínimo 100 caracteres" />
        <p className={`text-[10px] mt-1 ${descricao.length >= 100 ? "text-success" : "text-muted-foreground"}`}>{descricao.length}/100</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nicho</label>
          <select value={nicho} onChange={(e) => { setNicho(e.target.value); setSubnicho(""); }} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <option value="">Selecione</option>
            {nichos.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Subnicho</label>
          <div className="space-y-2">
            <select value={subnichos[nicho]?.includes(subnicho) ? subnicho : "__custom__"} onChange={(e) => { if (e.target.value !== "__custom__") setSubnicho(e.target.value); else setSubnicho(""); }} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" disabled={!nicho}>
              <option value="">Selecione</option>
              {(subnichos[nicho] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="__custom__">✏️ Digitar manualmente</option>
            </select>
            {(nicho && (!subnichos[nicho]?.includes(subnicho) || subnicho === "")) && (
              <input value={subnicho} onChange={(e) => setSubnicho(e.target.value)} placeholder="Digite o subnicho" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Idioma principal</label>
        <select value={idioma} onChange={(e) => setIdioma(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          {idiomas.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Preço</label>
        <input value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="R$ 0,00" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Garantia</label>
        <select value={garantia} onChange={(e) => setGarantia(Number(e.target.value))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          {garantiaOptions.map((g) => <option key={g} value={g}>{g} dias</option>)}
        </select>
      </div>

      <div className="border border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground font-medium">Programa de afiliados</p>
            <p className="text-[10px] text-muted-foreground">Permitir afiliados neste produto</p>
          </div>
          <button onClick={() => setComissaoAtiva(!comissaoAtiva)} className={`w-10 h-6 rounded-full relative transition-colors ${comissaoAtiva ? "bg-primary" : "bg-secondary"}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-all ${comissaoAtiva ? "right-1" : "left-1"}`} />
          </button>
        </div>
        {comissaoAtiva && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Comissão do afiliado: {comissao}%</label>
            <input type="range" min={30} max={85} value={comissao} onChange={(e) => setComissao(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>Mínimo: 30%</span><span>Máximo: 85%</span></div>
          </div>
        )}
      </div>

      {produto && <OrderBumpsSection productId={produto.id} />}

      {/* Tracking Pixel - Pixel & Tracking Integration */}
      <PixelSection trackingPixel={trackingPixel} setTrackingPixel={setTrackingPixel} />

      <button
        onClick={handleSave}
        disabled={updateProduct.isPending || uploading}
        className="w-full py-3 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {updateProduct.isPending ? "Salvando..." : "Salvar Alterações"}
      </button>

      <button
        onClick={handleDelete}
        disabled={deleteProduct.isPending}
        className="w-full py-2.5 rounded-lg border border-destructive text-destructive text-sm hover:bg-destructive/10 transition-colors disabled:opacity-40"
      >
        {deleteProduct.isPending ? "Excluindo..." : "Excluir Produto"}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader><DrawerTitle className="font-display">Editar Produto</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-6 overflow-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
        <SheetHeader><SheetTitle className="font-display">Editar Produto</SheetTitle></SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
};

export default EditProductSheet;
