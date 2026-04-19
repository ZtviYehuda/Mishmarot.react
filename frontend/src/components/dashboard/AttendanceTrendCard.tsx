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
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  filterTags?: string[];
  hideHeader?: boolean;
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
      filterTags = [],
      hideHeader = false,
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
        const message = `*${title}*\nתאריך הפקה: ${format(new Date(), "dd/MM/yyyy")}\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}${filterText}${statsText}`;

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
        className={cn(
          "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-card-foreground rounded-[1.5rem] border-none shadow-sm flex flex-col overflow-hidden h-full relative transition-all",
          className,
          hideHeader && "border-none bg-transparent backdrop-blur-none shadow-none py-0"
        )}
      >
        {!hideHeader && (
          <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 text-right w-full">
              <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest">
                מגמת זמינות — 30 ימים אחרונים
              </CardTitle>
            </div>
          </CardHeader>
        )}

        <CardContent className={cn("flex-1 flex flex-col min-h-[350px] p-6", hideHeader && "p-0")}>
          <div className="w-full h-full min-h-[250px] flex-1" style={{ direction: "ltr" }}>
            <ResponsiveContainer width="100%" height="100%">
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
                      <stop offset="5%" stopColor="#0074ff" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0074ff" stopOpacity={0} />
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
                      fontWeight: 700,
                    }}
                    tickLine={false}
                    axisLine={false}
                    dy={16}
                  />
                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      fontWeight: 700,
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[
                      0,
                      (dataMax: number) => Math.floor(Math.max(dataMax, 10) * 1.2),
                    ]}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    labelFormatter={(label) =>
                      format(parseISO(label), "dd/MM/yyyy")
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="present_count"
                    stroke="#0074ff"
                    strokeWidth={3}
                    dot={false}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    animationDuration={1500}
                    activeDot={{
                      r: 6,
                      fill: "#0074ff",
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
},
);
