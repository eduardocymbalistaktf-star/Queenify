import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AccentMode = "anchor" | "metal-emphasis";

interface ThemeAccentContextValue {
  accent: AccentMode;
  setAccent: (mode: AccentMode) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
}

const ACCENT_KEY = "dashboard-accent-mode";
const MOTION_KEY = "dashboard-reduce-motion";

const ThemeAccentContext = createContext<ThemeAccentContextValue | null>(null);

export function ThemeAccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentMode>(() => {
    if (typeof window === "undefined") return "anchor";
    const savedAccent = localStorage.getItem(ACCENT_KEY);
    return savedAccent === "gold-emphasis" ? "metal-emphasis" : savedAccent === "metal-emphasis" ? savedAccent : "anchor";
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(MOTION_KEY);
    if (saved !== null) return saved === "true";
    // Honour OS preference on first visit.
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  });

  // Apply body class for accent mode.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("theme-metal-emphasis", accent === "metal-emphasis");
    try { localStorage.setItem(ACCENT_KEY, accent); } catch { /* ignore */ }
  }, [accent]);

  // Apply body class for reduced motion.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("reduce-motion", reduceMotion);
    try { localStorage.setItem(MOTION_KEY, String(reduceMotion)); } catch { /* ignore */ }
  }, [reduceMotion]);

  return (
    <ThemeAccentContext.Provider
      value={{
        accent,
        setAccent: setAccentState,
        reduceMotion,
        setReduceMotion: setReduceMotionState,
      }}
    >
      {children}
    </ThemeAccentContext.Provider>
  );
}

export function useThemeAccent() {
  const ctx = useContext(ThemeAccentContext);
  if (!ctx) {
    // Safe fallback for components rendered outside the dashboard (e.g. landing).
    return {
      accent: "anchor" as AccentMode,
      setAccent: () => {},
      reduceMotion: false,
      setReduceMotion: () => {},
    };
  }
  return ctx;
}
