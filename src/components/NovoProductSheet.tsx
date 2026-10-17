import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreditCard, RefreshCw, Crown, Palette, MapPin, ArrowLeft, Upload, X } from "lucide-react";
import { useCreateProduct } from "@/hooks/useSupabaseData";
import { useImageUpload } from "@/hooks/useImageUpload";

interface NovoProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "type" | "delivery" | "details";
type PaymentType = "unico" | "assinatura" | null;
type DeliveryType = "membros" | "personalizada" | "presencial" | null;

const NovoProductSheet = ({ open, onOpenChange }: NovoProductSheetProps) => {
  const isMobile = useIsMobile();
  const createProduct = useCreateProduct();
  const { upload, uploading } = useImageUpload("product-images");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("type");
  const [paymentType, setPaymentType] = useState<PaymentType>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [paginaVendas, setPaginaVendas] = useState("");
  const [preco, setPreco] = useState("");
  const [comissaoAtiva, setComissaoAtiva] = useState(false);
  const [comissao, setComissao] = useState(30);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState("mensal");
  const [trialDays, setTrialDays] = useState(0);

  const reset = () => {
    setStep("type");
    setPaymentType(null);
    setDeliveryType(null);
    setNome("");
    setDescricao("");
    setPaginaVendas("");
    setPreco("");
    setComissaoAtiva(false);
    setComissao(30);
    setImageUrl(null);
    setImagePreview(null);
    setBillingInterval("mensal");
    setTrialDays(0);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleContinue = () => {
    if (step === "type" && paymentType) setStep("delivery");
    else if (step === "delivery" && deliveryType) setStep("details");
  };

  const handleBack = () => {
    if (step === "delivery") setStep("type");
    else if (step === "details") setStep("delivery");
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    const url = await upload(file);
    if (url) setImageUrl(url);
    else setImagePreview(null);
  };

  const handleCreate = async () => {
    if (!nome || descricao.length < 100 || !preco) return;
    const precoNum = parseFloat(preco.replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(precoNum) || precoNum < 10) return;

    await createProduct.mutateAsync({
      name: nome,
      description: descricao,
      price: precoNum,
      delivery_type: deliveryType || "queenify",
      commission_rate: comissaoAtiva ? comissao : 0,
      image_url: imageUrl,
      billing_type: paymentType || "unico",
      billing_interval: paymentType === "assinatura" ? billingInterval : null,
      trial_days: paymentType === "assinatura" ? trialDays : 0,
    });
    handleClose(false);
  };

  const content = (
    <div className="flex flex-col gap-6 p-2">
      {step !== "type" && (
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      )}

      {step === "type" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Selecione o tipo de pagamento</p>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentType("unico")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                paymentType === "unico" ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/50"
              }`}
            >
              <CreditCard className={`w-5 h-5 ${paymentType === "unico" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Pagamento Único</p>
                <p className="text-xs text-muted-foreground">Cobrança única pelo produto</p>
              </div>
            </button>
            <button
              onClick={() => setPaymentType("assinatura")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                paymentType === "assinatura" ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/50"
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${paymentType === "assinatura" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Assinatura</p>
                <p className="text-xs text-muted-foreground">Cobrança recorrente</p>
              </div>
            </button>
          </div>
          <button onClick={handleContinue} disabled={!paymentType} className="w-full py-3 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity">
            Continuar
          </button>
        </div>
      )}

      {step === "delivery" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Entrega do conteúdo</p>
          <div className="space-y-3">
            {[
              { type: "membros" as const, icon: Crown, title: "Área de Membros Queenify", desc: "Área de membros padrão da plataforma" },
              { type: "personalizada" as const, icon: Palette, title: "Área de Membros Personalizada", desc: "Personalize sua área de membros" },
              { type: "presencial" as const, icon: MapPin, title: "Evento Presencial", desc: "Evento físico ou presencial" },
            ].map(({ type, icon: Icon, title, desc }) => (
              <button
                key={type}
                onClick={() => setDeliveryType(type)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  deliveryType === type ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/50"
                }`}
              >
                <Icon className={`w-5 h-5 ${deliveryType === type ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={handleContinue} disabled={!deliveryType} className="w-full py-3 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity">
            Continuar
          </button>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Detalhes do produto</p>
          <div className="space-y-3">
            {/* Image upload */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Imagem do Produto</label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {imagePreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => { setImagePreview(null); setImageUrl(null); }} className="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  {uploading && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-28 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Clique para enviar</span>
                </button>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome do Produto</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Ex: Curso de Marketing Digital" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Explique o seu produto em pelo menos 100 caracteres" />
              <p className={`text-[10px] mt-1 ${descricao.length >= 100 ? "text-success" : "text-muted-foreground"}`}>{descricao.length}/100 caracteres mínimos</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Página de Vendas <span className="text-muted-foreground/60">(opcional)</span></label>
              <input value={paginaVendas} onChange={(e) => setPaginaVendas(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Ex: https://example.com" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Deixe em branco se ainda não tiver uma.</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{paymentType === "assinatura" ? "Preço da Assinatura" : "Preço do Produto"}</label>
              <input value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="R$ 0,00" />
              <div className="mt-1 space-y-0.5">
                <p className="text-[10px] text-primary font-medium">⚠️ Valor mínimo: R$ 10,00</p>
                <p className="text-[10px] text-amber-400">⚠️ Produtos acima de R$ 900,00 entram em análise e não serão publicados até aprovação.</p>
              </div>
            </div>

            {paymentType === "assinatura" && (
              <div className="border border-border rounded-lg p-3 space-y-3">
                <p className="text-sm text-foreground font-medium flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" /> Configurações de Recorrência</p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Intervalo de cobrança</label>
                  <select value={billingInterval} onChange={e => setBillingInterval(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground">
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Período de teste grátis (dias)</label>
                  <input type="number" min={0} max={90} value={trialDays} onChange={e => setTrialDays(Number(e.target.value))} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" placeholder="0" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">0 = sem período de teste</p>
                </div>
              </div>
            )}

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
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Mínimo: 30%</span><span>Máximo: 85%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!nome || descricao.length < 100 || !preco || (() => { const p = parseFloat(preco.replace(/[^\d,.-]/g, "").replace(",", ".")); return isNaN(p) || p < 10; })() || createProduct.isPending || uploading}
            className="w-full py-3 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
          >
            {createProduct.isPending ? "Criando..." : "Criar Produto"}
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader><DrawerTitle className="font-display">Novo Produto</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-6 overflow-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
        <SheetHeader><SheetTitle className="font-display">Novo Produto</SheetTitle></SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
};

export default NovoProductSheet;
