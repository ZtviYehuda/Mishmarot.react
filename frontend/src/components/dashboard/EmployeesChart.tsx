import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface EmployeesChartProps {
  stats: { status_name: string; count: number; color: string }[];
  loading?: boolean;
  onOpenWhatsAppReport?: () => void;
  title?: string;
  description?: string;
}

export const EmployeesChart = ({
  stats,
  loading = false,
  onOpenWhatsAppReport,
  title = "מצבת כוח אדם",
  description = "סטטוס נוכחות בזמן אמת"
}: EmployeesChartProps) => {

  // Process stats into chart data
  const { chartData, total } = useMemo(() => {
    if (!stats || stats.length === 0) return { chartData: [], total: 0 };

    const totalCount = stats.reduce((acc, curr) => acc + curr.count, 0);

    // Calculate percentages
    const percentagesArray = stats.map(item =>
      totalCount > 0 ? (item.count / totalCount) * 100 : 0
    );

    // Adjust for rounding errors - give the remainder to the largest percentage
    const rounded = percentagesArray.map(p => Math.floor(p));
    const remainders = percentagesArray.map((p, i) => ({ index: i, remainder: p - rounded[i] }));
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
      name: item.status_name || 'ללא סטטוס',
      value: item.count,
      fill: item.color || '#94a3b8',
      percentage: rounded[index],
    }));

    return { chartData: data, total: totalCount };
  }, [stats]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded shadow-lg text-sm border border-slate-700">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{data.value} משרתים</p>
          <p className="text-xs text-slate-300 mt-1">{data.percentage}% מהיחידה</p>
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
    const radius = 130; // Distance from center
    const angle = entry.startAngle + (entry.endAngle - entry.startAngle) / 2;

    const x = entry.cx + radius * Math.cos(-angle * RADIAN);
    const y = entry.cy + radius * Math.sin(-angle * RADIAN);

    return (
      <g>
        <text
          x={x}
          y={y - 10}
          fill="#64748b"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="700"
        >
          {entry.payload.name}
        </text>
        <text
          x={x}
          y={y + 5}
          fill="#001e30"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fontWeight="800"
        >
          {entry.payload.value}
        </text>
        <text
          x={x}
          y={y + 18}
          fill="#475569"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontWeight="600"
        >
          {entry.payload.percentage}%
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <Card className="border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-card dark:border-border">
        <CardHeader className="pb-8">
          <CardTitle className="text-xl font-black text-[#001e30] dark:text-white mb-1">
            {title}
          </CardTitle>
          <CardDescription className="font-bold text-xs text-slate-400">
            טוען נתונים...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-card dark:border-border">
      <CardHeader className="pb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl font-black text-[#001e30] dark:text-white mb-1">
              {title}
            </CardTitle>
            <CardDescription className="font-bold text-xs text-slate-400">
              {description}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onOpenWhatsAppReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenWhatsAppReport}
                className="gap-2"
                title="שלח דוח בוואטסאפ"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs" dir="rtl">דוח</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              אין נתונים להצגה
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pie Chart with Donut Style */}
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={100}
                      innerRadius={55}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {chartData.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-3xl font-black text-[#001e30] dark:text-white">
                    {total}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
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
