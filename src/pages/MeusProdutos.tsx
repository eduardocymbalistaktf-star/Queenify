import DashboardLayout from "@/layouts/DashboardLayout";
import { Plus, Package, Link2, ExternalLink, Copy, Trash2, Users, Handshake, ShoppingCart } from "lucide-react";
import { useState } from "react";
import NovoProductSheet from "@/components/NovoProductSheet";
import EditProductSheet from "@/components/EditProductSheet";
import DivulgarSheet from "@/components/DivulgarSheet";
import { useProducts, Product, useSales } from "@/hooks/useSupabaseData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MeusProdutos = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [divulgarOpen, setDivulgarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkProductId, setNewLinkProductId] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: produtos, isLoading } = useProducts();

  const { data: checkoutLinks = [] } = useQuery({
    queryKey: ["checkout_links", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkout_links")
        .select("*, products(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleEdit = (p: Product) => {
    setSelectedProduct(p);
    setEditOpen(true);
  };

  const handleDivulgar = (p: Product) => {
    setSelectedProduct(p);
    setDivulgarOpen(true);
  };

  const createLink = async () => {
    if (!newLinkProductId) { toast.error("Selecione um produto"); return; }
    const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const url = `${baseUrl}checkout/${newLinkProductId}`;
    const { error } = await supabase.from("checkout_links").insert({
      user_id: user!.id,
      product_id: newLinkProductId,
      name: newLinkName || "Checkout Principal",
      url,
    });
    if (error) { toast.error("Erro ao criar link"); return; }
    toast.success("Link criado!");
    setNewLinkName("");
    setNewLinkProductId("");
    queryClient.invalidateQueries({ queryKey: ["checkout_links"] });
  };

  const deleteLink = async (id: string) => {
    await supabase.from("checkout_links").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["checkout_links"] });
    toast.success("Link excluído");
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Gerenciar Produtos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie, edite ou remova seus produtos.</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity w-fit"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="produtos" className="gap-2"><Package className="w-4 h-4" /> Produtos</TabsTrigger>
          <TabsTrigger value="links" className="gap-2"><Link2 className="w-4 h-4" /> Links</TabsTrigger>
          <TabsTrigger value="afiliacoes" className="gap-2"><Users className="w-4 h-4" /> Minhas Afiliações</TabsTrigger>
          <TabsTrigger value="coproducao" className="gap-2"><Handshake className="w-4 h-4" /> Co-Produção</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !produtos?.length ? (
            <div className="glass-card p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Nenhum produto cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro produto para começar a vender.</p>
              <button
                onClick={() => setSheetOpen(true)}
                className="mt-4 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Criar Produto
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {produtos.map((p) => (
                <div key={p.id} className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-14 h-12 sm:w-20 sm:h-16 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.category || "Sem categoria"}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(p.tags || []).map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:gap-6 sm:flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-foreground font-medium">
                          R$ {Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-display font-bold text-foreground">{p.total_sales || 0}</p>
                        <p className="text-xs text-muted-foreground">Vendas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(p)} className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-secondary/80">Editar</button>
                      <button onClick={() => handleDivulgar(p)} className="px-3 py-1.5 gradient-gold rounded-lg text-xs font-semibold text-primary-foreground">Divulgar →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="links">
          <div className="glass-card p-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Criar Novo Link</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={newLinkProductId}
                onChange={e => setNewLinkProductId(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">Selecione um produto</option>
                {(produtos || []).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                value={newLinkName}
                onChange={e => setNewLinkName(e.target.value)}
                placeholder="Nome do link (opcional)"
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <button onClick={createLink} className="px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground whitespace-nowrap">
                <Plus className="w-4 h-4 inline mr-1" /> Criar Link
              </button>
            </div>
          </div>

          {checkoutLinks.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Nenhum link criado</p>
              <p className="text-sm text-muted-foreground mt-1">Crie links de checkout para compartilhar seus produtos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkoutLinks.map((link: any) => (
                <div key={link.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <h4 className="text-sm font-semibold text-foreground">{link.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Produto: {link.products?.name || "—"}</p>
                    <p className="text-xs text-primary truncate mt-1">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => copyLink(link.url)} className="p-2 bg-secondary border border-border rounded-lg hover:bg-secondary/80" title="Copiar link">
                      <Copy className="w-4 h-4 text-foreground" />
                    </button>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-secondary border border-border rounded-lg hover:bg-secondary/80" title="Abrir link">
                      <ExternalLink className="w-4 h-4 text-foreground" />
                    </a>
                    <button onClick={() => deleteLink(link.id)} className="p-2 bg-secondary border border-border rounded-lg hover:bg-destructive/10" title="Excluir">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="afiliacoes">
          <MinhasAfiliacoes />
        </TabsContent>

        <TabsContent value="coproducao">
          <CoProducao />
        </TabsContent>
      </Tabs>

      <NovoProductSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      <EditProductSheet open={editOpen} onOpenChange={setEditOpen} produto={selectedProduct} />
      <DivulgarSheet open={divulgarOpen} onOpenChange={setDivulgarOpen} produto={selectedProduct ? { nome: selectedProduct.name } : null} />
    </DashboardLayout>
  );
};

function MinhasAfiliacoes() {
  const { user } = useAuth();

  const { data: affiliatedProducts = [], isLoading } = useQuery({
    queryKey: ["my-affiliations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("product_id, products(id, name, image_url, price, commission_rate)")
        .eq("affiliate_name", user!.email)
        .eq("status", "completed");
      
      if (!data) return [];
      const seen = new Set<string>();
      return data.filter((s: any) => {
        if (seen.has(s.product_id)) return false;
        seen.add(s.product_id);
        return true;
      }).map((s: any) => ({
        ...s.products,
        totalSales: data.filter((d: any) => d.product_id === s.product_id).length,
      }));
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (affiliatedProducts.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium">Nenhuma afiliação ativa</p>
        <p className="text-sm text-muted-foreground mt-1">Quando sua solicitação de afiliação for aceita, o produto aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="glass-card p-4 mb-4 border-l-4 border-primary">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Como afiliado</strong>, você tem acesso apenas aos links de divulgação do produto e pode adquirir order bumps disponíveis. Edições no produto e acesso a dados são exclusivos do produtor.
        </p>
      </div>
      <div className="space-y-3">
        {affiliatedProducts.map((p: any) => (
          <div key={p.id} className="glass-card p-4 flex items-center gap-4">
            <div className="w-14 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
              <p className="text-xs text-muted-foreground">Comissão: {p.commission_rate || 50}%</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">R$ {Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">{p.totalSales} venda(s)</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}checkout/${p.id}`); toast.success("Link de afiliado copiado!"); }}
                className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-secondary/80"
              >
                <Copy className="w-3.5 h-3.5 inline mr-1" /> Link
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoProducao() {
  const { user } = useAuth();

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ["co-production-invites", user?.id],
    queryFn: async () => {
      const { data: sent } = await supabase
        .from("collaboration_invites")
        .select("*")
        .eq("inviter_id", user!.id)
        .order("created_at", { ascending: false });
      
      const { data: received } = await supabase
        .from("collaboration_invites")
        .select("*")
        .eq("invitee_email", user!.email || "")
        .order("created_at", { ascending: false });

      return { sent: sent || [], received: received || [] };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const { sent, received } = invites as any;
  const hasData = sent?.length > 0 || received?.length > 0;

  if (!hasData) {
    return (
      <div className="glass-card p-12 text-center">
        <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium">Nenhuma co-produção</p>
        <p className="text-sm text-muted-foreground mt-1">Convites de co-produção enviados e recebidos aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {received?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Convites Recebidos</h3>
          <div className="space-y-2">
            {received.map((inv: any) => (
              <div key={inv.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.role}</p>
                  <p className="text-xs text-muted-foreground">
                    Participação: {inv.share_percentage}% • Status: <span className={inv.status === "aceito" ? "text-success" : inv.status === "pendente" ? "text-primary" : "text-destructive"}>{inv.status}</span>
                  </p>
                  {inv.message && <p className="text-xs text-muted-foreground mt-1 italic">"{inv.message}"</p>}
                </div>
                {inv.status === "pendente" && (
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      await supabase.from("collaboration_invites").update({ status: "aceito", responded_at: new Date().toISOString() }).eq("id", inv.id);
                      toast.success("Convite aceito!");
                    }} className="px-3 py-1.5 gradient-gold rounded-lg text-xs font-semibold text-primary-foreground">Aceitar</button>
                    <button onClick={async () => {
                      await supabase.from("collaboration_invites").update({ status: "recusado", responded_at: new Date().toISOString() }).eq("id", inv.id);
                      toast.success("Convite recusado");
                    }} className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground">Recusar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sent?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Convites Enviados</h3>
          <div className="space-y-2">
            {sent.map((inv: any) => (
              <div key={inv.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.invitee_email}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.role} • {inv.share_percentage}% • <span className={inv.status === "aceito" ? "text-success" : inv.status === "pendente" ? "text-primary" : "text-destructive"}>{inv.status}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MeusProdutos;
