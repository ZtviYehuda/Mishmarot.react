import { Card } from "@/components/ui/card";
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
      className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 pb-2 lg:pb-0"
    >
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={cn(
            "group relative overflow-hidden border border-border/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:shadow-md transition-all bg-card/80 flex items-center justify-between",
            card.hideOnMobile ? "hidden md:flex" : "flex"
          )}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <div className="space-y-0.5 text-right min-w-0 flex-1">
              <p className="text-[9px] sm:text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wide leading-none truncate">
                {card.label}
              </p>
              <p className="text-base sm:text-xl font-black tracking-tight text-foreground leading-none mt-1">
                {card.value}
              </p>
              {card.subValue && (
                <p className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground/50 leading-none mt-1">
                  {card.subValue}
                </p>
              )}
            </div>
            <div className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 shadow-sm",
              card.iconBg,
              card.iconColor
            )}>
              <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
