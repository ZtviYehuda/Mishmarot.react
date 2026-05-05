import { useState, useEffect, useMemo, useTransition } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  addDays,
  isSameDay,
  startOfDay,
  getDay,
} from "date-fns";
import { he } from "date-fns/locale";
import {
  Users,
  Search,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,

  CalendarRange,
  BadgeInfo,
  Undo2,
  Save,
  Loader2,
  AlertCircle,
  Filter,
  Info,
  TrendingUp,
  X,
} from "lucide-react";

import { ShabbatIcon } from "@/components/common/ShabbatIcon";

const StatusCard = ({
  type,
  onClick,
  isSub = false,
  large = false,
}: {
  type: any;
  onClick: () => void;
  isSub?: boolean;
  large?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all text-center h-full group relative bg-background hover:bg-muted/30 border-border/40 hover:border-primary/40",
      isSub ? "opacity-90 scale-[1.0] min-h-[85px]" : "min-h-[95px]",
      large &&
        "col-span-3 flex-row gap-6 min-h-[80px] px-8 bg-slate-100/50 dark:bg-slate-800/50 border-primary/20",
    )}
  >
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
        large
          ? "w-12 h-12 bg-primary/10"
          : "w-10 h-10 bg-muted/70 group-hover:bg-primary/5",
      )}
    >
      <div
        className={large ? "w-5 h-5 rounded-full" : "w-4 h-4 rounded-full"}
        style={{
          backgroundColor: type.color,
          boxShadow: `0 0 10px ${type.color}40`,
        }}
      />
    </div>
    <div
      className={cn(
        "flex flex-col min-w-0",
        large ? "items-start text-right" : "items-center",
      )}
    >
      <span
        className={cn(
          "font-black leading-tight tracking-tight px-1",
          large ? "text-lg" : "text-[11px]",
        )}
        style={{ color: type.color }}
      >
        {type.name}
      </span>
      {isSub ? (
        <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
          (עבודה)
        </span>
      ) : large ? (
        <span className="text-[10px] text-muted-foreground font-bold opacity-60 uppercase tracking-widest">
          עבודה מהמשרד
        </span>
      ) : null}
    </div>
  </button>
);
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

import { motion, AnimatePresence } from "framer-motion";
import { useDateContext } from "@/context/DateContext";

