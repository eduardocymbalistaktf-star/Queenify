import { useTutorialGuide } from "@/contexts/TutorialGuideContext";
import { X, ArrowRight, CheckCircle, MapPin } from "lucide-react";
import { useLocation } from "react-router-dom";

const TutorialGuideOverlay = () => {
  const { isActive, currentTutorial, currentStepIndex, nextStep, prevStep, exitGuide } =
    useTutorialGuide();
  const location = useLocation();

  if (!isActive || !currentTutorial) return null;

  const step = currentTutorial.steps[currentStepIndex];
  const isOnTarget = step?.target === location.pathname;
  const progress = ((currentStepIndex + 1) / currentTutorial.steps.length) * 100;
  const isLast = currentStepIndex >= currentTutorial.steps.length - 1;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border gradient-gold flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-primary-foreground flex-shrink-0" />
            <p className="text-xs font-semibold text-primary-foreground truncate">
              {currentTutorial.title}
            </p>
          </div>
          <button
            onClick={exitGuide}
            className="text-primary-foreground/70 hover:text-primary-foreground flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              Passo {currentStepIndex + 1} de {currentTutorial.steps.length}
            </span>
            {isOnTarget && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">
                Você está aqui ✓
              </span>
            )}
            {!isOnTarget && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                Navegando...
              </span>
            )}
          </div>

          <h3 className="text-sm font-display font-bold text-foreground mb-1">{step.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{step.description}</p>

          {/* Progress */}
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-accent transition-colors"
              >
                Voltar
              </button>
            )}
            <button
              onClick={nextStep}
              className="flex-1 py-1.5 gradient-gold rounded-lg text-xs font-bold text-primary-foreground flex items-center justify-center gap-1.5"
            >
              {isLast ? (
                <>
                  Concluir <CheckCircle className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Próximo <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialGuideOverlay;
