import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  BarChart2,
  TrendingUp,
  Users,
  Gift,
  Sparkles,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReportToolbar } from "@/components/dashboard/ReportToolbar";
import { useEmployees } from "@/hooks/useEmployees";
import { AttendanceTrendCard } from "@/components/dashboard/AttendanceTrendCard";
import { StatsComparisonCard } from "@/components/dashboard/StatsComparisonCard";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { differenceInDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";

interface ReportHubProps {
  onShareBirthdays: () => void;
  className?: string;
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
  const [localDate, setLocalDate] = useState<Date>(initialDate);
  const [localViewMode, setLocalViewMode] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "custom"
  >(initialViewMode);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Data State for Reports
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [snapshotStats, setSnapshotStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Refs for hidden reports
  const trendRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);
  const snapshotRef = useRef<any>(null);

  const { getTrendStats, getComparisonStats, getDashboardStats } =
    useEmployees();

  const activeDaysRange = useMemo(() => {
    if (localViewMode === "custom") {
      if (dateRange?.from && dateRange?.to) {
        return Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1);
      }
      return 7; // Fallback
    }

    switch (localViewMode) {
      case "daily":
        return 1;
      case "weekly":
        return 7;
      case "monthly":
        return 30;
      case "yearly":
        return 365;
      default:
        return 7;
    }
  }, [localViewMode, dateRange]);

  // Calculate Max Date logic
  const maxDate = useMemo(() => {
    return undefined; // Allow future dates for all reports
  }, []);

  // Sync initial state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalDate(initialDate);
      setLocalViewMode(initialViewMode);
    }
  }, [isOpen, initialDate, initialViewMode]);

  // Fetch Report Data when filters change inside the hub
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);

      // Determine effective date and range
      let effectiveDate = localDate;
      const days = activeDaysRange;

      if (localViewMode === "custom") {
        if (!dateRange?.to || !dateRange?.from) {
          // Incomplete range, don't fetch or fetch default?
          // Let's wait for full range selection if in custom mode
          if (!dateRange?.from) {
            setLoading(false);
            return;
          }
          // If only from is selected, maybe we show just that day?
          effectiveDate = dateRange.from;
        } else {
          effectiveDate = dateRange.to;
        }
      }

      const formattedDate = format(effectiveDate, "yyyy-MM-dd");

      // Fetch Trend
      const tData = await getTrendStats(days, formattedDate, {
        department_id: filters.department_id,
        section_id: filters.section_id,
        team_id: filters.team_id,
        serviceTypes: filters.serviceTypes.join(","),
        status_id: filters.status_id,
      });
      setTrendStats(tData || []);

      // Fetch Comparison
      const cData = await getComparisonStats(formattedDate, days, {
        department_id: filters.department_id,
        section_id: filters.section_id,
        team_id: filters.team_id,
        serviceTypes: filters.serviceTypes.join(","),
        status_id: filters.status_id,
      });
      setComparisonStats(cData || []);

      // Fetch Snapshot (Dashboard Stats) - always for the END date
      const dData = await getDashboardStats({
        department_id: filters.department_id,
        section_id: filters.section_id,
        team_id: filters.team_id,
        date: formattedDate,
        serviceTypes: filters.serviceTypes.join(","),
        status_id: filters.status_id,
      });
      setSnapshotStats(dData?.stats || []);

      setLoading(false);
    };

    fetchData();
  }, [
    isOpen,
    localDate,
    localViewMode,
    dateRange,
    activeDaysRange,
    filters,
    getTrendStats,
    getComparisonStats,
    getDashboardStats,
  ]);

  const downloadCard = async (ref: any) => {
    if (!ref.current) {
      toast.error("לא ניתן למצוא את הגרף להפקה");
      return;
    }

    // Call component's internal download logic if available
    try {
      if (ref.current.download) {
        await ref.current.download();
      } else {
        toast.error("Ref method missing");
      }
    } catch (e) {
      console.error("Download error", e);
      toast.error("שגיאה בהורדה");
    }
  };

  const shareCard = async (ref: any) => {
    if (ref.current && ref.current.share) {
      await ref.current.share();
    } else {
      toast.error("שיתוף לא זמין עבור דוח זה");
    }
  };

  // Render a nicer card avoiding overflow
  const ReportCard = ({
    icon: Icon,
    title,
    description,
    colorClass,
    onDownload,
    onWhatsApp,
    hasDownload = true,
  }: {
    icon: any;
    title: string;
    description: string;
    colorClass: string;
    onDownload?: () => void;
    onWhatsApp: () => void;
    hasDownload?: boolean;
  }) => (
    <div className="group relative bg-card/50 hover:bg-card border border-border/50 hover:border-primary/20 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-lg active:scale-[0.99] overflow-hidden flex flex-col h-full">
      {/* Background Glow */}
      <div
        className={cn(
          "absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full pointer-events-none",
          colorClass,
        )}
      />

      <div className="flex items-start gap-3 sm:gap-4 flex-1">
        <div
          className={cn(
            "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300",
            colorClass.replace("bg-", "bg-").replace("text-", "text-"),
          )}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 border-none" />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm sm:text-base font-black text-foreground truncate break-words">
              {title}
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-relaxed mb-4 line-clamp-3 break-words">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-2 border-t border-border/30">
        {hasDownload && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownload}
            className="h-8 sm:h-9 px-3 rounded-xl gap-1.5 font-bold text-[10px] sm:text-[11px] bg-muted/50 hover:bg-muted text-foreground transition-all flex-1"
            disabled={loading}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="truncate">הורדה</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onWhatsApp}
          className={cn(
            "h-8 sm:h-9 px-3 rounded-xl gap-1.5 font-bold text-[10px] sm:text-[11px] transition-all",
            hasDownload ? "flex-1" : "w-full",
            "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white",
          )}
          disabled={loading}
        >
          <FaWhatsapp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">שיתוף</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 rounded-xl gap-2 font-black transition-all px-4 shrink-0 shadow-sm border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 active:scale-95",
              className,
            )}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">מרכז דוחות</span>
            <Sparkles className="w-3 h-3 opacity-50 animate-pulse text-amber-500" />
          </Button>
        </DialogTrigger>

        <DialogContent
          className="w-[95vw] max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden border-none bg-background rounded-2xl sm:rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
          showCloseButton={true}
        >
          {/* Header Section with Gradient */}
          <div className="bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-8 pb-4 shrink-0">
            <DialogHeader className="text-right">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 sm:p-2.5 bg-primary rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 rotate-3 shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg sm:text-2xl font-black text-foreground truncate">
                    מרכז הפקת דוחות
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm font-bold text-muted-foreground mt-1 truncate">
                    ייצוא נתונים, שיתוף סטטיסטיקות ודיווחים
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-2 bg-muted/30 border-b border-border/50 shrink-0 overflow-x-auto touch-pan-x">
            <ReportToolbar
              viewMode={localViewMode}
              onViewModeChange={setLocalViewMode}
              date={localDate}
              onDateChange={setLocalDate}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              maxDate={maxDate}
            />
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Attendance Snapshot */}
              <ReportCard
                icon={Users}
                title="מצבת כוח אדם"
                description="דוח ויזואלי של חלוקת השוטרים לפי סטטוס נוכחות."
                colorClass="bg-blue-500/10 text-blue-600"
                onDownload={() => downloadCard(snapshotRef)}
                onWhatsApp={() => shareCard(snapshotRef)}
              />

              {/* Trend Report */}
              <ReportCard
                icon={TrendingUp}
                title="מגמות וזמינות"
                description="ניתוח היסטורי של רמת הזמינות ביחידה לאורך זמן."
                colorClass="bg-amber-500/10 text-amber-600"
                onDownload={() => downloadCard(trendRef)}
                onWhatsApp={() => shareCard(trendRef)}
              />

              {/* Comparison Report */}
              <ReportCard
                icon={BarChart2}
                title="השוואת תת-יחידות"
                description="השוואה בין מחלקות, מדורים וחוליות ברמת הזמינות."
                colorClass="bg-purple-500/10 text-purple-600"
                onDownload={() => downloadCard(comparisonRef)}
                onWhatsApp={() => shareCard(comparisonRef)}
              />

              {/* Birthdays */}
              <ReportCard
                icon={Gift}
                title="ריכוז ימי הולדת"
                description="רשימת החוגגים בשבוע הקרוב מוכנה לשליחה."
                colorClass="bg-rose-500/10 text-rose-600"
                hasDownload={false}
                onWhatsApp={() => {
                  onShareBirthdays();
                }}
              />
            </div>
          </div>

          {/* Footer spacer if needed, but flex-col handles it */}
        </DialogContent>
      </Dialog>

      {/* Hidden Reports Area */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
        <div style={{ width: "800px", height: "600px" }}>
          <EmployeesChart
            ref={snapshotRef}
            stats={snapshotStats}
            loading={loading}
            title={`מצבת כוח אדם - ${filters.unitName}`}
            description={`דוח מערכת נכון לתאריך ${format(localDate, "dd/MM/yyyy")}`}
            selectedDate={localDate}
          />
        </div>
        <div style={{ width: "800px", height: "600px" }}>
          <AttendanceTrendCard
            ref={trendRef}
            data={trendStats}
            loading={loading}
            range={activeDaysRange}
            unitName={filters.unitName}
            subtitle={`דוח הופק ב- ${format(localDate, "dd/MM/yyyy")}`}
            selectedDate={localDate}
          />
        </div>
        <div style={{ width: "800px", height: "600px" }}>
          <StatsComparisonCard
            ref={comparisonRef}
            data={comparisonStats}
            loading={loading}
            days={activeDaysRange}
            unitName={filters.unitName}
            subtitle={`דוח הופק ב- ${format(localDate, "dd/MM/yyyy")}`}
            selectedDate={localDate}
          />
        </div>
      </div>
    </>
  );
};
