import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface TrendData {
  date_str: string;
  date: string;
  total_employees: number;
  present_count: number;
}

interface AttendanceTrendCardProps {
  data: TrendData[];
  loading?: boolean;
}

export function AttendanceTrendCard({
  data,
  loading,
}: AttendanceTrendCardProps) {
  if (loading) {
    return (
      <Card className="h-full min-h-[300px]">
        <CardHeader>
          <CardTitle className="text-lg animate-pulse bg-muted h-6 w-32 rounded"></CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">מגמת זמינות שבועית</CardTitle>
        <CardDescription>
          מעקב אחר כמות הנוכחים ב-7 הימים האחרונים
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="date_str"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  direction: "rtl",
                }}
                cursor={{
                  stroke: "#94a3b8",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
                itemStyle={{ color: "#15803d" }}
                formatter={(value: any) => [`${value} נוכחים`, ""]}
              />
              <Area
                type="monotone"
                dataKey="present_count"
                stroke="#16a34a"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPresent)"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
