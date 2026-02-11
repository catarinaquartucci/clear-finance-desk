import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CheckCircle, Users, Monitor, Zap } from "lucide-react";

const adminNavItems = [
  { icon: CheckCircle, label: "Aprovações", path: "/admin/aprovacoes" },
  { icon: Users, label: "Colaboradores", path: "/admin/colaboradores" },
  { icon: Monitor, label: "Equipamentos", path: "/admin/equipamentos" },
  { icon: Zap, label: "Automações", path: "/admin/automacoes" },
];

export const AdminNavigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-muted/50 border-b border-subtle">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto py-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all whitespace-nowrap rounded-md",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
