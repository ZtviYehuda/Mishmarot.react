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
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";

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
}

export function AttendanceTrendCard({
  data,
  loading,
  range,
  onRangeChange,
}: AttendanceTrendCardProps) {
  const formatXAxis = (dateStr: string) => {
    try {
      // The backend returns date_str often as day name, but 'date' field is YYYY-MM-DD
      // We'll use the 'date' field if available for more precise formatting
      const dateObj = parseISO(dateStr); // Assuming dateStr passed here matches the dataKey

      // If the dataKey passed is "date_str" which is Hebrew day name, we might want to use "date" instead
      // But let's check what dataKey is used. It is "date_str".

      // If range is large, we should probably use the date field.
      // Let's rely on the passed string if it's short range, 
      // but for long range we'll need the actual date context which might be missing from "date_str" if it's just "Yom Rishon"
      // Looking at the interface: `date` is YYYY-MM-DD.
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const getAxisTickFormatter = (value: string, index: number) => {
    // If we use 'date' as dataKey, we can format it.
    // If we use 'date_str' (Hebrew day name), it's good for 7 days.

    // For Month/Year, we should probably prefer the 'date' field.
    if (range > 7) {
      // Try to parse YYYY-MM-DD
      const date = parseISO(value); // This might fail if value is "Sunday"
      if (!isNaN(date.getTime())) {
        if (range > 30) {
          return format(date, "MMM", { locale: he }); // Month name for year view
        }
        return format(date, "d/M"); // Day/Month for month view
      }
    }
    return value;
  };

  if (loading) {
    return (
      <Card className="h-full min-h-[300px]">
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
    <Card className="h-full border shadow-sm flex flex-col">
      <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-bold">מגמת זמינות</CardTitle>
          <CardDescription>
            {range === 7
              ? "מעקב אחר כמות הנוכחים ב-7 הימים האחרונים"
              : range === 30
                ? "מעקב אחר כמות הנוכחים ב-30 הימים האחרונים"
                : "מגמת נוכחות שנתית"}
          </CardDescription>
        </div>
        <Select
          value={range.toString()}
          onValueChange={(val) => onRangeChange(parseInt(val))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="בחר טווח" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">שבועי</SelectItem>
            <SelectItem value="30">חודשי</SelectItem>
            <SelectItem value="365">שנתי</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-[250px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey={range > 7 ? "date" : "date_str"}
                tickFormatter={getAxisTickFormatter}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  direction: "rtl",
                  padding: "12px",
                }}
                cursor={{
                  stroke: "#94a3b8",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                labelStyle={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}
                labelFormatter={(value) => {
                  // Ensure we format the label correctly in the tooltip
                  if (range > 7) {
                    const d = parseISO(value);
                    if (!isNaN(d.getTime())) {
                      return format(d, "eeee, d MMMM yyyy", { locale: he });
                    }
                  }
                  return value;
                }}
                itemStyle={{ color: "#15803d", fontWeight: "500" }}
                formatter={(value: any) => [`${value} נוכחים`, undefined]}
              />
              <Area
                type="monotone"
                dataKey="present_count"
                stroke="#16a34a"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPresent)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#15803d" }}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
