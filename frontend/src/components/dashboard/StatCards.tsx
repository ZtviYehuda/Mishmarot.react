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
      hideOnMobile: true,
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
      hideOnMobile: true,
    },
  ];

  return (
    <div 
      id="stats-grid" 
      className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 pb-2 lg:pb-0"
    >
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={cn(
            "group relative overflow-hidden border-0 transition-all rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-md py-0 aspect-square flex items-center justify-center",
            card.hideOnMobile ? "hidden md:flex" : "flex",
            card.color === "blue" && "bg-blue-50/40 dark:bg-blue-900/10",
            card.color === "amber" && "bg-amber-50/40 dark:bg-amber-900/10",
            card.color === "emerald" && "bg-emerald-50/40 dark:bg-emerald-900/10",
            card.color === "indigo" && "bg-indigo-50/40 dark:bg-indigo-900/10"
          )}
        >
          <CardContent className="p-2 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-3 w-full h-full">
            <div className={cn(
              "w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 shadow-sm",
              card.iconBg,
              card.iconColor
            )}>
              <card.icon className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            </div>

            <div className="flex flex-col items-center text-center min-w-0">
              <div className="text-xl sm:text-2xl lg:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight mb-1">
                {card.value}
              </div>
              <div className="text-[8px] sm:text-[10px] lg:text-[11px] font-black text-slate-500/80 uppercase tracking-tighter sm:tracking-widest">
                {card.label}
              </div>
              {card.subValue && (
                <div className="text-[7px] sm:text-[9px] font-bold text-slate-400 mt-0.5">
                  {card.subValue}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

