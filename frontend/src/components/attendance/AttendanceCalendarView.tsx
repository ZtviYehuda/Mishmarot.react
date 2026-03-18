import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, CalendarDays, CalendarRange,
  Download, X, Users, CheckCircle2, AlertCircle, ArrowRight, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEmployeeContext } from "@/context/EmployeeContext";
import {
  format, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isSameMonth, isToday, getDay,
} from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { toPng } from "html-to-image";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayStats {
  date: Date;
  reported: number;
  total: number;
  statuses: { name: string; color: string; count: number }[];
  missing: { id: number; name: string }[];
}

interface Props {
  statusTypes: any[];
  scopeEmployees: any[];
  onClose: () => void;
}

const HEB_DAYS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

// ── Pre-parsed employee record ────────────────────────────────────────────────
interface ParsedEmp {
  id: number; rawEmp: any;
  hasStatus: boolean;
  startTs: number; startDayTs: number; endTs: number;
  isPersistent: boolean;
  statusName: string; statusColor: string; statusId: number | null;
  fullName: string;
}

function toMidnight(ts: number): number {
  const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime();
}

function prepareEmployees(emps: any[]): ParsedEmp[] {
  return emps.map((emp) => {
    const fullName = `${emp.last_name ?? ""} ${emp.first_name ?? ""}`.trim();
    if (!emp.status_id) return {
      id: emp.id, rawEmp: emp, hasStatus: false,
      startTs: 0, startDayTs: 0, endTs: 0, isPersistent: false,
      statusName: "", statusColor: "", statusId: null, fullName,
    };
    const startTs = emp.last_status_update ? new Date(emp.last_status_update).getTime() : 0;
    let endTs = Infinity;
    if (emp.status_end_datetime) {
      const e = new Date(emp.status_end_datetime);
      e.setHours(23, 59, 59, 999);
      endTs = e.getTime();
    }
    return {
      id: emp.id, rawEmp: emp, hasStatus: true,
      startTs, startDayTs: startTs > 0 ? toMidnight(startTs) : 0, endTs,
      isPersistent: !!emp.status_is_persistent && !emp.status_end_datetime,
      statusName: (emp.status_name || "").trim(),
      statusColor: emp.status_color || "#94a3b8",
      statusId: emp.status_id ?? null, fullName,
    };
  });
}

function isReportedOnDay(emp: ParsedEmp, dayMidnightTs: number, dayEndTs: number): boolean {
  if (!emp.hasStatus || emp.startTs === 0) return false;
  if (emp.startDayTs === dayMidnightTs) return true;
  if (emp.startTs <= dayEndTs && dayMidnightTs <= emp.endTs) return true;
  return false;
}

function computeDayStats(
  parsedEmps: ParsedEmp[],
  subToParent: Map<number, { name: string; color: string }>,
  date: Date,
): DayStats {
  const dayMidnightTs = toMidnight(date.getTime());
  const dayEndTs = dayMidnightTs + 86399999;
  const total = parsedEmps.length;
  let reported = 0;
  const statusMap = new Map<string, { name: string; color: string; count: number; emps: { id: number; name: string }[] }>();
  const missing: { id: number; name: string }[] = [];

  for (const emp of parsedEmps) {
    if (!isReportedOnDay(emp, dayMidnightTs, dayEndTs)) {
      missing.push({ id: emp.id, name: emp.fullName });
      continue;
    }
    reported++;
    if (!emp.statusName) continue;
    const parent = emp.statusId !== null ? subToParent.get(emp.statusId) : undefined;
    const key = parent ? parent.name : emp.statusName;
    const color = parent ? parent.color : emp.statusColor;
    const existing = statusMap.get(key);
    if (existing) { existing.count++; existing.emps.push({ id: emp.id, name: emp.fullName }); }
    else statusMap.set(key, { name: key, color, count: 1, emps: [{ id: emp.id, name: emp.fullName }] });
  }

  const statuses = Array.from(statusMap.values()).sort((a, b) => b.count - a.count);
  return { date, reported, total, statuses, missing };
}

