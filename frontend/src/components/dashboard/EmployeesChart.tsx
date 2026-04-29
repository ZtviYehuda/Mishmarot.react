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
          <div className="bg-popover text-popover-foreground px-3 py-2 rounded text-sm border border-border">
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
          "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-card-foreground rounded-[1.5rem] border-0 shadow-sm hover:shadow-md flex flex-col overflow-hidden h-full relative transition-all"
        )}
      >
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-row justify-between items-center gap-3 mb-6 relative z-10 min-h-[70px]">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/40">
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-right flex flex-col">
              <h3 className="text-lg font-black text-foreground tracking-tight flex items-center flex-wrap gap-2">
                <span>{title}</span>
                {filterTags.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
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
              </h3>
            </div>
          </div>

          <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg flex border border-border/50 backdrop-blur-md">
            <button
              onClick={() => setChartType("pie")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                chartType === "pie" ? "bg-white dark:bg-slate-700 text-primary" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
              title="תצוגת עוגה"
            >
              <PieChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                chartType === "bar" ? "bg-white dark:bg-slate-700 text-primary" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
              title="תצוגת עמודות"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[380px] relative p-0 mt-0">
          {total === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-center text-muted-foreground font-bold tracking-tight">
              אין נתונים להצגה
            </div>
          ) : (
            <div className="flex-1 w-full flex-col min-h-0 relative mt-0" style={{ direction: "ltr", overflow: 'visible' }}>
              <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
                {chartType === "pie" ? (
                  <PieChart 
                    margin={{ left: 40, right: 40, top: 20, bottom: 20 }}
                    style={{ overflow: 'visible' }}
                  >
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={isMobile ? "30%" : "40%"} 
                      outerRadius={isMobile ? "45%" : "55%"}
                      paddingAngle={4}
                      minAngle={15}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1000}
                      label={({ cx, cy, midAngle, outerRadius, name, percentage }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + (isMobile ? 15 : 20);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        const isRight = x > cx;

                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="currentColor" 
                            textAnchor={isRight ? "start" : "end"} 
                            dominantBaseline="central"
                            stroke="none"
                            strokeWidth={0}
                            style={{ overflow: 'visible' }}
                            className={cn(
                              "font-black fill-slate-700 dark:fill-slate-300 transition-all duration-300",
                              isMobile ? "text-[9px]" : "text-[11px]"
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
                            className="cursor-pointer transition-all duration-500 outline-none hover:brightness-110"
                            onClick={() => onStatusClick?.(entry.id, entry.name, entry.fill)}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 30, right: 10, left: 10, bottom: 40 }}>
                    <XAxis 
                      dataKey="name" 
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const name = payload.value;
                        
                        // Split name by spaces for wrapping if it's longer than a few chars
                        const parts = name.length > 5 && name.includes(" ") ? name.split(" ") : [name];

                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text 
                              x={0} y={0} dy={16} 
                              textAnchor="middle" 
                              className={cn("font-black fill-slate-500 dark:fill-slate-400", name.length > 10 ? "text-[8px]" : "text-[10px]")}
                            >
                              {parts.length > 1 ? (
                                <>
                                  <tspan x={0} dy="0em" dominantBaseline="hanging">{parts[0]}</tspan>
                                  <tspan x={0} dy="1.2em" dominantBaseline="hanging">{parts.slice(1).join(" ")}</tspan>
                                </>
                              ) : (
                                <tspan x={0} dy="0em" dominantBaseline="hanging">{name}</tspan>
                              )}
                            </text>
                          </g>
                        );
                      }}
                      axisLine={false} 
                      tickLine={false} 
                      interval={0}
                    />
                    <YAxis hide={true} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 28 : 40}
                    >
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        offset={10} 
                        fill="currentColor" 
                        fontSize={isMobile ? 9 : 11} 
                        fontWeight={900} 
                        className="fill-slate-600 dark:fill-slate-300"
                      />
                      {chartData.map((entry, index) => {
                        const isSelected = selectedStatusId === entry.id;
                        const hasSelection = selectedStatusId !== null;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill} 
                            fillOpacity={!hasSelection || isSelected ? 1 : 0.25}
                            className="cursor-pointer transition-all duration-500 outline-none hover:brightness-110"
                            onClick={() => onStatusClick?.(entry.id, entry.name, entry.fill)}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
              
              {chartType === "pie" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <div className="flex flex-col items-center justify-center">
                    <p className={cn("font-black text-slate-900 dark:text-white leading-none", isMobile ? "text-2xl" : "text-4xl")}>{total}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">סה"כ</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
    );
};

export const EmployeesChart = forwardRef(EmployeesChartComponent);
