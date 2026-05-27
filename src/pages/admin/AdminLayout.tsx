import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import AdminAuthDebug from "@/components/AdminAuthDebug";
import BrandLogo from "@/components/BrandLogo";
import AdminUserMenu from "@/components/admin/AdminUserMenu";

export default function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading, error: roleError, retry: retryRole } = useUserRole(user?.id);

  useEffect(() => {
    document.title = "Admin — Ledion Arbeitszeit";
  }, []);



  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandLogo size={56} />
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
          <header className="h-14 flex items-center border-b bg-card/90 backdrop-blur-xl sticky top-0 z-10 px-3 gap-2">
            <SidebarTrigger />
            <BrandLogo size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <AdminUserMenu email={user.email} onSignOut={signOut} />
          </header>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-accent to-brand-red opacity-70" />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