export default function RosterPage() {
  const { getRosterMatrix, getStatusTypes, getStructure, logBulkStatus } =
    useEmployees();
  const { user } = useAuthContext();
  // const navigate = useNavigate();

  // State
  const { selectedDate: currentDate } = useDateContext();

  const [employees, setEmployees] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pending Changes State
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    empId: number;
    date: Date;
  } | null>(null);

  // Range Mode State
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeEndDate, setRangeEndDate] = useState<string>("");

  const [selectedDayMobile, setSelectedDayMobile] = useState<Date>(new Date());

  // Other Status Note State
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherNote, setOtherNote] = useState("");
  const [targetOtherStatus, setTargetOtherStatus] = useState<any>(null);

  // Constants
  const today = startOfDay(new Date());

  // Week Calculation
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate],
  );

  // Sync mobile selected day when week changes
  useEffect(() => {
    // If current selected day is not in the new week, set it to the first day of that week
    if (
      selectedDayMobile < weekStart ||
      selectedDayMobile > addDays(weekStart, 6)
    ) {
      setSelectedDayMobile(weekStart);
    }
  }, [weekStart]);
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate],
  );
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  // Initial Data
  useEffect(() => {
    const init = async () => {
      const types = await getStatusTypes();
      setStatusTypes(types || []);
      const struct = await getStructure();
      setDepartments(struct || []);
    };
    init();
  }, [getStatusTypes, getStructure, user]); // Added user dependency

  // Default org filters based on permissions
  useEffect(() => {
    if (!user || user.is_admin) return;
    
    if (user.commands_department_id) {
      setSelectedDept(user.commands_department_id.toString());
    } else if (user.commands_section_id) {
      if (user.assigned_department_id) setSelectedDept(user.assigned_department_id.toString());
      setSelectedSection(user.commands_section_id.toString());
    } else if (user.commands_team_id) {
      if (user.assigned_department_id) setSelectedDept(user.assigned_department_id.toString());
      if (user.assigned_section_id) setSelectedSection(user.assigned_section_id.toString());
      setSelectedTeam(user.commands_team_id.toString());
    }
  }, [user]);

  // Fetch Matrix
  const fetchMatrix = async () => {
    setLoadingMatrix(true);
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");

    const filters: any = {};
    if (selectedDept !== "all") filters.department_id = selectedDept;
    if (selectedSection !== "all") filters.section_id = selectedSection;
    if (selectedTeam !== "all") filters.team_id = selectedTeam;

    try {
      const data = await getRosterMatrix(startStr, endStr, filters);
      setEmployees(data.employees || []);
      setLogs(data.logs || []);
      setPendingUpdates([]);
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [weekStart, selectedDept, selectedSection, selectedTeam]);

  const getLogForCell = (empId: number, date: Date) => {
    return logs.find((l) => {
      const start = startOfDay(new Date(l.start_datetime));
      const end = l.end_datetime ? startOfDay(new Date(l.end_datetime)) : null;
      const target = startOfDay(date);

      if (
        l.employee_id === empId &&
        target.getTime() >= start.getTime() &&
        (!end || target.getTime() <= end.getTime())
      ) {
        const dayOfW = getDay(date);
        const isFriSat = dayOfW === 5 || dayOfW === 6;
        if (isFriSat) {
          const typeName =
            statusTypes.find((t) => t.id === l.status_type_id)?.name ||
            l.status_name;
          if (!typeName.includes("תגבור") && !typeName.includes("אחר")) {
            return false;
          }
        }
        return true;
      }
      return false;
    });
  };

  const getStatusById = (id: number) => statusTypes.find((s) => s.id === id);

  // --- Actions ---

  const handleCellClick = (empId: number, date: Date) => {
    setSelectedCell({ empId, date });
    setIsDialogOpen(true);
    return;
  };

  const addPendingUpdate = (
    empId: number,
    statusId: number,
    startDate: Date,
    endDate?: Date,
    note?: string,
  ) => {
    const status = getStatusById(statusId);
    if (!status) return;

    const newUpdates: any[] = [];
    let curr = startOfDay(startDate);
    const endBound = startOfDay(endDate || startDate);

    while (curr <= endBound) {
      const dayOfW = getDay(curr);
      const isFriSat = dayOfW === 5 || dayOfW === 6;

      if (
        isFriSat &&
        !status.name.includes("תגבור") &&
        !status.name.includes("אחר")
      ) {
        curr = addDays(curr, 1);
        continue;
      }

      newUpdates.push({
        employee_id: empId,
        status_type_id: statusId,
        start_date: format(curr, "yyyy-MM-dd"),
        end_date: format(curr, "yyyy-MM-dd"),
        note: note,
      });
      curr = addDays(curr, 1);
    }

    const newLogs = [...logs];
    newUpdates.forEach((upd) => {
      const targetDate = new Date(upd.start_date);
      const log = {
        employee_id: upd.employee_id,
        status_type_id: upd.status_type_id,
        status_name: upd.note || status.name,
        status_color: status.color,
        notes: upd.note,
        start_datetime: targetDate.toISOString(),
        end_datetime: new Date(targetDate.getTime() + 86399000).toISOString(),
        is_verified: true,
        is_pending: true,
      };

      const existingIdx = newLogs.findIndex(
        (l) =>
          l.employee_id === upd.employee_id &&
          isSameDay(new Date(l.start_datetime), targetDate),
      );

      if (existingIdx >= 0) newLogs[existingIdx] = log;
      else newLogs.push(log);
    });

    setLogs(newLogs);

    setPendingUpdates((prev) => {
      const next = [...prev];
      newUpdates.forEach((nou) => {
        const idx = next.findIndex(
          (p) =>
            p.employee_id === nou.employee_id &&
            p.start_date === nou.start_date,
        );
        if (idx >= 0) next[idx] = nou;
        else next.push(nou);
      });
      return next;
    });

    setIsDialogOpen(false);
    setRangeMode(false);
    setRangeEndDate("");
    setShowOtherInput(false);
    setOtherNote("");
    setTargetOtherStatus(null);
  };

  const handleSaveAll = async () => {
    if (pendingUpdates.length === 0) return;

    setSaving(true);
    try {
      const success = await logBulkStatus(pendingUpdates);
      if (success) {
        toast.success("סידור העבודה עודכן בהצלחה");
        await fetchMatrix();
      } else {
        toast.error("עדכון סידור העבודה נכשל");
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const handleUndoAll = () => {
    setPendingUpdates([]);
    fetchMatrix();
  };

  const activeDepartment = useMemo(
    () => departments.find((d) => d.id.toString() === selectedDept),
    [departments, selectedDept],
  );
  const sections = activeDepartment?.sections || [];
  const activeSection = useMemo(
    () => sections.find((s: any) => s.id.toString() === selectedSection),
    [sections, selectedSection],
  );
  const teams = activeSection?.teams || [];

  const activeTeam = useMemo(
    () => teams.find((t: any) => t.id.toString() === selectedTeam),
    [teams, selectedTeam],
  );

  const filterButtonLabel = useMemo(() => {
    const activeUnitName = activeTeam?.name || activeSection?.name || activeDepartment?.name;
    const activeStatusName =
      statusFilter === "none"
        ? "לא דווח"
        : statusFilter !== "all"
        ? statusTypes.find((s) => s.id.toString() === statusFilter)?.name
        : null;

    const parts = [activeUnitName, activeStatusName].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : null;
  }, [activeDepartment, activeSection, activeTeam, statusFilter, statusTypes]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        false;

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;

      const log = getLogForCell(emp.id, today);
      if (statusFilter === "none") return !log;

      const selectedST = statusTypes.find(
        (s) => s.id.toString() === statusFilter,
      );
      if (log && selectedST) {
        if (log.status_type_id === selectedST.id) return true;
        const logST = statusTypes.find((s) => s.id === log.status_type_id);
        if (logST?.parent_status_id === selectedST.id) return true;
      }

      return log?.status_type_id.toString() === statusFilter;
    });
  }, [employees, searchTerm, statusFilter, logs, statusTypes, today]);

  const dailyTotals = useMemo(() => {
    const totals: Record<
      string,
      { present: number; absent: number; total: number }
    > = {};

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      let present = 0;
      let absent = 0;

      filteredEmployees.forEach((emp) => {
        const log = getLogForCell(emp.id, day);
        if (log) {
          const st = statusTypes.find((s) => s.id === log.status_type_id);
          if (st?.is_presence) present++;
          else absent++;
        }
      });

      totals[dayKey] = { present, absent, total: present + absent };
    });

    return totals;
  }, [logs, filteredEmployees, weekDays, statusTypes]);

  const weekdayAverageAttendance = useMemo(() => {
    const workDayEntries = Object.entries(dailyTotals).filter(([dateKey]) => {
      const d = new Date(dateKey + "T12:00:00");
      return getDay(d) !== 5 && getDay(d) !== 6;
    });
    if (workDayEntries.length === 0 || filteredEmployees.length === 0) return 0;
    const sum = workDayEntries.reduce(
      (acc, [, v]) => acc + (v.present / filteredEmployees.length),
      0,
    );
    return Math.round((sum / workDayEntries.length) * 100);
  }, [dailyTotals, filteredEmployees.length]);

  const rosterParentStatuses = useMemo(
    () => statusTypes.filter((s: any) => !s.parent_status_id),
    [statusTypes],
  );
  const rosterSubStatusMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    statusTypes.forEach((s: any) => {
      if (s.parent_status_id) {
        if (!map[s.parent_status_id]) map[s.parent_status_id] = [];
        map[s.parent_status_id].push(s);
      }
    });
    return map;
  }, [statusTypes]);

  return (
    <div
      className="flex flex-col h-full selection:bg-primary/10 selection:text-primary"
      dir="rtl"
    >
      <div className="flex flex-col h-full">
        {/* Unified Page Header - Premium Layout Style */}
        {/* Unified Page Header - Hyper Minimalist */}
        <div className="pt-6 pb-2 shrink-0 transition-all px-4 sm:px-6">
          <PageHeader
            icon={CalendarRange}
            title={
              window.innerWidth < 1024
                ? "מעקב נוכחות יומי"
                : "סידור עבודה שבועי"
            }
            subtitle={
              <span className="flex items-center gap-2 mt-1">
                <span>{filteredEmployees.length} שוטרים בסינון</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="text-primary">{weekdayAverageAttendance}% ממוצע נוכחות</span>
              </span>
            }
            className="mb-0"
            hideMobile={true}
            badge={
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 lg:mt-0 w-full sm:w-auto">
                
                {/* Save/Undo Actions */}
                <AnimatePresence>
                  {pendingUpdates.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-1.5 shrink-0"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUndoAll}
                        className="h-9 w-9 p-0 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-500/20 transition-all"
                        title="בטל הכל"
                      >
                        <Undo2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="h-9 rounded-xl px-4 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white gap-2 transition-all"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        שמור חלון ({pendingUpdates.length})
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filters & Search - Minimalist Right Side */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-9 rounded-full px-4 border-border/40 hover:bg-muted/30 font-bold text-xs gap-2 shrink-0 shadow-sm transition-all bg-background", filterButtonLabel ? "text-primary border-primary/30" : "")}>
                        <Filter className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{filterButtonLabel || "סינון נתונים"}</span>
                        <span className="sm:hidden">{filterButtonLabel || "סינון"}</span>
                        {(selectedDept !== "all" || statusFilter !== "all" || selectedSection !== "all" || selectedTeam !== "all") && (
                          <span className="w-2 h-2 rounded-full bg-primary relative -right-1 shadow-sm" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 rounded-3xl border-border/40 p-5 shadow-2xl bg-card/95 backdrop-blur-xl">
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">סינון יחידה</span>
                          <Select value={selectedDept} onValueChange={(val) => { setSelectedDept(val); setSelectedSection("all"); setSelectedTeam("all"); }}>
                            <SelectTrigger className="w-full rounded-2xl bg-background border border-border/40 hover:border-border/80 font-bold text-xs h-10 transition-colors">
                              <SelectValue placeholder="כל היחידה" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl font-bold border-border/40">
                              <SelectItem value="all">כל היחידה</SelectItem>
                              {departments.map((d: any) => (<SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          {/* Section Select */}
                          {selectedDept !== "all" && sections.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Select value={selectedSection} onValueChange={(val) => { setSelectedSection(val); setSelectedTeam("all"); }}>
                                <SelectTrigger className="w-full rounded-2xl bg-background border border-border/40 hover:border-border/80 font-bold text-xs h-10 transition-colors">
                                  <SelectValue placeholder="כל המדורים" />
                                </SelectTrigger>
                                <SelectContent dir="rtl" className="rounded-2xl font-bold border-border/40">
                                  <SelectItem value="all">כל המדורים</SelectItem>
                                  {sections.map((s: any) => (<SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </motion.div>
                          )}
                          {/* Team Select */}
                          {selectedSection !== "all" && teams.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                <SelectTrigger className="w-full rounded-2xl bg-background border border-border/40 hover:border-border/80 font-bold text-xs h-10 transition-colors">
                                  <SelectValue placeholder="כל החוליות" />
                                </SelectTrigger>
                                <SelectContent dir="rtl" className="rounded-2xl font-bold border-border/40">
                                  <SelectItem value="all">כל החוליות</SelectItem>
                                  {teams.map((t: any) => (<SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t border-border/20">
                          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">סטטוס משמרת</span>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full rounded-2xl bg-background border border-border/40 hover:border-border/80 font-bold text-xs h-10 transition-colors">
                              <SelectValue placeholder="סטטוס: הכל" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl font-bold border-border/40">
                              <SelectItem value="all">סטטוס: הכל</SelectItem>
                              <SelectItem value="none" className="text-rose-500">לא דווח</SelectItem>
                              {rosterParentStatuses.map((st: any) => (
                                <SelectItem key={st.id} value={st.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: st.color }} />
                                    {st.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {(selectedDept !== "all" || statusFilter !== "all" || selectedSection !== "all" || selectedTeam !== "all") && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedDept("all");
                        setSelectedSection("all");
                        setSelectedTeam("all");
                        setStatusFilter("all");
                      }}
                      className="h-9 rounded-full px-3 gap-1 hover:bg-destructive/10 text-destructive hover:text-destructive font-bold text-xs shrink-0 transition-colors"
                      title="נקה סינונים"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">נקה סינון</span>
                    </Button>
                  )}

                  {/* Minimal Search Pill */}
                  <div className="relative group/search flex-1 sm:flex-none w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within/search:text-primary transition-colors z-10" />
                    <Input
                      placeholder="חיפוש..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 w-full sm:w-32 lg:w-40 pr-9 pl-4 bg-background border-border/40 hover:bg-muted/20 focus:bg-background focus:border-primary/30 focus:sm:w-48 focus:lg:w-56 rounded-full font-bold text-xs transition-all duration-300 shadow-sm"
                    />
                  </div>
                </div>

              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-auto py-3 sm:py-4 md:py-6 custom-scrollbar relative">
          
          
          {/* Mobile Day Selector - Only visible on small screens */}
          <div className="lg:hidden bg-background/95 backdrop-blur-xl sticky top-0 z-40 mb-4 -mx-4 border-b border-border/40 px-4 pt-2 pb-3">
            {/* Day pills row */}
            <div className="flex items-center gap-1.5">
              {weekDays.map((day, i) => {
                const isSelected = isSameDay(day, selectedDayMobile);
                const isToday = isSameDay(day, today);
                const weekend = getDay(day) === 5 || getDay(day) === 6;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDayMobile(day);
                      if (window.navigator.vibrate)
                        window.navigator.vibrate(10);
                    }}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative",
                      "active:scale-95",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : weekend
                          ? "bg-amber-500/5 border border-amber-500/20"
                          : "bg-transparent hover:bg-muted/50",
                    )}
                  >
                    {/* Day letter */}
                    <span
                      className={cn(
                        "text-[10px] font-black mb-0.5",
                        isSelected
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {format(day, "EEEEE", { locale: he })}
                    </span>
                    {/* Day number */}
                    <span
                      className={cn(
                        "text-sm font-black tabular-nums leading-none",
                        isSelected
                          ? "text-primary-foreground"
                          : isToday
                            ? "text-primary"
                            : "text-foreground",
                      )}
                    >
                      {format(day, "dd")}
                    </span>
                    {/* Shabbat icon for weekend days */}
                    {weekend && (
                      <ShabbatIcon
                        className={cn(
                          "w-3 h-3 mt-0.5",
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-amber-500",
                        )}
                      />
                    )}
                    {/* Today dot */}
                    {isToday && !isSelected && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stats + date summary row */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-black">
                    נוכחים:{" "}
                    {dailyTotals[format(selectedDayMobile, "yyyy-MM-dd")]
                      ?.present || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-600 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-[11px] font-black">
                    נעדרים:{" "}
                    {dailyTotals[format(selectedDayMobile, "yyyy-MM-dd")]
                      ?.absent || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">
                  {format(selectedDayMobile, "MMMM", { locale: he })}
                </span>
                <span className="text-xs font-black text-foreground/80">
                  {format(selectedDayMobile, "yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Layout Wrapper */}
          <div className="relative group">
            {/* Desktop Roster Grid (hidden on mobile) */}
            <div className="hidden lg:block bg-background border border-border/40 rounded-2xl min-w-max lg:min-w-full overflow-hidden relative">
              {/* Table Header */}
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-[minmax(240px,1.5fr)_repeat(7,minmax(110px,1fr))] border-b border-border/30 sticky top-0 z-30 backdrop-blur-2xl bg-background/95">
                  <div className="p-4 flex items-center justify-between border-l border-border/30 sticky right-0 z-40 bg-background/95 backdrop-blur-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground uppercase tracking-widest">
                        שם השוטר
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold mt-0.5">
                        {filteredEmployees.length} שוטרים מדווחים
                      </span>
                    </div>
                  </div>

                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    const weekend = getDay(day) === 5 || getDay(day) === 6;
                    const dailyTotal = dailyTotals[
                      format(day, "yyyy-MM-dd")
                    ] || {
                      present: 0,
                      absent: 0,
                      total: 0,
                    };

                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-4 flex flex-col items-center justify-center border-l border-border/30 transition-colors relative",
                          isToday && "bg-primary/[0.04]",
                        )}
                      >
                        {/* Today indicator line on top */}
                        {isToday && (
                          <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-primary" />
                        )}

                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest mb-1.5",
                            isToday
                              ? "text-primary"
                              : "text-muted-foreground/50",
                          )}
                        >
                          {format(day, "EEEE", { locale: he })}
                        </span>

                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={cn(
                              "text-xl font-black tabular-nums leading-none",
                              isToday ? "text-primary" : "text-foreground/80",
                            )}
                          >
                            {format(day, "dd")}
                          </span>
                        </div>

                        {weekend && (
                          <ShabbatIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                        )}
                        {!weekend && dailyTotal.total > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] font-black text-emerald-600 tabular-nums">{dailyTotal.present}</span>
                            <span className="text-[9px] text-muted-foreground/40">/</span>
                            <span className="text-[9px] font-black text-rose-600 tabular-nums">{dailyTotal.absent}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border/20 relative">
                  {loadingMatrix ? (
                    <div className="py-48 flex flex-col items-center justify-center gap-6">
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-16 h-16 rounded-full border-4 border-border/40 border-t-primary"
                        />
                      </div>
                      <span className="text-sm font-black text-muted-foreground animate-pulse tracking-widest uppercase">
                        טוען נתונים...
                      </span>
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="py-48 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6">
                        <Users className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-lg font-black text-foreground tracking-tight">
                        לא נמצאו תוצאות
                      </h3>
                      <p className="text-xs text-muted-foreground/70 mt-2 font-bold max-w-xs">
                        נסה לשנות את מסנני החיפוש
                      </p>
                    </div>
                  ) : (
                    filteredEmployees.map((emp, empIdx) => (
                      <motion.div
                        key={emp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(empIdx * 0.05, 0.5) }}
                        className="grid grid-cols-[minmax(240px,1.5fr)_repeat(7,minmax(110px,1fr))] group/row hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all"
                      >
                        <div className="p-4 border-l border-border/30 sticky right-0 z-20 bg-background/90 backdrop-blur-xl transition-all border-r-2 border-r-transparent group-hover/row:border-r-primary">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-border/40 flex items-center justify-center text-slate-500 font-black text-xs group-hover/row:scale-105 transition-all">
                              {emp.first_name[0]}
                              {emp.last_name[0]}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <EmployeeLink
                                employee={emp}
                                className="text-sm font-black text-foreground truncate tracking-tight group-hover/row:text-primary transition-colors text-right"
                              />
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] font-black text-muted-foreground/60 tracking-widest">
                                  {emp.username}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border/60" />
                                <span className="text-[9px] font-black text-primary/70 truncate bg-primary/5 px-1.5 py-0.5 rounded-md">
                                  {emp.team_name || emp.section_name || "כללי"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {weekDays.map((day, i) => {
                          const log = getLogForCell(emp.id, day);
                          const weekend =
                            getDay(day) === 5 || getDay(day) === 6;
                          const isPending = log?.is_pending;

                          return (
                            <div
                              key={i}
                              onClick={() => handleCellClick(emp.id, day)}
                              className={cn(
                                "p-2 border-l border-border/30 flex items-center justify-center cursor-pointer transition-all relative group/cell min-h-[72px]",
                                weekend && "bg-muted/5",
                                "hover:bg-muted/30",
                              )}
                            >
                              {!log ? (
                                <div className="opacity-0 group-hover/cell:opacity-100 transition-all transform scale-75 group-hover/cell:scale-100 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/40 hover:bg-primary/10 hover:text-primary">
                                  <Plus className="w-4 h-4" />
                                </div>
                              ) : (
                                <motion.div
                                  initial={false}
                                  animate={
                                    isPending
                                      ? { scale: [1, 1.02, 1] }
                                      : { scale: 1 }
                                  }
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className={cn(
                                    "w-full h-full max-h-[55px] flex items-center justify-center p-2 rounded-xl transition-all relative overflow-hidden group/status",
                                    isPending
                                      ? "ring-2 ring-primary ring-offset-1"
                                      : "border border-transparent hover:border-border/60",
                                  )}
                                  style={{
                                    backgroundColor: `${log.status_color}10`,
                                    borderLeft: `3px solid ${log.status_color}`,
                                  }}
                                >
                                  <div
                                    className="absolute inset-0 opacity-0 group-hover/status:opacity-5 transition-opacity"
                                    style={{
                                      backgroundColor: log.status_color,
                                    }}
                                  />
                                  <span
                                    className="text-[11px] font-black text-center leading-tight tracking-tight z-10 truncate px-1"
                                    style={{ color: log.status_color }}
                                    title={log.status_name}
                                  >
                                    {log.status_name}
                                  </span>
                                  {isPending && (
                                    <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                  )}
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Employee List (Only visible on small screens) */}
            <div className="lg:hidden space-y-3 pb-24">
              {loadingMatrix ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4 opacity-50">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm font-bold">טוען נתונים...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-24 text-center bg-muted/20 rounded-3xl border border-dashed border-border p-8">
                  <BadgeInfo className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-black text-foreground">
                    לא נמצאו שוטרים
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    נסה לשנות את המסננים או מילת החיפוש
                  </p>
                </div>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const log = getLogForCell(emp.id, selectedDayMobile);
                  const isWeekend =
                    getDay(selectedDayMobile) === 5 ||
                    getDay(selectedDayMobile) === 6;
                  return (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleCellClick(emp.id, selectedDayMobile)}
                      className="flex items-center justify-between gap-4 py-3 border-b border-border/20 active:bg-muted/30 transition-all"
                      style={{
                        borderRightColor: log?.status_color || "transparent",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-black text-[11px] shrink-0 text-muted-foreground uppercase">
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <EmployeeLink
                            employee={emp}
                            className="text-base font-black text-foreground truncate tracking-tight active:text-primary transition-colors"
                          />
                          <div className="flex items-center gap-1.5 opacity-60">
                            <span className="text-[10px] font-black">
                              #{emp.username}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="text-[11px] font-bold truncate max-w-[100px] text-primary">
                              {emp.team_name || "ללא שיוך"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {log ? (
                          <div
                            className="px-4 py-2 rounded-xl text-[11px] font-black tracking-tight text-center min-w-[100px] flex items-center justify-center gap-1.5"
                            style={{
                              backgroundColor: `${log.status_color}1a`,
                              color: log.status_color,
                              border: `1.5px solid ${log.status_color}30`,
                            }}
                          >
                            {log.status_name}
                          </div>
                        ) : isWeekend ? (
                          <div className="px-3 py-2 rounded-xl text-[11px] font-black text-amber-500/60 flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10">
                            <ShabbatIcon className="w-4 h-4" />
                            <span>שבת</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary group-active:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden bg-background border-border rounded-3xl sm:rounded-[2rem]">
            <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-right">
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {selectedCell
                      ? employees.find((e) => e.id === selectedCell.empId)
                        ? `${employees.find((e) => e.id === selectedCell.empId).first_name} ${employees.find((e) => e.id === selectedCell.empId).last_name}`
                        : "עדכון שיבוץ"
                      : "עדכון שיבוץ"}
                  </DialogTitle>
                  <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {selectedCell &&
                      format(selectedCell.date, "EEEE, dd בMMMM yyyy", {
                        locale: he,
                      })}
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-white/5 rounded-2xl border border-border/40 dark:border-white/10 transition-all hover:bg-primary/10 dark:hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <CalendarRange className="w-5 h-5 text-primary/70" />
                  <span className="text-sm font-bold text-foreground">
                    טווח תאריכים
                  </span>
                </div>
                <Button
                  variant={rangeMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRangeMode(!rangeMode)}
                  className="h-8 px-4 text-[11px] font-bold rounded-lg transition-all"
                >
                  {rangeMode ? "ביטול " : "בחר טווח"}
                </Button>
              </div>

              {rangeMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-primary/[0.02] border border-border/40 rounded-xl space-y-4"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      טווח תאריכים
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mr-1">
                        מתאריך
                      </label>
                      <div className="h-10 flex items-center px-4 bg-muted/40 rounded-xl border border-border text-xs font-bold text-foreground">
                        {selectedCell &&
                          format(selectedCell.date, "yyyy-MM-dd")}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mr-1">
                        עד תאריך
                      </label>
                      <Input
                        type="date"
                        value={rangeEndDate}
                        min={
                          selectedCell
                            ? format(selectedCell.date, "yyyy-MM-dd")
                            : ""
                        }
                        onChange={(e) => setRangeEndDate(e.target.value)}
                        className="h-10 bg-background dark:bg-slate-900 border-border dark:border-white/20 text-xs font-bold rounded-xl dark:text-white dark:placeholder:text-white/40 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-6">
                {(() => {
                  const dayOfW = selectedCell ? getDay(selectedCell.date) : -1;
                  const isWeekendDay = dayOfW === 5 || dayOfW === 6;

                  const officeParent = rosterParentStatuses.find(
                    (p) => p.name === "משרד",
                  );
                  const otherParents = rosterParentStatuses.filter(
                    (p) => p.name !== "משרד",
                  );
                  const subStatuses = officeParent
                    ? rosterSubStatusMap[officeParent.id] || []
                    : [];

                  return (
                    <>
                      {/* Section 1: Office (Premium Large Style) */}
                      {!isWeekendDay && officeParent && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <StatusCard
                              type={officeParent}
                              large
                              onClick={() =>
                                addPendingUpdate(
                                  selectedCell!.empId,
                                  officeParent.id,
                                  selectedCell!.date,
                                  rangeMode && rangeEndDate
                                    ? new Date(rangeEndDate)
                                    : undefined,
                                )
                              }
                            />
                            {subStatuses.map((sub) => (
                              <StatusCard
                                key={sub.id}
                                type={sub}
                                isSub
                                onClick={() =>
                                  addPendingUpdate(
                                    selectedCell!.empId,
                                    sub.id,
                                    selectedCell!.date,
                                    rangeMode && rangeEndDate
                                      ? new Date(rangeEndDate)
                                      : undefined,
                                  )
                                }
                              />
                            ))}
                          </div>

                          <div className="h-px bg-border/40 mx-2" />
                        </div>
                      )}

                      {/* Section 2: Other Parents (3x3 Grid) */}
                      <div className="grid grid-cols-3 gap-3">
                        {otherParents
                          .filter((p) => {
                            if (isWeekendDay) {
                              return (
                                p.name.includes("תגבור") ||
                                p.name.includes("אחר")
                              );
                            }
                            return true;
                          })
                          .map((parent) => (
                            <StatusCard
                              key={parent.id}
                              type={parent}
                              onClick={() => {
                                if (parent.name === "אחר") {
                                  setTargetOtherStatus(parent);
                                  setShowOtherInput(true);
                                } else {
                                  addPendingUpdate(
                                    selectedCell!.empId,
                                    parent.id,
                                    selectedCell!.date,
                                    rangeMode && rangeEndDate
                                      ? new Date(rangeEndDate)
                                      : undefined,
                                  );
                                }
                              }}
                            />
                          ))}
                      </div>

                      {/* Section 3: Custom "Other" Input */}
                      <AnimatePresence>
                        {showOtherInput && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
                              <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                  פירוט סטטוס מותאם אישית (אחר)
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  autoFocus
                                  placeholder="הזן תיאור סטטוס..."
                                  value={otherNote}
                                  onChange={(e) => setOtherNote(e.target.value)}
                                  className="h-11 bg-white border-primary/20 rounded-xl text-sm font-bold placeholder:text-muted-foreground/40"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && otherNote.trim()) {
                                      addPendingUpdate(
                                        selectedCell!.empId,
                                        targetOtherStatus.id,
                                        selectedCell!.date,
                                        rangeMode && rangeEndDate
                                          ? new Date(rangeEndDate)
                                          : undefined,
                                        otherNote.trim(),
                                      );
                                    }
                                  }}
                                />
                                <Button
                                  disabled={!otherNote.trim()}
                                  onClick={() => {
                                    addPendingUpdate(
                                      selectedCell!.empId,
                                      targetOtherStatus.id,
                                      selectedCell!.date,
                                      rangeMode && rangeEndDate
                                        ? new Date(rangeEndDate)
                                        : undefined,
                                      otherNote.trim(),
                                    );
                                  }}
                                  className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90"
                                >
                                  אישור
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsDialogOpen(false);
                  setRangeMode(false);
                  setRangeEndDate("");
                }}
                className="px-6 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                ביטול
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

