import { useMemo, useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
  averageAge: number;
  totalEmployees: number;
  onRangeSelect?: (range: string) => void;
  selectedRange?: string;
  filterTags?: string[];
}

export const AgeDistributionChart = ({
  data,
  averageAge,
  totalEmployees,
  onRangeSelect,
  selectedRange = "all",
  filterTags = [],
}: AgeDistributionChartProps) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const chartData = useMemo(() => {
    if (!isMobile) return data;

    // Group ranges for mobile: 18-25, 26-35, 36-99 (displayed as 36+)
    const grouped = [
      { range: "18-25", count: 0 },
      { range: "26-35", count: 0 },
      { range: "36-99", count: 0 },
    ];

    data.forEach((item) => {
      const cleanRange = item.range.replace(/\s+/g, "");
      let min = 0;
      let max = 0;
      if (cleanRange.includes("+")) {
        min = parseInt(cleanRange) || 0;
        max = 999;
      } else if (cleanRange.includes("-")) {
        const parts = cleanRange.split("-");
        min = parseInt(parts[0]) || 0;
        max = parseInt(parts[1]) || 999;
      } else {
        min = parseInt(cleanRange) || 0;
        max = min;
      }

      if (min >= 18 && max <= 25) {
        grouped[0].count += item.count;
      } else if (min >= 26 && max <= 35) {
        grouped[1].count += item.count;
      } else if (min >= 36) {
        grouped[2].count += item.count;
      }
    });

    return grouped;
  }, [data, isMobile]);

  const isSelectedRange = useMemo(() => {
    if (selectedRange === "all") return () => true;

    let selMin = 0;
    let selMax = 999;
    if (selectedRange.includes("+")) {
      selMin = parseInt(selectedRange) || 0;
    } else if (selectedRange.includes("-")) {
      const parts = selectedRange.split("-");
      selMin = parseInt(parts[0]) || 0;
      selMax = parseInt(parts[1]) || 999;
    } else {
      selMin = parseInt(selectedRange) || 0;
      selMax = selMin;
    }

    return (entryRange: string) => {
      if (entryRange === selectedRange) return true;

      let entMin = 0;
      let entMax = 999;
      if (entryRange.includes("+")) {
        entMin = parseInt(entryRange) || 0;
      } else if (entryRange.includes("-")) {
        const parts = entryRange.split("-");
        entMin = parseInt(parts[0]) || 0;
        entMax = parseInt(parts[1]) || 999;
      } else {
        entMin = parseInt(entryRange) || 0;
        entMax = entMin;
      }

      if (isMobile) {
        // If the selected range is inside the grouped range, highlight it
        return selMin >= entMin && selMax <= entMax;
      }
      return false;
    };
  }, [selectedRange, isMobile]);

  return (
    <Card id="age-distribution-card" className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-2xl text-card-foreground rounded-[1.5rem] border-0 shadow-sm flex flex-col overflow-hidden h-full relative transition-all">
      <div className="pt-1.5 pb-2 px-0 sm:pt-2 sm:pb-3 sm:px-0 md:pt-2.5 md:pb-3 md:px-0 flex-1 flex flex-col relative overflow-visible">
      
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-1.5 sm:gap-3 mb-1.5 sm:mb-2.5 relative z-10 px-3 sm:px-4 md:px-6">
        <div className="flex gap-2 sm:gap-3 items-center min-w-0">
          <div className="text-right flex flex-col min-w-0">
            <h3 className="text-[11.5px] sm:text-base font-black text-foreground tracking-tight flex items-center flex-wrap gap-1 sm:gap-2 truncate">
              <span>חתך גילאים</span>
              {filterTags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {filterTags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-[9px] h-5 px-2 font-bold bg-background/20 text-primary border-primary/20 backdrop-blur-sm whitespace-nowrap rounded-md hover:bg-primary/5 transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                </div>
              )}
            </h3>
          </div>
        </div>
        <div className="bg-background/40 backdrop-blur-md px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-border/40 flex items-center gap-1.5 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[6.5px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-[0.05em] leading-none mb-0.5 sm:mb-1">
              גיל ממוצע
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse hidden sm:block" />
              <span className="text-xs sm:text-lg font-black text-foreground tabular-nums leading-none">
                {averageAge}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex flex-col flex-1 w-full min-h-[220px] sm:min-h-[240px] md:min-h-[320px] relative mt-0 overflow-visible cursor-pointer select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 25, right: 10, left: 10, bottom: 0 }}
          >
             <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              interval={0}
              height={isMobile ? 15 : 20}
              tick={{ fontSize: isMobile ? 11 : 13, fontWeight: 900, fill: "var(--foreground)" }}
              tickFormatter={(tick) => tick === "36-99" ? "36+" : tick}
            />
            <YAxis hide domain={[0, totalEmployees || 10]} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const displayRange = payload[0].payload.range === "36-99" ? "36+" : payload[0].payload.range;
                  return (
                    <div className="bg-popover text-popover-foreground border border-border p-2 rounded-xl">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                        טווח: {displayRange}
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
              radius={[6, 6, 0, 0]}
              barSize={isMobile ? 16 : 24}
              isAnimationActive={false}
              fill="currentColor"
              className="text-primary/70 hover:text-primary transition-colors"
            >
              {chartData.map((entry, index) => {
                const isSelected = isSelectedRange(entry.range);
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
                content={(props: any) => {
                  const { x, y, width, value } = props;
                  if (value === undefined || value === null || value === 0) return null;
                  return (
                    <text
                      x={x + width / 2}
                      y={y - 8}
                      fill="var(--foreground)"
                      textAnchor="middle"
                      className="text-[10px] sm:text-xs font-black fill-slate-700 dark:fill-slate-300"
                    >
                      {value}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </Card>
  );
};

