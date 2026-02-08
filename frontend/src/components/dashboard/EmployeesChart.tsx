import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Download } from "lucide-react";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { toPng } from "html-to-image";
import { toast } from "sonner";

interface EmployeesChartProps {
  stats: {
    status_id: number;
    status_name: string;
    count: number;
    color: string;
  }[];
  loading?: boolean;
  onOpenWhatsAppReport?: () => void;
  onStatusClick?: (statusId: number, statusName: string, color: string) => void;
  onFilterClick?: () => void;
  title?: string;
  description?: string;
}

export const EmployeesChart = forwardRef<any, EmployeesChartProps>((
  {
    stats,
    loading = false,
    onOpenWhatsAppReport,
    onStatusClick,
    onFilterClick,
    title = "מצבת כוח אדם",
    description = "סטטוס נוכחות בזמן אמת",
  },
  ref
) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    download: handleDownload,
  }));

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "white",
        style: {
          borderRadius: "0",
        },
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            node.classList.contains("no-export")
          ) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = `attendance-snapshot-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("גרף הורד בהצלחה");
    } catch (err) {
      console.error("Download failed", err);
      toast.error("שגיאה בהורדת הגרף");
    }
  };

  // Process stats into chart data
  const { chartData, total } = useMemo(() => {
    if (!stats || stats.length === 0) return { chartData: [], total: 0 };

    const totalCount = stats.reduce((acc, curr) => acc + curr.count, 0);

    // Calculate percentages
    const percentagesArray = stats.map((item) =>
      totalCount > 0 ? (item.count / totalCount) * 100 : 0,
    );

    // Adjust for rounding errors - give the remainder to the largest percentage
    const rounded = percentagesArray.map((p) => Math.floor(p));
    const remainders = percentagesArray.map((p, i) => ({
      index: i,
      remainder: p - rounded[i],
    }));
    const totalRounded = rounded.reduce((a, b) => a + b, 0);
    const difference = 100 - totalRounded;

    // Add the difference to the items with largest remainders
    if (difference > 0) {
      remainders.sort((a, b) => b.remainder - a.remainder);
      for (let i = 0; i < difference; i++) {
        if (remainders[i]) {
          rounded[remainders[i].index]++;
        }
      }
    }

    const data = stats.map((item, index) => ({
      // Make sure we pass the ID
      id: item.status_id === null ? -1 : item.status_id, // Use -1 for "No Status" to allow clicking
      name: item.status_name || "לא עודכן",
      value: item.count,
      fill: item.color || "#94a3b8",
      percentage: rounded[index],
    }));

    return { chartData: data, total: totalCount };
  }, [stats]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground px-3 py-2 rounded shadow-lg text-sm border border-border">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{data.value} שוטרים</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.percentage}% מהיחידה
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            לחץ לפירוט
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer for pie chart
  const renderCustomLabel = (entry: any) => {
    // Only show label if value is not too small
    if (entry.payload.percentage < 5) return null;

    // Calculate angle for label positioning
    const RADIAN = Math.PI / 180;
    const radius = window.innerWidth < 640 ? 115 : 135; // Increased radius to correct overlap
    const angle = entry.startAngle + (entry.endAngle - entry.startAngle) / 2;

    const x = entry.cx + radius * Math.cos(-angle * RADIAN);
    const y = entry.cy + radius * Math.sin(-angle * RADIAN);

    const isMobile = window.innerWidth < 640;

    return (
      <g
        className="cursor-pointer outline-none"
        onClick={() => {
          if (
            onStatusClick &&
            entry.payload.id !== undefined &&
            entry.payload.id !== null
          ) {
            onStatusClick(
              entry.payload.id,
              entry.payload.name,
              entry.payload.fill,
            );
          }
        }}
      >
        <text
          x={x}
          y={y - (isMobile ? 12 : 14)}
          fill="currentColor"
          className="fill-muted-foreground"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMobile ? "9" : "11"}
          fontWeight="700"
        >
          {entry.payload.name}
        </text>
        <text
          x={x}
          y={y}
          fill="currentColor"
          className="fill-foreground"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMobile ? "11" : "13"}
          fontWeight="800"
        >
          {entry.payload.value}
        </text>
        <text
          x={x}
          y={y + (isMobile ? 12 : 14)}
          fill="currentColor"
          className="fill-muted-foreground"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMobile ? "8" : "10"}
          fontWeight="600"
        >
          {entry.payload.percentage}%
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <Card className="border border-border shadow-sm bg-card">
        <CardHeader className="pb-8">
          <CardTitle className="text-xl font-black text-card-foreground mb-1">
            {title}
          </CardTitle>
          <CardDescription className="font-bold text-xs text-muted-foreground">
            טוען נתונים...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      ref={cardRef}
      id="attendance-snapshot-card"
      className="border border-border shadow-sm flex flex-col bg-card overflow-hidden h-full"
    >
      <CardHeader className="pb-3 border-b border-border/40 mb-2">
        <div className="space-y-2">
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex-1 min-w-0 text-right">
              <CardTitle className="text-base sm:text-xl font-black text-card-foreground leading-tight truncate">
                {title}
              </CardTitle>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 no-export">
              {/* Filter Button (Mobile Only) */}
              {onFilterClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFilterClick}
                  className="lg:hidden h-8 w-8 p-0 rounded-lg bg-background hover:bg-muted border-primary/20 text-primary shadow-sm"
                  title="סינון נתונים"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              )}

              {/* Download Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg transition-all"
                onClick={handleDownload}
                title="הורדה כתמונה"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* WhatsApp Button */}
              {onOpenWhatsAppReport && (
                <WhatsAppButton
                  onClick={onOpenWhatsAppReport}
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-lg border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  skipDirectLink={true}
                />
              )}
            </div>
          </div>
          <CardDescription className="font-bold text-[10px] sm:text-xs text-muted-foreground whitespace-pre-line text-right leading-relaxed opacity-80">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">אין נתונים להצגה</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pie Chart with Donut Style */}
            <div className="w-full flex flex-col items-center">
              <div
                className="relative w-full h-[280px] sm:h-[350px]"
                style={{ direction: "ltr" }} // Recharts works better with LTR
              >
                {/* Ensure parent has explicit height for Recharts */}
                <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                  <PieChart
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={window.innerWidth < 640 ? 75 : 95}
                      innerRadius={window.innerWidth < 640 ? 45 : 55}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {chartData.map((item, index) => (
                        <Cell
                          key={`cell-${item.id || index}`}
                          fill={item.fill}
                          className="outline-none hover:opacity-80 transition-opacity cursor-pointer"
                          onClick={() => {
                            if (
                              onStatusClick &&
                              item.id !== undefined &&
                              item.id !== null
                            ) {
                              onStatusClick(item.id, item.name, item.fill);
                            }
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-3xl font-black text-foreground">
                    {total}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground mt-1">
                    סך הכל
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
