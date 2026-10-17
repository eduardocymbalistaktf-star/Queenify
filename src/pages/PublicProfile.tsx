import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Youtube, ExternalLink, Package } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Settings {
  social_instagram: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      const [profileRes, settingsRes, productsRes] = await Promise.all([
        supabase.from("profiles_public").select("display_name, avatar_url, bio").eq("user_id", userId).maybeSingle(),
        supabase.rpc("get_public_profile_settings", { _user_id: userId }),
        supabase.from("products_public").select("id, name, description, price, image_url, category").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      if (!profileRes.data) {
        setNotFound(true);
      } else {
        setProfile(profileRes.data);
        setSettings((settingsRes.data as unknown as Settings) || null);
        setProducts(productsRes.data || []);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <BrandLogo size="medium" alt="" className="mx-auto mb-4 opacity-70" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Perfil não encontrado</h1>
          <p className="text-sm text-muted-foreground mb-4">Este produtor não existe ou foi removido.</p>
          <Link to="/login" className="text-sm text-primary hover:text-primary/80 font-medium">← Ir para o login</Link>
        </div>
      </div>
    );
  }

  const initials = (profile?.display_name || "??").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="small" alt="" />
            <span className="font-display text-lg font-bold text-foreground">Queenify</span>
          </Link>
        </div>
      </header>

      {/* Profile hero */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border-2 border-primary/30 mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {initials}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {profile?.display_name || "Produtor"}
          </h1>
          {profile?.bio && (
            <p className="text-sm text-muted-foreground max-w-md mt-2">{profile.bio}</p>
          )}

          {/* Social links */}
          {settings && (settings.social_instagram || settings.social_youtube || settings.social_tiktok) && (
            <div className="flex items-center gap-3 mt-4">
              {settings.social_instagram && (
                <a href={`https://instagram.com/${settings.social_instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.social_youtube && (
                <a href={settings.social_youtube.startsWith("http") ? settings.social_youtube : `https://youtube.com/${settings.social_youtube}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {settings.social_tiktok && (
                <a href={`https://tiktok.com/${settings.social_tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Products */}
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Produtos ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Este produtor ainda não publicou nenhum produto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="glass-card overflow-hidden hover:border-primary/30 transition-colors">
                  {p.image_url ? (
                    <div className="h-40 bg-secondary">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-40 bg-secondary flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-4">
                    {p.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mb-2 inline-block">{p.category}</span>
                    )}
                    <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{p.name}</h3>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                    )}
                    <p className="text-lg font-bold text-primary">
                      R$ {Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <BrandLogo size="small" alt="" className="opacity-60" />
          Powered by Queenify
        </div>
      </footer>
    </div>
  );
};

export default PublicProfile;