// ── Large Donut ───────────────────────────────────────────────────────────────
function LargeDonut({ stats, size = 140 }: { stats: DayStats; size?: number }) {
  const { reported, total, statuses } = stats;
  if (total === 0) return null;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const reportedPct = reported / total;
  let accum = 0;
  const segments = statuses.map((s) => {
    const pct = s.count / total;
    const offset = circumference * (1 - accum);
    const dash = circumference * pct;
    accum += pct;
    return { ...s, offset, dash };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.07} strokeWidth={12} />
      {segments.map((seg, i) => (
        <circle key={i} cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={seg.color} strokeWidth={12}
          strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
          strokeDashoffset={seg.offset} strokeLinecap="butt"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      ))}
      {reported < total && (
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#ef444425" strokeWidth={12}
          strokeDasharray={`${circumference * (1 - reportedPct)} ${circumference * reportedPct}`}
          strokeDashoffset={circumference * (accum === 0 ? 1 : 1 - accum) - circumference}
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      )}
      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central"
        fontSize="22" fontWeight="900" fill="currentColor" fontFamily="sans-serif">
        {Math.round(reportedPct * 100)}%
      </text>
      <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central"
        fontSize="10" fontWeight="600" fill="currentColor" fontFamily="sans-serif" opacity={0.5}>
        {reported}/{total}
      </text>
    </svg>
  );
}

