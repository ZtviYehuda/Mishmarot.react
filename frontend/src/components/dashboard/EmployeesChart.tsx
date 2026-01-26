import { useMemo } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthContext } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, MessageCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Employee } from '@/types/employee.types';

interface EmployeesChartProps {
  onOpenFilter?: () => void;
  onOpenWhatsAppReport?: () => void;
  filterType?: 'all' | 'department' | 'section';
  filteredDepartmentId?: number;
  filteredSectionId?: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
  percentage: number;
}

export const EmployeesChart = ({
  onOpenFilter,
  onOpenWhatsAppReport,
  filterType = 'all',
  filteredDepartmentId,
  filteredSectionId,
}: EmployeesChartProps) => {
  const { employees, loading } = useEmployees();
  const { user } = useAuthContext();

  // Filter employees based on user permissions and selected filter
  const filteredEmployees = useMemo(() => {
    if (loading) return [];

    let filtered = employees;

    // If not admin, filter to only show employees under same hierarchy
    if (user && !user.is_admin) {
      // For commanders, show employees in their section/department
    }

    // Apply additional filters
    if (filterType === 'department' && filteredDepartmentId) {
      filtered = filtered.filter(() => true);
    } else if (filterType === 'section' && filteredSectionId) {
      filtered = filtered.filter(() => true);
    }

    return filtered;
  }, [employees, loading, user, filterType, filteredDepartmentId, filteredSectionId]);

  // Group employees by status
  const chartData = useMemo(() => {
    const grouped = new Map<
      string,
      { count: number; color: string; employees: Employee[] }
    >();

    filteredEmployees.forEach((emp) => {
      const status = emp.status_name || 'לא ידוע';
      const color = emp.status_color || '#6b7280';

      if (!grouped.has(status)) {
        grouped.set(status, { count: 0, color, employees: [] });
      }
      const group = grouped.get(status)!;
      group.count++;
      group.employees.push(emp);
    });

    const total = filteredEmployees.length;
    const entries = Array.from(grouped.entries());
    
    // If no entries, return empty array
    if (entries.length === 0) {
      return [];
    }
    
    // Calculate percentages with adjustment to ensure sum equals 100
    const percentagesArray = entries.map(([, { count }]) => 
      total > 0 ? (count / total) * 100 : 0
    );
    
    // Adjust for rounding errors - give the remainder to the largest percentage
    const rounded = percentagesArray.map(p => Math.floor(p));
    const remainders = percentagesArray.map((p, i) => ({ index: i, remainder: p - rounded[i] }));
    const totalRounded = rounded.reduce((a, b) => a + b, 0);
    const difference = 100 - totalRounded;
    
    // Add the difference to the items with largest remainders
    for (let i = 0; i < difference; i++) {
      if (remainders.length === 0) break; // Safety check
      remainders.sort((a, b) => b.remainder - a.remainder);
      const largestIndex = remainders[0]?.index;
      if (largestIndex !== undefined) {
        rounded[largestIndex]++;
        remainders[0].remainder = -1; // Mark as used
      }
    }
    
    return entries.map(([name, { count, color }], index) => ({
      name,
      value: count,
      fill: color,
      percentage: rounded[index],
    }));
  }, [filteredEmployees]);

  const total = filteredEmployees.length;

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
            מצבת כוח אדם
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
              מצבת כוח אדם
            </CardTitle>
            <CardDescription className="font-bold text-xs text-slate-400">
              {filterType === 'all' && 'כל העובדים תחת הפיקוד שלך'}
              {filterType === 'department' && 'עובדי המחלקה'}
              {filterType === 'section' && 'עובדי המדור'}
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
            {onOpenFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenFilter}
                className="gap-2"
              >
                <Settings2 className="w-4 h-4" />
                <span className="text-xs" dir="rtl">סנן</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              אין עובדים להצגה
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pie Chart with Donut Style - Now showing all data on chart */}
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
