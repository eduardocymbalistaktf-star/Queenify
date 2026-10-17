import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import AllAfiliadosSheet from "./AllAfiliadosSheet";
import { useSales } from "@/hooks/useSupabaseData";

interface TopAfiliadosProps {
  /** "Hoje" | "Últimos 7 dias" | "Últimos 30 dias" | "Últimos 90 dias" */
  period?: string;
}

const periodToDays: Record<string, number> = {
  "Hoje": 1,
  "Últimos 7 dias": 7,
  "Últimos 30 dias": 30,
  "Últimos 90 dias": 90,
};

const TopAfiliados = ({ period = "Últimos 30 dias" }: TopAfiliadosProps) => {
  const [showAll, setShowAll] = useState(false);
  // RLS-safe: useSales só retorna vendas do user (auth.uid() = user_id).
  // Não selecionamos buyer_email/payment_details aqui — só agregamos campos não-PII.
  const { data: sales = [], isLoading } = useSales();

  const afiliados = useMemo(() => {
    const days = periodToDays[period] ?? 30;
    const cutoff = new Date();
    if (period === "Hoje") {
      cutoff.setHours(0, 0, 0, 0);
    } else {
      cutoff.setDate(cutoff.getDate() - days);
    }

    const map: Record<string, { vendas: number; comissao: number }> = {};
    sales
      .filter((s: any) => {
        if (!s.affiliate_name || s.status !== "completed") return false;
        const sd = new Date(s.sold_at);
        return sd >= cutoff;
      })
      .forEach((s: any) => {
        const name = s.affiliate_name!;
        if (!map[name]) map[name] = { vendas: 0, comissao: 0 };
        map[name].vendas += 1;
        map[name].comissao += Number(s.commission_amount || 0);
      });
    return Object.entries(map)
      .sort(([, a], [, b]) => b.comissao - a.comissao)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
  }, [sales, period]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold text-foreground">Top Afiliados</h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            {period}
          </span>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : afiliados.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda por afiliado no período.</p>
        ) : (
          <>
            <div className="flex justify-between text-xs text-muted-foreground mb-3 px-1">
              <span>Afiliado</span>
              <span>Vendas</span>
            </div>
            <div className="space-y-3">
              {afiliados.map((a, i) => (
                <div key={a.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <span className="text-sm text-foreground font-medium">{a.name}</span>
                      <p className="text-xs text-muted-foreground">R$ {a.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{a.vendas}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Ver Todos <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
      <AllAfiliadosSheet open={showAll} onOpenChange={setShowAll} />
    </>
  );
};

export default TopAfiliados;
