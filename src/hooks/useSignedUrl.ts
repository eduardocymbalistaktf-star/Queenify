import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Gera signed URL pra arquivos em buckets privados (ex: documents).
 * Os buckets product-images/avatars permanecem públicos por decisão de produto
 * — use este helper apenas pra documentos KYC e arquivos sensíveis.
 *
 * @param bucket  Nome do bucket
 * @param path    Caminho do arquivo dentro do bucket
 * @param expiresIn Tempo de expiração em segundos (default 1h)
 */
export function useSignedUrl(bucket: string, path: string | null, expiresIn = 3600) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) { setUrl(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setError(error.message); setUrl(null); }
        else setUrl(data?.signedUrl ?? null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [bucket, path, expiresIn]);

  return { url, loading, error };
}

/** Versão imperativa pra usos pontuais (ex: download on-demand). */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    console.error("[useSignedUrl] erro:", error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
