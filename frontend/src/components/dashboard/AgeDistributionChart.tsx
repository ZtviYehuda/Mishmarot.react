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
    <Card className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-card-foreground rounded-[1.5rem] border-0 shadow-sm hover:shadow-md flex flex-col overflow-hidden h-full relative transition-all">
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
      
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-3 mb-6 relative z-10 min-h-[70px]">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/40">
            <Timer className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-right flex flex-col">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center flex-wrap gap-2">
              <span>חתך גילאים</span>
              {filterTags.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                   <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-400 font-black uppercase tracking-tight ml-1 animate-pulse">
                    <Filter className="w-3 h-3" />
                  </div>
                  {filterTags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-[9px] h-5 px-2 font-black bg-blue-700 text-white border-none whitespace-nowrap rounded-md"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </h3>
          </div>
        </div>
        <div className="bg-muted/30 px-3 py-1.5 rounded-lg border border-border/40 flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.1em] leading-none mb-1">
              גיל ממוצע
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-lg font-black text-foreground tabular-nums leading-none">
                {averageAge}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-[200px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 10, left: 10, bottom: 40 }}
            barCategoryGap="15%"
          >
            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 900, fill: "#94a3b8" }}
              dy={5}
            />
            <YAxis hide domain={[0, 'dataMax + 10']} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover text-popover-foreground border border-border p-2 rounded-xl">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                        טווח: {payload[0].payload.range}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-3 rounded-full bg-primary" />
                        <p className="text-sm font-black text-foreground tabular-nums">
                          {payload[0].value} <span className="text-[10px] font-bold text-muted-foreground">שוטרים</span>
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
              radius={[6, 6, 2, 2]}
              fill="currentColor"
              className="text-primary/70 hover:text-primary transition-colors"
            >
              {chartData.map((entry, index) => {
                const isSelected = selectedRange === "all" || entry.range === selectedRange;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    className="transition-all cursor-pointer outline-none"
                    onClick={() => onRangeSelect?.(entry.range)}
                    fillOpacity={isSelected ? 1 : 0.2}
                  />
                );
              })}
              <LabelList
                dataKey="count"
                position="top"
                offset={10}
                fill="currentColor"
                fontSize={12}
                fontWeight={900}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </Card>
  );
};

