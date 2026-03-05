import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "lucide-react";

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
  averageAge: number;
}

export const AgeDistributionChart = ({
  data,
  averageAge,
}: AgeDistributionChartProps) => {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: "#2dd4bf", // Mint color from image
      opacity: 0.8 + (index % 3) * 0.1,
    }));
  }, [data]);

  return (
    <Card className="rounded-[2.5rem] border border-primary/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden group">
      <CardHeader className="p-6 sm:p-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 transition-transform group-hover:scale-110 duration-500">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                חתך גילאים
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-sm font-bold text-slate-500 mt-0.5 sm:mt-1 uppercase tracking-widest">
                התפלגות גילאי השוטרים ביחידה
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="h-10 px-4 w-fit bg-teal-50/50 border-teal-100 text-teal-700 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl whitespace-nowrap"
          >
            גיל ממוצע: {averageAge}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-2">
        <div className="h-[300px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
              barGap={0}
            >
              <defs>
                <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="range"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fontWeight: 900, fill: "#64748b" }}
                dy={12}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-2xl border border-white/20 backdrop-blur-md">
                        <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">
                          טווח גילאים {payload[0].payload.range}
                        </p>
                        <p className="text-lg font-black">
                          {payload[0].value} שוטרים
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="count"
                radius={[12, 12, 12, 12]}
                barSize={45}
                className="transition-all duration-500"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="url(#mintGradient)"
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  offset={10}
                  style={{
                    fill: "#115e59",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend/Summary for Mobile */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-teal-50/50 dark:bg-teal-950/10 p-4 rounded-[1.5rem] border border-teal-100/50 dark:border-teal-900/30">
            <span className="block text-[10px] font-black text-teal-600/70 uppercase mb-1 tracking-tighter">
              החתך הדומיננטי
            </span>
            <span className="text-lg font-black text-teal-700">
              {chartData.length > 0
                ? chartData.reduce((prev, current) =>
                    prev.count > current.count ? prev : current,
                  ).range
                : "N/A"}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
            <span className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-tighter">
              סה"כ מדווחים
            </span>
            <span className="text-lg font-black text-slate-700 dark:text-slate-200">
              {chartData.reduce((acc, curr) => acc + curr.count, 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
