import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "queenify_visitor_id";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
  };
}

export function usePageTracking(ownerId?: string, productId?: string) {
  const location = useLocation();

  useEffect(() => {
    const utm = getUtmParams();
    supabase.from("page_views").insert({
      path: location.pathname,
      visitor_id: getVisitorId(),
      owner_id: ownerId || null,
      product_id: productId || null,
      referrer: document.referrer || null,
      ...utm,
    } as any).then(() => {});
  }, [location.pathname, ownerId, productId]);
}

export async function trackPageView(path: string, ownerId?: string, productId?: string) {
  const utm = getUtmParams();
  await supabase.from("page_views").insert({
    path,
    visitor_id: getVisitorId(),
    owner_id: ownerId || null,
    product_id: productId || null,
    referrer: document.referrer || null,
    ...utm,
  } as any);
}
