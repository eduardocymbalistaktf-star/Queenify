import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Trophy, Crown, Star, Shield, Check } from "lucide-react";

import frameBronze from "@/assets/frame-bronze.png";
import frameSilver from "@/assets/frame-silver.png";
import frameGold from "@/assets/frame-gold.png";
import frameCrown from "@/assets/frame-crown.png";

const levels = [
  {
    name: "Bronze",
    range: "10K+",
    frameImg: frameBronze,
    icon: Shield,
    frameColor: "border-muted-foreground",
    frameBg: "bg-secondary",
    textColor: "text-muted-foreground",
    benefits: [
      "Moldura básica (opcional)",
      "Até 5 checkouts externos",
      "Acesso completo ao marketplace",
    ],
  },
  {
    name: "Silver",
    range: "100K+",
    frameImg: frameSilver,
    icon: Star,
    frameColor: "border-[hsl(0,0%,70%)]",
    frameBg: "bg-gradient-to-br from-[hsl(0,0%,60%)] to-[hsl(0,0%,80%)]",
    textColor: "text-[hsl(0,0%,70%)]",
    benefits: [
      "Moldura diferenciada (opcional)",
      "Até 7 checkouts externos",
      "Mais autoridade no perfil",
      "Badge Silver no marketplace",
    ],
  },
  {
    name: "Gold",
    range: "500K+",
    frameImg: frameGold,
    icon: Trophy,
    frameColor: "border-primary",
    frameBg: "gradient-gold",
    textColor: "text-primary",
    benefits: [
      "Moldura premium (opcional)",
      "Checkouts ilimitados",
      "Maior destaque no marketplace",
      "Badge Gold exclusivo",
      "Acesso antecipado a novidades",
    ],
  },
  {
    name: "Crown",
    range: "1M+",
    frameImg: frameCrown,
    icon: Crown,
    frameColor: "border-primary",
    frameBg: "gradient-gold",
    textColor: "text-primary",
    benefits: [
      "Moldura de elite (opcional)",
      "Forte destaque visual e no marketplace",
      "Status máximo na plataforma",
      "Prioridade no suporte",
      "Convite para eventos exclusivos",
      "Consultoria personalizada",
    ],
  },
];

const currentLevelName = "Gold";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LevelBenefitsSheet = ({ open, onOpenChange }: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-foreground font-display">Benefícios por Nível</SheetTitle>
          <p className="text-sm text-muted-foreground">Molduras e níveis são opcionais — você escolhe se aparecem no seu perfil.</p>
          <p className="text-xs text-muted-foreground/80 mt-2">
            Os níveis começam a partir de <span className="text-foreground font-semibold">R$ 10.000</span> em faturamento.
            Abaixo disso, sua conta fica <span className="text-foreground font-semibold">Sem Nível</span> até atingir o Bronze.
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {levels.map((level) => {
            const isCurrent = level.name === currentLevelName;
            const isPast = levels.indexOf(level) < levels.findIndex((l) => l.name === currentLevelName);

            return (
              <div key={level.name} className={`glass-card p-4 relative ${isCurrent ? "ring-2 ring-primary/50" : ""}`}>
                {isCurrent && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-bold rounded-full gradient-gold text-primary-foreground">
                    NÍVEL ATUAL
                  </span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  {/* Frame preview */}
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <img src={level.frameImg} alt={level.name} className="absolute inset-0 w-full h-full object-contain z-10" />
                    <level.icon className={`w-5 h-5 ${level.textColor} z-0`} />
                    {isPast && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center z-20">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-display font-bold ${level.textColor}`}>{level.name}</h4>
                    <span className="text-xs text-muted-foreground">{level.range}</span>
                    {isPast && <p className="text-[10px] text-success font-medium">✓ Concluído</p>}
                  </div>
                </div>

                {/* Moldura preview */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/50 rounded-lg">
                  <div className="w-10 h-10 relative">
                    <img src={level.frameImg} alt="moldura" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Preview da moldura no avatar</p>
                </div>

                <ul className="space-y-1.5">
                  {level.benefits.map((b) => (
                    <li key={b} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPast || isCurrent ? "bg-primary" : "bg-muted-foreground/40"}`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LevelBenefitsSheet;
