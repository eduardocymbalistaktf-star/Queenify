import { useState, useRef, useEffect } from "react";
import { Plus, CalendarDays, ChevronDown } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import StatsCards from "@/components/StatsCards";
import SalesChart from "@/components/SalesChart";

import RecentActivity from "@/components/RecentActivity";
import TopAfiliados from "@/components/TopAfiliados";
import NovoProductSheet from "@/components/NovoProductSheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const dateOptions = ["Hoje", "Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"];

const Index = () => {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("Últimos 30 dias");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.display_name) setProfileName(data.display_name);
    });
  }, [user]);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Dashboard do Produtor</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Bem-vindo de volta, {profileName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Produtor"}!</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-secondary border border-border rounded-lg text-xs sm:text-sm text-foreground hover:bg-secondary/80 transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">{dateFilter}</span>
              <span className="sm:hidden">{dateFilter.replace("Últimos ", "")}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {dateDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
                {dateOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setDateFilter(opt); setDateDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors ${
                      dateFilter === opt ? "text-primary font-medium" : "text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setProductSheetOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 gradient-gold rounded-lg text-xs sm:text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      <StatsCards />

      <div className="mt-4">
        <SalesChart />
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TopAfiliados period={dateFilter} />
        <RecentActivity />
      </div>

      <NovoProductSheet open={productSheetOpen} onOpenChange={setProductSheetOpen} />
    </DashboardLayout>
  );
};

export default Index;
