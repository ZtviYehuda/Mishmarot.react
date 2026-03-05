import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Download } from "lucide-react";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { Badge } from "@/components/ui/badge";
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

interface EmployeesChartProps {
  stats: {
    status_id: number;
    status_name: string;
    count: number;
    color: string;
  }[];
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
  fullUnitStats?: {
    status_id: number;
    status_name: string;
    count: number;
    color: string;
  }[];
}

export const EmployeesChart = forwardRef<any, EmployeesChartProps>(
  (
    {
      stats,
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
    },
    ref,
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);

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
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);

        const link = document.createElement("a");
        link.download = `attendance-snapshot-${format(selectedDate, "yyyy-MM-dd")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("גרף הורד בהצלחה");
      } catch (err) {
        console.error("Download failed", err);
        toast.error("שגיאה בהורדת הגרף");
      }
    };

    const handleWhatsAppShare = async () => {
      if (cardRef.current === null) return;

      try {
        const blob = await toBlob(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
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
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);

        if (!blob) throw new Error("Failed to capture image");

        const titleText = `${title} - ${unitName}`;
        const message = `*${titleText}*\nתאריך הפקה: ${format(new Date(), "dd/MM/yyyy")}\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}\n\nסיכום: ${total} שוטרים ביחידה.`;

        const file = new File([blob], `attendance-snapshot.png`, {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: titleText,
              text: message,
            });
            toast.success("הדוח שותף בהצלחה");
            return;
          } catch (shareErr) {
            if ((shareErr as Error).name !== "AbortError") {
              console.warn("Web Share failed:", shareErr);
            } else {
              return;
            }
          }
        }

        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
        } catch (clipErr) {
          console.warn("Clipboard copy failed", clipErr);
        }

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");

        toast.success("התמונה הועתקה! נא לבצע 'הדבק' (Ctrl+V) בווצאפ");
      } catch (err) {
        console.error("WhatsApp share failed", err);
        toast.error("שגיאה בהכנת הדוח ל-WhatsApp");
      }
    };

    // Process stats into chart data
    const { chartData, total, reportedCount } = useMemo(() => {
      if (!stats || stats.length === 0)
        return { chartData: [], total: 0, reportedCount: 0 };

      // Logical/Operational priority ordering
      const priorityMap: Record<string, number> = {
        משרד: 1,
        נוכח: 1,
        נוכחים: 1,
        זמין: 1,
        תגבור: 2,
        קורס: 3,
        חופשה: 4,
        'חופשה חו"ל': 5,
        חולה: 6,
        "לא דווח": 7,
      };

      const sortedStats = [...stats].sort((a, b) => {
        const pA = priorityMap[a.status_name] || 99;
        const pB = priorityMap[b.status_name] || 99;
        if (pA !== pB) return pA - pB;
        return b.count - a.count; // Secondary sort by count
      });

      // The 'viewTotal' is the sum of displayed segments
      const viewTotal = sortedStats.reduce((acc, curr) => acc + curr.count, 0);

      // The 'baseTotal' for percentages is either the override (full unit) or the displayed sum
      const baseTotal =
        totalInUnit && totalInUnit > 0 ? totalInUnit : viewTotal;

      const data = sortedStats.map((item) => ({
        id: item.status_id === null ? -1 : item.status_id,
        name: item.status_name || "לא דווח",
        value: item.count,
        fill: item.color || "#94a3b8",
        // Percentage relative to the WHOLE unit
        percentage:
          baseTotal > 0 ? Math.round((item.count / baseTotal) * 100) : 0,
        // Percentage relative to the current view (for segments alignment if needed)
        viewPercentage:
          viewTotal > 0 ? Math.round((item.count / viewTotal) * 100) : 0,
      }));

      const notReportedCount =
        stats.find((s) => s.status_name === "לא דווח")?.count || 0;
      const reportedCount = baseTotal - notReportedCount;

      return { chartData: data, total: baseTotal, reportedCount }; // total here is what we show in the center
    }, [stats, totalInUnit]);

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-popover text-popover-foreground px-3 py-2 rounded  text-sm border border-border">
            <p className="font-semibold">{data.name}</p>
            <p className="text-sm">{data.value} שוטרים</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.percentage}% מכלל היחידה
            </p>
          </div>
        );
      }
      return null;
    };

    if (loading) {
      return (
        <Card className="overflow-hidden">
          <CardHeader className="pb-8">
            <CardTitle className="text-xl font-black text-card-foreground mb-1">
              {title}
            </CardTitle>
            <CardDescription className="font-bold text-xs text-muted-foreground">
              טוען נתונים...
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card
        ref={cardRef}
        id="attendance-snapshot-card"
        className="bg-card/60 backdrop-blur-2xl text-card-foreground gap-6 rounded-[2rem] border border-primary/10 py-6 flex flex-col overflow-hidden h-full relative"
      >
        <CardHeader className="px-5 sm:px-6 py-5">
          <div className="space-y-3">
            <div className="flex flex-row items-center justify-between gap-3">
              <div className="flex-1 min-w-0 text-right">
                <CardTitle className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight truncate flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  {title}
                </CardTitle>
              </div>
              <div className="flex shrink-0 items-center gap-2 no-export">
                {/* Filter Button (Mobile Only) */}
                {onFilterClick && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onFilterClick}
                    className="lg:hidden h-9 w-9 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors border border-slate-200/50 dark:border-slate-700/50"
                    title="סינון נתונים"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                )}

                {/* Download Button - HIDDEN for Temp Commanders */}
                {!hideExportControls && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-500 hover:text-primary rounded-xl transition-all bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50"
                    onClick={handleDownload}
                    title="הורדה כתמונה"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {/* WhatsApp Button - HIDDEN for Temp Commanders */}
                {!hideExportControls && onOpenWhatsAppReport && (
                  <WhatsAppButton
                    onClick={onOpenWhatsAppReport}
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-xl border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                    skipDirectLink={true}
                  />
                )}
              </div>
            </div>
            <CardDescription className="font-bold text-[10px] sm:text-xs text-slate-500/80 dark:text-slate-400/80 whitespace-pre-line text-right leading-relaxed tracking-tight">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 relative p-4 sm:p-6">
          {total === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground font-bold">
                אין נתונים להצגה
              </p>
            </div>
          ) : (
            <>
              {/* Desktop View: Pie Chart */}
              <div className="hidden sm:flex flex-1 w-full flex-col min-h-0">
                <div
                  className="relative w-full flex-1 min-h-[300px]"
                  style={{ direction: "ltr" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                    >
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                          if (props.payload.percentage < 5) return null;
                          const RADIAN = Math.PI / 180;
                          const radius = props.outerRadius * 1.25;
                          const x =
                            props.cx +
                            radius * Math.cos(-props.midAngle * RADIAN);
                          const y =
                            props.cy +
                            radius * Math.sin(-props.midAngle * RADIAN);
                          return (
                            <g className="cursor-pointer select-none">
                              <text
                                x={x}
                                y={y - 14}
                                fill="currentColor"
                                className="fill-muted-foreground/60"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="11"
                                fontWeight="800"
                              >
                                {props.payload.name}
                              </text>
                              <text
                                x={x}
                                y={y + 1}
                                fill="currentColor"
                                className="fill-foreground font-black"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="13"
                              >
                                {props.payload.value}
                              </text>
                              <text
                                x={x}
                                y={y + 13}
                                fill="currentColor"
                                className="fill-primary/50"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="10"
                                fontWeight="700"
                              >
                                {props.payload.percentage}%
                              </text>
                            </g>
                          );
                        }}
                        outerRadius="80%"
                        innerRadius="50%"
                        stroke="none"
                        dataKey="value"
                        paddingAngle={4}
                      >
                        {chartData.map((item, index) => (
                          <Cell
                            key={`cell-${item.id || index}`}
                            fill={item.fill}
                            className="outline-none hover:opacity-90 cursor-pointer"
                            onClick={() =>
                              onStatusClick?.(item.id, item.name, item.fill)
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[40px]">
                    <div className="text-4xl font-black text-foreground">
                      {total}
                    </div>
                    <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest mt-1">
                      סה"כ יחידה
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile View: Bar Rows & Progress Bar */}
              <div className="sm:hidden space-y-6">
                {/* Manpower Summary Row (Kodkod style) */}
                <div className="bg-muted/30 dark:bg-slate-900/40 rounded-[2rem] p-5 border border-border/10">
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        כוח אדם
                      </h3>
                      <Badge
                        variant="secondary"
                        className="h-7 px-3 bg-indigo-500 text-white font-black text-[11px] rounded-full  border-none"
                      >
                        {Math.round((reportedCount / (total || 1)) * 100)}%
                        דווחו
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-black tracking-tight">
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg">
                        <span>{reportedCount}</span>
                        <span className="opacity-70">מעודכנים</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">
                        <span>{total}</span>
                        <span className="opacity-70">סה"כ תקן</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Bar */}
                  <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex flex-row-reverse">
                    {chartData.map((item) => (
                      <div
                        key={item.id}
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.fill,
                          opacity: item.name === "לא דווח" ? 0.3 : 1,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 px-1 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                    <span>לא זמינים</span>
                    <span>זמינים</span>
                  </div>
                </div>

                {/* Status Bar Chart (Mobile) */}
                <div className="h-[250px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                      onClick={(data: any) => {
                        if (
                          data &&
                          data.activePayload &&
                          data.activePayload[0]
                        ) {
                          const item = data.activePayload[0].payload;
                          onStatusClick?.(item.id, item.name, item.fill);
                        }
                      }}
                    >
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fontWeight: 900,
                          fill: "#64748b",
                        }}
                        interval={0}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-2 rounded-xl text-[10px] font-black">
                                {payload[0].payload.name}: {payload[0].value}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={30}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            style={{
                              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
                            }}
                          />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          style={{
                            fill: "#64748b",
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Units/Totals (Small cards) */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                    <span className="block text-[8px] font-black text-emerald-600/70 uppercase mb-0.5">
                      זמינים
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      {chartData.find(
                        (d) =>
                          d.name === "נוכחים" ||
                          d.name === "זמין" ||
                          d.name === "נוכח",
                      )?.value ||
                        total -
                          (chartData.find((d) => d.name === "לא דווח")?.value ||
                            0)}
                    </span>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-2 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center">
                    <span className="block text-[8px] font-black text-rose-600/70 uppercase mb-0.5">
                      חוסרים
                    </span>
                    <span className="text-sm font-black text-rose-600">
                      {chartData.find((d) => d.name === "לא דווח")?.value || 0}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <span className="block text-[8px] font-black text-muted-foreground uppercase mb-0.5">
                      סה"כ
                    </span>
                    <span className="text-sm font-black text-foreground">
                      {total}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="export-date-hidden absolute opacity-0 -z-50 left-0 top-0">
            תאריך דוח: {format(selectedDate, "dd/MM/yyyy")}
          </div>
        </CardContent>
      </Card>
    );
  },
);
