import { useRef, useMemo, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Download, Activity, ShieldCheck, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import { format, subDays, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface EmployeesChartProps {
  stats: {
    status_id: number;
    status_name: string;
    count: number;
    color: string;
  }[];
  total: number;
  loading?: boolean;
  onOpenWhatsAppReport?: () => void;
  onStatusClick?: (statusId: number, statusName: string, color: string) => void;
  onFilterClick?: () => void;
  title?: string;
  description?: string;
  selectedDate?: Date;
  hideExportControls?: boolean;
  unitName?: string;
  totalInUnit?: number;
  availableCount?: number;
  reportedPct?: number;
  fullUnitStats?: {
    status_id: number;
    status_name: string;
    count: number;
    color: string;
  }[];
  hasArchiveAccess?: boolean;
  onRequestRestore?: () => void;
  selectedStatusId?: number | null;
  filterTags?: string[];
  hideHeader?: boolean;
}

const EmployeesChartComponent = (
  {
    stats,
    total,
    loading = false,
    onOpenWhatsAppReport,
    onStatusClick,
    onFilterClick,
    title = "מצבת כוח אדם",
    description = "סטטוס נוכחות בזמן אמת",
    selectedDate = new Date(),
    hideExportControls = false,
    unitName = "כלל היחידה",
    totalInUnit = 0,
    availableCount = 0,
    reportedPct = 0,
    hasArchiveAccess = false,
    onRequestRestore,
    selectedStatusId = null,
    filterTags = [],
    hideHeader = false,
  }: EmployeesChartProps,
  ref: any,
) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [chartType, setChartType] = useState<"pie" | "bar">("pie");

    useEffect(() => {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setChartType("pie");
      }
    }, []);

    useImperativeHandle(ref, () => ({
      download: handleDownload,
      share: handleWhatsAppShare,
    }));

    const handleDownload = async () => {
      if (!cardRef.current) return;
      try {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          backgroundColor: "white",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "absolute";
              dateEl.style.top = "20px";
              dateEl.style.left = "20px";
              dateEl.style.opacity = "1";
              dateEl.style.zIndex = "50";
              dateEl.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
              dateEl.style.padding = "4px 12px";
              dateEl.style.borderRadius = "8px";
              dateEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              dateEl.style.border = "1px solid #e2e8f0";
              dateEl.style.color = "#0f172a";
              dateEl.innerText = `תאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);
        const link = document.createElement("a");
        link.download = `attendance-snapshot-${format(selectedDate, "yyyy-MM-dd")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("גרף הורד בהצלחה");
      } catch (err) {
        toast.error("שגיאה בהורדת הגרף");
      }
    };

    const handleWhatsAppShare = async () => {
      if (cardRef.current === null) return;
      try {
        const blob = await toBlob(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
        } as any);
        if (!blob) throw new Error("Failed to capture image");
        const titleText = `${title} - ${unitName}`;
        const message = `*${titleText}*\nתאריך הפקה: ${format(new Date(), "dd/MM/yyyy")}\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}\n\nסיכום: ${total} שוטרים ביחידה.`;
        const file = new File([blob], `attendance-snapshot.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: titleText, text: message });
          return;
        }
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
      } catch (err) {
        toast.error("שגיאה בהכנת הדוח ל-WhatsApp");
      }
    };

    const { chartData, computedAvailableCount, computedUnavailableCount } = useMemo(() => {
      if (!stats || stats.length === 0)
        return { chartData: [], computedAvailableCount: 0, computedUnavailableCount: 0 };

      const priorityMap: Record<string, number> = { "משרד": 1, "נוכח": 1, "תגבור": 2, "קורס": 3, "חופשה": 4, "חולה": 6, "לא דווח": 7 };
      const sortedStats = [...stats].sort((a, b) => (priorityMap[a.status_name] || 99) - (priorityMap[b.status_name] || 99));
      const viewTotal = sortedStats.reduce((acc, curr) => acc + curr.count, 0);
      const baseTotal = totalInUnit && totalInUnit > 0 ? totalInUnit : viewTotal;

      const data = sortedStats.map((item) => ({
        id: item.status_id === null ? -1 : item.status_id,
        name: item.status_name || "לא דווח",
        value: item.count,
        fill: item.color || "#94a3b8",
        percentage: baseTotal > 0 ? Math.round((item.count / baseTotal) * 100) : 0,
      }));

      const availableKeywords = ["משרד", "תגבור", "קורס"];
      let accAvail = 0; let accUnavail = 0;
      data.forEach(item => {
        if (item.name !== "לא דווח") {
          if (availableKeywords.some(kw => item.name.includes(kw))) accAvail += item.value;
          else accUnavail += item.value;
        }
      });
      return { chartData: data, computedAvailableCount: accAvail, computedUnavailableCount: accUnavail };
    }, [stats, totalInUnit]);

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
          <div className="bg-popover text-popover-foreground px-3 py-2 rounded text-sm border border-border shadow-xl">
            <p className="font-black">{d.name}</p>
            <p>{d.value} שוטרים</p>
            <p className="text-[10px] text-muted-foreground mt-1">{d.percentage}% מכלל היחידה</p>
          </div>
        );
      }
      return null;
    };

    const isOldData = useMemo(() => isBefore(selectedDate, subDays(new Date(), 30)), [selectedDate]);

    return (
      <Card
        ref={cardRef}
        id="attendance-snapshot-card"
        className={cn(
          "bg-card/60 backdrop-blur-2xl text-card-foreground gap-2 rounded-[1.5rem] border border-primary/10 py-3 flex flex-col overflow-hidden h-full relative transition-all",
          hideHeader && "border-none bg-transparent backdrop-blur-none shadow-none py-0"
        )}
      >
        {!hideHeader && (
          <CardHeader className="px-5 sm:px-6 py-3">
            <div className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight flex items-center flex-wrap gap-2">
                {title}
                {filterTags.length > 0 && filterTags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] h-5 px-2 font-black bg-blue-600 text-white rounded-md">{tag}</Badge>
                ))}
              </CardTitle>
              <div className="flex shrink-0 items-center gap-2 no-export">
                {!hideExportControls && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleDownload}><Download className="h-4 w-4" /></Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setChartType(prev => prev === "pie" ? "bar" : "pie")}>
                  {chartType === "pie" ? <BarChart2 className="h-4 w-4" /> : <PieChartIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className={cn("flex-1 flex flex-col min-h-0 relative p-4 sm:p-6", hideHeader && "p-0")}>
          {total === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-center text-muted-foreground font-bold">אין נתונים להצגה</div>
          ) : (
            <>
              <div className="flex-1 w-full flex-col min-h-0 min-h-[300px] relative" style={{ direction: "ltr" }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "pie" ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%" cy="50%"
                        innerRadius="35%" outerRadius="65%"
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        <LabelList dataKey="value" position="top" style={{ fill: "currentColor", fontSize: 12, fontWeight: 900 }} />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
                {chartType === "pie" && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                     <p className="text-4xl sm:text-5xl font-black text-foreground leading-none">{total}</p>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">נוכחות</p>
                   </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 no-export">
                <div className="bg-emerald-500/10 p-2 rounded-xl text-center">
                  <span className="block text-[8px] font-black text-emerald-600 uppercase">זמינים</span>
                  <span className="text-sm font-black text-emerald-600">{computedAvailableCount}</span>
                </div>
                <div className="bg-rose-500/10 p-2 rounded-xl text-center">
                  <span className="block text-[8px] font-black text-rose-600 uppercase">לא זמינים</span>
                  <span className="text-sm font-black text-rose-600">{computedUnavailableCount}</span>
                </div>
                <div className="bg-slate-500/10 p-2 rounded-xl text-center">
                  <span className="block text-[8px] font-black text-muted-foreground uppercase">סה"כ</span>
                  <span className="text-sm font-black text-foreground">{total}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
};

export const EmployeesChart = forwardRef(EmployeesChartComponent);
