import { ReactNode, forwardRef, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = forwardRef<HTMLDivElement, DashboardLayoutProps>(({ children }, ref) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  useRealtimeNotifications();

  return (
    <div ref={ref} className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isMobile ? (
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <DashboardSidebar onNavigate={() => setSidebarOpen(false)} onOpenSupport={() => { setSidebarOpen(false); setSupportOpen(true); }} />
        </div>
      ) : (
        <DashboardSidebar onOpenSupport={() => setSupportOpen(true)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} supportOpen={supportOpen} onSupportChange={setSupportOpen} />
        <main className="dashboard-main flex-1 min-w-0 p-4 sm:p-6 xl:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
});

DashboardLayout.displayName = "DashboardLayout";

export default DashboardLayout;
