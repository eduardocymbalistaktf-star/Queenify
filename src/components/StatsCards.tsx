import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { TrendingUp, Sparkles } from "lucide-react";
import { useDashboardStats } from "@/hooks/useSupabaseData";
import SolicitarSaqueSheet from "@/components/SolicitarSaqueSheet";
import { useThemeAccent } from "@/contexts/ThemeAccentContext";

/** Count-up number — drives a numeric spring and renders the formatted value.
 *  When `reduceMotion` is on, jumps straight to the final value. */
function CountUp({
  value,
  prefix = "",
  isCurrency = true,
  reduceMotion = false,
}: {
  value: number;
  prefix?: string;
  isCurrency?: boolean;
  reduceMotion?: boolean;
}) {
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const spring = useSpring(motionValue, { duration: 1400, bounce: 0 });
  const formatted = useTransform(reduceMotion ? motionValue : spring, (latest) =>
    isCurrency
      ? `${prefix}${latest.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${prefix}${Math.round(latest).toLocaleString("pt-BR")}`
  );

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span>{formatted}</motion.span>;
}

/** Skeleton block that respects current theme tokens (works on dark + .section-light). */
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted/60 animate-pulse rounded-md ${className}`} />
);

const StatsCards = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const [saqueOpen, setSaqueOpen] = useState(false);
  const { reduceMotion } = useThemeAccent();

  const cards = [
    {
      title: "Vendas",
      subtitle: "Últimos 30 dias",
      rawValue: stats?.vendas30d ?? 0,
      change: stats && stats.vendas30d > 0 ? "Ativo" : undefined,
    },
    {
      title: "Vendas Hoje",
      rawValue: stats?.vendasHoje ?? 0,
      change: stats ? `+ ${stats.qtdVendasHoje} vendas` : undefined,
    },
    {
      title: "Saldo Disponível",
      rawValue: stats?.vendas30d ?? 0,
      action: "Solicitar Saque",
      onAction: () => setSaqueOpen(true),
    },
    {
      title: "Produtos Ativos",
      rawValue: stats?.totalProdutos ?? 0,
      isCurrency: false,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((stat, i) => {
          // First KPI ("Vendas 30d") gets the inverted white treatment + microinteractions.
          const isHighlight = i === 0;
          // Pulse only when not reduced motion AND not loading (keeps glow stable, avoids jitter).
          const pulseClass = isHighlight && !reduceMotion ? "kpi-pulse" : "";
          const cardClass = isHighlight
            ? `section-light glass-card kpi-highlight ${pulseClass} p-4 sm:p-5 cursor-default col-span-2 lg:col-span-1`
            : "glass-card p-4 sm:p-5";

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : i * 0.1, duration: reduceMotion ? 0.15 : 0.4 }}
              whileHover={isHighlight && !reduceMotion ? { scale: 1.015 } : undefined}
              className={cardClass}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
                  )}
                </div>
                {isHighlight && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> Destaque
                  </span>
                )}
              </div>

              {isLoading ? (
                <Skeleton className={`mt-3 ${isHighlight ? "h-8 w-40" : "h-7 w-32"}`} />
              ) : (
                <p
                  className={`font-display font-bold mt-2 break-words ${
                    isHighlight ? "text-2xl sm:text-3xl text-foreground" : "text-xl sm:text-2xl text-foreground"
                  }`}
                >
                  {stat.isCurrency === false ? (
                    <CountUp value={stat.rawValue} isCurrency={false} reduceMotion={reduceMotion} />
                  ) : (
                    <CountUp value={stat.rawValue} prefix="R$ " reduceMotion={reduceMotion} />
                  )}
                </p>
              )}

              {isLoading ? (
                <Skeleton className="h-4 w-20 mt-2" />
              ) : (
                <>
                  {stat.change && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-success">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  )}
                  {stat.action && (
                    <button
                      onClick={stat.onAction}
                      className="mt-2 px-3 py-1 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      {stat.action}
                    </button>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>
      <SolicitarSaqueSheet open={saqueOpen} onOpenChange={setSaqueOpen} />
    </>
  );
};

export default StatsCards;
