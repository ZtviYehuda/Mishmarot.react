import { useRef, useMemo } from "react";
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
  Cell,
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import {
  MessageSquare,
  Download,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { toast } from "sonner";

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
  onOpenReport?: () => void;
  className?: string;
}

export function AttendanceTrendCard({
  data,
  loading,
  range,
  onRangeChange,
  onOpenReport,
  className,
}: AttendanceTrendCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Aggregated data for Yearly view (by Month)
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
        backgroundColor: "transparent",
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

  const getAxisTickFormatter = (value: string) => {
    if (range === 7) return value;
    if (range === 30) {
      const date = parseISO(value);
      return !isNaN(date.getTime()) ? format(date, "d/M") : value;
    }
    return value; // For yearly view, date_str is already the month name
  };

  if (loading) {
    return (
      <Card className={cn("h-full min-h-[300px]", className)}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg animate-pulse bg-muted h-6 w-32 rounded"></CardTitle>
            <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      ref={cardRef}
      className={cn(
        "h-full border shadow-sm flex flex-col overflow-hidden bg-card",
        className,
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            מגמת זמינות
          </CardTitle>
          <CardDescription>
            {range === 7
              ? "מעקב יומי ב-7 הימים האחרונים"
              : range === 30
                ? "מעקב יומי ב-30 הימים האחרונים"
                : "מגמה ממוצעת לפי חודשים"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 no-export">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={handleDownload}
            title="הורדה כתמונה"
          >
            <Download className="h-4 w-4" />
          </Button>
          {onOpenReport && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              onClick={onOpenReport}
              title="שליחת דוח"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          <Select
            value={range.toString()}
            onValueChange={(val) => onRangeChange(parseInt(val))}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs">
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
                      stopOpacity={0.2}
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
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey={range === 30 ? "date" : "date_str"}
                  tickFormatter={getAxisTickFormatter}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    direction: "rtl",
                    padding: "8px",
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  labelStyle={{
                    color: "hsl(var(--muted-foreground))",
                    marginBottom: "4px",
                    textAlign: "right",
                  }}
                  formatter={(value: any) => [`${value} נוכחים`, "נוכחות"]}
                />
                <Area
                  type="monotone"
                  dataKey="present_count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                  activeDot={{
                    r: 5,
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="date_str"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    direction: "rtl",
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  labelStyle={{
                    color: "hsl(var(--muted-foreground))",
                    marginBottom: "4px",
                    textAlign: "right",
                  }}
                />
                <Bar
                  dataKey="present_count"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  fill="hsl(var(--primary))"
                >
                  {/* Removed Cell mapping to let Theme color apply, or use solid primary */}
                </Bar>
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
