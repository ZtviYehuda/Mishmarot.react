import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, Calendar, Users, TrendingUp } from "lucide-react";
import type { DashboardStat } from "@/types/attendance.types";

interface StatCardsProps {
  stats: DashboardStat[];
}

export const StatCards = ({ stats }: StatCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <Card
          key={idx}
          className="border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all bg-white dark:bg-card dark:border-border group"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 dark:bg-slate-800 dark:border-slate-700 transition-transform group-hover:scale-110">
                {stat.status_name === "נוכח" ? (
                  <UserCheck className="w-5 h-5 text-green-600" />
                ) : stat.status_name === "חופשה" ? (
                  <Calendar className="w-5 h-5 text-[#0074ff]" />
                ) : (
                  <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50/50 border border-green-100/50">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-[10px] font-bold text-green-600 uppercase">
                  Live
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-[#001e30] dark:text-white tracking-tight">
                {stat.count}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stat.status_name}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <div className="flex-grow h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 shadow-sm"
                  style={{
                    backgroundColor: stat.color || "#0074ff",
                    width: `${Math.min(100, (stat.count / 40) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {Math.min(100, Math.round((stat.count / 40) * 100))}%
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
