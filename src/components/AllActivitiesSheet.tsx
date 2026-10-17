import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { ShoppingCart, RefreshCw, Filter, ChevronDown, Loader2 } from "lucide-react";
import { useSales } from "@/hooks/useSupabaseData";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

const typeFilters = [
  { value: "all", label: "Todas" },
  { value: "completed", label: "Vendas aprovadas" },
  { value: "refunded", label: "Reembolsos" },
  { value: "pending", label: "Pendentes" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AllActivitiesSheet = ({ open, onOpenChange }: Props) => {
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: sales = [], isLoading } = useSales();

  const filtered = typeFilter === "all" ? sales : sales.filter((s: any) => s.status === typeFilter);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-foreground font-display">Atividades Recentes</SheetTitle>
        </SheetHeader>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-4 flex items-center gap-2 text-sm text-primary font-medium"
        >
          <Filter className="w-4 h-4" /> Filtrar <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>

        {showFilters && (
          <div className="mt-3 space-y-3 p-3 glass-card">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Tipo</p>
              <div className="flex flex-wrap gap-1.5">
                {typeFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTypeFilter(f.value)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      typeFilter === f.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade encontrada.</p>
          ) : (
            filtered.slice(0, 30).map((s: any) => {
              const isRefund = s.status === "refunded";
              return (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center ${isRefund ? "text-[hsl(25,95%,53%)]" : "text-success"}`}>
                      {isRefund ? <RefreshCw className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{isRefund ? "Reembolso" : s.status === "pending" ? "Venda pendente" : "Venda aprovada"}</p>
                      <p className="text-xs text-muted-foreground">{s.products?.name || "Produto"}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(s.sold_at)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${isRefund ? "text-[hsl(25,95%,53%)]" : "text-success"}`}>
                    R$ {Number(s.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AllActivitiesSheet;
