import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Timer, Users, TrendingUp } from "lucide-react";

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
  averageAge: number;
  onRangeSelect?: (range: string) => void;
}

export const AgeDistributionChart = ({
  data,
  averageAge,
  onRangeSelect,
}: AgeDistributionChartProps) => {
  const chartData = useMemo(() => {
    return data;
  }, [data]);

  const totalCount = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const dominantRange = useMemo(() => {
    if (chartData.length === 0) return "—";
    return chartData.reduce((prev, current) =>
      prev.count > current.count ? prev : current,
    ).range;
  }, [chartData]);

  return (
    <Card className="rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-2xl shadow-sm overflow-hidden p-6 sm:p-8 h-full flex flex-col transition-all hover:bg-card/80 group/card relative">
      {/* Subtle background glow - very faint */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover/card:bg-primary/10 transition-colors" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/40">
            <Timer className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-right">
            <h3 className="text-xl font-black text-foreground tracking-tight">
              חתך גילאים
            </h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
              התפלגות גילאית של כוח האדם
            </p>
          </div>
        </div>
        <div className="bg-muted/30 px-4 py-2 rounded-xl border border-border/40 flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] leading-none mb-1">
              גיל ממוצע
            </span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xl font-black text-foreground tabular-nums leading-none">
                {averageAge}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-[250px] w-full mt-2 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 10, left: 10, bottom: 25 }}
            barCategoryGap="25%"
            onClick={(state) => {
              if (state && state.activeLabel && onRangeSelect) {
                onRangeSelect(state.activeLabel.toString());
              }
            }}
          >
            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 800, fill: "#94a3b8" }}
              dy={10}
              interval={0}
            />
            <YAxis hide domain={[0, 'dataMax + 10']} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 10 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover text-popover-foreground border border-border p-3 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                        טווח גילאים: {payload[0].payload.range}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-primary" />
                        <p className="text-lg font-black text-foreground tabular-nums">
                          {payload[0].value} <span className="text-xs font-bold text-muted-foreground">שוטרים</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              radius={[8, 8, 4, 4]}
              fill="currentColor"
              className="text-primary/70 hover:text-primary transition-colors cursor-pointer"
            >
              {chartData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  className="transition-all duration-300"
                />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                offset={12}
                fill="currentColor"
                fontSize={12}
                fontWeight={900}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
        <div className="p-5 rounded-[1.75rem] bg-muted/20 border border-border/40 transition-all hover:bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-card border border-border/40 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">הדומיננטי</span>
          </div>
          <p className="text-2xl font-black text-foreground tracking-tighter">
            {dominantRange}
          </p>
        </div>
        
        <div className="p-5 rounded-[1.75rem] bg-muted/20 border border-border/40 transition-all hover:bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-card border border-border/40 flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">סה"כ כוח אדם</span>
          </div>
          <p className="text-2xl font-black text-foreground tracking-tighter tabular-nums">
            {totalCount}
          </p>
        </div>
      </div>
    </Card>
  );
};
