import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Product = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type Sale = Tables<"sales">;
export type UserSettings = Tables<"user_settings">;

export function useProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["products", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (product: Omit<ProductInsert, "user_id">) => {
      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Auto-create checkout link
      const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
      await supabase.from("checkout_links").insert({
        user_id: user!.id,
        product_id: data.id,
        name: "Checkout Principal",
        url: `${baseUrl}checkout/${data.id}`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["checkout_links"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"products"> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSales() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sales", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, products(name, category)")
        .order("sold_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUserSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserSettings | null;
    },
    enabled: !!user,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: TablesUpdate<"user_settings">) => {
      const { data, error } = await supabase
        .from("user_settings")
        .upsert({ ...updates, user_id: user!.id }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePageViews(ownerId?: string) {
  return useQuery({
    queryKey: ["page_views", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_views")
        .select("*")
        .order("created_at", { ascending: false }) as any;
      if (error) throw error;
      return data as Array<{ id: string; path: string; product_id: string | null; owner_id: string | null; visitor_id: string; referrer: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; created_at: string }>;
    },
    enabled: !!ownerId,
  });
}

export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard_stats", user?.id],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const { data: sales30d } = await supabase
        .from("sales")
        .select("amount, sold_at, status")
        .gte("sold_at", thirtyDaysAgo.toISOString())
        .eq("status", "completed");

      const { data: salesToday } = await supabase
        .from("sales")
        .select("amount")
        .gte("sold_at", today.toISOString())
        .eq("status", "completed");

      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const total30d = (sales30d || []).reduce((sum, s) => sum + Number(s.amount), 0);
      const totalToday = (salesToday || []).reduce((sum, s) => sum + Number(s.amount), 0);

      return {
        vendas30d: total30d,
        vendasHoje: totalToday,
        qtdVendasHoje: salesToday?.length || 0,
        totalProdutos: productCount || 0,
      };
    },
    enabled: !!user,
  });
}
