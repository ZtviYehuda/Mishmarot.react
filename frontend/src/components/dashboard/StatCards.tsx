import { Card, CardContent } from "@/components/ui/card";
import { Users, HelpCircle, AlertCircle, TrendingUp, Search } from "lucide-react";
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
  const reportedCount = stats
    .filter(s => s.status_name !== "לא דווח")
    .reduce((acc, curr) => acc + curr.count, 0);
  
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={cn(
            "group relative overflow-hidden border-0 transition-all rounded-[1rem] sm:rounded-3xl shadow-sm hover:shadow-md",
            // Add a very subtle background tint based on color
            card.color === "blue" && "bg-blue-50/30 dark:bg-blue-900/10",
            card.color === "amber" && "bg-amber-50/30 dark:bg-amber-900/10",
            card.color === "emerald" && "bg-emerald-50/30 dark:bg-emerald-900/10",
            card.color === "indigo" && "bg-indigo-50/30 dark:bg-indigo-900/10"
          )}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex justify-between items-center">
              <div className="flex flex-col z-10">
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight mb-1">
                  {card.value}
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-500">
                  {card.label}
                </div>
                {card.subValue && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5">
                     {card.subValue}
                  </div>
                )}
              </div>

              {/* Icon */}
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                card.iconBg,
                card.iconColor
              )}>
                <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

