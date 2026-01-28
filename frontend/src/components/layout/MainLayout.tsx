import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MainLayout() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { name: "לוח בקרה", path: "/", icon: LayoutDashboard },
    { name: "ניהול שוטרים", path: "/employees", icon: Users },
    { name: "בקשות העברה", path: "/transfers", icon: ArrowLeftRight },
    { name: "מעקב נוכחות", path: "/attendance", icon: CalendarDays },
    { name: "הגדרות", path: "/settings", icon: Settings },
  ];

  return (
    <div
      className="min-h-screen bg-background flex font-sans text-foreground transition-colors duration-300"
      dir="rtl"
    >
      {/* Sidebar - Official White Style */}
      <aside
        className={cn(
          "bg-white border-l border-slate-200 transition-all duration-300 flex flex-col z-50 dark:bg-card dark:border-border shadow-[4px_0_24px_rgba(0,0,0,0.02)] sticky top-0 h-screen overflow-hidden",
          isSidebarOpen ? "w-64" : "w-16",
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-border/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-black text-[#001e30] text-sm tracking-tight dark:text-white leading-none">
                  gov.il
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1">
                  פורטל יחידה
                </span>
              </div>
            )}
          </div>
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
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-slate-500 hover:bg-slate-50 hover:text-primary dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-105",
                    isActive
                      ? "text-primary"
                      : "text-slate-400 group-hover:text-primary",
                  )}
                />
                {isSidebarOpen && (
                  <span className="text-sm font-bold tracking-tight truncate">
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
        <div className="p-3 border-t border-slate-100 dark:border-border/50 space-y-3">
          {/* User Profile Area */}
          {isSidebarOpen ? (
            <Link
              to={`/employees/${user?.id}`}
              className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 dark:bg-muted/30 dark:border-border/50 hover:bg-slate-100 dark:hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary font-black text-[10px] shrink-0 dark:bg-slate-800 dark:border-slate-700">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-[#001e30] truncate dark:text-white leading-none mb-1">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-tighter">
                  {user?.is_admin ? "Administrator" : "User"}
                </span>
              </div>
            </Link>
          ) : (
            <Link
              to={`/employees/${user?.id}`}
              className="flex justify-center transition-transform hover:scale-105"
            >
              <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-primary font-black text-[10px] dark:bg-slate-800 dark:border-slate-700 shadow-sm">
                {user?.first_name?.[0]}
              </div>
            </Link>
          )}

          {/* Quick Actions Row */}
          <div className="flex items-center gap-1.5 px-0.5">
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
              className="flex-grow h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-primary transition-all border border-transparent hover:border-slate-100 dark:hover:bg-muted dark:hover:border-border"
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
              className="flex-grow h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100/50 dark:hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Topbar - Professional governmental banner style */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 dark:bg-card dark:border-border shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
            >
              {isSidebarOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block dark:bg-border" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Navigation Node
              </span>
              <h2 className="text-sm font-black text-[#001e30] dark:text-white">
                {location.pathname === "/"
                  ? "לוח בקרה מרכזי"
                  : navItems.find((n) => n.path === location.pathname)?.name ||
                    "דף מערכת"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Active Secure Hub
              </span>
            </div>
          </div>
        </header>

        {/* Content Page */}
        <main className="p-8 flex-grow overflow-auto bg-background transition-colors">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
