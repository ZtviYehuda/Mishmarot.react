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

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { chartData, computedAvailableCount, computedUnavailableCount } = useMemo(() => {
      if (!stats || stats.length === 0)
        return { chartData: [], computedAvailableCount: 0, computedUnavailableCount: 0 };

      const priorityMap: Record<string, number> = { "משרד": 1, "נוכח": 1, "תגבור": 2, "קורס": 3, "חופשה": 4, "חולה": 6, "לא דווח": 7 };
      const sortedStats = [...stats].sort((a, b) => (priorityMap[a.status_name] || 99) - (priorityMap[b.status_name] || 99));
      const viewTotal = sortedStats.reduce((acc, curr) => acc + curr.count, 0);
      const baseTotal = totalInUnit && totalInUnit > 0 ? totalInUnit : viewTotal;

      // Calculate initial rounded percentages
      let percentages = sortedStats.map(item => 
        baseTotal > 0 ? Math.round((item.count / baseTotal) * 100) : 0
      );
      
      // Adjust to ensure sum is 100
      const currentSum = percentages.reduce((a, b) => a + b, 0);
      if (currentSum !== 100 && currentSum > 0 && percentages.length > 0) {
        const diff = 100 - currentSum;
        // Find index of the largest slice to absorb the rounding difference
        let maxIndex = 0;
        let maxValue = -1;
        sortedStats.forEach((s, idx) => {
          if (s.count > maxValue) {
            maxValue = s.count;
            maxIndex = idx;
          }
        });
        percentages[maxIndex] += diff;
      }

      const data = sortedStats.map((item, idx) => ({
        id: item.status_id === null ? -1 : item.status_id,
        name: item.status_name || "לא דווח",
        value: item.count,
        fill: item.color || "#94a3b8",
        percentage: percentages[idx],
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
          "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-card-foreground rounded-[1.5rem] border-none shadow-sm flex flex-col overflow-hidden h-full relative transition-all"
        )}
      >
        {(!hideHeader || filterTags.length > 0) && (
          <CardHeader className="px-6 py-2 border-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              {!hideHeader && (
                <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  {title}
                </CardTitle>
              )}
              {filterTags.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
                   <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-400 font-black uppercase tracking-tight ml-1 animate-pulse">
                    <Filter className="w-3 h-3" />
                  </div>
                  {filterTags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-[9px] h-5 px-2 font-black bg-blue-700 text-white border-none whitespace-nowrap rounded-md"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent className={cn("flex-1 flex flex-col min-h-[400px] relative px-2 py-4", hideHeader && (isMobile ? "p-4" : "p-8"))}>
          {total === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-center text-muted-foreground font-bold tracking-tight">
              אין נתונים להצגה
            </div>
          ) : (
            <div className="flex-1 w-full flex-col min-h-0 relative mt-0" style={{ direction: "ltr" }}>
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={isMobile ? { left: 35, right: 35, top: 30, bottom: 30 } : { left: 85, right: 85, top: 0, bottom: 0 }}>
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={isMobile ? "60%" : "50%"} 
                      outerRadius={isMobile ? "95%" : "90%"}
                      paddingAngle={5}
                      minAngle={18}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1000}
                      label={({ name, percentage, cx, x, y }) => {
                        const isRight = x > cx;
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="currentColor" 
                            textAnchor={isRight ? "start" : "end"} 
                            dominantBaseline="central"
                            className={cn(
                              "font-black fill-slate-700 dark:fill-slate-300",
                              isMobile ? "text-[10px]" : "text-[12px]"
                            )}
                          >
                            {`${name} (${percentage}%)`}
                          </text>
                        );
                      }}
                      labelLine={{ stroke: "rgba(148, 163, 184, 0.3)", strokeWidth: 1 }}
                    >
                      {chartData.map((entry, index) => {
                        const isSelected = selectedStatusId === entry.id;
                        const hasSelection = selectedStatusId !== null;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill} 
                            fillOpacity={!hasSelection || isSelected ? 1 : 0.25}
                            stroke={isSelected ? entry.fill : "none"}
                            strokeWidth={isSelected ? 3 : 0}
                            strokeOpacity={0.8}
                            className="cursor-pointer transition-all duration-500 outline-none"
                            onClick={() => onStatusClick?.(entry.id, entry.name, entry.fill)}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
                  </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="flex flex-col items-center justify-center">
                  <p className={cn("font-black text-slate-900 dark:text-white leading-none", isMobile ? "text-3xl" : "text-4xl")}>{total}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">נוכחות</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
};

export const EmployeesChart = forwardRef(EmployeesChartComponent);
