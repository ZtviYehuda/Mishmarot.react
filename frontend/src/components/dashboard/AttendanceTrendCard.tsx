import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import {
  Download,
  TrendingUp,
  Users,
  Calendar,
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
  onRangeChange: (range: number) => void;
  className?: string;
  unitName?: string;
  subtitle?: string;
}

export const AttendanceTrendCard = forwardRef<any, AttendanceTrendCardProps>(
  (
    {
      data,
      loading,
      range,
      onRangeChange,
      className,
      unitName = "כלל היחידה",
      subtitle,
    },
    ref,
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      download: handleDownload,
      share: handleWhatsAppShare,
    }));

    // ... (rest of useMemo logic)

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

    // Statistics calculation
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
        });
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
        // 1. Capture Image as Blob
        const blob = await toBlob(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
        });

        if (!blob) throw new Error("Failed to capture image");

        const rangeText = range === 7 ? "שבועית" : range === 30 ? "חודשית" : "שנתית";
        const statsText = stats
          ? `\n📊 *נתונים עיקריים:* \n• ממוצע נוכחות: ${stats.avgPresence} שוטרים\n• שיא נוכחות: ${stats.maxPresence} (${stats.peakDay})`
          : "";
        const filterText = subtitle ? `\n🔍 *סינון:* ${subtitle}` : "";
        const title = `דוח מגמת זמינות ${rangeText} - ${unitName}`;
        const message = `*${title}*\nתאריך: ${format(new Date(), "dd/MM/yyyy")}${filterText}${statsText}`;

        // 2. Try Web Share API (Mobile/Modern OS Support)
        const file = new File([blob], `trend-${range}.png`, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: title,
              text: message,
            });
            toast.success("הדוח שותף בהצלחה");
            return; // Exit if shared via native API
          } catch (shareErr) {
            // If user cancelled or error, we don't return, we try fallback
            if ((shareErr as Error).name !== "AbortError") {
              console.warn("Web Share failed:", shareErr);
            } else {
              return; // User cancelled
            }
          }
        }

        // 3. FALLBACK: Copy to Clipboard + WhatsApp Link
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
        } catch (clipErr) {
          console.warn("Clipboard copy failed:", clipErr);
        }

        // Also trigger a backup download
        const dataUrl = await toPng(cardRef.current, { backgroundColor: "#ffffff" });
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
      if (range === 7) return value;
      if (range === 30) {
        const date = parseISO(value);
        return !isNaN(date.getTime()) ? format(date, "d/M") : value;
      }
      return value; // For yearly view, date_str is already the month name
    };

    if (loading) {
      // ... existing loading state ...
    }

    return (
      <Card
        ref={cardRef}
        id="attendance-trend-card"
        className={cn(
          "h-full border shadow-sm flex flex-col overflow-hidden bg-card",
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
                  | <span>{subtitle}</span>
                </>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {range === 7
                  ? "מעקב יומי ב-7 הימים האחרונים"
                  : range === 30
                    ? "מעקב יומי ב-30 הימים האחרונים"
                    : "מגמה ממוצעת לפי חודשים"}
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
              className="h-8 w-8 p-0 rounded-lg border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              skipDirectLink={true}
            />

            <Select
              value={range.toString()}
              onValueChange={(val) => onRangeChange(parseInt(val))}
            >
              <SelectTrigger className="h-8 w-[90px] text-[11px] font-bold rounded-lg bg-background border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">שבועי</SelectItem>
                <SelectItem value="30">חודשי</SelectItem>
                <SelectItem value="365">שנתי</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          <div className="h-[220px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              {range < 365 ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="date_str"
                    tickFormatter={getAxisTickFormatter}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                    itemStyle={{ fontWeight: "bold", padding: "2px 0" }}
                    labelStyle={{ fontWeight: "bold", marginBottom: "4px", color: "hsl(var(--muted-foreground))" }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present_count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    animationDuration={1500}
                    activeDot={{
                      r: 6,
                      fill: "hsl(var(--primary))",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="date_str"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--primary))", opacity: 0.05, radius: 8 }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                    itemStyle={{ fontWeight: "bold", padding: "2px 0" }}
                    labelStyle={{ fontWeight: "bold", marginBottom: "4px", color: "hsl(var(--muted-foreground))" }}
                  />
                  <Bar
                    dataKey="present_count"
                    radius={[6, 6, 0, 0]}
                    barSize={range === 365 ? 24 : 16}
                    fill="url(#barGradient)"
                    animationDuration={1500}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Statistics Summary Row */}
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
                  <Calendar className="w-3 h-3" />
                  <span>יום שיא</span>
                </div>
                <span className="text-sm font-bold text-foreground font-mono">
                  {stats.peakDay}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
