import { useEffect } from "react";

const STORAGE_KEY = "queenify_utms";
const TTL_DAYS = 30;

export interface UtmData {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
  landing_url?: string | null;
  captured_at?: number;
}

/**
 * Captures UTMs/click IDs from the URL on first visit and stores them.
 * First-touch attribution: keeps the first UTMs unless expired.
 */
export function useUtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const incoming: UtmData = {};
      let hasAny = false;

      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"].forEach((k) => {
        const v = params.get(k);
        if (v) {
          (incoming as any)[k] = v;
          hasAny = true;
        }
      });

      if (!hasAny) return;

      const stored = getStoredUtms();
      // First-touch: only overwrite if expired or empty
      if (!stored || isExpired(stored)) {
        incoming.landing_url = window.location.href;
        incoming.captured_at = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
      }
    } catch (e) {
      // ignore
    }
  }, []);
}

export function getStoredUtms(): UtmData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as UtmData;
    if (isExpired(data)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function isExpired(data: UtmData): boolean {
  if (!data.captured_at) return false;
  const ageMs = Date.now() - data.captured_at;
  return ageMs > TTL_DAYS * 24 * 60 * 60 * 1000;
}

export function clearUtms() {
  localStorage.removeItem(STORAGE_KEY);
}
