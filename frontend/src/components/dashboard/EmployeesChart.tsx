import {
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart2, PieChart as PieChartIcon, X } from "lucide-react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmployeesChartProps {
  stats: {
    status_id: number;
    status_name: string;
    count: number;
    color: string;
  }[];
  total: number;
  loading?: boolean;
  onStatusClick?: (statusId: number, statusName: string, color: string) => void;
  title?: string;
  unitName?: string;
  totalInUnit?: number;
  totalEmployeesInScope?: number;
  selectedUnitId?: number | null;
  selectedDate?: Date;
  selectedStatusId?: number | null;
  filterTags?: string[];
  hasArchiveAccess?: boolean;
  onRequestRestore?: () => void;
  hideHeader?: boolean;
  compact?: boolean;
}

const OFFICE_GROUP_NAME = "משרד";
const OFFICE_SUB_STATUSES = ["משרד", "מתקן חיצוני", "מהבית", "שטח"];

const EmployeesChartComponent = (
  {
    stats,
    total,
    onStatusClick,
    title = "מצבת כוח אדם",
    selectedDate = new Date(),
    unitName = "כלל היחידה",
    totalInUnit = 0,
    totalEmployeesInScope = 0,
    selectedStatusId = null,
    filterTags = [],
    compact = false,
    hideHeader = false,
  }: EmployeesChartProps,
  ref: any,
) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [isOfficeSelected, setIsOfficeSelected] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

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
      } as any);
      const link = document.createElement("a");
      link.download = `attendance-snapshot-${format(selectedDate, "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();
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
      if (!blob) return;
      const message = `*${title} - ${unitName}*\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}\n\nסיכום: ${total} שוטרים ביחידה.`;
      const file = new File([blob], `attendance-snapshot.png`, {
        type: "image/png",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text: message });
        return;
      }
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    } catch (err) {
      toast.error("שגיאה בשיתוף");
    }
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync isOfficeSelected with global selection
  useEffect(() => {
    const selectedStatus = stats.find((s) => s.status_id === selectedStatusId);
    if (
      selectedStatus &&
      OFFICE_SUB_STATUSES.includes(selectedStatus.status_name)
    ) {
      setIsOfficeSelected(true);
    } else if (selectedStatusId !== -999) {
      setIsOfficeSelected(false);
    }
  }, [selectedStatusId, stats]);

  const { chartData, officeSubItems } = useMemo(() => {
    let activeStats = stats || [];

    if (activeStats.length === 0) return { chartData: [], officeSubItems: [] };

    const priorityMap: Record<string, number> = {
      משרד: 1,
      נוכח: 1,
      תגבור: 2,
      קורס: 3,
      חופשה: 4,
      חולה: 6,
      "לא דווח": 7,
    };

    const officeItems = activeStats.filter((s) =>
      OFFICE_SUB_STATUSES.includes(s.status_name),
    );
    const nonOfficeItems = activeStats.filter(
      (s) => !OFFICE_SUB_STATUSES.includes(s.status_name),
    );

    const totalOfficeCount = officeItems.reduce(
      (acc, curr) => acc + curr.count,
      0,
    );
    const mainOfficeColor =
      officeItems.find((s) => s.status_name === "משרד")?.color || "#22c55e";

    const processedStats = [
      ...nonOfficeItems,
      ...(totalOfficeCount > 0
        ? [
            {
              status_id: -999,
              status_name: OFFICE_GROUP_NAME,
              count: totalOfficeCount,
              color: mainOfficeColor,
              isGroup: true,
            },
          ]
        : []),
    ];

    const sortedStats = processedStats.sort(
      (a, b) =>
        (priorityMap[a.status_name] || 99) - (priorityMap[b.status_name] || 99),
    );
    const baseTotal = sortedStats.reduce((a, b) => a + b.count, 0);

    const data = sortedStats.map((item) => {
      const rawName = item.status_name?.trim() || "";
      const name =
        rawName === "חופשה חול" || rawName === 'חופשה חו"ל'
          ? "חו' חול"
          : rawName || "לא דווח";
      return {
        id: item.status_id === null ? -1 : item.status_id,
        name,
        value: item.count,
        fill: item.color || "#94a3b8",
        percentage:
          baseTotal > 0 ? Math.round((item.count / baseTotal) * 100) : 0,
        isGroup: (item as any).isGroup,
      };
    });

    return { chartData: data, officeSubItems: officeItems };
  }, [stats]);

  const handleStatusInteraction = (entry: any) => {
    if (entry.isGroup) {
      setIsOfficeSelected(true);
      // We can also trigger a generic office filter if desired
      onStatusClick?.(entry.id, entry.name, entry.fill);
    } else {
      onStatusClick?.(entry.id, entry.name, entry.fill);
      setIsOfficeSelected(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl flex flex-col gap-1 min-w-[145px] pointer-events-none transition-all duration-200">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm shrink-0"
              style={{ backgroundColor: d.fill || d.color || "#94a3b8" }}
            />
            <span className="font-black text-slate-800 dark:text-slate-100 text-[13px] tracking-tight leading-none">
              {d.name}
            </span>
          </div>
          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1 w-full" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
              נוכחות
            </span>
            <span className="font-extrabold text-primary dark:text-blue-400 text-base leading-none">
              {d.value} שוטרים
            </span>
          </div>
          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 leading-none mt-0.5">
            {d.percentage}% מכלל היחידה
          </span>
        </div>
      );
    }
    return null;
  };

  const displayTotal = total;

  return (
    <Card
      ref={cardRef}
      id="attendance-snapshot-card"
      className={cn(
        "bg-white dark:bg-slate-900 text-card-foreground rounded-2xl sm:rounded-[1.5rem] border-0 shadow-sm flex flex-col overflow-visible h-full relative transition-all",
        compact && "bg-transparent border-0 shadow-none",
      )}
    >
      <div
        className={cn(
          "pt-1.5 pb-0 px-0 sm:pt-2 sm:pb-4 sm:px-0 md:pt-2.5 md:pb-6 md:px-0 flex-1 flex flex-col relative overflow-visible",
          compact && "pt-1 pb-1.5 sm:pt-1.5 sm:pb-2 px-0 sm:px-0",
        )}
      >
        {/* Header */}
        {!hideHeader ? (
          <div className="flex flex-row justify-between items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2.5 relative z-10 px-3 sm:px-4 md:px-6">
            <div className="flex gap-2 sm:gap-3 items-center min-w-0">
              <div className="text-right flex flex-col min-w-0">
                <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight flex items-center flex-wrap gap-2 truncate">
                  <span>{title}</span>
                  {filterTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                      {filterTags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] h-6 px-2.5 font-black bg-primary/10 text-primary border-primary/30 rounded-lg shadow-sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </h3>
              </div>
            </div>

            <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg flex border border-border/50 backdrop-blur-md shrink-0">
              <button
                onClick={() => setChartType("pie")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  chartType === "pie"
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-400",
                )}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  chartType === "bar"
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-400",
                )}
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute left-2 sm:left-4 top-2 sm:top-3 z-20 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg flex border border-border/40 backdrop-blur-md shrink-0 no-export">
            <button
              onClick={() => setChartType("pie")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                chartType === "pie"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : "text-slate-400",
              )}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                chartType === "bar"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : "text-slate-400",
              )}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Premium Pills Filter for Office - Contextual */}
        <div
          className={cn(
            "flex flex-col items-center gap-2 transition-all duration-500 overflow-hidden px-3 sm:px-4 md:px-6",
            isOfficeSelected
              ? "max-h-20 opacity-100 mb-4"
              : "max-h-0 opacity-0 mb-0",
          )}
        >
          <div className="flex items-center gap-1.5 p-1.5 bg-muted/30 dark:bg-slate-800/30 rounded-2xl border border-border/20 shadow-inner">
            {OFFICE_SUB_STATUSES.map((name) => {
              const item = stats.find((s) => s.status_name === name);
              const id = item?.status_id || -1;
              const color = item?.color || "#22c55e";
              const isSelected = selectedStatusId === id;

              return (
                <button
                  key={name}
                  onClick={() => onStatusClick?.(id, name, color)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap flex items-center gap-2",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-white" : "bg-emerald-500",
                    )}
                  />
                  {name}
                </button>
              );
            })}
            <div className="w-[1px] h-4 bg-border/40 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onStatusClick?.(-999, OFFICE_GROUP_NAME, "#22c55e");
                setIsOfficeSelected(false);
              }}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative p-0 mt-0 overflow-visible min-h-0">
          {chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-center text-muted-foreground font-bold tracking-tight">
              אין נתונים להצגה
            </div>
          ) : (
            <div
              className="flex flex-col flex-1 w-full min-h-[240px] sm:min-h-[320px] relative mt-0 overflow-visible"
              style={{ direction: "ltr" }}
            >
              <ResponsiveContainer
                className="overflow-visible"
                width="100%"
                height={
                  compact
                    ? (isMobile ? 220 : 300)
                    : chartType === "bar"
                      ? (isMobile ? 180 : 280)
                      : (isMobile ? 240 : 320)
                }
              >
                {chartType === "pie" ? (
                  <PieChart
                    className="overflow-visible"
                    margin={{
                      left: isMobile ? 10 : 60,
                      right: isMobile ? 10 : 60,
                      top: isMobile ? 10 : 15,
                      bottom: isMobile ? 10 : 15,
                    }}
                    onMouseMove={(e: any) => {
                      if (e && e.chartX !== undefined && e.chartY !== undefined) {
                        const isRight = e.chartX > (isMobile ? 120 : 160);
                        setTooltipPos({
                          x: isRight ? e.chartX - 160 : e.chartX + 15,
                          y: e.chartY - 85,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltipPos(null)}
                  >
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? "38%" : "36%"}
                      outerRadius={isMobile ? "55%" : "53%"}
                      paddingAngle={4}
                      minAngle={15}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={false}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        outerRadius: outerR,
                        name,
                        percentage,
                      }: any) => {
                        const RADIAN = Math.PI / 180;
                        const cos = Math.cos(-midAngle * RADIAN);
                        const sin = Math.sin(-midAngle * RADIAN);

                        const offset = isMobile ? 12 : 24;
                        const sx = cx + outerR * cos;
                        const sy = cy + outerR * sin;
                        const mx = cx + (outerR + offset) * cos;
                        const my = cy + (outerR + offset) * sin;
                        const tx =
                          mx + (cos >= 0 ? 1 : -1) * (isMobile ? 8 : 16);

                        const textAnchor = cos >= 0 ? "start" : "end";

                        return (
                          <g>
                            <path
                              d={`M${sx},${sy}L${mx},${my}L${tx},${my}`}
                              stroke="rgba(148, 163, 184, 0.45)"
                              strokeWidth={1}
                              fill="none"
                            />
                            <circle
                              cx={sx}
                              cy={sy}
                              r={2}
                              fill="rgba(148, 163, 184, 0.8)"
                            />

                            <text
                              x={tx + (cos >= 0 ? 4 : -4)}
                              y={my}
                              fill="currentColor"
                              textAnchor={textAnchor}
                              dominantBaseline="central"
                              className={cn(
                                "font-black fill-slate-700 dark:fill-slate-300",
                                isMobile ? "text-[9px]" : "text-[12px]",
                              )}
                            >
                              {`${name} (${percentage}%)`}
                            </text>
                          </g>
                        );
                      }}
                      labelLine={false} // Disable default label line since we draw our own segmented path
                    >
                      {chartData.map((entry, index) => {
                        const isSelected =
                          selectedStatusId === entry.id ||
                          (entry.isGroup &&
                            officeSubItems.some(
                              (s) => s.status_id === selectedStatusId,
                            ));
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
                            onClick={() => handleStatusInteraction(entry)}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip />}
                      position={tooltipPos || undefined}
                    />
                  </PieChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 25, right: 10, left: 10, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={isMobile ? 15 : 20}
                      tick={{
                        fontSize: isMobile ? 11 : 13,
                        fontWeight: 900,
                        fill: "var(--foreground)",
                      }}
                    />
                    <YAxis
                      hide={true}
                      domain={[
                        0,
                        (max: number) => {
                          const scopeMax = totalEmployeesInScope || 0;
                          if (scopeMax > 0 && scopeMax >= max) return scopeMax;
                          if (!max || isNaN(max)) return 5;
                          return max + Math.max(2, Math.ceil(max * 0.15));
                        },
                      ]}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      barSize={isMobile ? 16 : 24}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="value"
                        content={(props: any) => {
                          const { x, y, width, value } = props;
                          if (value === undefined || value === null || value === 0) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 8}
                              fill="var(--foreground)"
                              textAnchor="middle"
                              className="text-[10px] sm:text-xs font-black fill-slate-700 dark:fill-slate-300"
                            >
                              {value}
                            </text>
                          );
                        }}
                      />
                      {chartData.map((entry, index) => {
                        const isSelected =
                          selectedStatusId === entry.id ||
                          (entry.isGroup &&
                            officeSubItems.some(
                              (s) => s.status_id === selectedStatusId,
                            ));
                        const hasSelection = selectedStatusId !== null;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            fillOpacity={!hasSelection || isSelected ? 1 : 0.25}
                            className="cursor-pointer transition-all duration-500"
                            onClick={() => handleStatusInteraction(entry)}
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
                    <p
                      className={cn(
                        "font-black text-slate-900 dark:text-white leading-none",
                        isMobile ? "text-2xl" : "text-4xl",
                      )}
                    >
                      {displayTotal}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">
                      סה"כ
                    </p>
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