// ── Mini Donut ────────────────────────────────────────────────────────────────
function MiniDonut({ stats, size = 40 }: { stats: DayStats; size?: number }) {
  const { reported, total, statuses } = stats;
  if (total === 0) return null;
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const reportedPct = reported / total;
  let accum = 0;
  const segments = statuses.map((s) => {
    const pct = s.count / total;
    const offset = circumference * (1 - accum);
    const dash = circumference * pct;
    accum += pct;
    return { ...s, offset, dash };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={4} />
      {segments.map((seg, i) => (
        <circle key={i} cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={seg.color} strokeWidth={4}
          strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
          strokeDashoffset={seg.offset} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      ))}
      {reported < total && (
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#ef444420" strokeWidth={4}
          strokeDasharray={`${circumference * (1 - reportedPct)} ${circumference * reportedPct}`}
          strokeDashoffset={circumference * (accum === 0 ? 1 : 1 - accum) - circumference}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize={size < 44 ? "8" : "10"} fontWeight="800" fill="currentColor" fontFamily="sans-serif">
        {Math.round(reportedPct * 100)}%
      </text>
    </svg>
  );
}

// ── Month Day Cell ────────────────────────────────────────────────────────────
function MonthDayCell({ stats, isCurrentMonth, selectedDate, onClick }: {
  stats: DayStats; isCurrentMonth: boolean; selectedDate: Date | null; onClick: () => void;
}) {
  const isSelected = selectedDate && isSameDay(stats.date, selectedDate);
  const today = isToday(stats.date);
  const pct = stats.total > 0 ? stats.reported / stats.total : 0;
  const isWeekend = getDay(stats.date) === 5 || getDay(stats.date) === 6;

  return (
    <motion.div whileTap={{ scale: 0.95 }} onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-between p-1 rounded-lg cursor-pointer border transition-all duration-150 overflow-hidden select-none h-16 md:h-[90px]",
        !isCurrentMonth && "opacity-25 pointer-events-none",
        isWeekend && isCurrentMonth && "opacity-40",
        isSelected ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : today ? "border-primary/50 bg-primary/5"
          : "border-border/30 bg-card/40 hover:border-primary/20 hover:bg-card",
      )}>
      <span className={cn("text-[11px] font-black leading-none self-start",
        today ? "text-primary" : isCurrentMonth ? "text-foreground" : "text-muted-foreground")}>
        {format(stats.date, "d")}
      </span>
      {stats.total > 0 && !isWeekend && (
        <>
          <span className="md:hidden text-[10px] font-black"
            style={{ color: pct === 1 ? "#10b981" : pct > 0.7 ? "#f59e0b" : "#ef4444" }}>
            {Math.round(pct * 100)}%
          </span>
          <div className="hidden md:flex"><MiniDonut stats={stats} size={30} /></div>
          <div className="hidden md:flex flex-col gap-0.5 w-full">
            {stats.statuses.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-center gap-0.5">
                <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-[7px] font-bold text-muted-foreground truncate">{s.name} {s.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {stats.total > 0 && !isWeekend && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border/20">
          <div className="h-full transition-all duration-700"
            style={{ width: `${pct * 100}%`, backgroundColor: pct === 1 ? "#10b981" : pct > 0.7 ? "#f59e0b" : "#ef4444" }} />
        </div>
      )}
    </motion.div>
  );
}

// ── Week Day Row ──────────────────────────────────────────────────────────────
function WeekDayRow({ stats, selectedDate, onClick }: {
  stats: DayStats; selectedDate: Date | null; onClick: () => void;
}) {
  const isSelected = selectedDate && isSameDay(stats.date, selectedDate);
  const today = isToday(stats.date);
  const pct = stats.total > 0 ? stats.reported / stats.total : 0;
  const isFriday = getDay(stats.date) === 5;
  const isSaturday = getDay(stats.date) === 6;
  const isWeekend = isFriday || isSaturday;

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
      onClick={!isWeekend ? onClick : undefined}
      className={cn(
        "relative flex items-center gap-3 p-3 md:p-4 rounded-2xl border transition-all cursor-pointer",
        isWeekend && "opacity-40 pointer-events-none bg-muted/20",
        isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/20"
          : today ? "border-primary/40 bg-primary/5"
          : "border-border/40 bg-card/50 hover:border-primary/30 hover:bg-card",
      )}>
      <div className="flex flex-col items-center shrink-0 w-10 md:w-14">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
          {format(stats.date, "EEE", { locale: he })}
        </span>
        <span className={cn("text-xl md:text-2xl font-black leading-none", today ? "text-primary" : "text-foreground")}>
          {format(stats.date, "d")}
        </span>
        <span className="text-[9px] font-bold text-muted-foreground">{format(stats.date, "MMM", { locale: he })}</span>
      </div>
      {!isWeekend && stats.total > 0 && <MiniDonut stats={stats} size={48} />}
      {!isWeekend ? (
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-foreground">{stats.reported}/{stats.total} דיווחו</span>
            {stats.reported === stats.total && stats.total > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
            {stats.reported < stats.total && stats.total > 0 && (
              <span className="text-[10px] font-bold text-rose-500">{stats.total - stats.reported} חסרים</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {stats.statuses.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name} · {s.count}
              </div>
            ))}
          </div>
          <div className="h-1 bg-border/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct * 100}%`, backgroundColor: pct === 1 ? "#10b981" : pct > 0.7 ? "#f59e0b" : "#ef4444" }} />
          </div>
        </div>
      ) : (
        <span className="text-xs font-bold text-muted-foreground flex-1">
          {isFriday ? "שישי - לא יום עבודה" : "שבת - לא יום עבודה"}
        </span>
      )}
    </motion.div>
  );
}

// ── Day Detail View — full rich panel for a selected day ──────────────────────
function DayDetailView({ stats, onBack, subToParent, parsedEmps }: {
  stats: DayStats;
  onBack: () => void;
  subToParent: Map<number, { name: string; color: string }>;
  parsedEmps: ParsedEmp[];
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [missingExpanded, setMissingExpanded] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const { openProfile } = useEmployeeContext();

  const toggleGroup = (name: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });

  // Get employees for a specific status group
  const statusGroups = useMemo(() => {
    const dayMidnightTs = toMidnight(stats.date.getTime());
    const dayEndTs = dayMidnightTs + 86399999;
    const groups = new Map<string, { name: string; color: string; emps: { id: number; name: string }[] }>();

    for (const emp of parsedEmps) {
      if (!isReportedOnDay(emp, dayMidnightTs, dayEndTs) || !emp.statusName) continue;
      const parent = emp.statusId !== null ? subToParent.get(emp.statusId) : undefined;
      const key = parent ? parent.name : emp.statusName;
      const color = parent ? parent.color : emp.statusColor;
      const existing = groups.get(key);
      if (existing) existing.emps.push({ id: emp.id, name: emp.fullName });
      else groups.set(key, { name: key, color, emps: [{ id: emp.id, name: emp.fullName }] });
    }
    return Array.from(groups.values()).sort((a, b) => b.emps.length - a.emps.length);
  }, [stats.date, parsedEmps, subToParent]);

  const handleExport = async () => {
    const target = detailRef.current;
    if (!target || isExporting) return;
    setIsExporting(true);
    try {
      const bakeStyles = (el: Element) => {
        if (!(el instanceof HTMLElement)) return;
        const cs = getComputedStyle(el);
        el.style.color = cs.color;
        el.style.backgroundColor = cs.backgroundColor;
        el.style.borderColor = cs.borderColor;
        for (const child of Array.from(el.children)) bakeStyles(child);
      };
      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${target.offsetWidth}px;padding:24px;border-radius:16px;direction:rtl;`;
      clone.style.backgroundColor = getComputedStyle(target).backgroundColor || "#1e293b";
      document.body.appendChild(clone);
      bakeStyles(clone);
      const dataUrl = await toPng(clone, { quality: 1, pixelRatio: 2, cacheBust: true });
      document.body.removeChild(clone);
      const label = format(stats.date, "dd_MM_yyyy");
      const link = document.createElement("a");
      link.download = `shiftguard_${label}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("התמונה יוצאה בהצלחה!");
    } catch (e) {
      toast.error("שגיאה בייצוא התמונה");
    } finally {
      setIsExporting(false);
    }
  };

  const pct = stats.total > 0 ? stats.reported / stats.total : 0;
  const today = isToday(stats.date);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-3"
      dir="rtl"
    >
      {/* Header row (NOT in export) */}
      <div className="flex items-center gap-2">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black text-primary hover:underline">
          <ArrowRight className="w-3.5 h-3.5" />
          חזרה ללוח שנה
        </button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleExport} disabled={isExporting}
          className="h-8 gap-1.5 text-xs font-bold border border-border/40 rounded-xl hover:bg-primary/5 hover:text-primary disabled:opacity-60">
          {isExporting ? (
            <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg><span>מייצא...</span></>
          ) : (
            <><Download className="w-3.5 h-3.5" /><span>ייצוא תמונה</span></>
          )}
        </Button>
      </div>

      {/* ── Export target ── */}
      <div ref={detailRef} className="flex flex-col gap-4 bg-card/60 rounded-2xl p-4 border border-border/40">

        {/* Day title */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {format(stats.date, "EEEE", { locale: he })}
            </p>
            <h2 className={cn("text-2xl font-black leading-none", today ? "text-primary" : "text-foreground")}>
              {format(stats.date, "d MMMM yyyy", { locale: he })}
            </h2>
          </div>
          <LargeDonut stats={stats} size={120} />
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-muted/40 rounded-xl px-3 py-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-black">{stats.reported}/{stats.total}</span>
            <span className="text-xs text-muted-foreground font-bold">דיווחו</span>
          </div>
          {stats.reported === stats.total && stats.total > 0 && (
            <div className="flex items-center gap-1 bg-emerald-500/10 rounded-xl px-3 py-1.5 text-emerald-600 text-xs font-black">
              <CheckCircle2 className="w-3.5 h-3.5" />כולם דיווחו!
            </div>
          )}
          {stats.reported < stats.total && stats.total > 0 && (
            <div className="flex items-center gap-1 bg-rose-500/10 rounded-xl px-3 py-1.5 text-rose-500 text-xs font-black">
              <AlertCircle className="w-3.5 h-3.5" />{stats.total - stats.reported} לא דיווחו
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-muted-foreground">אחוז דיווח</span>
            <span className="text-[10px] font-black" style={{ color: pct === 1 ? "#10b981" : pct > 0.7 ? "#f59e0b" : "#ef4444" }}>
              {Math.round(pct * 100)}%
            </span>
          </div>
          <div className="h-2.5 bg-border/30 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ backgroundColor: pct === 1 ? "#10b981" : pct > 0.7 ? "#f59e0b" : "#ef4444" }} />
          </div>
        </div>

        {/* Status breakdown */}
        {statusGroups.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">פירוט סטטוסים</p>
            <div className="flex flex-col gap-2">
              {statusGroups.map((group, i) => {
                const groupPct = stats.total > 0 ? group.emps.length / stats.total : 0;
                return (
                  <div key={i} className="rounded-xl border p-2.5"
                    style={{ borderColor: `${group.color}25`, backgroundColor: `${group.color}08` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                        <span className="text-xs font-black" style={{ color: group.color }}>{group.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {Math.round(groupPct * 100)}%
                        </span>
                        <span className="text-xs font-black px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: `${group.color}20`, color: group.color }}>
                          {group.emps.length}
                        </span>
                      </div>
                    </div>
                    {/* Mini progress */}
                    <div className="h-1.5 bg-black/10 rounded-full overflow-hidden mb-2">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${groupPct * 100}%` }}
                        transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
                        style={{ backgroundColor: group.color }} />
                    </div>

                    {/* Toggle button for employee list */}
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="flex items-center gap-1 text-[10px] font-black hover:underline mt-0.5"
                      style={{ color: group.color }}
                    >
                      <span>לרשימה המלאה ({group.emps.length})</span>
                      <ChevronDown className={cn("w-3 h-3 transition-transform duration-150",
                        expandedGroups.has(group.name) && "rotate-180")} />
                    </button>

                    {/* Employee chips — shown only when expanded */}
                    <AnimatePresence>
                      {expandedGroups.has(group.name) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-1 pt-2">
                            {group.emps.map((emp) => (
                              <button
                                key={emp.id}
                                onClick={() => openProfile(emp.id)}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border transition-all hover:scale-105 active:scale-95"
                                style={{
                                  borderColor: `${group.color}40`,
                                  color: group.color,
                                  backgroundColor: `${group.color}12`,
                                }}
                              >
                                {emp.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing employees */}
        {stats.missing.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                לא דיווחו ({stats.missing.length})
              </p>
              <button
                onClick={() => setMissingExpanded((v) => !v)}
                className="flex items-center gap-1 text-[10px] font-black text-rose-500 hover:underline"
              >
                <span>לרשימה</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-150",
                  missingExpanded && "rotate-180")} />
              </button>
            </div>
            <AnimatePresence>
              {missingExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {stats.missing.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => openProfile(emp.id)}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                          {emp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Branded footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <span className="text-[9px] font-black text-primary tracking-widest uppercase">ShiftGuard</span>
          <span className="text-[9px] text-muted-foreground font-bold">
            {format(stats.date, "dd/MM/yyyy")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AttendanceCalendarView({ statusTypes, scopeEmployees, onClose }: Props) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    if (viewMode === "week") {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      });
    }
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
      end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
    });
  }, [currentDate, viewMode]);

  const parsedEmps = useMemo(() => prepareEmployees(scopeEmployees), [scopeEmployees]);

  const subToParent = useMemo(() => {
    const m = new Map<number, { name: string; color: string }>();
    statusTypes.forEach((st) => {
      if (st.parent_status_id) {
        const parent = statusTypes.find((p) => p.id === st.parent_status_id);
        if (parent) m.set(st.id, { name: parent.name, color: parent.color });
      }
    });
    return m;
  }, [statusTypes]);

  const dayStats = useMemo(
    () => days.map((day) => computeDayStats(parsedEmps, subToParent, day)),
    [days, parsedEmps, subToParent],
  );

  const selectedDayStats = useMemo(
    () => (selectedDay ? dayStats.find((d) => isSameDay(d.date, selectedDay)) ?? null : null),
    [selectedDay, dayStats],
  );

  const navigate = useCallback((dir: 1 | -1) => {
    if (viewMode === "week") setCurrentDate((p) => dir === 1 ? addWeeks(p, 1) : subWeeks(p, 1));
    else setCurrentDate((p) => dir === 1 ? addMonths(p, 1) : subMonths(p, 1));
  }, [viewMode]);

  const goToday = () => setCurrentDate(new Date());

  const periodLabel = useMemo(() => {
    if (viewMode === "week") {
      const s = startOfWeek(currentDate, { weekStartsOn: 0 });
      const e = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(s, "d MMM", { locale: he })} – ${format(e, "d MMM", { locale: he })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: he });
  }, [currentDate, viewMode]);

  // Calendar image export
  const handleExport = async () => {
    const target = exportRef.current;
    if (!target || isExporting) return;
    setIsExporting(true);
    try {
      const bakeStyles = (el: Element) => {
        if (!(el instanceof HTMLElement)) return;
        const cs = getComputedStyle(el);
        el.style.color = cs.color;
        el.style.backgroundColor = cs.backgroundColor;
        el.style.borderColor = cs.borderColor;
        for (const child of Array.from(el.children)) bakeStyles(child);
      };
      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${target.offsetWidth}px;padding:20px;border-radius:16px;direction:rtl;`;
      clone.style.backgroundColor = getComputedStyle(target).backgroundColor || "#1e293b";
      document.body.appendChild(clone);
      bakeStyles(clone);
      const dataUrl = await toPng(clone, { quality: 1, pixelRatio: 2, cacheBust: true });
      document.body.removeChild(clone);
      const label = periodLabel.replace(/[\s/–]/g, "_");
      const link = document.createElement("a");
      link.download = `shiftguard_${label}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("התמונה יוצאה בהצלחה!");
    } catch (e) {
      toast.error("שגיאה בייצוא התמונה");
    } finally {
      setIsExporting(false);
    }
  };

  // If a day is selected → show the day detail view
  if (selectedDay && selectedDayStats) {
    return (
      <DayDetailView
        stats={selectedDayStats}
        onBack={() => setSelectedDay(null)}
        subToParent={subToParent}
        parsedEmps={parsedEmps}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col gap-3"
      dir="rtl"
    >
      {/* ══ ROW 1: Navigation ══ */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center hover:bg-muted active:scale-95 transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-sm font-black text-foreground tracking-tight">{periodLabel}</span>
          <button onClick={goToday} className="text-[9px] font-bold text-primary hover:underline mt-0.5 leading-none">
            היום
          </button>
        </div>
        <button onClick={() => navigate(1)}
          className="w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center hover:bg-muted active:scale-95 transition-all shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ══ ROW 2: View toggle + actions ══ */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 border border-border/40">
          <button onClick={() => setViewMode("week")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all",
              viewMode === "week" ? "bg-card text-primary shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground")}>
            <CalendarDays className="w-3.5 h-3.5" />שבועי
          </button>
          <button onClick={() => setViewMode("month")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all",
              viewMode === "month" ? "bg-card text-primary shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground")}>
            <CalendarRange className="w-3.5 h-3.5" />חודשי
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={isExporting}
            className="h-8 gap-1.5 text-xs font-bold border border-border/40 rounded-xl hover:bg-primary/5 hover:text-primary disabled:opacity-60">
            {isExporting ? (
              <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg><span className="hidden sm:inline">מייצא...</span></>
            ) : (
              <><Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">ייצוא תמונה</span></>
            )}
          </Button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border/40 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ══ Calendar grid (export target) ══ */}
      <div ref={exportRef} className="flex flex-col gap-3">
        {viewMode === "month" && (
          <div>
            <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
              {HEB_DAYS.map((day) => (
                <div key={day} className="text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-[2px] md:gap-1">
              {dayStats.map((ds) => (
                <MonthDayCell key={ds.date.toISOString()} stats={ds}
                  isCurrentMonth={isSameMonth(ds.date, currentDate)}
                  selectedDate={selectedDay} onClick={() => setSelectedDay(ds.date)} />
              ))}
            </div>
          </div>
        )}
        {viewMode === "week" && (
          <div className="flex flex-col gap-2">
            {dayStats.map((ds) => (
              <WeekDayRow key={ds.date.toISOString()} stats={ds}
                selectedDate={selectedDay} onClick={() => setSelectedDay(ds.date)} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
