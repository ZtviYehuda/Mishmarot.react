import { useState, useEffect } from "react";
import {
  Activity,
  Laptop2,
  Search,
  Wifi,
  Cpu,
  AlertTriangle,
  Loader2,
  Archive,
  Download,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import apiClient from "@/config/api.client";

interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  action_type: string;
  description: string;
  created_at: string;
  ip_address: string;
  metadata: any;
  reason?: string;
  target_name?: string;
}

interface ArchiveFile {
  filename: string;
  size_kb: number;
  created_at: string;
}

export function AuditLogsSettings({ user }: any) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allActivity, setAllActivity] = useState<AuditLog[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [activeTab, setActiveTab] = useState<"my" | "all" | "suspicious">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  // Archive state
  const [archives, setArchives] = useState<ArchiveFile[]>([]);
  const [showArchives, setShowArchives] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const [myRes, allRes, suspRes, archRes] = await Promise.all([
          apiClient.get("/audit/my-activity"),
          user?.is_admin ? apiClient.get("/audit/all-activity") : Promise.resolve({ data: [] }),
          user?.is_admin ? apiClient.get("/audit/suspicious") : Promise.resolve({ data: [] }),
          user?.is_admin ? apiClient.get("/audit/archives") : Promise.resolve({ data: [] }),
        ]);

        setAuditLogs(myRes.data);
        setAllActivity(allRes.data);
        setSuspiciousActivity(suspRes.data);
        setArchives(archRes.data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [user]);

  const displayedLogs =
    activeTab === "my"
      ? auditLogs
      : activeTab === "all"
        ? allActivity
        : suspiciousActivity;

  const filteredLogs = displayedLogs.filter((log) => {
    let match = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = match && (
        log.description.toLowerCase().includes(q) ||
        (log.user_name || "").toLowerCase().includes(q) ||
        log.ip_address.toLowerCase().includes(q) ||
        log.action_type.toLowerCase().includes(q)
      );
    }
    if (dateFilter) {
      match = match && log.created_at.startsWith(dateFilter);
    }
    if (userFilter) {
      match = match && log.user_name === userFilter;
    }
    return match;
  });

  const uniqueUsers = Array.from(new Set(allActivity.map(l => l.user_name).filter(Boolean)));

  const handleDownloadArchive = async (filename: string) => {
    try {
      const response = await apiClient.get(`/audit/archives/${filename}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename.replace(".gz", ""));
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("הקובץ הורד בהצלחה");
    } catch {
      toast.error("שגיאה בהורדת הקובץ");
    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="w-full pb-24 lg:pb-0 space-y-8">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-foreground tracking-tight">
              יומן פעילות וניטור
            </h3>
          </div>
          {archives.length > 0 && (
            <button
              onClick={() => setShowArchives(!showArchives)}
              className={cn(
                "flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border transition-all",
                showArchives
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-muted-foreground hover:text-foreground border-border/40 hover:border-border"
              )}
            >
              <Archive className="w-3 h-3" />
              {archives.length} ארכיונים
            </button>
          )}
        </div>
        
        {/* Auto-rotation info banner */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/20 rounded-xl border border-border/20 text-[10px] text-muted-foreground font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
          ניהול אחסון: המערכת מעבירה לוגים מעל 7 ימים לארכיון דחוס באופן אוטומטי לשמירה על ביצועים.
        </div>

        {/* Archived Files Panel */}
        <AnimatePresence>
          {showArchives && archives.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/40 p-3 sm:p-4 space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                  קבצי ארכיון בשרת
                </p>
                <div className="grid gap-2">
                  {archives.map((a) => (
                    <div
                      key={a.filename}
                      className="flex items-center justify-between bg-background/60 rounded-xl border border-border/30 px-3 py-2.5 group hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] sm:text-xs font-bold text-foreground truncate">{a.filename}</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                            {a.size_kb} KB · {format(new Date(a.created_at), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDownloadArchive(a.filename)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/40 p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col gap-4">
          
          {/* Filter / Search Bar */}
          <div className="flex flex-col lg:flex-row justify-between gap-3 bg-muted/30 p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-border/40">
            <div className="flex-1 relative">
               <div className="absolute top-1/2 -translate-y-1/2 right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center pointer-events-none">
                 <Search className="w-3.5 h-3.5 text-primary" />
               </div>
               <input 
                 placeholder="חיפוש חופשי (IP, פעולה, מערכת)..." 
                 className="w-full h-11 sm:h-12 bg-background border border-border/40 rounded-[1rem] sm:rounded-2xl font-bold text-xs sm:text-sm shadow-sm pr-12 pl-4 focus:ring-4 focus:ring-primary/5 focus:outline-none placeholder:text-muted-foreground/60 transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
               <div className="relative flex-1 sm:w-44">
                  <select 
                    className="w-full h-11 sm:h-12 bg-background border border-border/40 rounded-[1rem] sm:rounded-2xl font-bold text-xs sm:text-sm text-foreground shadow-sm pl-8 pr-4 focus:ring-4 focus:ring-primary/5 appearance-none focus:outline-none transition-all"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "left 0.75rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.25em 1.25em",
                    }}
                  >
                    <option value="">כל המשתמשים</option>
                    {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
               </div>
               <div className="relative flex-1 sm:w-44">
                  <input 
                    type="date"
                    className="w-full h-11 sm:h-12 bg-background border border-border/40 rounded-[1rem] sm:rounded-2xl font-bold text-xs sm:text-sm text-foreground shadow-sm px-4 focus:ring-4 focus:ring-primary/5 [color-scheme:light] dark:[color-scheme:dark] focus:outline-none transition-all"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
               </div>
            </div>
          </div>

          {/* Log View Container */}
          <div className="bg-background/80 rounded-[1.5rem] sm:rounded-[2rem] border border-border/60 shadow-sm overflow-hidden flex flex-col h-[500px] sm:h-[600px]">
            {/* Console tabs */}
            <div className="flex bg-muted/30 px-2 sm:px-4 pt-4 border-b border-border/40 gap-1 sm:gap-2 overflow-x-auto custom-scrollbar flex-nowrap">
               <button onClick={() => setActiveTab("all")} className={cn("whitespace-nowrap px-4 py-2.5 text-[10px] font-black rounded-t-xl transition-all", activeTab === "all" ? "bg-background text-primary border-t border-x border-border/40" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                 Global.log
               </button>
               <button onClick={() => setActiveTab("my")} className={cn("whitespace-nowrap px-4 py-2.5 text-[10px] font-black rounded-t-xl transition-all", activeTab === "my" ? "bg-background text-emerald-600 dark:text-emerald-500 border-t border-x border-border/40" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                 System.log
               </button>
               <button onClick={() => setActiveTab("suspicious")} className={cn("whitespace-nowrap px-4 py-2.5 text-[10px] font-black rounded-t-xl transition-all", activeTab === "suspicious" ? "bg-red-500/5 text-red-600 dark:text-red-500 border-t border-x border-red-500/20" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                 Alerts.log
               </button>
            </div>

            {/* The Code/Log List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar flex flex-col gap-2 font-mono">
              {loadingLogs ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/60">Reading file stream...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-muted-foreground/60 border-2 border-dashed border-border/40 rounded-2xl m-2 bg-muted/10">
                  <Search className="w-8 h-8 opacity-20" />
                  <span className="text-[10px] sm:text-xs tracking-widest">NO_RECORDS_FOUND</span>
                </div>
              ) : (
                filteredLogs.map((log, i) => (
                  <AnimatedLogEntry key={`${log.id}-${i}`} log={log} index={i} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedLogEntry({ log, index }: { log: AuditLog, index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isFailed = log.reason || log.action_type === "FAILED_LOGIN";
  const isLogin = log.action_type === "LOGIN";

  // Parse Metadata
  const browser = log.metadata?.browser || "";
  const realIp = log.metadata?.real_ip || log.ip_address;
  const forwarded = log.metadata?.forwarded_for;
  const usernameAttempt = log.metadata?.username_attempt;

  // Derive OS/Browser icon/label
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(browser);
  const isWindows = /Windows/i.test(browser);
  const isMac = /Macintosh/i.test(browser);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.2) }}
      className={cn(
        "group flex flex-col rounded-2xl border transition-all cursor-pointer overflow-hidden mb-1",
        isFailed 
          ? "bg-red-500/5 hover:bg-red-500/[0.08] border-red-500/10" 
          : "bg-muted/20 hover:bg-muted/40 border-transparent hover:border-border/40",
        expanded && "bg-muted/50 border-border/40"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
            isFailed 
              ? "bg-red-500/10 border-red-500/20 text-red-600" 
              : isLogin 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                : "bg-primary/10 border-primary/20 text-primary"
          )}>
             {isFailed ? <AlertTriangle className="w-5 h-5" /> : isLogin ? <Laptop2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                isFailed ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-primary/5 border-primary/10 text-primary"
              )}>
                {log.action_type}
              </span>
              {log.user_name && <span className="text-xs font-black text-slate-700 dark:text-slate-300">@{log.user_name}</span>}
              {!log.user_name && usernameAttempt && <span className="text-xs font-black text-rose-500">@{usernameAttempt} (נכשל)</span>}
              <span className="text-[10px] font-bold text-muted-foreground opacity-60">
                {format(new Date(log.created_at), "HH:mm:ss")}
              </span>
            </div>
            
            <p className="text-[11px] sm:text-xs text-foreground/90 font-bold leading-relaxed truncate">
              {log.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
           <div className="hidden sm:flex flex-col items-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-mono font-bold text-muted-foreground">{realIp}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isMobile ? <Search className="w-3 h-3 text-muted-foreground" /> : <Cpu className="w-3 h-3 text-muted-foreground" />}
                <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px]">
                  {isWindows ? "Windows" : isMac ? "macOS" : isMobile ? "Mobile Device" : "Browser"}
                </span>
              </div>
           </div>
           <div className={cn(
             "w-7 h-7 rounded-full flex items-center justify-center bg-background/50 border border-border/40 transition-transform",
             expanded && "rotate-180"
           )}>
             <Search className="w-3 h-3 text-muted-foreground" />
           </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-border/20 bg-muted/30 overflow-hidden"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-2">
                <p className="font-black text-[9px] text-muted-foreground uppercase tracking-widest">Client Environment</p>
                <div className="bg-background/40 p-3 rounded-xl border border-border/20 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Browser/UA:</span>
                    <span className="font-bold text-foreground truncate ml-4" title={browser}>{browser || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device Type:</span>
                    <span className="font-bold text-foreground">{isMobile ? "Mobile" : "Desktop"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-black text-[9px] text-muted-foreground uppercase tracking-widest">Network Metadata</p>
                <div className="bg-background/40 p-3 rounded-xl border border-border/20 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source IP:</span>
                    <span className="font-bold text-primary">{realIp}</span>
                  </div>
                  {forwarded && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forwarded:</span>
                      <span className="font-bold text-amber-600 truncate ml-4">{forwarded}</span>
                    </div>
                  )}
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="font-bold text-foreground">{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss.SSS")}</span>
                  </div>
                </div>
              </div>

              {log.metadata && Object.keys(log.metadata).length > 0 && !log.metadata.browser && (
                <div className="col-span-1 md:col-span-2 space-y-2">
                   <p className="font-black text-[9px] text-muted-foreground uppercase tracking-widest">Extended Context (JSON)</p>
                   <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-400 overflow-x-auto text-[10px]">
                      {JSON.stringify(log.metadata, null, 2)}
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
