import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  BarChart2,
  TrendingUp,
  Users,
  Gift,
  ArrowRight,
  Eye,
  Lock,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReportToolbar } from "@/components/dashboard/ReportToolbar";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { AttendanceTrendCard } from "@/components/dashboard/AttendanceTrendCard";
import { StatsComparisonCard } from "@/components/dashboard/StatsComparisonCard";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { differenceInDays, format, isBefore } from "date-fns";
import type { DateRange } from "react-day-picker";
import { RestorationRequestDialog } from "@/components/dashboard/RestorationRequestDialog";

interface ReportHubProps {
  onShareBirthdays: () => void;
  className?: string;
  id?: string;
  initialDate?: Date;
  initialViewMode?: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  filters?: {
    department_id: string;
    section_id: string;
    team_id: string;
    serviceTypes: string[];
    unitName: string;
    statusName?: string;
    status_id?: string;
  };
}

export const ReportHub: React.FC<ReportHubProps> = ({
  onShareBirthdays,
  className,
  id,
  initialDate = new Date(),
  initialViewMode = "weekly",
  filters = {
    department_id: "",
    section_id: "",
    team_id: "",
    serviceTypes: [],
    unitName: "כלל היחידה",
    status_id: undefined,
  },
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewType, setPreviewType] = useState<null | 'snapshot' | 'trend' | 'comparison' | 'birthdays'>(null);
  const [localDate, setLocalDate] = useState<Date>(initialDate);
  const [localViewMode, setLocalViewMode] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "custom"
  >(initialViewMode);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [snapshotStats, setSnapshotStats] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasArchiveAccess, setHasArchiveAccess] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const { user } = useAuthContext();
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tutorial = searchParams.get("tutorial");
    if (tutorial === "report-hub" || tutorial === "report-hub-inside") {
      setActiveTutorial(tutorial);
      if (tutorial === "report-hub-inside") {
        setIsOpen(true);
      }
      const timer = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("tutorial");
        setSearchParams(newParams, { replace: true });
        setTimeout(() => setActiveTutorial(null), 1000);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  // When moving past the report-hub-inside step to attendance, ensure Dialog closes
  useEffect(() => {
    const isAttendance = location.pathname.includes('attendance');
    if (isAttendance && isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const isOldDate = useMemo(() => {
    if (user?.is_admin) return false;
    const today = new Date();
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return isBefore(localDate, startOfPrevMonth);
  }, [localDate, user]);

  const trendRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);
  const snapshotRef = useRef<any>(null);

  const { getTrendStats, getComparisonStats, getDashboardStats } =
    useEmployees();

  const snapshotTotal = useMemo(() => {
    return snapshotStats.reduce((acc, curr) => acc + curr.count, 0);
  }, [snapshotStats]);

  const activeDaysRange = useMemo(() => {
    if (localViewMode === "custom") {
      if (dateRange?.from && dateRange?.to) {
        return Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1);
      }
      return 7;
    }

    switch (localViewMode) {
      case "daily": return 1;
      case "weekly": return 7;
      case "monthly": return 30;
      case "yearly": return 365;
      default: return 7;
    }
  }, [localViewMode, dateRange]);

  const maxDate = useMemo(() => undefined, []);

  useEffect(() => {
    if (isOpen) {
      setLocalDate(initialDate);
      setLocalViewMode(initialViewMode);
    } else {
      setPreviewType(null);
    }
  }, [isOpen, initialDate, initialViewMode]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      let effectiveDate = localDate;
      const days = activeDaysRange;

      if (localViewMode === "custom") {
        if (!dateRange?.from) {
          setLoading(false);
          return;
        }
        effectiveDate = dateRange.to || dateRange.from;
      }

      const formattedDate = format(effectiveDate, "yyyy-MM-dd");

      try {
        const [tData, cData, dData] = await Promise.all([
          getTrendStats(days, formattedDate, {
            department_id: filters.department_id,
            section_id: filters.section_id,
            team_id: filters.team_id,
            serviceTypes: filters.serviceTypes.join(","),
            status_id: filters.status_id,
          }),
          getComparisonStats(formattedDate, days, {
            department_id: filters.department_id,
            section_id: filters.section_id,
            team_id: filters.team_id,
            serviceTypes: filters.serviceTypes.join(","),
            status_id: filters.status_id,
          }),
          getDashboardStats({
            department_id: filters.department_id,
            section_id: filters.section_id,
            team_id: filters.team_id,
            date: formattedDate,
            serviceTypes: filters.serviceTypes.join(","),
            status_id: filters.status_id,
          })
        ]);
        setTrendStats(tData || []);
        setComparisonStats(cData || []);
        setSnapshotStats(dData?.stats || []);
        setBirthdays(dData?.birthdays || []);
        setHasArchiveAccess(dData?.has_archive_access || false);
      } catch (err) {
        toast.error("שגיאה בטעינת נתוני דוחות");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, localDate, localViewMode, dateRange, activeDaysRange, JSON.stringify(filters)]);

  const downloadCard = async (ref: any) => {
    if (!ref.current) return;
    try {
      if (ref.current.download) await ref.current.download();
    } catch (e) { toast.error("שגיאה בהורדה"); }
  };

  const shareCard = async (ref: any) => {
    if (ref.current && ref.current.share) await ref.current.share();
  };

  // Mobile: slim horizontal row. Desktop: keeps old card style via sm: breakpoints.
  const ReportCard = ({ icon: Icon, title, onDownload, onWhatsApp, hasDownload = true, onClick }: any) => (
    <div
      onClick={onClick}
      className="group flex justify-between items-center p-3.5 bg-card/60 hover:bg-accent border border-border/50 rounded-xl transition-all active:scale-[0.98] cursor-pointer sm:bg-card/40 sm:border-border/40 sm:rounded-[2rem] sm:p-5 sm:hover:border-primary/40 shadow-sm hover:shadow-md"
    >
      {/* Right side: icon + title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 transition-colors group-hover:bg-primary/20">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{title}</span>
      </div>

      {/* Left side: action buttons */}
      <div className="flex items-center gap-2 no-export" onClick={(e) => e.stopPropagation()}>
        {hasDownload ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
              className="p-2 rounded-lg text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 transition-colors active:scale-90"
              aria-label="שיתוף בוואטסאפ"
            >
              <FaWhatsapp className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors active:scale-90"
              aria-label="הורדה"
            >
              <Download className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors active:scale-90"
          >
            <FaWhatsapp className="w-4 h-4" />
            שיתוף וריכוז
          </button>
        )}
      </div>
    </div>
  );

  const PreviewHeader = ({ title, icon: Icon, colorClass }: any) => (
    <div className="flex items-center justify-between mb-2 sm:mb-4 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className={cn("p-1.5 sm:p-3 rounded-lg sm:rounded-xl", colorClass)}>
          <Icon className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h4 className="text-[13px] sm:text-2xl font-black text-foreground tracking-tight leading-none">{title}</h4>
          <p className="hidden xs:block text-[9px] sm:text-xs font-bold text-muted-foreground/60 mt-0.5 sm:mt-1 tracking-tight">נתוני מערכת • {filters.unitName}</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        onClick={() => setPreviewType(null)}
        className="h-7 sm:h-11 rounded-lg sm:rounded-2xl px-2 sm:px-5 gap-1 sm:gap-2 font-black text-[10px] sm:text-sm bg-muted/40 border-border/40 hover:bg-muted"
      >
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
        <span>חזור</span>
        <span className="hidden sm:inline">לרשימה</span>
      </Button>
    </div>
  );


  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            id={id || "report-hub-card"}
            variant="ghost" 
            className={cn(
              "rounded-xl font-black transition-all bg-card/40 border border-border/40 text-primary hover:bg-primary/5 active:scale-95 backdrop-blur-xl",
              className?.includes("h-20") 
                ? className 
                : cn("h-9 gap-2 px-4 text-[13px]", className),
              searchParams.get("tutorial") === "report-hub" || activeTutorial === "report-hub" ? "tutorial-highlight" : ""
            )}
          >
            {className?.includes("flex-col") ? (
              <>
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black leading-none">דוחות</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>מרכז דוחות</span>
              </>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className={cn(
          "p-0 overflow-hidden border border-border/40 bg-background/95 backdrop-blur-3xl sm:rounded-[2rem] flex flex-col transition-all duration-300 shadow-2xl",
          previewType !== null && "h-full sm:h-auto sm:max-h-[92vh]",
          "sm:max-w-4xl sm:w-full"
        )}>
          <DialogDragHandle />

          {/* Header - Hides on mobile preview */}
          <div className={cn(
            "px-6 pt-2 pb-4 border-b border-border/30 flex items-center justify-between shrink-0",
            previewType && "hidden sm:flex"
          )}>
            <div className="flex-1 text-right">
              <DialogTitle className="text-xl font-black text-foreground">
                מרכז הפקת דוחות
              </DialogTitle>
              <DialogDescription className="sr-only">ניהול, הפקה ושיתוף נתונים מבצעיים</DialogDescription>
            </div>
            {/* We could place a close or action button here if needed */}
          </div>

          {/* Compact Toolbar - Consistent padding */}
          <div className="px-4 sm:px-8 py-1.5 bg-muted/20 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar">
            <ReportToolbar viewMode={localViewMode} onViewModeChange={setLocalViewMode} date={localDate} onDateChange={setLocalDate} dateRange={dateRange} onDateRangeChange={setDateRange} maxDate={maxDate} />
          </div>

          <div className={cn("p-2 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/5 relative", previewType && "p-2 sm:p-4")}>
            {(isOldDate && !hasArchiveAccess) ? (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md rounded-b-[1.5rem] sm:rounded-b-[2rem]">
                <div className="bg-card border border-border/50 rounded-[2rem] p-8 max-w-md text-center space-y-4 m-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-black">נתוני ארכיון חסומים</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    הנתונים מהתקופה הזו הועברו לארכיון. על מנת לצפות ולהפיק דוחות, עליך לבקש אישור גישה.
                  </p>
                  <Button 
                    onClick={() => setRestoreDialogOpen(true)}
                    className="w-full rounded-xl h-12 font-black mt-4"
                  >
                    הגש בקשת גישה לארכיון
                  </Button>
                </div>
              </div>
            ) : null}

            {previewType === null ? (
              <div id="report-hub-content" className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
                <ReportCard icon={Users} title="מצבת כוח אדם" onClick={() => setPreviewType('snapshot')} onDownload={() => downloadCard(snapshotRef)} onWhatsApp={() => shareCard(snapshotRef)} />
                <ReportCard icon={TrendingUp} title="מגמות וזמינות" onClick={() => setPreviewType('trend')} onDownload={() => downloadCard(trendRef)} onWhatsApp={() => shareCard(trendRef)} />
                <ReportCard icon={BarChart2} title="השוואת תת-יחידות" onClick={() => setPreviewType('comparison')} onDownload={() => downloadCard(comparisonRef)} onWhatsApp={() => shareCard(comparisonRef)} />
                <ReportCard icon={Gift} title="ריכוז ימי הולדת" onClick={() => setPreviewType('birthdays')} hasDownload={false} onWhatsApp={() => onShareBirthdays()} />
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PreviewHeader title={
                  previewType === 'snapshot' ? "מצבת כוח אדם" :
                  previewType === 'trend' ? "מגמות וזמינות" :
                  previewType === 'comparison' ? "השוואת תת-יחידות" : "חוגגי ימי הולדת"
                } icon={
                  previewType === 'snapshot' ? Users :
                  previewType === 'trend' ? TrendingUp :
                  previewType === 'comparison' ? BarChart2 : Gift
                } colorClass={
                  previewType === 'snapshot' ? "bg-blue-500" :
                  previewType === 'trend' ? "bg-amber-500" :
                  previewType === 'comparison' ? "bg-purple-500" : "bg-rose-500"
                } />

                <div className="flex-1 flex flex-col min-h-0 bg-card/60 rounded-[1.25rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden backdrop-blur-2xl">
                  <div className="flex-1 overflow-y-auto no-scrollbar p-0 sm:p-6 flex flex-col h-full">
                    {previewType === 'snapshot' && (
                      <EmployeesChart stats={snapshotStats} total={snapshotTotal} loading={loading} hideHeader={true} unitName={filters.unitName} selectedDate={localDate} />
                    )}
                    {previewType === 'trend' && (
                      <AttendanceTrendCard data={trendStats} loading={loading} range={activeDaysRange} unitName={filters.unitName} hideHeader={true} selectedDate={localDate} />
                    )}
                    {previewType === 'comparison' && (
                      <StatsComparisonCard data={comparisonStats} loading={loading} days={activeDaysRange} unitName={filters.unitName} hideHeader={true} selectedDate={localDate} />
                    )}
                    {previewType === 'birthdays' && (
                      <div className="flex-1 overflow-y-auto min-h-[300px] p-2">
                        {birthdays.length === 0 ? (
                          <div className="text-center py-10 sm:py-12"><Gift className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" /><p className="text-xs font-black text-muted-foreground">אין חוגגים בטווח הנבחר</p></div>
                        ) : (
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
                            {birthdays.map((emp, i) => (
                              <div key={i} className="flex items-center justify-between p-2.5 sm:p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-[11px]-500/20">{emp.first_name[0]}{emp.last_name[0]}</div>
                                  <div><p className="font-black text-xs sm:text-sm text-foreground">{emp.first_name} {emp.last_name}</p><p className="text-[10px] font-bold text-muted-foreground">{emp.sub_unit || filters.unitName}</p></div>
                                </div>
                                <div className="text-left"><p className="text-xs font-black text-rose-500">{format(new Date(emp.birth_date), 'dd/MM')}</p></div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Compact Actions inside Preview */}
                <div className="mt-3 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0 pb-2">
                  {(previewType !== 'birthdays') && (
                    <Button onClick={() => { if (previewType === 'snapshot') downloadCard(snapshotRef); if (previewType === 'trend') downloadCard(trendRef); if (previewType === 'comparison') downloadCard(comparisonRef); }} disabled={loading} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-primary text-white font-black text-sm sm:text-base flex-1 gap-2 sm:gap-3 active:scale-95 transition-all">
                      <Download className="w-5 h-5 sm:w-6 sm:h-6" /><span>הורדה למכשיר</span></Button>
                  )}
                  <Button onClick={() => { if (previewType === 'birthdays') onShareBirthdays(); else if (previewType === 'snapshot') shareCard(snapshotRef); else if (previewType === 'trend') shareCard(trendRef); else if (previewType === 'comparison') shareCard(comparisonRef); }} disabled={loading} className={cn("h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500 text-white font-black text-sm sm:text-base gap-2 sm:gap-3 active:scale-95 transition-all flex-1")}>
                    <FaWhatsapp className="w-5 h-5 sm:w-7 sm:h-7" /><span>שיתוף מהיר</span></Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Hidden high-res capture divs — only mount when dialog is open to prevent recharts measuring zero-sized containers */}
      {isOpen && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none text-right" dir="rtl" style={{ visibility: 'hidden' }}>
          <div style={{ width: "800px", height: "600px" }}><EmployeesChart ref={snapshotRef} stats={snapshotStats} total={snapshotTotal} loading={loading} unitName={filters.unitName} selectedDate={localDate} /></div>
          <div style={{ width: "800px", height: "600px" }}><AttendanceTrendCard ref={trendRef} data={trendStats} loading={loading} range={activeDaysRange} unitName={filters.unitName} selectedDate={localDate} /></div>
          <div style={{ width: "800px", height: "600px" }}><StatsComparisonCard ref={comparisonRef} data={comparisonStats} loading={loading} days={activeDaysRange} unitName={filters.unitName} selectedDate={localDate} /></div>
        </div>
      )}

      <RestorationRequestDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        targetDate={localDate}
      />
    </>
  );
};
