import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useUserRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_roles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []).map((r) => r.role as AppRole);
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useHasPermission(permission: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["has_permission", user?.id, permission],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_permission", {
        _user_id: user!.id,
        _permission: permission,
      });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useHasRole(role: AppRole) {
  const roles = useUserRoles();
  return {
    hasRole: roles.data?.includes(role) ?? false,
    isLoading: roles.isLoading,
  };
}

// Map routes to required permissions
// Only admin page requires special permission - all other pages are accessible to authenticated producers
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin": "gerenciar_roles",
};
