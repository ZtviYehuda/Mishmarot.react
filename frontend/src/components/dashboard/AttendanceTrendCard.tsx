import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import {
  Download,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";

interface TrendData {
  date_str: string;
  date: string;
  total_employees: number;
  present_count: number;
}

interface AttendanceTrendCardProps {
  data: TrendData[];
  loading?: boolean;
  range: number;
  className?: string;
  unitName?: string;
  subtitle?: string;
  selectedDate?: Date;
}

export const AttendanceTrendCard = forwardRef<any, AttendanceTrendCardProps>(
  (
    {
      data,
      loading,
      range,
      className,
      unitName = "כלל היחידה",
      subtitle,
      selectedDate = new Date(),
    },
    ref,
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      download: handleDownload,
      share: handleWhatsAppShare,
    }));

    const chartData = useMemo(() => {
      if (range < 365) return data;

      const monthlyMap = new Map<
        string,
        { month: string; present: number; total: number; count: number }
      >();

      data.forEach((item) => {
        const date = parseISO(item.date);
        const monthKey = format(startOfMonth(date), "yyyy-MM");
        const existing = monthlyMap.get(monthKey) || {
          month: format(date, "MMMM", { locale: he }),
          present: 0,
          total: 0,
          count: 0,
        };

        monthlyMap.set(monthKey, {
          month: existing.month,
          present: existing.present + item.present_count,
          total: existing.total + item.total_employees,
          count: existing.count + 1,
        });
      });

      return Array.from(monthlyMap.values()).map((m) => ({
        date_str: m.month,
        present_count: Math.round(m.present / m.count),
        total_employees: Math.round(m.total / m.count),
      }));
    }, [data, range]);

    const stats = useMemo(() => {
      if (!data.length) return null;
      const avgPresence = Math.round(
        data.reduce((acc, curr) => acc + curr.present_count, 0) / data.length,
      );
      const maxPresence = Math.max(...data.map((d) => d.present_count));
      const peakDay = data.find((d) => d.present_count === maxPresence);

      return {
        avgPresence,
        peakDay: peakDay ? format(parseISO(peakDay.date), "dd/MM") : "-",
        maxPresence,
      };
    }, [data]);

    const handleDownload = async () => {
      if (cardRef.current === null) return;

      try {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "static";
              dateEl.style.opacity = "1";
              dateEl.style.marginTop = "1rem";
              dateEl.innerText = `תאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);
        const link = document.createElement("a");
        link.download = `attendance-trend-${range}-days.png`;
        link.href = dataUrl;
        link.click();
        toast.success("הגרף יוצא כתמונה בהצלחה");
      } catch (err) {
        console.error("Failed to download image", err);
        toast.error("שגיאה בייצוא הגרף");
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
              dateEl.style.position = "static";
              dateEl.style.opacity = "1";
              dateEl.style.marginTop = "1rem";
              dateEl.innerText = `תאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);

        if (!blob) throw new Error("Failed to capture image");

        const rangeText =
          range === 7 ? "שבועית" : range === 30 ? "חודשית" : "שנתית";
        const statsText = stats
          ? `\n*נתונים עיקריים:* \n- ממוצע נוכחות: ${stats.avgPresence} שוטרים\n- שיא נוכחות: ${stats.maxPresence} (${stats.peakDay})`
          : "";
        const filterText = subtitle ? `\n*סינון:* ${subtitle}` : "";
        const title = `דוח מגמת זמינות ${rangeText} - ${unitName}`;
        const message = `*${title}*\nתאריך: ${format(new Date(), "dd/MM/yyyy")}${filterText}${statsText}`;

        const file = new File([blob], `trend-${range}.png`, {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: title,
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
          console.warn("Clipboard copy failed:", clipErr);
        }

        const dataUrl = await toPng(cardRef.current, {
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "static";
              dateEl.style.opacity = "1";
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);
        const link = document.createElement("a");
        link.download = `מגמת_זמינות_${format(new Date(), "dd-MM-yyyy")}.png`;
        link.href = dataUrl;
        link.click();

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");

        toast.success("התמונה הועתקה! נא לבצע 'הדבק' (Ctrl+V) בווצאפ");
      } catch (err) {
        console.error("WhatsApp share failed", err);
        toast.error("שגיאה בהכנת הדוח ל-WhatsApp");
      }
    };

    const getAxisTickFormatter = (value: string) => {
      if (!value) return "";
      try {
        const date = parseISO(value);
        if (!isNaN(date.getTime())) {
          return format(date, "dd/MM");
        }
      } catch (e) {
        // ignore
      }
      return value;
    };

    const maxTotal = useMemo(() => {
      if (!chartData || chartData.length === 0) return 10;
      const max = Math.max(...chartData.map((d) => d.total_employees || 0), 10);
      return max;
    }, [chartData]);

    const getBarColor = (present: number, total: number) => {
      if (!total) return "#ef4444";
      const percentage = (present / total) * 100;
      if (percentage >= 70) return "#10b981";
      if (percentage >= 50) return "#f97316";
      return "#ef4444";
    };

    if (loading) {
      return (
        <Card className={cn("h-full", className)}>
          <CardHeader>
            <CardTitle className="text-lg animate-pulse bg-muted h-6 w-32 rounded"></CardTitle>
            <CardDescription className="animate-pulse bg-muted h-4 w-48 rounded mt-2"></CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        ref={cardRef}
        id="attendance-trend-card"
        className={cn(
          "h-full flex flex-col relative overflow-hidden",
          className,
        )}
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-right">
              <TrendingUp className="w-5 h-5 text-primary" />
              מגמת זמינות
            </CardTitle>
            <CardDescription className="text-right">
              <span className="font-bold text-foreground">{unitName}</span>
              {subtitle && (
                <>
                  {" "}
                  | <span className="export-hide">{subtitle}</span>
                </>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {range === 7
                  ? "7 ימים אחרונים"
                  : range === 30
                    ? "30 ימים אחרונים"
                    : "מגמה שנתית"}
              </div>
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 no-export">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg transition-all"
              onClick={handleDownload}
              title="הורדה כתמונה"
            >
              <Download className="h-4 w-4" />
            </Button>

            <WhatsAppButton
              onClick={handleWhatsAppShare}
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20 bg-emerald-50/50"
              skipDirectLink={true}
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2 flex-1 min-h-0 flex flex-col">
          <div className="w-full h-full min-h-[250px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              {range <= 30 ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorPresent"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={getAxisTickFormatter}
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      fontWeight: 500,
                    }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      fontWeight: 500,
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[
                      0,
                      (dataMax: number) => Math.max(dataMax, maxTotal),
                    ]}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--primary)", strokeWidth: 2 }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                    labelFormatter={(label) =>
                      format(parseISO(label), "dd/MM/yyyy")
                    }
                    itemStyle={{ fontWeight: "bold", padding: "2px 0" }}
                    labelStyle={{
                      fontWeight: "bold",
                      marginBottom: "4px",
                      color: "var(--muted-foreground)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present_count"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    animationDuration={1500}
                    activeDot={{
                      r: 6,
                      fill: "#10b981",
                      stroke: "var(--background)",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="date_str"
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      fontWeight: 500,
                    }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      fontWeight: 500,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{
                      fill: "var(--primary)",
                      opacity: 0.05,
                      radius: 8,
                    }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                    itemStyle={{ fontWeight: "bold", padding: "2px 0" }}
                    labelStyle={{
                      fontWeight: "bold",
                      marginBottom: "4px",
                      color: "var(--muted-foreground)",
                    }}
                  />
                  <Bar
                    dataKey="present_count"
                    radius={[6, 6, 0, 0]}
                    barSize={range === 365 ? 24 : 16}
                    animationDuration={1500}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(
                          entry.present_count,
                          entry.total_employees,
                        )}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-0.5">
                  <Users className="w-3 h-3" />
                  <span>ממוצע נוכחים</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {stats.avgPresence}
                </span>
              </div>
              <div className="flex flex-col items-center text-center border-x border-border/50">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>שיא התייצבות</span>
                </div>
                <span className="text-sm font-bold text-emerald-500">
                  {stats.maxPresence}
                </span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-0.5">
                  <CalendarIcon className="w-3 h-3" />
                  <span>יום שיא</span>
                </div>
                <span className="text-sm font-bold text-foreground font-mono">
                  {stats.peakDay}
                </span>
              </div>
            </div>
          )}
          <div className="export-date-hidden absolute opacity-0 -z-50 text-center mt-4 pt-2 border-t border-border/50 text-sm font-bold text-muted-foreground">
            תאריך דוח: {format(selectedDate, "dd/MM/yyyy")}
          </div>
        </CardContent>
      </Card>
    );
  },
);
