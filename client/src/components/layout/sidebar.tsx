import { TrendingUp, LayoutDashboard, Briefcase, Heart, Newspaper, Activity, Target, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "#", active: true },
  { icon: Briefcase, label: "Portfolio", href: "#", active: false },
  { icon: Heart, label: "Watchlist", href: "#", active: false },
  { icon: Newspaper, label: "Market News", href: "#", active: false },
  { icon: Activity, label: "Sentiment Tracker", href: "#", active: false },
  { icon: Target, label: "Alpha Signals", href: "#", active: false },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Neufin</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Sentiment Intelligence</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                item.active 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer group">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-accent-foreground">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-username">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">Premium Member</p>
          </div>
          <button
            onClick={logout}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid="button-logout"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}
