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
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReportToolbar } from "@/components/dashboard/ReportToolbar";
import { useEmployees } from "@/hooks/useEmployees";
import { AttendanceTrendCard } from "@/components/dashboard/AttendanceTrendCard";
import { StatsComparisonCard } from "@/components/dashboard/StatsComparisonCard";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { format } from "date-fns";

interface ReportHubProps {
  onOpenWhatsAppReport: () => void;
  onShareTrend: () => void; // Trigger for Dashboard sharing (legacy/quick share)
  onShareComparison: () => void;
  onShareBirthdays: () => void;
  className?: string;
  initialDate?: Date;
  initialViewMode?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  filters?: {
    department_id: string;
    section_id: string;
    team_id: string;
    serviceTypes: string[];
    unitName: string;
    statusName?: string;
  };
}

export const ReportHub: React.FC<ReportHubProps> = ({
  onOpenWhatsAppReport,
  onShareTrend,
  onShareComparison,
  onShareBirthdays,
  className,
  initialDate = new Date(),
  initialViewMode = 'weekly',
  filters = {
    department_id: "",
    section_id: "",
    team_id: "",
    serviceTypes: [],
    unitName: "כלל היחידה"
  },
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localDate, setLocalDate] = useState<Date>(initialDate);
  const [localViewMode, setLocalViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(initialViewMode);

  // Data State for Reports
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [snapshotStats, setSnapshotStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Refs for hidden reports
  const trendRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);
  const snapshotRef = useRef<any>(null);

  const { getTrendStats, getComparisonStats, getDashboardStats } = useEmployees();

  const trendRange = useMemo(() => {
    switch (localViewMode) {
      case 'daily': return 7;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'yearly': return 365;
      default: return 7;
    }
  }, [localViewMode]);

  const comparisonRange = useMemo(() => {
    switch (localViewMode) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'yearly': return 365; // Comparison for year?
      default: return 1;
    }
  }, [localViewMode]);

  // Calculate Max Date logic
  const maxDate = useMemo(() => {
    if (!filters.statusName) return new Date(); // Default to today

    // Statuses that allow future reporting
    const allowFuture = ["תגבור", "חו\"ל", "קורס", "חופשה"].some(s => filters.statusName?.includes(s));

    return allowFuture ? undefined : new Date();
  }, [filters.statusName]);

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
      const formattedDate = format(localDate, "yyyy-MM-dd");

      // Fetch Trend
      const tData = await getTrendStats(trendRange, formattedDate, {
        department_id: filters.department_id,
        section_id: filters.section_id,
        team_id: filters.team_id,
        serviceTypes: filters.serviceTypes.join(",")
      });
      setTrendStats(tData || []);

      // Fetch Comparison
      const cData = await getComparisonStats(formattedDate, comparisonRange, {
        department_id: filters.department_id,
        section_id: filters.section_id,
        team_id: filters.team_id,
        serviceTypes: filters.serviceTypes.join(",")
      });
      setComparisonStats(cData || []);

      // Fetch Snapshot (Dashboard Stats)
      const dData = await getDashboardStats({
        department_id: filters.department_id,
        section_id: filters.section_id,
        team_id: filters.team_id,
        date: formattedDate,
        serviceTypes: filters.serviceTypes.join(",")
      });
      setSnapshotStats(dData?.stats || []);

      setLoading(false);
    };

    fetchData();
  }, [isOpen, localDate, localViewMode, filters, getTrendStats, getComparisonStats, getDashboardStats, trendRange, comparisonRange]);


  const downloadCard = async (ref: any, fileName: string) => {
    if (!ref.current) {
      toast.error("לא ניתן למצוא את הגרף להפקה");
      return;
    }

    // Call component's internal download logic if available, OR use direct capture here.
    // The components (AttendanceTrendCard, etc) expose `download` method via ref.
    // So we can just call `ref.current.download()`.
    // BUT, their internal download uses `toPng` on their internal `div`.
    // And they name the file based on props.
    // If we call their method, it's easiest.

    try {
      if (ref.current.download) {
        await ref.current.download();
      } else {
        // Fallback if Ref doesn't expose download (shouldn't happen with current implementation)
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
    <div className="group relative bg-card/50 hover:bg-card border border-border/50 hover:border-primary/20 rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99] overflow-hidden">
      {/* Background Glow */}
      <div
        className={cn(
          "absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full",
          colorClass,
        )}
      />

      <div className="flex items-start gap-4 h-full">
        <div
          className={cn(
            "p-3 rounded-2xl shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300",
            colorClass.replace("bg-", "bg-").replace("text-", "text-"),
          )}
        >
          <Icon className="w-6 h-6 border-none" />
        </div>

        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm sm:text-base font-black text-foreground truncate">
              {title}
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {description}
          </p>

          <div className="mt-auto flex items-center gap-2">
            {hasDownload && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDownload}
                className="h-9 px-3 rounded-xl gap-1.5 font-bold text-[11px] bg-muted/50 hover:bg-muted text-foreground transition-all flex-1"
                disabled={loading}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">הורדה</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onWhatsApp}
              className={cn(
                "h-9 px-3 rounded-xl gap-1.5 font-bold text-[11px] transition-all",
                hasDownload ? "flex-1" : "w-full",
                "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white",
              )}
              disabled={loading}
            >
              <FaWhatsapp className="w-4 h-4" />
              <span>שיתוף</span>
            </Button>
          </div>
        </div>
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
          className="sm:max-w-2xl p-0 overflow-hidden border-none bg-background rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300"
          showCloseButton={true}
        >
          {/* Header Section with Gradient */}
          <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 pb-4">
            <DialogHeader className="text-right">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-primary rounded-2xl shadow-lg shadow-primary/20 rotate-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-black text-foreground">
                    מרכז הפקת דוחות
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">
                    ייצוא נתונים, שיתוף סטטיסטיקות ודיווחים חיצוניים
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 py-2 bg-muted/30 border-b border-border/50">
            <ReportToolbar
              viewMode={localViewMode}
              onViewModeChange={setLocalViewMode}
              date={localDate}
              onDateChange={setLocalDate}
              maxDate={maxDate}
            />
          </div>

          <div className="p-6 pt-2 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Attendance Snapshot */}
              <ReportCard
                icon={Users}
                title="מצבת כוח אדם"
                description="דוח ויזואלי מהיר של חלוקת השוטרים לפי סטטוס נוכחות נוכחי."
                colorClass="bg-blue-500/10 text-blue-600"
                onDownload={() => downloadCard(snapshotRef, "attendance")}
                onWhatsApp={() => shareCard(snapshotRef)}
              />

              {/* Trend Report */}
              <ReportCard
                icon={TrendingUp}
                title="מגמות וזמינות"
                description="ניתוח היסטורי של רמת הזמינות ביחידה לאורך זמן."
                colorClass="bg-amber-500/10 text-amber-600"
                onDownload={() => downloadCard(trendRef, "trend")}
                onWhatsApp={() => shareCard(trendRef)}
              />

              {/* Comparison Report */}
              <ReportCard
                icon={BarChart2}
                title="השוואת תת-יחידות"
                description="השוואה בין מחלקות, מדורים וחוליות ברמת הזמינות והנוכחות."
                colorClass="bg-purple-500/10 text-purple-600"
                onDownload={() => downloadCard(comparisonRef, "comparison")}
                onWhatsApp={() => shareCard(comparisonRef)}
              />

              {/* Birthdays */}
              <ReportCard
                icon={Gift}
                title="ריכוז ימי הולדת"
                description="רשימת כלל החוגגים בשבוע הקרוב מוכנה לשליחה מהירה."
                colorClass="bg-rose-500/10 text-rose-600"
                hasDownload={false}
                onWhatsApp={() => {
                  onShareBirthdays(); // Use passed handler for generic birthday share or implement specific one
                }}
              />
            </div>
          </div>

          {/* Modal Footer (Decorative/Empty space) */}
          <div className="h-4 bg-background" />
        </DialogContent>
      </Dialog>

      {/* Hidden Reports Area for Generation */}
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
            range={trendRange}
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
            days={comparisonRange}
            unitName={filters.unitName}
            subtitle={`דוח הופק ב- ${format(localDate, "dd/MM/yyyy")}`}
            selectedDate={localDate}
          />
        </div>
      </div>
    </>
  );
};
