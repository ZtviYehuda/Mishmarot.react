import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import api from "@/config/api.client";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  MessageSquare,
  User,
  Search,
  ChevronLeft,
  LayoutDashboard,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { he } from "date-fns/locale";

interface DailyLog {
  id: number;
  first_name: string;
  last_name: string;
  status_name: string | null;
  status_color: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  note: string | null;
  team_name: string | null;
  section_name: string | null;
}

export function DailyAttendanceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && date) {
      fetchLogs();
    }
  }, [isOpen, date]);

  const fetchLogs = async () => {
    if (!date) return;
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await api.get(`/attendance/daily-log?date=${dateStr}`);
      setLogs(res.data);
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const fullName = `${log.first_name} ${log.last_name}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      return (
        fullName.includes(query) ||
        (log.team_name?.toLowerCase() || "").includes(query) ||
        (log.section_name?.toLowerCase() || "").includes(query) ||
        (log.status_name?.toLowerCase() || "").includes(query)
      );
    });
  }, [logs, searchQuery]);

  const handleEmployeeClick = (id: number) => {
    onClose();
    const dateStr = date ? format(date, "yyyy-MM-dd") : "";
    navigate(`/employees/${id}?date=${dateStr}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-[1300px] sm:max-w-none w-[95vw] h-[85vh] p-0 overflow-hidden bg-white dark:bg-slate-950 border shadow-2xl sm:rounded-[2rem] flex flex-col md:flex-row rtl"
        dir="rtl"
      >
        <DialogTitle className="sr-only">יומן נוכחות יומי</DialogTitle>

        {/* Sidebar (Appears on the right because of dir="rtl" + flex-row) */}
        <div className="w-full md:w-[380px] border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/30 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/10 shadow-sm">
                <LayoutDashboard className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight dark:text-white">
                  בקרת נוכחות
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">
                  Control Center
                </p>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-lg p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full"
                locale={he}
              />
            </div>

            {/* Stats Cards */}
            <div className="space-y-4">
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center justify-between group">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-primary uppercase tracking-wider">
                    דיווחו היום
                  </p>
                  <p className="text-4xl font-black dark:text-white tabular-nums">
                    {logs.filter((l) => l.status_name).length}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-primary/10 border-t-primary group-hover:rotate-180 transition-transform duration-1000 ease-in-out" />
              </div>

              <div className="p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    סה"כ כוח אדם
                  </p>
                  <p className="text-4xl font-black dark:text-white tabular-nums">
                    {logs.length}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transform rotate-3">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Section (Left side in RTL because of flex-row-reverse) */}
        <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative border-l border-slate-200 dark:border-white/10">
          {/* Top Sticky Header */}
          <header className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-30">
            <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-10">
              <div className="space-y-3">
                <div className="flex items-center gap-5">
                  <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.4)]" />
                  <h2 className="text-3xl font-black tracking-tighter dark:text-white">
                    יומן נוכחות
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-slate-500 font-bold pr-8">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-base">
                    {date
                      ? format(date, "EEEE, dd בMMMM yyyy", { locale: he })
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Search Control */}
              <div className="relative w-full 2xl:w-[500px] group">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-all" />
                <input
                  type="text"
                  placeholder="חפש שוטר, חוליה, פלגה..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pr-12 pl-6 text-base font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                />
              </div>
            </div>
          </header>

          {/* List Scrolling Area */}
          <div className="flex-1 overflow-y-auto p-10 md:p-14 custom-scrollbar">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center py-32 gap-8"
                >
                  <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                  <p className="text-2xl font-black text-slate-400 tracking-[0.2em] uppercase animate-pulse">
                    Synchronizing feed...
                  </p>
                </motion.div>
              ) : filteredLogs.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center py-32 text-center opacity-40"
                >
                  <Filter className="w-32 h-32 mb-8 text-slate-200" />
                  <h3 className="text-5xl font-black dark:text-white mb-4">
                    הרשימה ריקה
                  </h3>
                  <p className="text-2xl font-bold">
                    נסה לשנות את פרמטרי החיפוש או לבחור תאריך אחר
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-8 pb-12">
                  {filteredLogs.map((log, idx) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, scale: 0.95, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        delay: idx * 0.015,
                        type: "spring",
                        stiffness: 120,
                        damping: 20,
                      }}
                      onClick={() => handleEmployeeClick(log.id)}
                      className="group relative flex items-center p-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      {/* Interactive Avatar */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-black shrink-0 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        {log.first_name[0]}
                        {log.last_name[0]}
                      </div>

                      {/* Detailed Content */}
                      <div className="flex-1 min-w-0 mr-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xl font-black truncate dark:text-white group-hover:text-primary transition-colors pr-1">
                            {log.first_name} {log.last_name}
                          </h4>
                          {log.start_datetime && (
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                                Time In
                              </span>
                              <span className="text-sm font-black bg-primary/5 text-primary px-4 py-1.5 rounded-2xl border border-primary/10">
                                {format(new Date(log.start_datetime), "HH:mm")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                          <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {log.team_name || "ללא חוליה"}
                          </span>
                          {log.section_name && (
                            <span className="text-sm font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-xl flex items-center gap-2">
                              {log.section_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unified Status Area */}
                      <div className="shrink-0 flex flex-col items-end gap-5 mr-4">
                        {log.status_name ? (
                          <div
                            className="px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-lg shadow-black/5 transform group-hover:scale-105 transition-transform duration-300"
                            style={{
                              backgroundColor: log.status_color || "#333",
                            }}
                          >
                            {log.status_name}
                          </div>
                        ) : (
                          <div className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 text-xs font-black border border-dashed border-slate-200 dark:border-white/10 opacity-60">
                            ממתין
                          </div>
                        )}

                        {log.note && (
                          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                            <MessageSquare className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DailyAttendanceModal;
