import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Star, ShoppingCart, MessageSquare, CheckCircle, Loader2, Trophy, Crown, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const nichos = ["Todos", "Marketing Digital", "Desenvolvimento", "Design", "Finanças", "Saúde", "Educação"];
const ordenar = ["Mais vendidos", "Melhor avaliação", "Menor preço", "Maior preço", "Mais recentes"];
const faixasPreco = ["Todos", "Até R$50", "R$50 - R$200", "R$200 - R$500", "Acima de R$500"];

const RatingStars = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => {
  const s = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${s} ${i <= Math.round(rating) ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [nicho, setNicho] = useState("Todos");
  const [ordem, setOrdem] = useState("Mais vendidos");
  const [faixaPreco, setFaixaPreco] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: products = [], isLoading, isError: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_public")
        .select("*")
        .eq("is_active", true)
        .order("total_sales", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ["marketplace-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles for top sellers
  const { data: profiles = [] } = useQuery({
    queryKey: ["marketplace-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("user_id, display_name, avatar_url");
      if (error) throw error;
      return data || [];
    },
  });

  // Compute top sellers
  const topSellers = (() => {
    const sellerMap = new Map<string, number>();
    products.forEach((product: any) => {
      sellerMap.set(product.user_id, (sellerMap.get(product.user_id) || 0) + Number(product.total_sales || 0));
    });
    return Array.from(sellerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, total], index) => {
        const profile = profiles.find((p: any) => p.user_id === userId);
        return {
          rank: index + 1,
          userId,
          name: profile?.display_name || "Produtor",
          avatar: profile?.avatar_url,
          totalSales: total,
        };
      });
  })();

  const reviewsByProduct = allReviews.reduce((acc: Record<string, any[]>, r) => {
    if (!acc[r.product_id]) acc[r.product_id] = [];
    acc[r.product_id].push(r);
    return acc;
  }, {});

  const getAvgRating = (productId: string) => {
    const reviews = reviewsByProduct[productId] || [];
    if (!reviews.length) return 0;
    return reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
  };

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !user) throw new Error("Faça login para avaliar");
      const { error } = await supabase.from("product_reviews").insert({
        product_id: selectedProduct.id,
        reviewer_id: user.id,
        reviewer_name: user.user_metadata?.full_name || user.user_metadata?.display_name || "Usuário",
        rating: reviewRating,
        comment: reviewComment || null,
        is_approved: false,
        is_verified_purchase: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-reviews"] });
      toast.success("Avaliação enviada para análise.");
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = products
    .filter((p: any) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
      const matchNicho = nicho === "Todos" || p.niche === nicho || p.category === nicho;
      let matchPreco = true;
      if (faixaPreco === "Até R$50") matchPreco = p.price <= 50;
      else if (faixaPreco === "R$50 - R$200") matchPreco = p.price > 50 && p.price <= 200;
      else if (faixaPreco === "R$200 - R$500") matchPreco = p.price > 200 && p.price <= 500;
      else if (faixaPreco === "Acima de R$500") matchPreco = p.price > 500;
      return matchSearch && matchNicho && matchPreco;
    })
    .sort((a: any, b: any) => {
      if (ordem === "Mais vendidos") return (b.total_sales || 0) - (a.total_sales || 0);
      if (ordem === "Melhor avaliação") return getAvgRating(b.id) - getAvgRating(a.id);
      if (ordem === "Menor preço") return a.price - b.price;
      if (ordem === "Maior preço") return b.price - a.price;
      if (ordem === "Mais recentes") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

  const selectedReviews = selectedProduct ? (reviewsByProduct[selectedProduct.id] || []) : [];

  return (
    <DashboardLayout>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vitrine Queenify</p>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Encontre produtos para promover e acompanhe os destaques da comunidade.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-success" />
          {productsError || isLoading ? "Vitrine atualizando" : `${products.length} ${products.length === 1 ? "produto ativo" : "produtos ativos"}`}
        </div>
      </div>

      {/* Top Sellers Section */}
      {topSellers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-bold text-foreground">Produtores em destaque</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Ranking list */}
            <div className="glass-card p-4">
              <p className="mb-3 text-xs text-muted-foreground">Ranking por vendas registradas em produtos ativos. Valores financeiros individuais não são exibidos.</p>
              <div className="space-y-2">
                {topSellers.map(seller => (
                  <div key={seller.userId} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                    seller.rank <= 5 ? "bg-primary/5 border border-primary/10" : "bg-secondary/50"
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      seller.rank === 1 ? "gradient-gold text-primary-foreground" : 
                      seller.rank <= 3 ? "bg-primary/20 text-primary" : 
                      seller.rank <= 5 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      {seller.rank === 1 ? <Crown className="w-4 h-4" /> : `#${seller.rank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">{seller.name}</p>
                        {seller.rank === 1 && (
                          <Star className="w-3.5 h-3.5 text-primary fill-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{seller.totalSales.toLocaleString("pt-BR")} vendas registradas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {productsError && (
        <div className="glass-card mb-5 flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><RefreshCw className="h-5 w-5" /></div>
          <div><h2 className="font-semibold text-foreground">Não foi possível carregar os produtos</h2><p className="mt-1 text-sm text-muted-foreground">Confira sua conexão e tente novamente.</p></div>
          <button onClick={() => refetchProducts()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Tentar novamente</button>
        </div>
      )}

      {/* Search + Filter Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-card p-4 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Filtros</p>
            <button onClick={() => { setNicho("Todos"); setFaixaPreco("Todos"); setOrdem("Mais vendidos"); }} className="text-xs text-primary hover:text-primary/80">Limpar filtros</button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Nicho</p>
            <div className="flex gap-2 flex-wrap">
              {nichos.map(n => (
                <button key={n} onClick={() => setNicho(n)} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${nicho === n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Faixa de Preço</p>
            <div className="flex gap-2 flex-wrap">
              {faixasPreco.map(f => (
                <button key={f} onClick={() => setFaixaPreco(f)} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${faixaPreco === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Ordenar por</p>
            <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="bg-secondary border border-border text-sm text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
              {ordenar.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : productsError ? null : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-foreground mb-2">Nenhum produto encontrado</h3>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou crie um produto primeiro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => {
            const reviews = reviewsByProduct[p.id] || [];
            const avgRating = getAvgRating(p.id);
            const sellerRank = topSellers.find(s => s.userId === p.user_id)?.rank;
            const isTopSeller = sellerRank !== undefined && sellerRank <= 5;
            const isPopular = (p.total_sales || 0) >= 50;
            return (
              <div key={p.id} className="glass-card p-4 transition-all relative">
                {/* Boost badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                  {isTopSeller && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-bold backdrop-blur-sm">
                      <Trophy className="w-3 h-3" /> Em Destaque
                    </span>
                  )}
                  {isPopular && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/80 text-background text-[10px] font-bold backdrop-blur-sm">
                      <Crown className="w-3 h-3" /> Popular
                    </span>
                  )}
                </div>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-28 rounded-lg object-cover mb-3" />
                ) : (
                  <div className="w-full h-28 rounded-lg bg-secondary flex items-center justify-center text-4xl mb-3">📦</div>
                )}
                <p className="text-sm font-medium text-foreground line-clamp-1">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.niche || p.category || "Produto digital"}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-primary">R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                  <div className="flex items-center gap-1">
                    {avgRating > 0 && (
                      <>
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="text-xs text-foreground font-medium">{avgRating.toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">({reviews.length})</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{(p.total_sales || 0).toLocaleString()} vendas</span>
                  {p.commission_rate && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">{p.commission_rate}% comissão</span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}
                    className="flex-1 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">Detalhes</button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/checkout/${p.id}`); }}
                    className="flex-1 py-2 rounded-lg gradient-gold text-primary-foreground text-xs font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" /> Comprar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Sheet with Reviews */}
      <Sheet open={!!selectedProduct} onOpenChange={() => { setSelectedProduct(null); setShowReviewForm(false); }}>
        <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
          <SheetHeader>
            <SheetTitle className="font-display">Detalhes do Produto</SheetTitle>
          </SheetHeader>
          {selectedProduct && (
            <div className="mt-6 space-y-4">
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-36 rounded-xl object-cover" />
              ) : (
                <div className="w-full h-36 rounded-xl bg-secondary flex items-center justify-center text-5xl">📦</div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedProduct.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{selectedProduct.niche || selectedProduct.category || "Produto digital"}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description || "Sem descrição disponível."}</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                  <p className="text-xs text-muted-foreground">Preço</p>
                  <p className="text-sm font-bold text-primary mt-1">R$ {Number(selectedProduct.price).toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                  <p className="text-xs text-muted-foreground">Avaliação</p>
                  <p className="text-sm font-bold text-foreground mt-1">{getAvgRating(selectedProduct.id).toFixed(1) || "N/A"}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-sm font-bold text-foreground mt-1">{(selectedProduct.total_sales || 0).toLocaleString()}</p>
                </div>
              </div>

              {selectedProduct.commission_rate && (
                <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                  <p className="text-xs text-success font-medium">💰 Comissão de {selectedProduct.commission_rate}% por venda</p>
                </div>
              )}

              {selectedProduct.guarantee_days && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-xs text-primary font-medium">🛡️ Garantia de {selectedProduct.guarantee_days} dias</p>
                </div>
              )}

              <button onClick={() => navigate(`/checkout/${selectedProduct.id}`)}
                className="w-full py-3 rounded-xl gradient-gold text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <ShoppingCart className="w-4 h-4" /> Comprar Agora
              </button>

              {/* Reviews Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Avaliações ({selectedReviews.length})
                  </h4>
                  {user && (
                    <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-xs text-primary hover:underline">
                      {showReviewForm ? "Cancelar" : "Avaliar"}
                    </button>
                  )}
                </div>

                {showReviewForm && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Nota:</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <button key={i} onClick={() => setReviewRating(i)} aria-label={`${i} ${i === 1 ? "estrela" : "estrelas"}`} aria-pressed={reviewRating === i}>
                            <Star className={`w-5 h-5 ${i <= reviewRating ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Escreva sua avaliação..." maxLength={3000}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground resize-none" rows={3} />
                    <p className="text-right text-[10px] text-muted-foreground">{reviewComment.length}/3000</p>
                    <button onClick={() => submitReview.mutate()} disabled={submitReview.isPending}
                      className="w-full py-2 rounded-lg gradient-gold text-primary-foreground text-xs font-bold disabled:opacity-50">
                      {submitReview.isPending ? "Enviando..." : "Enviar Avaliação"}
                    </button>
                  </div>
                )}

                {selectedReviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma avaliação ainda. Seja o primeiro!</p>
                ) : (
                  selectedReviews.map((review: any) => (
                    <div key={review.id} className="p-3 rounded-xl bg-secondary/50 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {review.reviewer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-medium text-foreground">{review.reviewer_name}</p>
                              {review.is_verified_purchase && (
                                <span className="flex items-center gap-0.5 text-[9px] text-success font-medium">
                                  <CheckCircle className="w-2.5 h-2.5" /> Compra verificada
                                </span>
                              )}
                            </div>
                            <RatingStars rating={review.rating} />
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {review.comment && <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Marketplace;
