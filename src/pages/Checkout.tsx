import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView } from "@/hooks/usePageTracking";
import { useUtmCapture, getStoredUtms } from "@/hooks/useUtmCapture";
import { CreditCard, QrCode, FileText, ShieldCheck, Lock, ChevronLeft, Check, Plus, Package, Star, RefreshCw, Zap } from "lucide-react";
import queenifyBee from "@/assets/queenify-bee.png";
import { toast } from "sonner";
import { createCardToken, loadMercadoPago } from "@/lib/mercadopago";

interface OrderBumpItem {
  id: string;
  bump_product_id: string;
  discount_percent: number;
  name: string;
  price: number;
  discountedPrice: number;
}

type PaymentMethod = "pix" | "cartao" | "boleto";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  user_id: string;
  guarantee_days: number | null;
}

interface BuyerForm {
  email: string;
  name: string;
  cpf: string;
}

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatPrice = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CheckoutCustom {
  theme: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  banner_url: string | null;
  show_guarantee_badge: boolean;
  show_security_badge: boolean;
  show_testimonials: boolean;
  custom_cta_text: string;
  custom_header_text: string | null;
  urgency_enabled: boolean;
  urgency_text: string;
  countdown_enabled: boolean;
  countdown_minutes: number;
}

const THEME_STYLES: Record<string, { bg: string; fg: string; card: string; border: string; muted: string }> = {
  dark: { bg: "#0a0a0a", fg: "#ffffff", card: "#141414", border: "#2a2a2a", muted: "#888888" },
  light: { bg: "#ffffff", fg: "#1a1a1a", card: "#f8f8f8", border: "#e0e0e0", muted: "#666666" },
  minimal: { bg: "#f5f5f5", fg: "#333333", card: "#ffffff", border: "#ddd", muted: "#777" },
  modern: { bg: "#1a1a2e", fg: "#eaeaea", card: "#222244", border: "#333366", muted: "#9999bb" },
};

const mockTestimonials = [
  { name: "Mariana S.", photo: null, rating: 5, text: "Produto incrível! Mudou completamente minha forma de trabalhar. Super recomendo!" },
  { name: "João P.", photo: null, rating: 5, text: "Conteúdo de qualidade excepcional. Valeu cada centavo investido." },
  { name: "Ana Clara R.", photo: null, rating: 4, text: "Muito bom! As aulas são práticas e diretas ao ponto. Já estou tendo resultados." },
];

