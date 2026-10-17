import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sales",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const sale = payload.new as any;
          toast.success("💰 Nova venda!", {
            description: `R$ ${Number(sale.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — ${sale.buyer_email}`,
          });
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chargebacks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const cb = payload.new as any;
          toast.error("⚠️ Chargeback recebido!", {
            description: `R$ ${Number(cb.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — ${cb.reason || "Sem motivo informado"}`,
          });
          queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as any;
          toast.info(notif.title, {
            description: notif.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
