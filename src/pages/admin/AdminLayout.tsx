import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import DarkModeToggle from "@/components/DarkModeToggle";
import { Button } from "@/components/ui/button";
import { LogOut, Briefcase } from "lucide-react";
import AdminAuthDebug from "@/components/AdminAuthDebug";

export default function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading, error: roleError, retry: retryRole } = useUserRole(user?.id);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
          <Briefcase className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (roleError) {
    return (
      <AdminAuthDebug
        email={user.email}
        userId={user.id}
        message="Die Admin-Rolle konnte nicht geladen werden. Bitte prüfe die Debug-Logs und lade die Rolle erneut."
        code={roleError.code}
        details={roleError.details || roleError.message}
        onRetry={retryRole}
      />
    );
  }
  if (!isAdmin) {
    return (
      <AdminAuthDebug
        email={user.email}
        userId={user.id}
        message="Dieses Konto hat aktuell keine Admin-Rolle und darf den Admin-Bereich nicht öffnen."
        details="Erwartet wird ein Eintrag in user_roles mit role = admin."
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 px-3 gap-2">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <DarkModeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Abmelden" className="h-9 w-9">
              <LogOut className="w-4 h-4" />
            </Button>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
