import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TutorialStep {
  title: string;
  description: string;
  target: string;
}

export interface Tutorial {
  title: string;
  steps: TutorialStep[];
}

interface TutorialGuideContextType {
  isActive: boolean;
  currentTutorial: Tutorial | null;
  tutorialIndex: number;
  currentStepIndex: number;
  completedSteps: string[];
  startGuide: (tutorial: Tutorial, tutorialIdx: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  exitGuide: () => void;
  toggleComplete: (tutorialIdx: number, stepTitle: string) => void;
  isStepComplete: (tutorialIdx: number, stepTitle: string) => boolean;
}

const TutorialGuideContext = createContext<TutorialGuideContextType>({
  isActive: false,
  currentTutorial: null,
  tutorialIndex: 0,
  currentStepIndex: 0,
  completedSteps: [],
  startGuide: () => {},
  nextStep: () => {},
  prevStep: () => {},
  exitGuide: () => {},
  toggleComplete: () => {},
  isStepComplete: () => false,
});

export const useTutorialGuide = () => useContext(TutorialGuideContext);

export const TutorialGuideProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Load progress
  useEffect(() => {
    if (!user) return;
    supabase
      .from("tutorial_progress")
      .select("step_key")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setCompletedSteps(data.map((r) => r.step_key));
      });
  }, [user]);

  const getKey = (tIdx: number, title: string) => `${tIdx}:${title}`;

  const isStepComplete = (tIdx: number, title: string) =>
    completedSteps.includes(getKey(tIdx, title));

  const toggleComplete = async (tIdx: number, stepTitle: string) => {
    if (!user) return;
    const key = getKey(tIdx, stepTitle);
    if (completedSteps.includes(key)) {
      setCompletedSteps((p) => p.filter((k) => k !== key));
      await supabase.from("tutorial_progress").delete().eq("user_id", user.id).eq("step_key", key);
    } else {
      setCompletedSteps((p) => [...p, key]);
      await supabase.from("tutorial_progress").insert({ user_id: user.id, step_key: key });
    }
  };

  const startGuide = (tutorial: Tutorial, tIdx: number) => {
    setCurrentTutorial(tutorial);
    setTutorialIndex(tIdx);
    setCurrentStepIndex(0);
    setIsActive(true);
    // Navigate to first step's target
    if (tutorial.steps[0]?.target) {
      navigate(tutorial.steps[0].target);
    }
  };

  const nextStep = () => {
    if (!currentTutorial) return;
    const step = currentTutorial.steps[currentStepIndex];
    if (step) toggleComplete(tutorialIndex, step.title);

    if (currentStepIndex < currentTutorial.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextTarget = currentTutorial.steps[nextIdx]?.target;
      if (nextTarget && nextTarget !== location.pathname) {
        navigate(nextTarget);
      }
    } else {
      toast.success("🎉 Tutorial concluído! Parabéns!");
      setIsActive(false);
      setCurrentTutorial(null);
    }
  };

  const prevStep = () => {
    if (!currentTutorial || currentStepIndex <= 0) return;
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);
    const prevTarget = currentTutorial.steps[prevIdx]?.target;
    if (prevTarget && prevTarget !== location.pathname) {
      navigate(prevTarget);
    }
  };

  const exitGuide = () => {
    setIsActive(false);
    setCurrentTutorial(null);
  };

  return (
    <TutorialGuideContext.Provider
      value={{
        isActive,
        currentTutorial,
        tutorialIndex,
        currentStepIndex,
        completedSteps,
        startGuide,
        nextStep,
        prevStep,
        exitGuide,
        toggleComplete,
        isStepComplete,
      }}
    >
      {children}
    </TutorialGuideContext.Provider>
  );
};