const Checkout = () => {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  useUtmCapture();
  const affiliateRef = searchParams.get("ref") || null;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [form, setForm] = useState<BuyerForm>({ email: "", name: "", cpf: "" });
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvv: "", installments: "1", holderName: "" });
  const [errors, setErrors] = useState<Partial<BuyerForm & { card: string }>>({});
  const [orderBumps, setOrderBumps] = useState<OrderBumpItem[]>([]);
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<CheckoutCustom | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [oneClickAvailable, setOneClickAvailable] = useState(false);
  const paymentAttemptKey = useRef<string | null>(null);
  const [oneClickData, setOneClickData] = useState<{ email: string; name: string } | null>(null);
  const [pixResult, setPixResult] = useState<{ qr_code: string; qr_code_base64: string; ticket_url: string } | null>(null);
  const [boletoResult, setBoletoResult] = useState<{ barcode?: string; pdf_url?: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!productId) return;
      const { data } = await supabase
        .from("products")
        .select("id, name, price, description, image_url, user_id, guarantee_days, commission_rate")
        .eq("id", productId)
        .eq("is_active", true)
        .single();
      setProduct(data);

      if (data) {
        // Track page view for analytics
        trackPageView(`/checkout/${productId}`, data.user_id, data.id);
        // Load checkout customization
        const { data: cs } = await supabase
          .from("checkout_settings")
          .select("*")
          .eq("product_id", data.id)
          .maybeSingle();
        if (cs) {
          setCustom(cs as any);
          if (cs.countdown_enabled && cs.countdown_minutes > 0) {
            setCountdown(cs.countdown_minutes * 60);
          }
        }

        // Load order bumps
        const { data: bumps } = await supabase
          .from("order_bumps")
          .select("id, bump_product_id, discount_percent")
          .eq("product_id", data.id)
          .eq("is_active", true);
        if (bumps && bumps.length > 0) {
          const bumpIds = bumps.map(b => b.bump_product_id);
          const { data: bumpProducts } = await supabase
            .from("products")
            .select("id, name, price")
            .in("id", bumpIds)
            .eq("is_active", true);
          const enriched: OrderBumpItem[] = bumps.map(b => {
            const p = (bumpProducts || []).find(pr => pr.id === b.bump_product_id);
            const price = p?.price || 0;
            return {
              id: b.id,
              bump_product_id: b.bump_product_id,
              discount_percent: b.discount_percent || 0,
              name: p?.name || "",
              price,
              discountedPrice: price * (1 - (b.discount_percent || 0) / 100),
            };
          }).filter(b => b.name);
          setOrderBumps(enriched);
        }
      }
      // Check for 1-Click Buy data in localStorage
      const savedBuyer = sessionStorage.getItem("queenify_buyer");
      if (savedBuyer) {
        try {
          const parsed = JSON.parse(savedBuyer);
          if (typeof parsed?.email === "string" && typeof parsed?.name === "string") {
            setOneClickAvailable(true);
            setOneClickData({ email: parsed.email.slice(0, 254), name: parsed.name.slice(0, 120) });
          }
        } catch { sessionStorage.removeItem("queenify_buyer"); }
      }
      // Remove the previous version's persistent storage, which also kept CPF.
      try { localStorage.removeItem("queenify_buyer"); } catch { /* browser storage may be disabled */ }

      setLoading(false);
    };
    load();
    // Pré-carrega o SDK do Mercado Pago para tokenização de cartão
    loadMercadoPago().catch((e) => console.warn("MP SDK preload:", e));
  }, [productId]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown > 0]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const theme = custom ? (THEME_STYLES[custom.theme] || THEME_STYLES.dark) : null;

  const validateCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let rem = (sum * 10) % 11;
    if (rem === 10) rem = 0;
    if (rem !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    rem = (sum * 10) % 11;
    if (rem === 10) rem = 0;
    return rem === parseInt(digits[10]);
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Coloque um email válido";
    }
    if (!form.name || form.name.trim().length < 3) e.name = "Nome completo obrigatório";
    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11 || !validateCPF(form.cpf)) {
      e.cpf = "Coloque um CPF válido";
    }
    if (paymentMethod === "cartao") {
      if (cardData.number.replace(/\s/g, "").length < 13) e.card = "Número de cartão inválido";
      else if (!cardData.holderName || cardData.holderName.trim().length < 3) e.card = "Nome impresso no cartão obrigatório";
      else if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) e.card = "Validade inválida (MM/AA)";
      else if (cardData.cvv.length < 3) e.card = "CVV inválido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (isRetry = false) => {
    if (!validate() || !product) return;
    setSubmitting(true);
    if (isRetry) setRetrying(true);

    try {
      // Verifica compra duplicada
      const { data: existingSale } = await supabase
        .from("sales")
        .select("id")
        .eq("product_id", product.id)
        .eq("buyer_email", form.email.trim().toLowerCase())
        .eq("status", "completed")
        .maybeSingle();
      if (existingSale) {
        toast.error("Você já adquiriu este produto com este email.");
        setSubmitting(false);
        return;
      }

      const methodMap: Record<PaymentMethod, string> = {
        pix: "pix",
        cartao: "credit_card",
        boleto: "boleto",
      };

      const utms = getStoredUtms() || {};
      const payload: Record<string, unknown> = {
        product_id: product.id,
        buyer_email: form.email.trim().toLowerCase(),
        buyer_name: form.name.trim(),
        buyer_doc: form.cpf,
        payment_method: methodMap[paymentMethod],
        amount: product.price,
        idempotency_key: paymentAttemptKey.current || crypto.randomUUID(),
        utms,
      };
      paymentAttemptKey.current = payload.idempotency_key as string;

      if (paymentMethod === "cartao") {
        try {
          const [mm, yy] = cardData.expiry.split("/");
          const tokenRes = await createCardToken({
            cardNumber: cardData.number.replace(/\s/g, ""),
            cardholderName: cardData.holderName.trim(),
            cardExpirationMonth: mm,
            cardExpirationYear: yy,
            securityCode: cardData.cvv,
            identificationType: "CPF",
            identificationNumber: form.cpf.replace(/\D/g, ""),
          });
          payload.card_token = tokenRes.id;
          payload.payment_method_id = tokenRes.payment_method_id;
          if (tokenRes.issuer_id) payload.issuer_id = tokenRes.issuer_id;
          payload.installments = parseInt(cardData.installments, 10) || 1;
          setCardData((current) => ({ ...current, number: "", expiry: "", cvv: "", holderName: "" }));
        } catch (err) {
          console.error("Mercado Pago card tokenization failed");
          toast.error(err instanceof Error ? err.message : "Falha ao validar cartão");
          setSubmitting(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("mp-create-payment", {
        body: payload,
      });

      if (error || !(data as any)?.success) {
        const msg = (data as any)?.error || error?.message || "Erro ao processar pagamento";
        if ((data as any)?.retryable === false) paymentAttemptKey.current = null;
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      sessionStorage.setItem("queenify_buyer", JSON.stringify({
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
      }));

      if ((data as any).pix) setPixResult((data as any).pix);
      if ((data as any).boleto) setBoletoResult((data as any).boleto);
      setSuccess(true);
    } catch (err) {
      console.error("checkout error:", err);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setSubmitting(false);
      setRetrying(false);
      setRetryCount(0);
    }
  };

  const handleOneClickBuy = () => {
    if (oneClickData) {
      setForm({ email: oneClickData.email, name: oneClickData.name, cpf: "" });
      toast.success("Dados preenchidos! Confirme o pagamento.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg text-foreground font-semibold">Produto não encontrado</p>
        <Link to="/" className="text-sm text-primary hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            {paymentMethod === "pix" ? "PIX gerado com sucesso!" : paymentMethod === "boleto" ? "Boleto gerado!" : "Pagamento aprovado!"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {paymentMethod === "pix"
              ? "Escaneie o QR Code abaixo ou copie o código PIX para concluir o pagamento."
              : paymentMethod === "boleto"
              ? "Seu boleto foi gerado. Efetue o pagamento até a data de vencimento."
              : `Sua compra de "${product.name}" foi confirmada! Verifique seu email (${form.email}) para acessar o produto.`}
          </p>
          {paymentMethod === "pix" && pixResult?.qr_code_base64 && (
            <div className="p-4 bg-white rounded-xl mx-auto w-fit">
              <img
                src={`data:image/png;base64,${pixResult.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            </div>
          )}
          {paymentMethod === "pix" && pixResult?.qr_code && (
            <button
              onClick={() => { navigator.clipboard.writeText(pixResult.qr_code); toast.success("Código PIX copiado!"); }}
              className="w-full py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors break-all"
            >
              Copiar código PIX
            </button>
          )}
          {paymentMethod === "boleto" && boletoResult?.pdf_url && (
            <a
              href={boletoResult.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Abrir boleto (PDF)
            </a>
          )}
          {paymentMethod === "boleto" && boletoResult?.barcode && (
            <button
              onClick={() => { navigator.clipboard.writeText(boletoResult.barcode!); toast.success("Código de barras copiado!"); }}
              className="w-full py-2.5 rounded-lg bg-secondary text-foreground text-xs font-mono hover:bg-secondary/80 transition-colors break-all"
            >
              {boletoResult.barcode}
            </button>
          )}
          <Link to="/" className="block text-sm text-primary hover:underline mt-4">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    { id: "pix" as const, label: "PIX", icon: QrCode, desc: "Aprovação instantânea" },
    { id: "cartao" as const, label: "Cartão de Crédito", icon: CreditCard, desc: "Até 12x" },
    { id: "boleto" as const, label: "Boleto Bancário", icon: FileText, desc: "Vence em 3 dias" },
  ];

  return (
    <div className="min-h-screen" style={theme ? { background: theme.bg, color: theme.fg } : undefined}>
      {/* Urgency bar */}
      {custom?.urgency_enabled && (
        <div className="py-2 text-center text-xs font-bold" style={{ background: `${custom.primary_color}20`, color: custom.primary_color }}>
          ⚡ {custom.urgency_text}
          {custom.countdown_enabled && countdown > 0 && (
            <span className="ml-2 font-mono">⏱ {formatCountdown(countdown)}</span>
          )}
        </div>
      )}

      {/* Banner */}
      {custom?.banner_url && (
        <img src={custom.banner_url} alt="" className="w-full h-32 sm:h-48 object-cover" />
      )}

      {/* Header */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-md" style={theme ? { borderColor: theme.border, background: `${theme.bg}ee` } : undefined}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {custom?.logo_url ? (
              <img src={custom.logo_url} alt="" className="h-7 object-contain" />
            ) : (
              <>
                <img src={queenifyBee} alt="Queenify" className="w-7 h-7" />
                <span className="font-display text-lg font-bold" style={theme ? { color: theme.fg } : undefined}>Queenify</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={theme ? { color: theme.muted } : undefined}>
            <Lock className="w-3.5 h-3.5" />
            <span>Pagamento seguro</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {custom?.custom_header_text && (
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-4" style={theme ? { color: theme.fg } : undefined}>
            {custom.custom_header_text}
          </h1>
        )}
        <Link to="/" className="inline-flex items-center gap-1 text-sm mb-6" style={theme ? { color: theme.muted } : undefined}>
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form – left side */}
          <div className="lg:col-span-3 space-y-6">
            {/* 1-Click Buy */}
            {oneClickAvailable && oneClickData && (
              <div className="glass-card p-4 border-primary/30 border">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Compra rápida</p>
                    <p className="text-xs text-muted-foreground">Comprar como {oneClickData.name} ({oneClickData.email})</p>
                  </div>
                  <button onClick={handleOneClickBuy}
                    className="px-4 py-2 gradient-gold rounded-lg text-xs font-semibold text-primary-foreground">
                    <Zap className="w-3.5 h-3.5 inline mr-1" /> 1-Click Buy
                  </button>
                </div>
              </div>
            )}

            {/* Retry indicator */}
            {retrying && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                <p className="text-xs text-amber-400">Smart Retry: tentativa {retryCount + 1} de 3...</p>
              </div>
            )}

            {/* Buyer info */}
            <div className="glass-card p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-display font-bold text-foreground">Dados do comprador</h2>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome completo *</label>
                <input
                  type="text"
                  placeholder="Maria Silva Santos"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">CPF *</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
              </div>
            </div>

            {/* Payment method */}
            <div className="glass-card p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-display font-bold text-foreground">Forma de pagamento</h2>

              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === pm.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-secondary hover:border-primary/20"
                    }`}
                  >
                    <pm.icon className={`w-5 h-5 mx-auto mb-1.5 ${paymentMethod === pm.id ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium text-foreground">{pm.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{pm.desc}</p>
                  </button>
                ))}
              </div>

              {/* Card fields */}
              {paymentMethod === "cartao" && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Número do cartão</label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cardData.number}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setCardData({ ...cardData, number: v.replace(/(\d{4})/g, "$1 ").trim() });
                      }}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nome impresso no cartão</label>
                    <input
                      type="text"
                      placeholder="MARIA S SANTOS"
                      value={cardData.holderName}
                      onChange={(e) => setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Validade</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardData.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                          setCardData({ ...cardData, expiry: v });
                        }}
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">CVV</label>
                      <input
                        type="text"
                        placeholder="000"
                        maxLength={4}
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Parcelas</label>
                    <select
                      value={cardData.installments}
                      onChange={(e) => setCardData({ ...cardData, installments: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}x de {formatPrice(product.price / n)}
                          {n === 1 ? " (à vista)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.card && <p className="text-xs text-destructive">{errors.card}</p>}
                </div>
              )}

              {paymentMethod === "pix" && (
                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-center">
                  <p className="text-xs text-green-400">⚡ PIX tem aprovação instantânea e desconto automático</p>
                </div>
              )}

              {paymentMethod === "boleto" && (
                <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-center">
                  <p className="text-xs text-yellow-400">📋 O boleto será gerado após a confirmação e vence em 3 dias úteis</p>
                </div>
              )}
            </div>

            {/* Order Bumps */}
            {orderBumps.length > 0 && (
              <div className="glass-card p-5 sm:p-6 space-y-3">
                <h2 className="text-base font-display font-bold text-foreground">🎁 Aproveite e adicione</h2>
                {orderBumps.map(bump => {
                  const isSelected = selectedBumps.has(bump.id);
                  return (
                    <button
                      key={bump.id}
                      onClick={() => {
                        const next = new Set(selectedBumps);
                        isSelected ? next.delete(bump.id) : next.add(bump.id);
                        setSelectedBumps(next);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/20"}`}
                    >
                      <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <Package className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{bump.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {bump.discount_percent > 0 && (
                            <span className="text-[10px] text-muted-foreground line-through">{formatPrice(bump.price)}</span>
                          )}
                          <span className="text-xs font-bold text-primary">{formatPrice(bump.discountedPrice)}</span>
                          {bump.discount_percent > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">-{bump.discount_percent}%</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              style={custom ? { background: custom.primary_color, color: "#fff", boxShadow: `0 10px 25px -5px ${custom.primary_color}40` } : undefined}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {custom?.custom_cta_text || (paymentMethod === "pix" ? "Gerar PIX" : paymentMethod === "boleto" ? "Gerar Boleto" : "Finalizar Compra")}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Criptografia SSL</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Compra segura</span>
            </div>
          </div>

          {/* Order summary – right side */}
          <div className="lg:col-span-2">
            <div className="glass-card p-5 sm:p-6 space-y-4 lg:sticky lg:top-20">
              <h2 className="text-base font-display font-bold text-foreground">Resumo do pedido</h2>

              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-36 object-cover rounded-xl" />
              ) : (
                <div className="w-full h-36 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="text-4xl">📦</span>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-foreground">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{product.description}</p>
                )}
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(product.price)}</span>
                </div>
                {orderBumps.filter(b => selectedBumps.has(b.id)).map(b => (
                  <div key={b.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">+ {b.name}</span>
                    <span className="text-foreground">{formatPrice(b.discountedPrice)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/50">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary text-lg">
                    {formatPrice(product.price + orderBumps.filter(b => selectedBumps.has(b.id)).reduce((s, b) => s + b.discountedPrice, 0))}
                  </span>
                </div>
              </div>

              {product.guarantee_days && product.guarantee_days > 0 && custom?.show_guarantee_badge !== false && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-primary font-medium">🛡️ Garantia de {product.guarantee_days} dias</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Reembolso incondicional dentro do prazo</p>
                </div>
              )}

              {/* Testimonials / Social Proof */}
              {custom?.show_testimonials !== false && (
                <div className="space-y-3">
                  <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-primary fill-primary" /> Avaliações de clientes
                  </h3>
                  {mockTestimonials.map((t, i) => (
                    <div key={i} className="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {t.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">{t.name}</p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star key={s} className={`w-2.5 h-2.5 ${s < t.rating ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">"{t.text}"</p>
                    </div>
                  ))}
                  <p className="text-center text-[10px] text-muted-foreground">
                    ⭐ 4.9/5 baseado em {Math.floor(Math.random() * 200 + 100)} avaliações
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-2">
                <img src={queenifyBee} alt="" className="w-4 h-4 opacity-50" />
                <span className="text-[10px] text-muted-foreground">Powered by Queenify</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
