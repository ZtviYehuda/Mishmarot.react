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
import { Timer, Filter } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
  averageAge: number;
  onRangeSelect?: (range: string) => void;
  selectedRange?: string;
  selectedDate?: Date;
  filterTags?: string[];
}

export const AgeDistributionChart = ({
  data,
  averageAge,
  onRangeSelect,
  selectedRange = "all",
  selectedDate = new Date(),
  filterTags = [],
}: AgeDistributionChartProps) => {
  const chartData = useMemo(() => {
    return data;
  }, [data]);

  return (
    <Card className="rounded-[2rem] border border-primary/10 bg-card/60 backdrop-blur-2xl overflow-hidden p-6 sm:p-8 h-full flex flex-col relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/40">
            <Timer className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-right flex flex-col">
            <h3 className="text-xl font-black text-foreground tracking-tight flex items-center flex-wrap gap-2 sm:gap-3">
              <span>חתך גילאים</span>
              {filterTags.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                   <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 font-black uppercase tracking-tight ml-1 animate-pulse">
                    <Filter className="w-4 h-4" />
                    <span>סינון פעיל:</span>
                  </div>
                  {filterTags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-[11px] h-6 px-3 font-black bg-blue-700 text-white border-none shadow-md shadow-blue-500/30 whitespace-nowrap rounded-lg"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </h3>
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
          >
            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fontWeight: 900, fill: "#94a3b8" }}
              dy={10}
              interval={0}
            />
            <YAxis hide domain={[0, 'dataMax + 10']} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 10 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover text-popover-foreground border border-border p-3 rounded-2xl shadow-xl">
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
              className="text-primary/70 hover:text-primary transition-colors"
            >
              {chartData.map((entry, index) => {
                const isSelected = selectedRange === "all" || entry.range === selectedRange;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    className="transition-all cursor-pointer"
                    onClick={() => onRangeSelect?.(entry.range)}
                    fillOpacity={isSelected ? 1 : 0.2}
                  />
                );
              })}
              <LabelList
                dataKey="count"
                position="top"
                offset={12}
                fill="currentColor"
                fontSize={16}
                fontWeight={900}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

