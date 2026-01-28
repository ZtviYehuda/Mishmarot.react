import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function MainLayout() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const { alerts, loading, refreshAlerts } = useNotifications();
  const location = useLocation();
  // Sidebar closed by default on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Auto-open sidebar on desktop (lg breakpoint)
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { name: "לוח בקרה", path: "/", icon: LayoutDashboard },
    { name: "מעקב נוכחות", path: "/attendance", icon: CalendarDays },
    { name: "ניהול שוטרים", path: "/employees", icon: Users },
    { name: "בקשות העברה", path: "/transfers", icon: ArrowLeftRight },
    { name: "הגדרות", path: "/settings", icon: Settings },
  ];

  return (
    <div
      className="h-screen bg-background flex font-sans text-foreground transition-colors duration-300 overflow-hidden"
      dir="rtl"
    >
      {/* Sidebar - Official White Style */}
      <aside
        className={cn(
          "bg-card border-l border-border transition-all duration-300 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed lg:sticky top-0 h-screen overflow-hidden",
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-0 lg:w-16 -translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-border/50 justify-between">
          <div className="flex items-center gap-3 overflow-hidden text-right">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-black text-foreground text-sm tracking-tight leading-none">
                  gov.il
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1">
                  פורטל יחידה
                </span>
              </div>
            )}
          </div>
          {/* Close button for mobile sidebar */}
          <button
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow p-2.5 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-primary",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-105",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary",
                  )}
                />
                {(isSidebarOpen || window.innerWidth < 1024) && (
                  <span className="text-sm font-bold tracking-tight truncate flex-1 text-right">
                    {item.name}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-1 w-1 h-5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/50 space-y-3">
          {/* User Profile Area */}
          {isSidebarOpen ? (
            <Link
              to={`/settings`}
              onClick={() => {
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-primary font-black text-[10px] shrink-0">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </div>
              <div className="flex flex-col min-w-0 text-right">
                <span className="text-xs font-black text-foreground truncate leading-none mb-1">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground truncate uppercase tracking-tighter">
                  {user?.is_admin ? "Administrator" : "Commander"}
                </span>
              </div>
            </Link>
          ) : (
            <Link
              to={`/settings`}
              className="flex justify-center transition-transform hover:scale-105"
            >
              <div className="w-9 h-9 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center text-primary font-black text-[10px] shadow-sm">
                {user?.first_name?.[0]}
              </div>
            </Link>
          )}

          {/* Quick Actions Row */}
          <div className="flex items-center gap-1.5 px-0.5">
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
              className="flex-grow h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-all border border-transparent hover:border-border"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={logout}
              title="Logout"
              className="flex-grow h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all border border-transparent hover:border-destructive/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Topbar - Professional governmental banner style */}
        <header className="h-14 sm:h-16 bg-card border-b border-border px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all shrink-0 relative",
                !isSidebarOpen && "animate-pulse",
              )}
              aria-label="תפריט ניווט"
            >
              <Menu className="w-4 h-4" />
              {!isSidebarOpen && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2 lg:hidden">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </button>
            <div className="h-4 sm:h-5 w-px bg-border hidden sm:block" />
            <div className="flex flex-col text-right min-w-0">
              <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-0.5 sm:mb-1 hidden sm:block">
                Security Hub
              </span>
              <h2 className="text-xs sm:text-sm font-black text-foreground truncate">
                {location.pathname === "/"
                  ? "לוח בקרה מרכזי"
                  : navItems.find((n) => n.path === location.pathname)?.name ||
                  "דף מערכת"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Notifications Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-muted/50 border border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-destructive text-[9px] sm:text-[10px] font-black text-destructive-foreground ring-2 ring-card transition-transform animate-in zoom-in">
                      {alerts.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0 overflow-hidden rounded-2xl border-border shadow-2xl"
                align="start"
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
                  <span className="text-xs font-black text-foreground text-right">
                    מרכז התראות ({alerts.length})
                  </span>
                  <button
                    onClick={refreshAlerts}
                    className="text-[10px] font-black text-primary hover:underline"
                  >
                    רענן רשימה
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-muted/50">
                  {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 opacity-50">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-xs font-bold">בודק עדכונים...</span>
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4 opacity-50">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-foreground">
                          שיגרה מלאה
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          אין התראות חדשות המצריכות טיפול
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {alerts.map((alert) => (
                        <Link
                          key={alert.id}
                          to={alert.link}
                          className="p-4 flex gap-4 hover:bg-card transition-colors border-b border-border last:border-0 group"
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              alert.type === "danger"
                                ? "bg-destructive/10 text-destructive"
                                : alert.type === "warning"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-primary/10 text-primary",
                            )}
                          >
                            {alert.type === "danger" ? (
                              <X className="w-5 h-5" />
                            ) : alert.type === "warning" ? (
                              <AlertTriangle className="w-5 h-5" />
                            ) : (
                              <Info className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                              {alert.title}
                            </p>
                            <p className="text-[11px] font-bold text-muted-foreground leading-tight mt-1">
                              {alert.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {alerts.length > 0 && (
                  <div className="p-3 bg-card border-t border-border text-center">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      נא לטפל בבקשות הממתינות בהקדם
                    </span>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <div className="h-4 sm:h-5 w-px bg-border hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Active Secure Hub
              </span>
            </div>
          </div>
        </header>

        {/* Content Page */}
        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 flex-grow overflow-auto bg-background transition-colors">
          <div className="w-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
