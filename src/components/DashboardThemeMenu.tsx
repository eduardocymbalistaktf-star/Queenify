import { useState, useRef, useEffect } from "react";
import { Palette, Sun, Moon, Sparkles, Check } from "lucide-react";
import { useThemeAccent } from "@/contexts/ThemeAccentContext";

/** Compact theme controller for the dashboard header.
 *  Centralizes accent mode (anchor / gold-emphasis) and reduce-motion toggle,
 *  persisting via the context (localStorage). The .section-light scope is not
 *  affected by the body-level class — it always re-scopes its own tokens. */
const DashboardThemeMenu = () => {
  const { accent, setAccent, reduceMotion, setReduceMotion } = useThemeAccent();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
        aria-label="Aparência"
        aria-expanded={open}
        title="Aparência"
      >
        <Palette className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-popover shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-2">
            Tema do dashboard
          </p>

          <button
            onClick={() => setAccent("anchor")}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
              accent === "anchor" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="flex-1 text-left">Areia e grafite</span>
            {accent === "anchor" && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>

          <button
            onClick={() => setAccent("gold-emphasis")}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
              accent === "gold-emphasis" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="flex-1 text-left">Destaque dourado</span>
            {accent === "gold-emphasis" && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>

          <div className="h-px bg-border my-2" />

          <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-secondary/50 cursor-pointer">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 text-sm text-foreground">Reduzir animações</span>
            <span
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                reduceMotion ? "bg-primary" : "bg-secondary"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={reduceMotion}
                onChange={e => setReduceMotion(e.target.checked)}
              />
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                  reduceMotion ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
          </label>

          <p className="text-[10px] text-muted-foreground px-2.5 pt-1 pb-1 leading-relaxed">
            Desativa pulse dourado, count-up e transições longas.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardThemeMenu;
