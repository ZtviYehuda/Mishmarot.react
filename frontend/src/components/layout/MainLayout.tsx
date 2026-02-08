import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
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
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  Circle,
  Clock,
  History,
  Undo2,
  Thermometer,
  MessageCircle,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { ThemeToggle } from "./ThemeToggle";
import { InternalMessageDialog } from "@/components/dashboard/InternalMessageDialog";
import { SickLeaveDetailsDialog } from "@/components/dashboard/SickLeaveDetailsDialog";
import { toast } from "sonner";
import { Send, Eye, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function getAlertConfig(alert: {
  id: string;
  title: string;
  description: string;
  type: string;
}) {
  const text = (alert.title + alert.description).toLowerCase();
  const isTransfer = alert.id.includes("transfer") || text.includes("העברה");
  const isSick = alert.id.includes("sick") || text.includes("מחלה");
  const isMessage = alert.id.startsWith("msg-");

  if (isTransfer) {
    return {
      icon: ArrowLeftRight,
      bg: "rgba(59, 130, 246, 0.1)",
      color: "rgb(59, 130, 246)",
    }; // Blue
  }
  if (isSick) {
    return {
      icon: Thermometer,
      bg: "rgba(239, 68, 68, 0.1)",
      color: "rgb(239, 68, 68)",
    }; // Red
  }
  if (isMessage) {
    return {
      icon: Megaphone,
      bg: "rgba(59, 130, 246, 0.1)",
      color: "rgb(59, 130, 246)",
    };
  }

  // Default fallback based on type
  if (alert.type === "danger")
    return {
      icon: AlertTriangle,
      bg: "rgba(239, 68, 68, 0.1)",
      color: "rgb(239, 68, 68)",
    };
  if (alert.type === "warning")
    return {
      icon: AlertTriangle,
      bg: "rgba(245, 158, 11, 0.1)",
      color: "rgb(245, 158, 11)",
    };

  return {
    icon: Info,
    bg: "rgba(59, 130, 246, 0.1)",
    color: "rgb(59, 130, 246)",
  };
}

export default function MainLayout() {
  const { user, logout } = useAuthContext();

  const {
    alerts,
    history,
    loading: loadingNotifs,
    loadingHistory,
    unreadCount,
    readIds,
    refreshAlerts,
    fetchHistory,
    markAllAsRead,
    toggleRead,
    markAsUnread,
  } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  // Sidebar closed by default on mobile and desktop
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [notificationTab, setNotificationTab] = React.useState<
    "active" | "history"
  >("active");
  const [msgDialogOpen, setMsgDialogOpen] = React.useState(false);
  const [selectedAlert, setSelectedAlert] = React.useState<any>(null);
  const [msgRecipient, setMsgRecipient] = React.useState<{
    id: number;
    name: string;
  } | null>(null);

  const [sickModalOpen, setSickModalOpen] = React.useState(false);
  const [sickEmployees, setSickEmployees] = React.useState<any[]>([]);

  // Check for critical morning alerts
  React.useEffect(() => {
    if (!user) return;
    // logic removed for specific critical alert state as it was unused
  }, [alerts, user]);

  const [msgDefaults, setMsgDefaults] = React.useState({
    title: "",
    description: "",
  });

  // Effect to track shown alerts to prevent duplicate toasts
  const shownAlertsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    alerts.forEach((alert) => {
      if (
        alert.id.startsWith("msg-") &&
        !shownAlertsRef.current.has(alert.id)
      ) {
        shownAlertsRef.current.add(alert.id);
        toast(alert.title, {
          description: alert.description,
          duration: 5000,
        });
      }
    });
  }, [alerts, user]);

  // Handle window resize - keep closed by default unless user interacts
  React.useEffect(() => {
    const handleResize = () => {
      // Logic removed to enforce "default closed" behavior requested by user
      // Sidebar will stay in whatever state the user left it, or default to false on load
    };
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
      className="h-screen bg-background flex font-sans text-foreground overflow-hidden"
      dir="rtl"
    >
      {/* Sidebar - Official White Style */}
      <aside
        className={cn(
          "bg-card border-l border-border flex flex-col z-[100] shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed lg:sticky top-0 h-[100dvh] overflow-hidden transition-all duration-300 ease-in-out",
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-0 lg:w-20 -translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div
          className={cn(
            "h-20 flex items-center border-b border-border/50 transition-all duration-300",
            isSidebarOpen ? "px-4 justify-between" : "justify-center",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden transition-all duration-300",
              isSidebarOpen ? "w-auto text-right" : "w-full justify-center",
            )}
            onDoubleClick={() => setIsSidebarOpen(true)}
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src="/organization-logo.jpg"
                alt="Organization Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden",
                  );
                }}
              />
              <div className="hidden w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <div
              className={cn(
                "flex flex-col transition-all duration-300",
                isSidebarOpen
                  ? "opacity-100 w-auto"
                  : "opacity-0 w-0 overflow-hidden",
              )}
            >
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1 whitespace-nowrap">
                פורטל יחידה
              </span>
            </div>
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
                onClick={() => setIsSidebarOpen(false)}
                onDoubleClick={() => setIsSidebarOpen(true)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden select-none",
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-primary",
                )}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-105",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary",
                    !isSidebarOpen && "mx-auto",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-bold tracking-tight truncate flex-1 text-right transition-all duration-300",
                    isSidebarOpen
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-10 absolute right-12 w-0",
                  )}
                >
                  {item.name}
                </span>
                {isActive && (
                  <div className="absolute left-1 w-1 h-5 bg-primary rounded-full transition-opacity duration-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/50 space-y-3">
          {/* User Profile Area */}
          <Link
            to={`/settings`}
            onClick={() => setIsSidebarOpen(false)}
            onDoubleClick={() => setIsSidebarOpen(true)}
            className={cn(
              "flex items-center gap-3 rounded-xl transition-all select-none",
              isSidebarOpen
                ? "p-2 bg-muted/30 border border-border/50 hover:bg-muted/50"
                : "justify-center p-0 border-0 hover:scale-105",
            )}
          >
            <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-primary font-black text-[10px] shrink-0 shadow-sm">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </div>
            <div
              className={cn(
                "flex flex-col min-w-0 text-right transition-all duration-300",
                isSidebarOpen
                  ? "opacity-100 w-auto"
                  : "opacity-0 w-0 overflow-hidden",
              )}
            >
              <span className="text-xs font-black text-foreground truncate leading-none mb-1">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground truncate uppercase tracking-tighter">
                {user?.is_admin ? "Administrator" : "Commander"}
              </span>
            </div>
          </Link>

          {/* Quick Actions Row */}
          <div
            className={cn(
              "flex items-center gap-1.5",
              isSidebarOpen ? "px-0.5" : "flex-col",
            )}
          >
            <ThemeToggle collapsed={!isSidebarOpen} />
            <button
              onClick={() => logout()}
              title="Logout"
              className="flex-grow w-full h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all border border-transparent hover:border-destructive/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div
        className="flex-grow flex flex-col min-w-0"
        onClick={() => {
          // Close sidebar when clicking main content on desktop if it's open
          if (isSidebarOpen && window.innerWidth >= 1024) {
            setIsSidebarOpen(false);
          }
        }}
      >
        <header className="h-20 bg-card border-b border-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-none flex-none">
          <div className="flex items-center gap-2 lg:gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted rounded-lg shrink-0 relative",
                !isSidebarOpen && "animate-pulse",
              )}
              aria-label="תפריט ניווט"
            >
              <Menu className="w-5 h-5" />
              {!isSidebarOpen && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2 lg:hidden">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 md:gap-5 flex-1 min-w-0">
              <div className="flex flex-col text-right border-r-[3px] border-primary pr-3 md:pr-5 leading-none flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] md:text-[11px] font-black text-primary uppercase tracking-[0.1em] md:tracking-[0.15em] leading-none truncate">
                    מוקד שליטה ובקרה
                  </span>
                  <div className="flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] shrink-0" />
                </div>
                <h2 className="text-lg md:text-xl font-black text-foreground tracking-tight py-0.5 leading-none truncate">
                  {location.pathname === "/"
                    ? "לוח בקרה מרכזי"
                    : navItems.find((n) => n.path === location.pathname)
                        ?.name || "דף מערכת"}
                </h2>
              </div>

              <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 shrink-0 overflow-hidden rounded-lg bg-white/50 border border-border/50 shadow-sm ml-2">
                <img
                  src="/unit-logo.jpg"
                  alt="Unit Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Notifications Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-muted/50 border border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[9px] sm:text-[10px] font-black text-primary-foreground ring-2 ring-card shadow-lg shadow-primary/40 animate-in zoom-in duration-300">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[90vw] sm:w-[450px] p-0 overflow-hidden rounded-2xl border-border shadow-2xl mr-2"
                align="start"
              >
                <div className="p-4 border-b border-border bg-card sticky top-0 z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground text-right">
                        מרכז התראות
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black">
                        {notificationTab === "active"
                          ? alerts.length
                          : history.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {notificationTab === "active" && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          סמן הכל כנקרא
                        </button>
                      )}
                      <button
                        onClick={
                          notificationTab === "active"
                            ? refreshAlerts
                            : fetchHistory
                        }
                        className="text-[10px] font-black text-muted-foreground hover:text-primary hover:underline"
                      >
                        רענן רשימה
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 border-b border-border -mb-px">
                    <button
                      onClick={() => setNotificationTab("active")}
                      className={cn(
                        "flex-1 px-3 py-2 text-[11px] font-black rounded-t-lg transition-all",
                        notificationTab === "active"
                          ? "bg-background text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      פעילות ({alerts.length})
                    </button>
                    <button
                      onClick={() => {
                        setNotificationTab("history");
                        fetchHistory();
                      }}
                      className={cn(
                        "flex-1 px-3 py-2 text-[11px] font-black rounded-t-lg transition-all",
                        notificationTab === "history"
                          ? "bg-background text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      היסטוריה ({history.length})
                    </button>
                  </div>
                </div>
                <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar bg-muted/50">
                  {notificationTab === "active" ? (
                    loadingNotifs ? (
                      <div className="p-12 flex flex-col items-center justify-center gap-3 opacity-50">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-xs font-bold">
                          בודק עדכונים...
                        </span>
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
                        {alerts.map((alert) => {
                          const isRead = readIds.includes(alert.id);
                          const config = getAlertConfig(alert);
                          const Icon = config.icon;
                          const isMorningReport =
                            alert.title?.includes("דיווח בוקר") ||
                            alert.description?.includes("דיווח בוקר");

                          return (
                            <div
                              key={alert.id}
                              className={cn(
                                "p-3 sm:p-4 flex flex-row-reverse gap-3 sm:gap-4 hover:bg-card transition-all border-b border-border last:border-0 group relative cursor-pointer",
                                isRead && "opacity-60 grayscale-[0.3]",
                              )}
                              dir="rtl"
                              onClick={(e) => {
                                // Default click handler for the whole row
                                if ((e.target as HTMLElement).closest("button"))
                                  return; // Ignore button clicks

                                if (isMorningReport) {
                                  navigate("/attendance", {
                                    state: {
                                      openBulkModal: true,
                                      alertData: (alert as any).data,
                                    },
                                  });
                                } else if (
                                  (alert as any).data?.sick_employees
                                ) {
                                  setSickEmployees(
                                    (alert as any).data.sick_employees,
                                  );
                                  setSickModalOpen(true);
                                  // Do not mark as read - keep active until resolved
                                } else {
                                  navigate(alert.link);
                                  // Auto-mark as read for navigation alerts
                                  if (!isRead) toggleRead(alert.id);
                                }
                              }}
                            >
                              <div
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
                                style={{
                                  backgroundColor: config.bg,
                                  color: config.color,
                                }}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0 text-right">
                                <div className="flex items-center justify-start gap-2">
                                  {!isRead && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                  )}
                                  <p
                                    className={cn(
                                      "text-xs font-black transition-colors",
                                      isRead
                                        ? "text-muted-foreground"
                                        : "text-foreground group-hover:text-primary",
                                    )}
                                  >
                                    {alert.title}
                                  </p>
                                </div>
                                <p
                                  className={cn(
                                    "text-[11px] font-bold leading-tight mt-1",
                                    isRead
                                      ? "text-muted-foreground/60"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {alert.description}
                                </p>
                              </div>
                              {/* Internal Message Button */}
                              {isMorningReport &&
                                (alert as any).data?.commander_id &&
                                user?.id !==
                                  (alert as any).data.commander_id && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setMsgRecipient({
                                        id: (alert as any).data.commander_id,
                                        name: (alert as any).data
                                          .commander_name,
                                      });
                                      setMsgDefaults({
                                        title: "דיווח בוקר טרם הושלם",
                                        description: `שלום ${(alert as any).data.commander_name}, טרם הושלם דיווח בוקר עבור ${(alert as any).data.missing_count} שוטרים ביחידתך. נא להשלים את הדיווח בהקדם.`,
                                      });
                                      setMsgDialogOpen(true);
                                    }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-blue-600 hover:bg-blue-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0 mr-1"
                                    title="שלח התראה פנימית"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                              {/* WhatsApp Reminder Button */}
                              {isMorningReport &&
                                (alert as any).data?.commander_phone &&
                                user?.id !==
                                  (alert as any).data.commander_id && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const phone = (
                                        alert as any
                                      ).data.commander_phone
                                        .replace(/-/g, "")
                                        .replace(/^0/, "972");
                                      const name = (alert as any).data
                                        .commander_name;
                                      const count = (alert as any).data
                                        .missing_count;
                                      const text = `שלום ${name}, טרם הושלם דיווח בוקר עבור ${count} שוטרים ביחידתך. נא להשלים את הדיווח בהקדם.`;
                                      window.open(
                                        `https://wa.me/${phone}?text=${encodeURIComponent(
                                          text,
                                        )}`,
                                        "_blank",
                                      );
                                    }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-emerald-600 hover:bg-emerald-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0 mr-1"
                                    title="שלח תזכורת בווטסאפ"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if ((alert as any).data?.sick_employees) {
                                    setSickEmployees(
                                      (alert as any).data.sick_employees,
                                    );
                                    setSickModalOpen(true);
                                    // Do not mark as read
                                  } else {
                                    setSelectedAlert(alert);
                                    if (!isRead) toggleRead(alert.id);
                                  }
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-blue-600 hover:bg-blue-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0 mr-1"
                                title="פתח הודעה"
                              >
                                {alert.title.includes("הודעה") ? (
                                  <Mail className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleRead(alert.id);
                                }}
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0",
                                  isRead
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-primary hover:bg-muted",
                                )}
                                title={isRead ? "סמן כלא נקרא" : "סמן כנקרא"}
                              >
                                {isRead ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Circle className="w-4 h-4 opacity-30" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : loadingHistory ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 opacity-50">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-xs font-bold">
                        טוען היסטוריה...
                      </span>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4 opacity-50">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <History className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-foreground">
                          אין היסטוריה
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          לא נמצאו התראות שנקראו
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {history.map((alert) => {
                        const config = getAlertConfig(alert);
                        const Icon = config.icon;

                        return (
                          <div
                            key={alert.id}
                            className="p-4 flex flex-row-reverse gap-4 bg-muted/30 border-b border-border last:border-0 opacity-70 hover:opacity-100 transition-opacity group"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 grayscale opacity-70"
                              style={{
                                backgroundColor: config.bg,
                                color: config.color,
                              }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-right">
                              <h4 className="text-xs font-black text-foreground mb-1 leading-tight">
                                {alert.title}
                              </h4>
                              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                                {alert.description}
                              </p>
                              {alert.read_at && (
                                <p className="text-[9px] font-bold text-muted-foreground mt-2 flex items-center gap-1 justify-end">
                                  <Clock className="w-3 h-3" />
                                  נקרא:{" "}
                                  {new Date(
                                    alert.read_at.endsWith("Z")
                                      ? alert.read_at
                                      : alert.read_at + "Z",
                                  ).toLocaleString("he-IL", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                              <button
                                onClick={() => markAsUnread(alert.id)}
                                title="סמן כלא נקרא"
                                className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {alerts.length > 0 && notificationTab === "active" && (
                  <div className="p-3 bg-card border-t border-border text-center">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      נא לטפל בבקשות הממתינות בהקדם
                    </span>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <div className="h-4 sm:h-5 w-px bg-border hidden sm:block" />

            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm transition-all hover:bg-emerald-500/10">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                מערכת במצב פעיל
              </span>
            </div>
          </div>
        </header>

        {/* Content Page */}
        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 flex-grow overflow-auto bg-background">
          <div className="w-full max-w-full">
            <Outlet context={{ isSidebarOpen }} />
          </div>
        </main>
        {/* Impersonation Banner */}
        <ImpersonationBanner />

        <InternalMessageDialog
          open={msgDialogOpen}
          onOpenChange={setMsgDialogOpen}
          recipient={msgRecipient}
          defaultTitle={msgDefaults.title}
          defaultDescription={msgDefaults.description}
        />

        <SickLeaveDetailsDialog
          open={sickModalOpen}
          onOpenChange={setSickModalOpen}
          employees={sickEmployees}
        />

        <Dialog
          open={!!selectedAlert}
          onOpenChange={(open) => !open && setSelectedAlert(null)}
        >
          <DialogContent className="max-w-[90vw] sm:max-w-md p-4 sm:p-6">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={
                    selectedAlert
                      ? {
                          backgroundColor: getAlertConfig(selectedAlert).bg,
                          color: getAlertConfig(selectedAlert).color,
                        }
                      : {}
                  }
                >
                  {selectedAlert &&
                    React.createElement(getAlertConfig(selectedAlert).icon, {
                      className: "w-5 h-5",
                    })}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-lg font-black text-foreground">
                    {selectedAlert?.title}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground font-bold">
                    {selectedAlert?.created_at &&
                      new Date(selectedAlert.created_at).toLocaleString(
                        "he-IL",
                      )}
                  </p>
                </div>
              </div>
            </DialogHeader>
            <div className="bg-muted/30 p-4 rounded-xl border border-border mt-2">
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-foreground">
                {selectedAlert?.description}
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedAlert(null)}
                className="flex-1 rounded-xl font-bold"
              >
                סגור
              </Button>
              {selectedAlert?.link && (
                <Button
                  className="flex-1 rounded-xl font-bold"
                  onClick={() => {
                    navigate(selectedAlert.link);
                    setSelectedAlert(null);
                  }}
                >
                  למעבר לעמוד
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
