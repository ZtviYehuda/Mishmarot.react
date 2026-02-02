import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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
  title?: string;
  description?: string;
}

export const EmployeesChart = ({
  stats,
  loading = false,
  onOpenWhatsAppReport,
  onStatusClick,
  title = "מצבת כוח אדם",
  description = "סטטוס נוכחות בזמן אמת",
}: EmployeesChartProps) => {
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
      id: item.status_id,
      name: item.status_name || "ללא סטטוס",
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
    const radius = window.innerWidth < 640 ? 95 : 115; // Closer on mobile
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
          y={y - (isMobile ? 8 : 10)}
          fill="currentColor"
          className="fill-muted-foreground"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMobile ? "10" : "12"}
          fontWeight="700"
        >
          {entry.payload.name}
        </text>
        <text
          x={x}
          y={y + (isMobile ? 3 : 5)}
          fill="currentColor"
          className="fill-foreground"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMobile ? "12" : "14"}
          fontWeight="800"
        >
          {entry.payload.value}
        </text>
        <text
          x={x}
          y={y + (isMobile ? 14 : 18)}
          fill="currentColor"
          className="fill-muted-foreground"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMobile ? "9" : "11"}
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
    <Card className="border border-border shadow-sm bg-card">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-black text-card-foreground mb-1 leading-tight whitespace-normal break-words">
              {title}
            </CardTitle>
            <CardDescription className="font-bold text-xs text-muted-foreground whitespace-normal break-words">
              {description}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center pt-1">
            {onOpenWhatsAppReport && (
              <Button
                size="sm"
                onClick={onOpenWhatsAppReport}
                className="gap-1.5 sm:gap-2 h-8 sm:h-9 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-md transition-all active:scale-95"
                title="שלח דוח בוואטסאפ"
              >
                <FaWhatsapp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs hidden sm:inline font-bold" dir="rtl">
                  WhatsApp
                </span>
              </Button>
            )}
          </div>
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
                      outerRadius={80}
                      innerRadius={45}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                      className="sm:!outerRadius-[100px] sm:!innerRadius-[55px]"
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
};
