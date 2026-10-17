import { motion } from "framer-motion";
import { ShoppingCart, RefreshCw, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import AllActivitiesSheet from "./AllActivitiesSheet";
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

const RecentActivity = () => {
  const [showAll, setShowAll] = useState(false);
  const { data: sales = [], isLoading } = useSales();

  const recentSales = sales.slice(0, 4);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">Atividades Recentes</h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : recentSales.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade recente.</p>
        ) : (
          <div className="space-y-4">
            {recentSales.map((s: any) => {
              const isRefund = s.status === "refunded";
              return (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center ${isRefund ? "text-[hsl(25,95%,53%)]" : "text-success"}`}>
                      {isRefund ? <RefreshCw className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{isRefund ? "Reembolso" : "Venda aprovada"}</p>
                      <p className="text-xs text-muted-foreground">{s.products?.name || "Produto"} • {timeAgo(s.sold_at)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${isRefund ? "text-[hsl(25,95%,53%)]" : "text-success"}`}>
                    R$ {Number(s.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Ver mais <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
      <AllActivitiesSheet open={showAll} onOpenChange={setShowAll} />
    </>
  );
};

export default RecentActivity;
