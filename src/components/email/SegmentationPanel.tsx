import { useState, useMemo } from "react";
import { Filter, Users, Calendar, Tag, ShoppingCart, CreditCard, TrendingUp, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";

interface SegmentationPanelProps {
  allSales: any[];
  products: any[];
  onSegmentChange: (emails: { email: string; name: string }[]) => void;
}

type SegmentFilter = {
  productIds: string[];
  status: string;
  dateRange: "all" | "7d" | "30d" | "90d" | "180d";
  paymentMethod: string;
  hasRepurchased: "all" | "yes" | "no";
};

const SegmentationPanel = ({ allSales, products, onSegmentChange }: SegmentationPanelProps) => {
  const [filters, setFilters] = useState<SegmentFilter>({
    productIds: [],
    status: "completed",
    dateRange: "all",
    paymentMethod: "all",
    hasRepurchased: "all",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const segmentedBuyers = useMemo(() => {
    let filtered = [...allSales];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((s: any) => s.status === filters.status);
    }

    // Product filter
    if (filters.productIds.length > 0) {
      filtered = filtered.filter((s: any) => filters.productIds.includes(s.product_id));
    }

    // Date range
    if (filters.dateRange !== "all") {
      const days = { "7d": 7, "30d": 30, "90d": 90, "180d": 180 }[filters.dateRange] || 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      filtered = filtered.filter((s: any) => s.sold_at >= since || s.created_at >= since);
    }

    // Payment method
    if (filters.paymentMethod !== "all") {
      filtered = filtered.filter((s: any) => s.payment_method === filters.paymentMethod);
    }

    // Deduplicate by email
    const emailMap = new Map<string, { email: string; name: string; count: number }>();
    filtered.forEach((s: any) => {
      const existing = emailMap.get(s.buyer_email);
      if (existing) {
        existing.count++;
      } else {
        emailMap.set(s.buyer_email, { email: s.buyer_email, name: s.buyer_name || "", count: 1 });
      }
    });

    // Repurchase filter
    let buyers = Array.from(emailMap.values());
    if (filters.hasRepurchased === "yes") {
      buyers = buyers.filter(b => b.count > 1);
    } else if (filters.hasRepurchased === "no") {
      buyers = buyers.filter(b => b.count === 1);
    }

    return buyers;
  }, [allSales, filters]);

  // Notify parent
  useMemo(() => {
    onSegmentChange(segmentedBuyers.map(b => ({ email: b.email, name: b.name })));
  }, [segmentedBuyers]);

  const toggleProduct = (id: string) => {
    setFilters(f => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter(p => p !== id)
        : [...f.productIds, id],
    }));
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-display font-bold text-foreground">Segmentação de Contatos</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
            {segmentedBuyers.length} contatos
          </span>
        </div>
      </div>

      {/* Quick filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Status da compra</label>
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="w-full px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground"
          >
            <option value="all">Todos</option>
            <option value="completed">Aprovadas</option>
            <option value="pending">Pendentes</option>
            <option value="refunded">Reembolsadas</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Período</label>
          <select
            value={filters.dateRange}
            onChange={e => setFilters(f => ({ ...f, dateRange: e.target.value as any }))}
            className="w-full px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground"
          >
            <option value="all">Todo período</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="180d">Últimos 6 meses</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Pagamento</label>
          <select
            value={filters.paymentMethod}
            onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
            className="w-full px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground"
          >
            <option value="all">Todos</option>
            <option value="pix">PIX</option>
            <option value="cartao">Cartão</option>
            <option value="boleto">Boleto</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Recompra</label>
          <select
            value={filters.hasRepurchased}
            onChange={e => setFilters(f => ({ ...f, hasRepurchased: e.target.value as any }))}
            className="w-full px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground"
          >
            <option value="all">Todos</option>
            <option value="yes">Recorrentes</option>
            <option value="no">Primeira compra</option>
          </select>
        </div>
      </div>

      {/* Product filter */}
      <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-xs text-primary hover:underline">
        <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        {showAdvanced ? "Ocultar" : "Filtrar"} por produto
      </button>

      {showAdvanced && (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {products.map((p: any) => (
            <button
              key={p.id}
              onClick={() => toggleProduct(p.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                filters.productIds.includes(p.id)
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              {p.name}
            </button>
          ))}
          {filters.productIds.length > 0 && (
            <button
              onClick={() => setFilters(f => ({ ...f, productIds: [] }))}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium text-destructive bg-destructive/10 border border-destructive/20"
            >
              Limpar ×
            </button>
          )}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-display font-bold text-foreground">{segmentedBuyers.length}</p>
          <p className="text-[10px] text-muted-foreground">Contatos únicos</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-display font-bold text-foreground">
            {segmentedBuyers.filter(b => b.count > 1).length}
          </p>
          <p className="text-[10px] text-muted-foreground">Recorrentes</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-display font-bold text-success">
            {segmentedBuyers.length > 0 ? Math.round((segmentedBuyers.filter(b => b.count > 1).length / segmentedBuyers.length) * 100) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground">Taxa recompra</p>
        </div>
      </div>
    </div>
  );
};

export default SegmentationPanel;
