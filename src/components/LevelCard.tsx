import { motion } from "framer-motion";
import { ArrowRight, Trophy, Crown, Star, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import LevelBenefitsSheet from "./LevelBenefitsSheet";
import { useSales } from "@/hooks/useSupabaseData";

import frameBronze from "@/assets/frame-bronze.png";
import frameSilver from "@/assets/frame-silver.png";
import frameGold from "@/assets/frame-gold.png";
import frameCrown from "@/assets/frame-crown.png";

const levels = [
  { name: "Bronze", icon: Shield, min: 10000, max: 100000, frame: frameBronze, borderColor: "border-muted-foreground" },
  { name: "Silver", icon: Star, min: 100000, max: 500000, frame: frameSilver, borderColor: "border-[hsl(0,0%,70%)]" },
  { name: "Gold", icon: Trophy, min: 500000, max: 1000000, frame: frameGold, borderColor: "border-primary" },
  { name: "Crown", icon: Crown, min: 1000000, max: Infinity, frame: frameCrown, borderColor: "border-primary" },
];

export function getUserLevel(revenue: number) {
  const level = levels.find((l) => revenue >= l.min && revenue < l.max);
  return level || null; // null means no level reached
}

export { levels };

const LevelCard = () => {
  const [showBenefits, setShowBenefits] = useState(false);
  const { data: sales = [], isLoading } = useSales();

  const currentRevenue = sales
    .filter((s: any) => s.status === "completed")
    .reduce((sum: number, s: any) => sum + Number(s.amount), 0);

  const currentLevel = getUserLevel(currentRevenue);
  const hasLevel = currentLevel !== null;
  
  // For display purposes, show progress toward first level if none reached
  const displayLevel = currentLevel || { name: "Sem Nível", icon: Shield, min: 0, max: 10000, frame: null, borderColor: "border-border" };
  const nextLevel = hasLevel 
    ? levels[levels.indexOf(currentLevel!) + 1] || null
    : levels[0]; // Next level is Bronze if no level
  
  const progress = nextLevel 
    ? ((currentRevenue - (hasLevel ? displayLevel.min : 0)) / (nextLevel.min - (hasLevel ? displayLevel.min : 0))) * 100 
    : 100;

  const LevelIcon = displayLevel.icon;

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-[300px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatRevenue = (val: number) => {
    if (val >= 1000000) return "1M+";
    if (val >= 1000) return `${Math.round(val / 1000)}K`;
    return Math.round(val).toString();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 flex flex-col items-center text-center"
      >
        <h3 className="text-lg font-display font-semibold text-foreground mb-4 self-start">Nível Atual</h3>

        <div className="relative w-32 h-32 mb-3">
          {hasLevel && currentLevel?.frame ? (
            <img src={currentLevel.frame} alt={currentLevel.name} className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" />
          ) : null}
          <div className={`absolute ${hasLevel ? 'inset-[18%]' : 'inset-[10%]'} rounded-full bg-card flex flex-col items-center justify-center ${!hasLevel ? 'border-2 border-dashed border-border' : ''}`}>
            <LevelIcon className={`w-5 h-5 ${hasLevel ? 'text-primary' : 'text-muted-foreground'} mb-1`} />
            <span className="text-lg font-display font-bold text-foreground">
              {formatRevenue(currentRevenue)}
            </span>
          </div>
          {hasLevel && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full gradient-gold text-[10px] font-bold text-primary-foreground whitespace-nowrap z-20">
              {currentLevel!.name}
            </div>
          )}
          {!hasLevel && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground whitespace-nowrap z-20">
              Sem Nível
            </div>
          )}
        </div>

        <span className={`text-sm font-semibold mt-2 ${hasLevel ? 'text-gradient-gold' : 'text-muted-foreground'}`}>
          {hasLevel
            ? currentLevel!.name === "Gold" ? "Ouro Elite" : currentLevel!.name === "Crown" ? "Crown Elite" : currentLevel!.name
            : "Fature R$ 10.000 para desbloquear"}
        </span>

        <div className="flex items-center gap-3 mt-4 mb-2">
          {levels.map((lvl) => {
            const Icon = lvl.icon;
            const isActive = hasLevel && lvl.name === currentLevel!.name;
            const isPast = hasLevel && levels.indexOf(lvl) < levels.indexOf(currentLevel!);
            return (
              <div key={lvl.name} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 ${isActive ? lvl.borderColor : "border-border"} flex items-center justify-center transition-all ${isActive ? "scale-110" : isPast ? "opacity-50" : "opacity-30"}`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className={`text-[9px] ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>{lvl.name}</span>
              </div>
            );
          })}
        </div>

        {nextLevel && (
          <div className="w-full mt-3">
            <p className="text-xs text-muted-foreground mb-2">Próximo Nível: {nextLevel.name}</p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                transition={{ duration: 1, delay: 0.8 }}
                className="h-full gradient-gold rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              R$ {currentRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / R$ {nextLevel.min.toLocaleString("pt-BR")}
            </p>
          </div>
        )}

        <button
          onClick={() => setShowBenefits(true)}
          className="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Ver Benefícios <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
      <LevelBenefitsSheet open={showBenefits} onOpenChange={setShowBenefits} />
    </>
  );
};

export default LevelCard;
