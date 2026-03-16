import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Eye, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "./NotificationsDropdown";

export const AppLayout = () => {
  const { user, isAdmin, hasFinanceViewOnly, hasAdminViewOnly, signOut } = useAuth();
  const isViewOnlyMode = hasFinanceViewOnly || hasAdminViewOnly;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border/50 bg-card/80 shadow-card sticky top-0 z-50 backdrop-blur-md h-14 flex items-center px-4 gap-4">
            <SidebarTrigger />

            <div className="flex-1" />

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{user.email}</span>
                  {isAdmin && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded font-medium">
                      Admin
                    </span>
                  )}
                  {isViewOnlyMode && (
                    <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-medium">
                      <Eye className="w-3 h-3" />
                      Leitura
                    </span>
                  )}
                </div>
                <NotificationsDropdown />
                <Button variant="outline" size="sm" onClick={handleSignOut} className="border-border/50 hover:border-primary hover:text-primary">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate("/auth")} size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                Entrar
              </Button>
            )}
          </header>

          {/* Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
