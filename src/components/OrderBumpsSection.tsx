import { useState, useEffect } from "react";
import { Plus, X, Package, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface OrderBump {
  id: string;
  bump_product_id: string;
  discount_percent: number;
  is_active: boolean;
  product_name?: string;
  product_price?: number;
}

interface AvailableProduct {
  id: string;
  name: string;
  price: number;
}

export default function OrderBumpsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [bumps, setBumps] = useState<OrderBump[]>([]);
  const [available, setAvailable] = useState<AvailableProduct[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [discount, setDiscount] = useState(10);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data: bumpData } = await supabase
      .from("order_bumps")
      .select("id, bump_product_id, discount_percent, is_active")
      .eq("product_id", productId);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price")
      .neq("id", productId);

    const enriched = (bumpData || []).map(b => {
      const p = (products || []).find(pr => pr.id === b.bump_product_id);
      return { ...b, product_name: p?.name || "Produto removido", product_price: p?.price || 0 };
    });

    setBumps(enriched);
    const usedIds = (bumpData || []).map(b => b.bump_product_id);
    setAvailable((products || []).filter(p => !usedIds.includes(p.id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [productId, user]);

  const addBump = async () => {
    if (!selectedProduct) return;
    const { error } = await supabase.from("order_bumps").insert({
      product_id: productId,
      bump_product_id: selectedProduct,
      discount_percent: discount,
    });
    if (error) { toast.error("Erro ao adicionar order bump"); return; }
    toast.success("Order bump adicionado!");
    setAdding(false);
    setSelectedProduct("");
    setDiscount(10);
    load();
  };

  const removeBump = async (id: string) => {
    await supabase.from("order_bumps").delete().eq("id", id);
    toast.success("Order bump removido");
    load();
  };

  const toggleBump = async (id: string, active: boolean) => {
    await supabase.from("order_bumps").update({ is_active: !active }).eq("id", id);
    load();
  };

  if (loading) return <div className="text-xs text-muted-foreground py-2">Carregando...</div>;

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground font-medium">Order Bumps</p>
          <p className="text-[10px] text-muted-foreground">Ofertas complementares no checkout</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="p-1.5 rounded-lg hover:bg-secondary text-primary">
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {adding && (
        <div className="space-y-2 p-3 bg-secondary/50 rounded-lg">
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <option value="">Selecione um produto</option>
            {available.map(p => (
              <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</option>
            ))}
          </select>
          <div>
            <label className="text-[10px] text-muted-foreground">Desconto: {discount}%</label>
            <input type="range" min={0} max={50} value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full accent-primary" />
          </div>
          <button onClick={addBump} disabled={!selectedProduct} className="w-full py-2 gradient-gold rounded-lg text-xs font-semibold text-primary-foreground disabled:opacity-40">
            Adicionar
          </button>
        </div>
      )}

      {bumps.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhum order bump configurado</p>
      )}

      {bumps.map(b => (
        <div key={b.id} className={`flex items-center gap-3 p-2 rounded-lg border ${b.is_active ? "border-border" : "border-border/50 opacity-60"}`}>
          <Package className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{b.product_name}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Percent className="w-2.5 h-2.5" /> {b.discount_percent}% desconto
              {b.product_price ? ` • R$ ${(b.product_price * (1 - b.discount_percent / 100)).toFixed(2)}` : ""}
            </p>
          </div>
          <button onClick={() => toggleBump(b.id, b.is_active)} className={`w-8 h-5 rounded-full relative transition-colors ${b.is_active ? "bg-primary" : "bg-secondary"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-all ${b.is_active ? "right-0.5" : "left-0.5"}`} />
          </button>
          <button onClick={() => removeBump(b.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
    </div>
  );
}
