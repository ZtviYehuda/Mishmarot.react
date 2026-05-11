import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertCircle, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  stats: any[];
  totalEmployees: number;
}

export const StatCards = ({ stats, totalEmployees }: StatCardsProps) => {
  // Find specific stats
  const notReported = stats.find(s => s.status_name === "לא דווח")?.count || 0;
  
  // Unavailable keywords logic matching other components
  const unavailableKeywords = ["חופשה", "חולה", "מושעה", "גימל", "בלתי מורשה", "נפקד"];
  const unavailableCount = stats
    .filter(s => unavailableKeywords.some(kw => s.status_name?.includes(kw)))
    .reduce((acc, curr) => acc + curr.count, 0);

  // Operational availability = (Total - Missing - Unavailable) / Total
  
  const presentKeywords = ["נוכח", "משרד", "תגבור", "קורס"];
  const presentCount = stats
    .filter(s => presentKeywords.some(kw => s.status_name?.includes(kw)))
    .reduce((acc, curr) => acc + curr.count, 0);

  const availabilityPct = totalEmployees > 0 
    ? Math.round((presentCount / totalEmployees) * 100) 
    : 0;

  const cards = [
    {
      label: "לא דיווחו",
      value: notReported,
      icon: Search,
      color: "blue",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-500",
    },
    {
      label: "לא זמינים",
      value: unavailableCount,
      icon: AlertCircle,
      color: "amber",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-500",
    },
    {
      label: "זמינות מבצעית",
      value: `${availabilityPct}%`,
      subValue: `${presentCount} זמינים`,
      icon: TrendingUp,
      color: "emerald",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-500",
    },
    {
      label: "סה\"כ שוטרים",
      value: totalEmployees,
      icon: Users,
      color: "indigo",
      iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-500",
    },
  ];

  return (
    <div 
      id="stats-grid" 
      className="grid grid-cols-4 gap-1.5 sm:gap-4 pb-2 lg:pb-0"
    >
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={cn(
            "group relative overflow-hidden border-0 transition-all rounded-xl sm:rounded-3xl shadow-sm hover:shadow-md",
            // Add a very subtle background tint based on color
            card.color === "blue" && "bg-blue-50/40 dark:bg-blue-900/10",
            card.color === "amber" && "bg-amber-50/40 dark:bg-amber-900/10",
            card.color === "emerald" && "bg-emerald-50/40 dark:bg-emerald-900/10",
            card.color === "indigo" && "bg-indigo-50/40 dark:bg-indigo-900/10"
          )}
        >
          <CardContent className="p-1.5 sm:p-5 flex flex-col items-center sm:items-start lg:items-center text-center sm:text-right">
            <div className="flex flex-col items-center sm:items-start lg:items-center z-10 min-w-0 w-full">
              {/* Icon - Restored & Compact */}
              <div className={cn(
                "w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 mb-1 sm:mb-2",
                card.iconBg,
                card.iconColor
              )}>
                <card.icon className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
              </div>

              <div className="text-lg sm:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight mb-0.5 sm:mb-1 truncate w-full">
                {card.value}
              </div>
              <div className="text-[8px] sm:text-xs font-bold text-slate-500 truncate uppercase tracking-tighter sm:tracking-normal w-full">
                {card.label}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

